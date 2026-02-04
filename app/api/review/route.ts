import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/review
 *
 * Pass 4: AI Review endpoint.
 * Sends the complete annotation JSON to Claude Sonnet for quality checking.
 * Returns structured flags \u2014 AI never changes tags, only flags for human review.
 *
 * Request body:
 *   { project_id, genre, subgenre, annotations: ClauseAnnotation[] }
 *
 * Response:
 *   { flags: ReviewFlag[] }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { project_id, genre, subgenre, annotations } = body;

    if (!project_id || !annotations || annotations.length === 0) {
      return NextResponse.json(
        { error: 'Missing project_id or annotations' },
        { status: 400 }
      );
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'ANTHROPIC_API_KEY not configured' },
        { status: 500 }
      );
    }

    // Build the review prompt
    const systemPrompt = `You are a quality reviewer for semantic annotations of biblical Hebrew text.
You are reviewing Meaning Maps created using the Tripod Ontology v5.3.

The passage genre is: ${genre} (${subgenre}).

Review the annotations for these 5 categories:
1. INTERNAL CONSISTENCY \u2014 Do event categories match their verbal cores? Do participant roles make sense for the event type?
2. MISSING FIELDS \u2014 Are critical fields left as not_specified when the text provides clear information?
3. CROSS-CLAUSE COHERENCE \u2014 Do participant references track correctly across clauses? Is discourse structure coherent?
4. SEMANTIC PLAUSIBILITY \u2014 Do the semantic role assignments match the actual meaning of the Hebrew text?
5. GENRE EXPECTATIONS \u2014 Are genre-specific features properly annotated? Are presets appropriate?

For each issue found, return a JSON array of flag objects:
{
  "clause_id": <number>,
  "category": "consistency" | "missing_fields" | "cross_clause" | "plausibility" | "genre_expectations",
  "severity": "error" | "warning" | "suggestion",
  "message": "<clear description of the issue>",
  "recommendation": "<specific actionable fix>"
}

Return ONLY the JSON array. No preamble, no markdown. If no issues found, return [].
Important: You flag, you never fix. The human analyst decides.`;

    const userMessage = `Review these clause annotations:

${JSON.stringify(annotations, null, 2)}`;

    // Call Claude Sonnet
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Anthropic API error:', err);
      return NextResponse.json(
        { error: 'AI review failed', details: err },
        { status: 502 }
      );
    }

    const data = await response.json();
    const text = data.content
      .filter((block: { type: string }) => block.type === 'text')
      .map((block: { text: string }) => block.text)
      .join('');

    // Parse the flags JSON
    let flags;
    try {
      const cleaned = text.replace(/```json|```/g, '').trim();
      flags = JSON.parse(cleaned);
    } catch {
      console.error('Failed to parse AI review response:', text);
      return NextResponse.json(
        { error: 'Failed to parse AI review response', raw: text },
        { status: 502 }
      );
    }

    // Add metadata to each flag
    const enrichedFlags = flags.map((flag: Record<string, unknown>, index: number) => ({
      ...flag,
      id: `flag_${project_id}_${index}`,
      project_id,
      status: 'open',
      created_at: new Date().toISOString(),
    }));

    return NextResponse.json({ flags: enrichedFlags });
  } catch (error) {
    console.error('Review endpoint error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

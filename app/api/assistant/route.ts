import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/assistant
 *
 * Ontology assistant endpoint (explanatory, no auto-fill).
 * Request body:
 *   { project_id, genre, subgenre, active_pass, clause, field, question }
 *
 * Response:
 *   { reply: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { project_id, genre, subgenre, active_pass, clause, field, question } = body ?? {};

    if (!project_id || !question) {
      return NextResponse.json({ error: 'Missing project_id or question' }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 });
    }

    const systemPrompt = `You are an ontology assistant for the Tripod Method Meaning Map workflow.
You only EXPLAIN and GUIDE. You never change tags or choose for the analyst.
Use the provided ontology options and the clause context to suggest which options might fit and why.
Keep answers short (3-6 sentences), ask 1 clarifying question if needed.
Always remind the analyst that they decide the final tag.`;

    const userPayload = {
      genre,
      subgenre,
      active_pass,
      clause,
      field,
      question,
    };

    const userMessage = `Context:\n${JSON.stringify(userPayload, null, 2)}\n\nAnswer the analyst's question using the ontology options.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 600,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Anthropic API error:', err);
      return NextResponse.json({ error: 'Assistant failed', details: err }, { status: 502 });
    }

    const data = await response.json();
    const text = data.content
      .filter((block: { type: string }) => block.type === 'text')
      .map((block: { text: string }) => block.text)
      .join('')
      .trim();

    return NextResponse.json({ reply: text });
  } catch (error) {
    console.error('Assistant endpoint error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

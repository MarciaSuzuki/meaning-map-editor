import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

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

    const systemPrompt = `You are a friendly helper for the Tripod Method Meaning Map workflow (v5.4).
You only EXPLAIN and GUIDE. You never change tags or choose for the analyst.
Write in plain, non-technical language for non‑linguists. Avoid jargon.
Use the provided ontology options and definitions, and cite them explicitly.
Only include examples when the analyst asks for them (or explicitly asks "for example").
Keep answers short (2-4 short sentences). Focus on the simplest explanation.
Ask 1 short clarifying question only if truly needed.
Always remind the analyst that they decide the final tag.`;

    const tripodPath = path.join(process.cwd(), 'public', 'ontology', 'tripod-ontology.html');
    const expandedPath = path.join(process.cwd(), 'public', 'ontology', 'expanded-properties.html');
    const tripodHtml = fs.existsSync(tripodPath) ? fs.readFileSync(tripodPath, 'utf-8') : '';
    const expandedHtml = fs.existsSync(expandedPath) ? fs.readFileSync(expandedPath, 'utf-8') : '';

    const stripTags = (value: string) => value.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

    const parseTableRows = (tableHtml: string) => {
      const rows = Array.from(tableHtml.matchAll(/<tr>([\s\S]*?)<\/tr>/gi)).map((m) => m[1]);
      const entries: Array<{ value: string; definition?: string; example?: string }> = [];
      for (const row of rows) {
        if (row.includes('<th')) continue;
        const cols = Array.from(row.matchAll(/<td>([\s\S]*?)<\/td>/gi)).map((m) => stripTags(m[1]));
        if (cols.length === 0) continue;
        const [value, definition, example] = cols;
        if (!value) continue;
        entries.push({ value, definition, example });
      }
      return entries;
    };

    const extractTableAfterHeading = (html: string, headingRegex: RegExp) => {
      const match = headingRegex.exec(html);
      if (!match) return [];
      const rest = html.slice(match.index + match[0].length);
      const tableMatch = rest.match(/<table>[\s\S]*?<\/table>/i);
      if (!tableMatch) return [];
      return parseTableRows(tableMatch[0]);
    };

    const extractDimTable = (html: string, dimension: string) => {
      const headingRegex = new RegExp(`<div class=\"dim-header[^>]*>\\s*${dimension}\\b[\\s\\S]*?<\\/div>`, 'i');
      return extractTableAfterHeading(html, headingRegex);
    };

    const fieldLabel: string = field?.label ?? 'General';
    const fieldContext: Record<string, string> = field?.context ?? {};

    const headingMap: Record<string, { file: 'tripod' | 'expanded'; heading: RegExp }> = {
      'Clause Type': { file: 'tripod', heading: /Clause Type/i },
      'Non-Event Roles': { file: 'tripod', heading: /Non-Event Roles/i },
      'Event Category': { file: 'tripod', heading: /Event Categories/i },
      'Participant Type': { file: 'tripod', heading: /Participant Types/i },
      'Participant Quantity': { file: 'tripod', heading: /Quantity<\/h3>/i },
      'Reference Status': { file: 'tripod', heading: /Reference Status/i },
      'Name Meaning': { file: 'tripod', heading: /Name Meaning/i },
      'Semantic Role': { file: 'tripod', heading: /Semantic Roles/i },
      'Kinship Relation': { file: 'tripod', heading: /Kinship Relations/i },
      'Social Relation': { file: 'tripod', heading: /Social Relations/i },
      'Possession Relation': { file: 'tripod', heading: /Possession Relations/i },
      'Spatial Relation': { file: 'tripod', heading: /Spatial Relations/i },
      'Part-Whole Relation': { file: 'tripod', heading: /Part-Whole Relations/i },
      'Reality': { file: 'tripod', heading: /Reality/i },
      'Time Frame': { file: 'tripod', heading: /Time Frame/i },
      'Duration': { file: 'tripod', heading: /Duration \(4/i },
      'Duration Precision': { file: 'tripod', heading: /Duration Precision/i },
      'Evidentiality': { file: 'tripod', heading: /Evidentiality/i },
      'Aspect': { file: 'tripod', heading: /Aspect/i },
      'Polarity': { file: 'tripod', heading: /Polarity/i },
      'Volitionality': { file: 'tripod', heading: /Volitionality/i },
      'Discourse Function': { file: 'tripod', heading: /Discourse Functions/i },
      'Discourse Relation': { file: 'tripod', heading: /Discourse Relations/i },
      'Information Structure Topic': { file: 'tripod', heading: /<h3>Topic<\/h3>/i },
      'Information Structure Focus': { file: 'tripod', heading: /<h3>Focus<\/h3>/i },
      'Formulaic Marker': { file: 'tripod', heading: /Formulaic Marker/i },
      'Register': { file: 'tripod', heading: /Register/i },
      'Social Axis': { file: 'tripod', heading: /Social Axis/i },
      'Prominence': { file: 'tripod', heading: /Prominence/i },
      'Pacing': { file: 'tripod', heading: /Pacing/i },
      'Focalization': { file: 'tripod', heading: /Focalization/i },
      'Emotion': { file: 'tripod', heading: /Emotion Types/i },
      'Emotion Intensity': { file: 'tripod', heading: /Intensity Levels/i },
      'Narrator Stance': { file: 'tripod', heading: /Narrator Stance/i },
      'Audience Response': { file: 'tripod', heading: /Audience Response/i },
      'Inference Source': { file: 'tripod', heading: /Inference Source/i },
      'Confidence': { file: 'tripod', heading: /Confidence Levels/i },
      'Speech Act': { file: 'tripod', heading: /Speech Acts/i },
      'Figurative Language': { file: 'tripod', heading: /Figurative Language/i },
      'Figurative Transferability': { file: 'tripod', heading: /Transferability/i },
      'Key Term Domain': { file: 'tripod', heading: /Semantic Domains/i },
      'Key Term Consistency': { file: 'tripod', heading: /Consistency Levels/i },
      'Poetic Parallelism': { file: 'tripod', heading: /Parallelism Type/i },
      'Poetic Line Structure': { file: 'tripod', heading: /Line Structure/i },
      'Poetic Sound Patterns': { file: 'tripod', heading: /Sound Patterns/i },
      'Poetic Compression': { file: 'tripod', heading: /Compression/i },
      'Proverb Type': { file: 'tripod', heading: /Proverb Type/i },
      'Wisdom Function': { file: 'tripod', heading: /Wisdom Function/i },
      'Authority Source': { file: 'tripod', heading: /Authority Source/i },
      'Applicability': { file: 'tripod', heading: /Applicability/i },
    };

    let fieldDefinitions: Array<{ value: string; definition?: string; example?: string }> = [];

    if (fieldLabel === 'Property Value' && fieldContext.dimension) {
      const dimensionLabel = fieldContext.dimension.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
      fieldDefinitions = extractDimTable(expandedHtml, dimensionLabel);
    } else if (headingMap[fieldLabel]) {
      const mapEntry = headingMap[fieldLabel];
      const sourceHtml = mapEntry.file === 'expanded' ? expandedHtml : tripodHtml;
      fieldDefinitions = extractTableAfterHeading(sourceHtml, mapEntry.heading);
    }

    const userPayload = {
      genre,
      subgenre,
      active_pass,
      clause,
      field,
      field_definitions: fieldDefinitions,
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

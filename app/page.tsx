'use client';

import { useState } from 'react';
import {
  PROPERTY_DIMENSIONS,
  KINSHIP_RELATIONS,
  SOCIAL_RELATIONS,
  POSSESSION_RELATIONS,
  SPATIAL_RELATIONS,
  PART_WHOLE_RELATIONS,
  NON_EVENT_ROLES,
  EVIDENTIALITY_VALUES,
  DURATION_VALUES,
  DURATION_PRECISION_VALUES,
  DISCOURSE_RELATIONS,
  INFORMATION_STRUCTURE_TOPICS,
  INFORMATION_STRUCTURE_FOCI,
  FORMULAIC_MARKERS,
  SOCIAL_AXES,
  PROMINENCE_VALUES,
  PACING_VALUES,
  FOCALIZATION_VALUES,
  EMOTIONS,
  EMOTION_INTENSITIES,
  NARRATOR_STANCES,
  AUDIENCE_RESPONSES,
  INFERENCE_SOURCES,
  CONFIDENCE_VALUES,
  RETRIEVAL_TAG_CATEGORIES,
  SPEECH_ACTS,
  FIGURATIVE_LANGUAGE,
  FIGURATIVE_TRANSFERABILITY,
  KEY_TERM_DOMAINS,
  KEY_TERM_CONSISTENCY,
  POETIC_PARALLELISM,
  POETIC_LINE_STRUCTURE,
  POETIC_SOUND_PATTERNS,
  POETIC_COMPRESSION,
  PROVERB_TYPES,
  WISDOM_FUNCTIONS,
  WISDOM_AUTHORITY_SOURCES,
  WISDOM_APPLICABILITY,
} from '@/lib/ontology';

const SAMPLE_PROJECTS = [
  {
    id: 'ruth',
    name: 'Ruth (Full Book)',
    book: 'ruth',
    genre: 'narrative',
    subgenre: 'family loyalty',
    status: 'draft',
    updated_at: '2026-02-04T08:00:00Z',
    chapters: 4,
    verses: 85,
    clauses: 463,
  },
];

const values = (opts: { value: string }[]) => opts.map((o) => o.value).join(', ');

const TIER_CARDS = [
  {
    title: 'Tier 1: Programmatic (BHSA)',
    summary: 'Auto-filled from BHSA morphology and clause features when the signal is explicit.',
    bullets: [
      'Clause type + event core/category when clear',
      'Participant basics (type, quantity, reference status)',
      'Semantic roles from clause functions',
      'Reality, polarity, aspect, time frame, volitionality (when explicit)',
      'Discourse function + register',
    ],
    color: '#BE4A01',
    bg: '#FFF3EB',
  },
  {
    title: 'Tier 2: Human Analyst',
    summary: 'You fill every remaining ontology field or leave it as not_specified.',
    bullets: [
      'Complete all non-prefilled ontology layers',
      'Confirm or correct any auto-filled items',
      'Leave unknowns as not_specified (no guessing)',
    ],
    color: '#89AAA3',
    bg: '#E8F0EE',
  },
  {
    title: 'Tier 3: AI Review',
    summary: 'AI only checks consistency and asks follow-up questions.',
    bullets: [
      'Flags missing or conflicting tags',
      'Asks clarifying questions',
      'Does not create or overwrite tags',
    ],
    color: '#3F3E20',
    bg: '#F0EFE0',
  },
];

const NON_PREFILL_SECTIONS = [
  {
    title: 'Participants: Properties + Name Meaning',
    rows: [
      { category: 'Property: physical', values: values(PROPERTY_DIMENSIONS.physical) },
      { category: 'Property: quantity_size', values: values(PROPERTY_DIMENSIONS.quantity_size) },
      { category: 'Property: sensory', values: values(PROPERTY_DIMENSIONS.sensory) },
      { category: 'Property: character', values: values(PROPERTY_DIMENSIONS.character) },
      { category: 'Property: social', values: values(PROPERTY_DIMENSIONS.social) },
      { category: 'Property: emotional_state', values: values(PROPERTY_DIMENSIONS.emotional_state) },
      { category: 'Property: relational', values: values(PROPERTY_DIMENSIONS.relational) },
      { category: 'Property: material', values: values(PROPERTY_DIMENSIONS.material) },
      { category: 'Property: evaluative', values: values(PROPERTY_DIMENSIONS.evaluative) },
      { category: 'Property: temporal', values: values(PROPERTY_DIMENSIONS.temporal) },
      { category: 'Property: spatial', values: values(PROPERTY_DIMENSIONS.spatial) },
      { category: 'Name meaning', values: 'free text (when narratively activated)' },
    ],
  },
  {
    title: 'Participant Relations',
    rows: [
      { category: 'Kinship relations', values: values(KINSHIP_RELATIONS) },
      { category: 'Social relations', values: values(SOCIAL_RELATIONS) },
      { category: 'Possession relations', values: values(POSSESSION_RELATIONS) },
      { category: 'Spatial relations', values: values(SPATIAL_RELATIONS) },
      { category: 'Part-whole relations', values: values(PART_WHOLE_RELATIONS) },
    ],
  },
  {
    title: 'Clause Semantics: Non-Event Roles + Modifiers',
    rows: [
      { category: 'Non-event roles', values: values(NON_EVENT_ROLES) },
      { category: 'Evidentiality', values: values(EVIDENTIALITY_VALUES) },
      { category: 'Duration', values: values(DURATION_VALUES) },
      { category: 'Duration precision', values: values(DURATION_PRECISION_VALUES) },
    ],
  },
  {
    title: 'Discourse + Pragmatics',
    rows: [
      { category: 'Discourse relations', values: values(DISCOURSE_RELATIONS) },
      { category: 'Information structure: topic', values: values(INFORMATION_STRUCTURE_TOPICS) },
      { category: 'Information structure: focus', values: values(INFORMATION_STRUCTURE_FOCI) },
      { category: 'Formulaic marker', values: values(FORMULAIC_MARKERS) },
      { category: 'Peak event', values: 'mark 1 clause as PEAK' },
      { category: 'Thematic spine', values: 'one-sentence free text summary' },
      { category: 'Social axis', values: values(SOCIAL_AXES) },
      { category: 'Prominence', values: values(PROMINENCE_VALUES) },
      { category: 'Pacing', values: values(PACING_VALUES) },
      { category: 'Focalization', values: values(FOCALIZATION_VALUES) },
    ],
  },
  {
    title: 'Emotion + Source Tracking',
    rows: [
      { category: 'Emotion type', values: values(EMOTIONS) },
      { category: 'Emotion intensity', values: values(EMOTION_INTENSITIES) },
      { category: 'Narrator stance', values: values(NARRATOR_STANCES) },
      { category: 'Audience response', values: values(AUDIENCE_RESPONSES) },
      { category: 'Inference source', values: values(INFERENCE_SOURCES) },
      { category: 'Confidence level', values: values(CONFIDENCE_VALUES) },
    ],
  },
  {
    title: 'Speech + Figurative + Key Terms + Retrieval Tags',
    rows: [
      { category: 'Speech acts', values: values(SPEECH_ACTS) },
      { category: 'Figurative language', values: values(FIGURATIVE_LANGUAGE) },
      { category: 'Figurative transferability', values: values(FIGURATIVE_TRANSFERABILITY) },
      { category: 'Key term domains', values: values(KEY_TERM_DOMAINS) },
      { category: 'Key term consistency', values: values(KEY_TERM_CONSISTENCY) },
      { category: 'LA retrieval tag categories', values: values(RETRIEVAL_TAG_CATEGORIES) + ' (values = free tags)' },
    ],
  },
  {
    title: 'Poetic + Proverb/Wisdom Layers',
    rows: [
      { category: 'Parallelism type', values: values(POETIC_PARALLELISM) },
      { category: 'Line structure', values: values(POETIC_LINE_STRUCTURE) },
      { category: 'Sound patterns', values: values(POETIC_SOUND_PATTERNS) },
      { category: 'Compression', values: values(POETIC_COMPRESSION) },
      { category: 'Proverb type', values: values(PROVERB_TYPES) },
      { category: 'Wisdom function', values: values(WISDOM_FUNCTIONS) },
      { category: 'Authority source', values: values(WISDOM_AUTHORITY_SOURCES) },
      { category: 'Applicability', values: values(WISDOM_APPLICABILITY) },
    ],
  },
];

const s = {
  display: 'Source Serif 4, Georgia, serif',
  body: 'DM Sans, system-ui, sans-serif',
  mono: 'JetBrains Mono, monospace',
  muted: '#5A5940',
  border: '#E4E3D0',
  bgCard: '#EDECD8',
  telha: '#BE4A01',
  azul: '#89AAA3',
  verde: '#777D45',
  dark: '#3F3E20',
};

export default function HomePage() {
  const [projects] = useState(SAMPLE_PROJECTS);

  return (
    <div style={{ minHeight: '100vh', fontFamily: s.body }}>
      <header style={{ borderBottom: '1px solid #D4D2B8', padding: '1.25rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
          <img src="/logos/LOGO_-_telha.svg" alt="Shema" style={{ height: 52, width: 'auto' }} />
          <h1 style={{ fontFamily: s.display, fontSize: '1.3rem', fontWeight: 600, margin: 0, color: s.dark }}>Meaning Map Three Tiers Test</h1>
        </div>
        <button style={{ padding: '0.5rem 1rem', borderRadius: 8, fontSize: '0.85rem', fontWeight: 600, color: 'white', backgroundColor: s.telha, border: 'none', cursor: 'pointer' }}>+ New Project</button>
      </header>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '2.5rem 2rem' }}>
        <section style={{ marginBottom: '2.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h2 style={{ fontFamily: s.display, fontSize: '1.15rem', fontWeight: 600, margin: 0 }}>Projects</h2>
            <span style={{ fontSize: '0.85rem', color: s.muted }}>{projects.length} project{projects.length === 1 ? '' : 's'}</span>
          </div>
          {projects.map((p) => (
            <a key={p.id} href={`/editor/${p.id}`} style={{ display: 'block', borderRadius: 12, border: `1px solid ${s.border}`, padding: '1.25rem', backgroundColor: 'white', textDecoration: 'none', color: 'inherit', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <h3 style={{ fontFamily: s.display, fontSize: '1rem', fontWeight: 600, margin: '0 0 0.25rem 0' }}>{p.name}</h3>
                  <span style={{ fontSize: '0.85rem', color: s.muted }}>{p.genre} - {p.subgenre} - {new Date(p.updated_at).toLocaleDateString()}</span>
                  <div style={{ marginTop: '0.35rem', fontSize: '0.75rem', color: s.muted }}>
                    {p.chapters} chapters - {p.verses} verses - {p.clauses} clauses
                  </div>
                </div>
                <span style={{ padding: '2px 10px', borderRadius: 4, fontSize: '0.7rem', fontFamily: s.mono, fontWeight: 600, backgroundColor: '#F0EFE0', color: s.dark }}>DRAFT</span>
              </div>
            </a>
          ))}
        </section>

        <section style={{ backgroundColor: 'white', borderRadius: 12, border: `1px solid ${s.border}`, padding: '1.75rem', marginBottom: '2.5rem' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ fontFamily: s.display, fontSize: '1.1rem', fontWeight: 600, margin: '0 0 0.5rem 0' }}>Tripod Ontology Reference (v5.4)</h2>
            <p style={{ fontSize: '0.85rem', color: s.muted, lineHeight: 1.6, maxWidth: 760, margin: 0 }}>
              The editor uses a three-tier workflow. Tier 1 is programmatic and deterministic, Tier 2 is human analysis,
              and Tier 3 is AI consistency review only.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.75rem' }}>
            {TIER_CARDS.map((tier) => (
              <div key={tier.title} style={{ borderRadius: 12, border: `1px solid ${s.border}`, padding: '1rem', backgroundColor: tier.bg }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: tier.color, marginBottom: '0.35rem' }}>{tier.title}</div>
                <p style={{ fontSize: '0.78rem', color: s.muted, margin: '0 0 0.65rem 0', lineHeight: 1.5 }}>{tier.summary}</p>
                <ul style={{ margin: 0, paddingLeft: '1rem', fontSize: '0.76rem', color: s.dark, lineHeight: 1.5 }}>
                  {tier.bullets.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div>
            <h3 style={{ fontFamily: s.display, fontSize: '1rem', fontWeight: 600, margin: '0 0 0.5rem 0' }}>
              Not Pre-Filled from BHSA (Analyst-Filled Only)
            </h3>
            <p style={{ fontSize: '0.82rem', color: s.muted, lineHeight: 1.6, maxWidth: 760, margin: '0 0 1rem 0' }}>
              These categories are never auto-filled from BHSA. They appear blank until the analyst chooses a value.
            </p>

            <div style={{ display: 'grid', gap: '1rem' }}>
              {NON_PREFILL_SECTIONS.map((section) => (
                <details key={section.title} style={{ borderRadius: 12, border: `1px solid ${s.border}`, padding: '0.75rem 1rem', backgroundColor: '#FBFAF3' }}>
                  <summary style={{ cursor: 'pointer', fontFamily: s.display, fontSize: '0.9rem', fontWeight: 600, color: s.dark }}>
                    {section.title}
                  </summary>
                  <div style={{ marginTop: '0.75rem' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
                      <thead>
                        <tr>
                          <th style={{ textAlign: 'left', padding: '0.4rem 0', borderBottom: `1px solid ${s.border}`, color: s.muted, fontWeight: 600, width: '28%' }}>Category</th>
                          <th style={{ textAlign: 'left', padding: '0.4rem 0', borderBottom: `1px solid ${s.border}`, color: s.muted, fontWeight: 600 }}>Values</th>
                        </tr>
                      </thead>
                      <tbody>
                        {section.rows.map((row) => (
                          <tr key={row.category}>
                            <td style={{ padding: '0.45rem 0.35rem 0.45rem 0', verticalAlign: 'top', fontWeight: 600, color: s.dark }}>
                              {row.category}
                            </td>
                            <td style={{ padding: '0.45rem 0', verticalAlign: 'top', fontFamily: s.mono, color: s.dark, whiteSpace: 'normal', wordBreak: 'break-word', lineHeight: 1.4 }}>
                              {row.values}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>
      </div>

      <footer style={{ borderTop: `1px solid ${s.border}`, padding: '1.5rem 2rem', marginTop: '3rem' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <img src="/logos/I_CONE_-_telha.svg" alt="Shema" style={{ height: 20, width: 20 }} />
            <span style={{ fontSize: '0.8rem', color: s.muted }}>Shema Bible Translation - Ready Vessels Project - YWAM Kansas City - 2026</span>
          </div>
          <span style={{ fontSize: '0.7rem', color: '#C5C29F' }}>Tripod Ontology v5.4</span>
        </div>
      </footer>
    </div>
  );
}

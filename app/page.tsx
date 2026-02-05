'use client';

import { useState } from 'react';

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
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <img src="/logos/LOGO_-_telha.svg" alt="Shema" style={{ height: 36, width: 'auto' }} />
          <div>
            <h1 style={{ fontFamily: s.display, fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>Shema Meaning Maps</h1>
            <p style={{ fontSize: '0.85rem', color: s.muted, margin: 0 }}>Semantic Mapping of Biblical Text for AI-Assisted OBT</p>
          </div>
        </div>
        <button style={{ padding: '0.5rem 1rem', borderRadius: 8, fontSize: '0.85rem', fontWeight: 600, color: 'white', backgroundColor: s.telha, border: 'none', cursor: 'pointer' }}>+ New Project</button>
      </header>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '2.5rem 2rem' }}>
        <section style={{ backgroundColor: s.bgCard, borderRadius: 12, padding: '2rem', marginBottom: '2.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.5rem' }}>
            <img src="/logos/I_CONE_-_telha.svg" alt="" style={{ height: 48, width: 48 }} />
            <div>
              <h2 style={{ fontFamily: s.display, fontSize: '1.15rem', fontWeight: 600, margin: '0 0 0.5rem 0' }}>Meaning Map Editor</h2>
              <p style={{ fontSize: '0.85rem', color: s.muted, lineHeight: 1.6, maxWidth: 600, margin: '0 0 1rem 0' }}>
                Create clause-level semantic annotations of biblical Hebrew text.
                The Tripod Method separates meaning from expression.
                This avoids translationese in Bible translation for oral communities.
              </p>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {[
                  { label: '4-Pass Workflow', bg: '#E8F0EE', fg: s.azul },
                  { label: '14 Ontology Layers', bg: '#FFF3EB', fg: s.telha },
                  { label: 'Genre Filtering', bg: '#F0EFE0', fg: s.verde },
                ].map((b) => (
                  <span key={b.label} style={{ padding: '2px 8px', borderRadius: 4, fontSize: '0.75rem', fontFamily: s.mono, fontWeight: 500, backgroundColor: b.bg, color: b.fg, border: `1px solid ${b.fg}` }}>{b.label}</span>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section style={{ backgroundColor: 'white', borderRadius: 12, border: `1px solid ${s.border}`, padding: '1.75rem', marginBottom: '2.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1.5rem' }}>
            <div>
              <h2 style={{ fontFamily: s.display, fontSize: '1.1rem', fontWeight: 600, margin: '0 0 0.5rem 0' }}>Tripod Ontology Reference</h2>
              <p style={{ fontSize: '0.85rem', color: s.muted, lineHeight: 1.6, maxWidth: 680, margin: 0 }}>
                Use these references to study the full ontology and the expanded property dimensions. Open them in a new tab while you analyze.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <a
                href="/ontology/tripod-ontology.html"
                target="_blank"
                rel="noreferrer"
                style={{ padding: '0.45rem 0.85rem', borderRadius: 8, fontSize: '0.8rem', fontWeight: 600, color: 'white', backgroundColor: s.telha, border: 'none', textDecoration: 'none' }}
              >
                Open Ontology
              </a>
              <a
                href="/ontology/expanded-properties.html"
                target="_blank"
                rel="noreferrer"
                style={{ padding: '0.45rem 0.85rem', borderRadius: 8, fontSize: '0.8rem', fontWeight: 600, color: s.dark, backgroundColor: '#F0EFE0', border: `1px solid ${s.border}`, textDecoration: 'none' }}
              >
                Expanded Properties
              </a>
            </div>
          </div>
        </section>

        <section>
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

        <section style={{ marginTop: '2.5rem' }}>
          <h2 style={{ fontFamily: s.display, fontSize: '1.15rem', fontWeight: 600, marginBottom: '1rem' }}>Four-Pass Workflow</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
            {[
              { n: 1, t: 'Structural Skeleton', d: 'WHO does WHAT', c: s.telha },
              { n: 2, t: 'Semantic Context', d: 'HOW and WHY', c: s.azul },
              { n: 3, t: 'Expressive Layer', d: 'WHAT DOES IT FEEL LIKE', c: s.verde },
              { n: 4, t: 'AI Review', d: 'Quality check', c: s.dark },
            ].map((i) => (
              <div key={i.n} style={{ borderRadius: 12, border: `1px solid ${s.border}`, padding: '1.25rem', backgroundColor: 'white' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <span style={{ width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.75rem', fontWeight: 700, backgroundColor: i.c }}>{i.n}</span>
                  <h3 style={{ fontFamily: s.display, fontSize: '0.9rem', fontWeight: 600, margin: 0 }}>{i.t}</h3>
                </div>
                <p style={{ fontSize: '0.8rem', color: s.muted, lineHeight: 1.5, margin: 0 }}>{i.d}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <footer style={{ borderTop: `1px solid ${s.border}`, padding: '1.5rem 2rem', marginTop: '3rem' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <img src="/logos/I_CONE_-_telha.svg" alt="Shema" style={{ height: 20, width: 20 }} />
            <span style={{ fontSize: '0.8rem', color: s.muted }}>Shema Bible Translation - Ready Vessels Project - YWAM Kansas City - 2026</span>
          </div>
          <span style={{ fontSize: '0.7rem', color: '#C5C29F' }}>Tripod Ontology v5.3</span>
        </div>
      </footer>
    </div>
  );
}

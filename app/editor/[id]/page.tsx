'use client';

import { useParams } from 'next/navigation';
import { useState } from 'react';

const s = {
  display: 'Source Serif 4, Georgia, serif',
  body: 'DM Sans, system-ui, sans-serif',
  mono: 'JetBrains Mono, monospace',
  hebrew: 'SBL Hebrew, Ezra SIL, Times New Roman, serif',
  muted: '#5A5940',
  border: '#E4E3D0',
  borderLight: '#D4D2B8',
  telha: '#BE4A01',
  azul: '#89AAA3',
  verde: '#777D45',
  dark: '#3F3E20',
  bgCard: '#EDECD8',
};

const PASSES = [
  { label: 'Pass 1: Structure', color: s.telha },
  { label: 'Pass 2: Context', color: s.azul },
  { label: 'Pass 3: Expression', color: s.verde },
  { label: 'Pass 4: AI Review', color: s.dark },
];

export default function EditorPage() {
  const params = useParams();
  const projectId = params.id as string;
  const [activePass, setActivePass] = useState(0);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: s.body }}>
      {/* Header */}
      <header style={{ borderBottom: `1px solid ${s.borderLight}`, padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <a href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', color: s.muted }}>
            <span style={{ fontSize: '1.2rem' }}>&larr;</span>
            <img src="/logos/I_CONE_-_telha.svg" alt="Shema" style={{ height: 24, width: 24 }} />
          </a>
          <h1 style={{ fontFamily: s.display, fontSize: '1rem', fontWeight: 600, margin: 0 }}>Editor</h1>
          <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: '0.7rem', fontFamily: s.mono, fontWeight: 500, backgroundColor: '#E8F0EE', color: s.azul, border: `1px solid ${s.azul}` }}>
            Project {projectId}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button style={{ padding: '0.4rem 0.75rem', borderRadius: 6, fontSize: '0.8rem', fontWeight: 500, border: `1px solid ${s.border}`, color: s.muted, backgroundColor: 'transparent', cursor: 'pointer' }}>Export JSON</button>
          <button style={{ padding: '0.4rem 0.75rem', borderRadius: 6, fontSize: '0.8rem', fontWeight: 600, border: 'none', color: 'white', backgroundColor: s.telha, cursor: 'pointer' }}>Save</button>
        </div>
      </header>

      {/* Pass Tabs */}
      <nav style={{ borderBottom: `1px solid ${s.borderLight}`, padding: '0 1.5rem', display: 'flex', gap: '0.25rem' }}>
        {PASSES.map((pass, i) => (
          <button
            key={pass.label}
            onClick={() => setActivePass(i)}
            style={{
              padding: '0.6rem 1rem',
              fontWeight: 500,
              fontSize: '0.85rem',
              borderBottom: i === activePass ? `2px solid ${pass.color}` : '2px solid transparent',
              color: i === activePass ? pass.color : s.muted,
              background: 'none',
              border: 'none',
              borderBottomWidth: 2,
              borderBottomStyle: 'solid',
              borderBottomColor: i === activePass ? pass.color : 'transparent',
              cursor: 'pointer',
              fontFamily: s.body,
            }}
          >
            {pass.label}
          </button>
        ))}
      </nav>

      {/* Three-Panel Layout */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Left: Clause List */}
        <aside style={{ width: 300, borderRight: `1px solid ${s.borderLight}`, overflowY: 'auto', padding: '1rem' }}>
          <h2 style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: s.muted, marginBottom: '0.75rem' }}>Clauses</h2>
          <p style={{ fontSize: '0.85rem', color: s.muted }}>Loading clauses from BHSA data...</p>
        </aside>

        {/* Center: Annotation Workspace */}
        <section style={{ flex: 1, overflowY: 'auto', padding: '2rem' }}>
          <div style={{ maxWidth: 640, margin: '0 auto', textAlign: 'center', paddingTop: '5rem' }}>
            <img src="/logos/I_CONE_-_telha.svg" alt="" style={{ height: 48, width: 48, margin: '0 auto 1rem', opacity: 0.3 }} />
            <h2 style={{ fontFamily: s.display, fontSize: '1.15rem', fontWeight: 600, marginBottom: '0.5rem' }}>Meaning Map Editor</h2>
            <p style={{ fontSize: '0.85rem', color: s.muted }}>Select a clause from the left panel to begin annotation.</p>
          </div>
        </section>

        {/* Right: JSON / Review */}
        <aside style={{ width: 300, borderLeft: `1px solid ${s.borderLight}`, overflowY: 'auto', padding: '1rem' }}>
          <h2 style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: s.muted, marginBottom: '0.75rem' }}>Annotation Data</h2>
          <pre style={{ fontSize: '0.7rem', fontFamily: s.mono, color: s.muted, backgroundColor: s.bgCard, padding: '0.75rem', borderRadius: 8, overflow: 'auto' }}>
{JSON.stringify({ project: projectId, pass: activePass + 1, clauses: [] }, null, 2)}
          </pre>
        </aside>
      </div>
    </div>
  );
}

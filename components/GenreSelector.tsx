'use client';

import { MAJOR_GENRES, SUBGENRES } from '@/lib/ontology';
import type { MajorGenre, Subgenre } from '@/lib/types';

interface GenreSelectorProps {
  genre: MajorGenre | null;
  subgenre: Subgenre | null;
  onSelect: (genre: MajorGenre, subgenre: Subgenre) => void;
}

/**
 * Genre selection screen.
 * 7 major genres \u2192 38 sub-genres.
 * Genre choice determines which ontology layers are active (40\u201360% reduction).
 */
export default function GenreSelector({ genre, subgenre, onSelect }: GenreSelectorProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-3">
          Select Genre
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {MAJOR_GENRES.filter(g => g.value !== 'not_specified' && g.value !== 'other').map((g) => (
            <button
              key={g.value}
              onClick={() => {
                const subs = SUBGENRES[g.value];
                if (subs && subs.length > 0) {
                  onSelect(g.value as MajorGenre, subs[0].value as Subgenre);
                }
              }}
              className={`px-3 py-2 rounded-lg text-sm font-medium border transition-brand
                ${genre === g.value
                  ? 'border-[var(--telha)] bg-[#FFF3EB] text-[var(--telha)]'
                  : 'border-[var(--color-border-light)] hover:border-[var(--telha)]'
                }`}
            >
              {g.label}
            </button>
          ))}
        </div>
      </div>

      {genre && SUBGENRES[genre] && (
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-3">
            Sub-Genre
          </h3>
          <div className="flex flex-wrap gap-2">
            {SUBGENRES[genre].map((s) => (
              <button
                key={s.value}
                onClick={() => onSelect(genre, s.value as Subgenre)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-brand
                  ${subgenre === s.value
                    ? 'border-[var(--azul)] bg-[#E8F0EE] text-[var(--azul)]'
                    : 'border-[var(--color-border-light)] hover:border-[var(--azul)]'
                  }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

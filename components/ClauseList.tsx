'use client';

import type { BHSAClause } from '@/lib/types';

interface ClauseListProps {
  clauses: BHSAClause[];
  selectedClauseId: number | null;
  onSelectClause: (clauseId: number) => void;
  flaggedClauseIds?: Set<number>; // clauses with \u2691 from AI review
  completedClauseIds?: Set<number>; // clauses with annotations
}

/**
 * Clause list panel (left sidebar of the editor).
 * Shows Hebrew text, clause type badges, and verbless markers.
 * Flagged clauses display \u2691 marker.
 */
export default function ClauseList({
  clauses,
  selectedClauseId,
  onSelectClause,
  flaggedClauseIds = new Set(),
  completedClauseIds = new Set(),
}: ClauseListProps) {
  return (
    <div className="space-y-1">
      {clauses.map((clause, index) => {
        const isSelected = clause.id === selectedClauseId;
        const isFlagged = flaggedClauseIds.has(clause.id);
        const isCompleted = completedClauseIds.has(clause.id);

        return (
          <button
            key={clause.id}
            onClick={() => onSelectClause(clause.id)}
            className={`w-full text-left px-3 py-2.5 rounded-lg transition-brand
              ${isSelected
                ? 'bg-[#FFF3EB] border border-[var(--telha)]'
                : 'hover:bg-[var(--color-bg-secondary)] border border-transparent'
              }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-[var(--color-text-muted)]">
                Clause {index + 1}
              </span>
              <div className="flex items-center gap-1.5">
                {isFlagged && (
                  <span className="text-amber-500 text-xs" title="Has review flags">\u2691</span>
                )}
                {isCompleted && (
                  <span className="text-green-600 text-xs" title="Annotated">\u2713</span>
                )}
                <span className={`badge text-[10px] ${clause.is_verbless ? 'badge-verbless' : 'badge-verbal'}`}>
                  {clause.clause_type}
                </span>
              </div>
            </div>
            <div className="hebrew-text text-sm leading-relaxed">
              {clause.hebrew_text}
            </div>
            <div className="text-[11px] text-[var(--color-text-muted)] mt-1 truncate">
              {clause.gloss}
            </div>
          </button>
        );
      })}
    </div>
  );
}

// =============================================================================
// TIER 1 VALIDATION: Pre-Fill vs. Gold Standard (Ruth 1:1–5)
//
// Run with: npx tsx lib/prefill-validation.ts
//
// Compares pre-fill engine output against the manually-created Ruth 1:1–5
// mapping (Tripod Ontology v5.4). Reports per-field accuracy.
// =============================================================================

import { prefillPericope } from "./prefill-engine";
import type { BHSAEnrichedVerse, PrefillClauseResult } from "./prefill-types";

// ---------------------------------------------------------------------------
// Gold standard: Ruth 1:1–5 (19 clauses)
// Extracted from Ruth_1_1-5_v54_Mapping.docx
// ---------------------------------------------------------------------------

interface GoldClause {
  ref: string;               // e.g. "1:1c1"
  clause_type: string;       // event | existential | identification | classification | attribution
  event_category?: string;   // MOTION, STATE, META, etc.
  discourse_function?: string; // MAIN, BG, SET
  polarity: string;          // positive | negative
  aspect?: string;           // completed, ongoing, habitual, etc.
  time_frame?: string;       // retrospective, prospective
  register?: string;         // narrative, quotation, discourse
  participants?: string[];   // labels of expected participants
}

const GOLD: GoldClause[] = [
  // Ruth 1:1
  { ref: "1:1c1", clause_type: "event", event_category: "META",
    discourse_function: "setting", polarity: "positive", aspect: "completed",
    time_frame: "retrospective", register: "narrative" },
  { ref: "1:1c2", clause_type: "event", event_category: "SOCIAL",
    discourse_function: "background", polarity: "positive", aspect: "completed",
    time_frame: "retrospective" },
  { ref: "1:1c3", clause_type: "existential",
    discourse_function: "setting", polarity: "positive",
    register: "narrative",
    participants: ["famine", "the land"] },
  { ref: "1:1c4", clause_type: "event", event_category: "MOTION",
    discourse_function: "mainline", polarity: "positive", aspect: "completed",
    time_frame: "retrospective",
    participants: ["a man", "his wife", "his two sons"] },
  { ref: "1:1c5", clause_type: "event", event_category: "STATE",
    discourse_function: "background", polarity: "positive",
    time_frame: "retrospective" },

  // Ruth 1:2
  { ref: "1:2c1", clause_type: "identification",
    discourse_function: "background", polarity: "positive",
    participants: ["the man", "Elimelech"] },
  { ref: "1:2c2", clause_type: "identification",
    discourse_function: "background", polarity: "positive",
    participants: ["his wife", "Naomi"] },
  { ref: "1:2c3", clause_type: "identification",
    discourse_function: "background", polarity: "positive",
    participants: ["his two sons", "Mahlon", "Kilion"] },
  { ref: "1:2c4", clause_type: "classification",
    discourse_function: "background", polarity: "positive",
    participants: ["Ephrathites"] },
  { ref: "1:2c5", clause_type: "event", event_category: "MOTION",
    discourse_function: "mainline", polarity: "positive", aspect: "completed",
    time_frame: "retrospective" },
  { ref: "1:2c6", clause_type: "event", event_category: "STATE",
    discourse_function: "mainline", polarity: "positive", aspect: "completed",
    time_frame: "retrospective" },

  // Ruth 1:3
  { ref: "1:3c1", clause_type: "event", event_category: "PROCESS",
    discourse_function: "mainline", polarity: "positive", aspect: "completed",
    time_frame: "retrospective",
    participants: ["Elimelech"] },
  { ref: "1:3c2", clause_type: "event",
    discourse_function: "mainline", polarity: "positive", aspect: "completed",
    time_frame: "retrospective",
    participants: ["she", "her two sons"] },

  // Ruth 1:4
  { ref: "1:4c1", clause_type: "event", event_category: "SOCIAL",
    discourse_function: "mainline", polarity: "positive", aspect: "completed",
    time_frame: "retrospective" },
  { ref: "1:4c2", clause_type: "identification",
    discourse_function: "background", polarity: "positive",
    participants: ["Orpah"] },
  { ref: "1:4c3", clause_type: "identification",
    discourse_function: "background", polarity: "positive",
    participants: ["Ruth"] },
  { ref: "1:4c4", clause_type: "event", event_category: "STATE",
    discourse_function: "mainline", polarity: "positive", aspect: "completed",
    time_frame: "retrospective" },

  // Ruth 1:5
  { ref: "1:5c1", clause_type: "event", event_category: "PROCESS",
    discourse_function: "mainline", polarity: "positive", aspect: "completed",
    time_frame: "retrospective",
    participants: ["Mahlon", "Kilion"] },
  { ref: "1:5c2", clause_type: "event",
    discourse_function: "mainline", polarity: "positive", aspect: "completed",
    time_frame: "retrospective",
    participants: ["the woman"] },
];

// ---------------------------------------------------------------------------
// Scoring
// ---------------------------------------------------------------------------

interface Score {
  field: string;
  total: number;
  correct: number;
  incorrect: number;
  not_attempted: number;
  details: string[];  // mismatch descriptions
}

function scoreField(
  field: string,
  clauses: PrefillClauseResult[],
  gold: GoldClause[],
  getActual: (c: PrefillClauseResult) => string | null | undefined,
  getExpected: (g: GoldClause) => string | null | undefined
): Score {
  const score: Score = {
    field,
    total: 0,
    correct: 0,
    incorrect: 0,
    not_attempted: 0,
    details: [],
  };

  const len = Math.min(clauses.length, gold.length);
  for (let i = 0; i < len; i++) {
    const expected = getExpected(gold[i]);
    if (expected === undefined || expected === null) continue; // no gold value

    score.total++;
    const actual = getActual(clauses[i]);

    if (actual === null || actual === undefined || actual === "not_specified") {
      score.not_attempted++;
      score.details.push(`  ${gold[i].ref}: expected "${expected}", got nothing`);
    } else if (actual === expected) {
      score.correct++;
    } else {
      score.incorrect++;
      score.details.push(`  ${gold[i].ref}: expected "${expected}", got "${actual}"`);
    }
  }

  return score;
}

// ---------------------------------------------------------------------------
// Main validation
// ---------------------------------------------------------------------------

export function validateAgainstGold(enrichedVerses: BHSAEnrichedVerse[]): void {
  console.log("=== TIER 1 VALIDATION: Ruth 1:1–5 ===\n");

  const result = prefillPericope(enrichedVerses, "Ruth", 1, 1, 1, 5);
  const clauses = result.clauses;

  console.log(`Pre-filled ${clauses.length} clauses (gold: ${GOLD.length})\n`);

  if (clauses.length !== GOLD.length) {
    console.warn(`⚠ Clause count mismatch! Pre-fill: ${clauses.length}, Gold: ${GOLD.length}`);
    console.warn("  This may indicate differences in BHSA clause segmentation.\n");
  }

  // Score each field
  const scores: Score[] = [];

  scores.push(scoreField(
    "clause_type",
    clauses, GOLD,
    c => c.clause_type.value,
    g => g.clause_type
  ));

  scores.push(scoreField(
    "event_category",
    clauses, GOLD,
    c => c.event_category?.value ?? null,
    g => g.event_category ?? null
  ));

  scores.push(scoreField(
    "discourse_function",
    clauses, GOLD,
    c => c.discourse_function?.value ?? null,
    g => g.discourse_function ?? null
  ));

  scores.push(scoreField(
    "polarity",
    clauses, GOLD,
    c => c.polarity.value,
    g => g.polarity
  ));

  scores.push(scoreField(
    "aspect",
    clauses, GOLD,
    c => c.aspect?.value ?? null,
    g => g.aspect ?? null
  ));

  scores.push(scoreField(
    "time_frame",
    clauses, GOLD,
    c => c.time_frame?.value ?? null,
    g => g.time_frame ?? null
  ));

  scores.push(scoreField(
    "register",
    clauses, GOLD,
    c => c.register.value,
    g => g.register ?? null
  ));

  // Print results
  console.log("FIELD                  TOTAL  CORRECT  INCORRECT  SKIPPED  ACCURACY");
  console.log("─".repeat(73));

  for (const s of scores) {
    const accuracy = s.total > 0
      ? ((s.correct / s.total) * 100).toFixed(0) + "%"
      : "n/a";
    const line = [
      s.field.padEnd(23),
      String(s.total).padStart(5),
      String(s.correct).padStart(8),
      String(s.incorrect).padStart(10),
      String(s.not_attempted).padStart(8),
      accuracy.padStart(9),
    ].join("");
    console.log(line);
  }

  // Print mismatches
  console.log("\n─── MISMATCHES ───\n");
  for (const s of scores) {
    if (s.details.length > 0) {
      console.log(`${s.field}:`);
      for (const d of s.details) {
        console.log(d);
      }
      console.log();
    }
  }

  // Overall recommendation
  const totalChecks = scores.reduce((sum, s) => sum + s.total, 0);
  const totalCorrect = scores.reduce((sum, s) => sum + s.correct, 0);
  const overallAccuracy = totalChecks > 0 ? (totalCorrect / totalChecks) * 100 : 0;

  console.log("─".repeat(73));
  console.log(`OVERALL: ${totalCorrect}/${totalChecks} correct (${overallAccuracy.toFixed(1)}%)`);

  if (overallAccuracy >= 80) {
    console.log("✓ Pre-fill engine is performing well. Safe to deploy.");
  } else if (overallAccuracy >= 60) {
    console.log("△ Pre-fill engine needs tuning. Review mismatches above.");
  } else {
    console.log("✗ Pre-fill accuracy too low. Review rule mappings before deployment.");
  }
}

// ---------------------------------------------------------------------------
// CLI runner
// ---------------------------------------------------------------------------

// To run standalone, load the Ruth JSON and pass it in:
//
//   import ruthData from "../data/bhsa/ruth.json";
//   validateAgainstGold(ruthData.verses);
//
// Or use this file as: npx tsx lib/prefill-validation.ts
// (requires ruth.json in data/bhsa/)

async function main() {
  const fs = await import("fs");
  const path = await import("path");

  const ruthPath = path.resolve(__dirname, "../data/bhsa/ruth.json");
  if (!fs.existsSync(ruthPath)) {
    console.error("Error: ruth.json not found at", ruthPath);
    console.error("Run: python scripts/extract-bhsa-enriched.py ruth");
    process.exit(1);
  }

  const raw = fs.readFileSync(ruthPath, "utf-8");
  const ruthData = JSON.parse(raw);
  validateAgainstGold(ruthData.verses);
}

main().catch(console.error);

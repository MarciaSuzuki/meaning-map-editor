// =============================================================================
// TIER 1 PRE-FILL — ENRICHED BHSA TYPES
// These extend the base BHSAClause/BHSAPhrase with word-level morphological
// features needed for deterministic pre-fill. The enriched JSON is produced
// by scripts/extract-bhsa-enriched.py.
// =============================================================================

/** Word-level features from BHSA (Text-Fabric extraction). */
export interface BHSAWord {
  word_id: number;
  text_utf8: string;         // pointed Hebrew (אֲשֶׁר)
  lex: string;               // consonantal lexeme, transliterated (>CR)
  lex_utf8: string;          // consonantal lexeme, Hebrew (אשׁר)
  gloss: string;             // English gloss ("which")
  sp: string;                // part of speech: verb, subs, nmpr, adjv, advb, prep, conj, prps, prde, inrg, nega, intj, art
  pdp: string;               // phrase-dependent POS
  gn: string;                // gender: m, f, NA, unknown
  nu: string;                // number: sg, pl, du, NA, unknown
  ps: string;                // person: p1, p2, p3, NA, unknown
  vs: string;                // verbal stem: qal, nif, piel, pual, hif, hof, hit, NA
  vt: string;                // verbal tense: perf, impf, wayq, impv, infa, infc, ptca, ptcp, NA
  st: string;                // state: a (absolute), c (construct), e (emphatic), NA
  ls: string;                // lexical set: quot, ques, nmdi, card, ordn, NA
  nametype: string;          // named entity: pers, topo, ppde, gntl, NA
  prs: string;               // pronominal suffix consonantal
  prs_gn: string;            // suffix gender
  prs_nu: string;            // suffix number
  prs_ps: string;            // suffix person
}

/** Enriched phrase with word-level data. */
export interface BHSAEnrichedPhrase {
  phrase_id: number;
  function: string;          // Subj, Pred, Objc, Cmpl, Adju, Time, Loca, Modi, PreC, PreO, PtcO, Ques, Rela, Conj, ExsS, IntS, ModS, NCoS, PrcS, PreS, Supp, NA
  typ: string;               // NP, VP, PP, AdvP, CP, InrP, InjP, DPrP, PPrP, IPrP, NegP, NA
  rela: string;              // phrase relation
  words: BHSAWord[];
}

/** Enriched clause with phrase and word data. */
export interface BHSAEnrichedClause {
  clause_id: number;
  typ: string;               // NmCl, Way0, WayX, InfC, Ptcp, xQt0, XQtl, ZQt0, ZQtX, xYq0, XYqt, Ellp, etc.
  txt: string;               // text type: N, D, Q, QN, NQ, etc.
  rela: string;              // clause relation
  domain: string;            // N, D, Q, ?
  kind: string;              // VC, NC, AjCl, Ellp
  hebrew_text: string;       // full Hebrew text of clause
  transliteration: string;
  gloss: string;
  phrases: BHSAEnrichedPhrase[];
  words: BHSAWord[];         // flat word list (same words, for convenience)
}

/** Enriched verse. */
export interface BHSAEnrichedVerse {
  chapter: number;
  verse: number;
  clauses: BHSAEnrichedClause[];
}

/** Enriched book file. */
export interface BHSAEnrichedBook {
  book: string;
  extraction_version: string; // e.g. "enriched-v1"
  bhsa_version: string;       // e.g. "2021"
  verses: BHSAEnrichedVerse[];
}

// =============================================================================
// PRE-FILL RESULT TYPES
// These describe what the pre-fill engine returns per clause.
// Each field carries a `source` tag so the UI knows what is auto vs. human.
// =============================================================================

export type PrefillSource = "BHSA_AUTO" | "human" | "human_confirmed" | "unset";

export interface PrefillValue<T> {
  value: T;
  source: PrefillSource;
  confidence: "high" | "medium" | "low";
  bhsa_basis?: string;       // which BHSA feature produced this value
}

export interface PrefillParticipant {
  id: string;
  label: string;
  label_hebrew: string;
  type: PrefillValue<string>;
  quantity: PrefillValue<string>;
  reference_status: PrefillValue<string>;
  semantic_role: PrefillValue<string>;
  word_id: number;           // back-reference to BHSA word
  phrase_function: string;   // which phrase this came from
}

export interface PrefillSemanticRole {
  role: string;
  filler: string;
  filler_hebrew: string;
  source: PrefillSource;
  confidence: "high" | "medium" | "low";
  phrase_function: string;   // BHSA phrase function that produced this
}

export interface PrefillEventCore {
  lexeme: string;
  lexeme_utf8: string;
  gloss: string;
  verbal_stem: string;
  verbal_tense: string;
}

export interface PrefillClauseResult {
  clause_id: number;

  // Layer 3: Clause Semantics
  clause_type: PrefillValue<string>;          // event | identification | classification | attribution | existential
  event_category: PrefillValue<string> | null; // MOTION, STATE, etc. — only high-confidence
  event_core: PrefillEventCore | null;
  semantic_roles: PrefillSemanticRole[];

  // Layer 1: Participants
  participants: PrefillParticipant[];

  // Layer 4: Event Modifiers
  reality: PrefillValue<string>;
  polarity: PrefillValue<string>;
  aspect: PrefillValue<string> | null;
  time_frame: PrefillValue<string> | null;
  volitionality: PrefillValue<string> | null;

  // Layer 5: Discourse
  discourse_function: PrefillValue<string> | null;
  register: PrefillValue<string>;

  // Layer 6: Pragmatics (only register, others need human)
  // Layers 7–14: NOT pre-filled (human-only)
}

/** Full pericope pre-fill result. */
export interface PrefillPericope {
  book: string;
  start_chapter: number;
  start_verse: number;
  end_chapter: number;
  end_verse: number;
  clauses: PrefillClauseResult[];
  participant_registry: PrefillParticipant[];  // deduplicated, pericope-wide
}

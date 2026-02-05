// =============================================================================
// TIER 1 PRE-FILL ENGINE
// Deterministic mapping from BHSA features → Tripod Ontology v5.4 fields
//
// Principle: only pre-fill what can be derived with high confidence from
// explicit BHSA annotations. Leave everything else for the human analyst.
//
// Usage:
//   import { prefillPericope } from "@/lib/prefill-engine";
//   const result = prefillPericope(enrichedVerses, "Ruth", 1, 1, 1, 5);
//
// =============================================================================

import type {
  BHSAEnrichedClause,
  BHSAEnrichedPhrase,
  BHSAEnrichedVerse,
  BHSAWord,
  PrefillClauseResult,
  PrefillEventCore,
  PrefillParticipant,
  PrefillPericope,
  PrefillSemanticRole,
  PrefillSource,
  PrefillValue,
} from "./prefill-types";

// =============================================================================
// CONSTANTS: BHSA → TRIPOD MAPPINGS
// =============================================================================

/**
 * High-confidence verb lexeme → event category mappings.
 * Only includes verbs where the category is unambiguous regardless of context.
 * Everything else is left for the human.
 */
const VERB_EVENT_CATEGORY: Record<string, string> = {
  // MOTION verbs
  "HLK[": "MOTION",     // walk, go
  "BWJ>[": "MOTION",    // come, enter (note: BHSA uses BWJ> for בוא)
  "BW>[": "MOTION",     // come (alternate lexeme form)
  ">WB[": "MOTION",     // come (alternate)
  "CWB[": "MOTION",     // return
  "JY>[": "MOTION",     // go out
  "<LH[": "MOTION",     // go up
  "JRD[": "MOTION",     // go down
  "NWS[": "MOTION",     // flee
  "RWY[": "MOTION",     // run
  "BRX[": "MOTION",     // flee

  // TRANSFER verbs
  "NTN[": "TRANSFER",   // give
  "LQX[": "TRANSFER",   // take
  "NC>[": "TRANSFER",   // lift, carry (can be TRANSFER or MOTION — medium confidence)

  // SPEECH verbs
  ">MR[": "SPEECH", // say
  "DBR[": "SPEECH", // speak
  "QR>[": "SPEECH", // call, proclaim
  "SPR[": "SPEECH", // tell, recount
  "NGD[": "SPEECH", // declare
  "CMW[": "INTERNAL", // hear (perception)
  "C>L[": "SPEECH", // ask

  // PERCEPTION verbs → INTERNAL
  "R>H[": "INTERNAL", // see
  "JD<[": "INTERNAL", // know

  // STATE verbs
  "HJH[": "STATE",      // be, become (but often META — see clause-type routing)
  "JCB[": "STATE",      // sit, dwell
  "GWR[": "STATE",       // sojourn
  "<MD[": "STATE",       // stand
  "CKB[": "STATE",       // lie down

  // PROCESS verbs
  "MWT[": "PROCESS", // die
  "JLD[": "PROCESS", // give birth, be born
  "XJH[": "STATE",   // live

  // ACTION verbs
  ">KL[": "ACTION", // eat
  "CTH[": "ACTION", // drink

  // SOCIAL verbs
  "MLK[": "SOCIAL",     // reign
  "CPV[": "SOCIAL",     // judge
  "PQD[": "SOCIAL",     // appoint, visit

  // ACTION verbs (creation/building)
  "BR>[": "ACTION",   // create
  "<FH[": "ACTION",   // make
  "BNH[": "ACTION",   // build

  // ACTION verbs (combat)
  "LXM[": "ACTION",     // fight
  "NKH[": "ACTION",     // strike
  "HRG[": "ACTION",     // kill
};

/**
 * BHSA phrase function → Tripod semantic role.
 * Only high-confidence mappings. Ambiguous functions → "not_specified".
 */
const PHRASE_ROLE_MAP: Record<string, { role: string; confidence: "high" | "medium" | "low" }> = {
  "Subj": { role: "initiator", confidence: "medium" },    // usually initiator, but experiencer/affected also possible
  "Objc": { role: "affected", confidence: "medium" },     // usually affected, but theme/recipient also possible
  "Loca": { role: "location", confidence: "high" },
  "Time": { role: "time", confidence: "high" },
  "Cmpl": { role: "not_specified", confidence: "low" },   // too generic for high confidence
  "Adju": { role: "manner", confidence: "low" },
  "PreC": { role: "not_specified", confidence: "low" },    // predicate complement — depends on clause type
};

/**
 * BHSA clause type → discourse function.
 * Mainline wayyiqtol = MAIN; background/offline = BG.
 */
const DISCOURSE_FUNCTION_MAP: Record<string, { fn: string; confidence: "high" | "medium" | "low" }> = {
  "Way0": { fn: "mainline", confidence: "high" },
  "WayX": { fn: "mainline", confidence: "high" },
  "NmCl": { fn: "background", confidence: "high" },
  "InfC": { fn: "background", confidence: "high" },
  "Ptcp": { fn: "background", confidence: "medium" },
  "xQt0": { fn: "background", confidence: "medium" },
  "XQtl": { fn: "background", confidence: "medium" },
  "ZQt0": { fn: "background", confidence: "medium" },
  "Ellp": { fn: "background", confidence: "low" },
};

/**
 * Negation particles in Biblical Hebrew.
 */
const NEGATION_LEXEMES = new Set([
  "L>",    // לא
  ">L",    // אל
  "BL",    // בל
  ">JN",   // אין (existential negation)
  "LBL",   // לבל
]);

// =============================================================================
// CORE ENGINE
// =============================================================================

/**
 * Pre-fill a full pericope.
 * This is the main entry point. Call it when the editor loads a pericope.
 */
export function prefillPericope(
  verses: BHSAEnrichedVerse[],
  book: string,
  startChapter: number,
  startVerse: number,
  endChapter: number,
  endVerse: number
): PrefillPericope {
  // 1. Filter to the requested range
  const pericope = filterVerseRange(verses, startChapter, startVerse, endChapter, endVerse);

  // 2. Pre-fill each clause independently
  const allClauses: PrefillClauseResult[] = [];
  for (const verse of pericope) {
    for (const clause of verse.clauses) {
      allClauses.push(prefillClause(clause));
    }
  }

  // 3. Run pericope-wide passes
  assignReferenceStatus(allClauses);

  // 4. Build deduplicated participant registry
  const registry = buildParticipantRegistry(allClauses);

  return {
    book,
    start_chapter: startChapter,
    start_verse: startVerse,
    end_chapter: endChapter,
    end_verse: endVerse,
    clauses: allClauses,
    participant_registry: registry,
  };
}

/**
 * Pre-fill a single clause. This is the workhorse function.
 */
export function prefillClause(clause: BHSAEnrichedClause): PrefillClauseResult {
  const clauseType = inferClauseType(clause);
  const participants = extractParticipants(clause);
  const eventCore = extractEventCore(clause);
  const eventCategory = inferEventCategory(clause, eventCore);
  const semanticRoles = extractSemanticRoles(clause);
  const modifiers = inferModifiers(clause);
  const discourseFn = inferDiscourseFunction(clause);
  const register = inferRegister(clause);

  return {
    clause_id: clause.clause_id,

    // Layer 3
    clause_type: clauseType,
    event_category: eventCategory,
    event_core: eventCore,
    semantic_roles: semanticRoles,

    // Layer 1
    participants,

    // Layer 4
    reality: modifiers.reality,
    polarity: modifiers.polarity,
    aspect: modifiers.aspect,
    time_frame: modifiers.time_frame,
    volitionality: modifiers.volitionality,

    // Layer 5
    discourse_function: discourseFn,
    register,
  };
}

// =============================================================================
// LAYER 3: CLAUSE TYPE ROUTING
// =============================================================================

function inferClauseType(clause: BHSAEnrichedClause): PrefillValue<string> {
  const { typ, kind, phrases } = clause;

  // Verbless clauses
  if (typ === "NmCl" || kind === "NC" || kind === "AjCl") {
    const predPhrase = phrases.find(p => p.function === "PreC" || p.function === "PreS");
    if (!predPhrase) {
      return pv("classification", "medium", "typ=" + typ);
    }

    const mainWord = findHeadNoun(predPhrase);
    if (!mainWord) {
      return pv("classification", "medium", "typ=" + typ);
    }

    // Proper noun predicate → identification ("the name was Elimelech")
    if (mainWord.sp === "nmpr") {
      return pv("identification", "high", "PreC head is nmpr");
    }

    // Adjective predicate → attribution ("the land was good")
    if (mainWord.sp === "adjv") {
      return pv("attribution", "high", "PreC head is adjv");
    }

    // Gentilics → classification ("Ephrathites from Bethlehem")
    if (mainWord.nametype === "gntl") {
      return pv("classification", "high", "PreC head is gntl");
    }

    // Default verbless → classification
    return pv("classification", "medium", "typ=" + typ + " default");
  }

  // Check for existential: ויהי with no real subject agent
  const hasHJH = clause.words.some(w => w.sp === "verb" && w.lex === "HJH[");
  const hasSubj = phrases.some(p => p.function === "Subj");
  if (hasHJH) {
    // ויהי רעב = existential; ויהי בימי = META frame-opener
    // Heuristic: if there IS a subject noun → existential ("there was a famine")
    // If NO subject → META temporal frame ("and it was in the days of")
    if (hasSubj) {
      return pv("existential", "medium", "HJH + Subj");
    }
    // ויהי as temporal frame or general state
    // We mark it as "event" and let the human refine to META if needed
    return pv("event", "medium", "HJH without Subj — possible META");
  }

  // Default: verbal clause → event
  return pv("event", "high", "verbal clause");
}

// =============================================================================
// LAYER 1: PARTICIPANT EXTRACTION
// =============================================================================

function extractParticipants(clause: BHSAEnrichedClause): PrefillParticipant[] {
  const result: PrefillParticipant[] = [];
  const seen = new Set<string>(); // avoid duplicate participants within same clause

  // Nominal phrase functions that carry participants
  const participantFunctions = new Set(["Subj", "Objc", "Cmpl", "PreC", "PreS", "ExsS", "IntS"]);

  for (const phrase of clause.phrases) {
    if (!participantFunctions.has(phrase.function)) continue;

    // Find head nouns/pronouns in the phrase
    for (const word of phrase.words) {
      if (!isParticipantWord(word)) continue;

      const key = word.lex_utf8 || word.lex || word.gloss;
      if (seen.has(key)) continue;
      seen.add(key);

      result.push({
        id: `p_${word.word_id}`,
        label: word.gloss || word.lex,
        label_hebrew: word.lex_utf8 || word.text_utf8,
        type: inferParticipantType(word),
        quantity: inferQuantity(word),
        reference_status: pv("unset", "low", "pending pericope pass"),
        semantic_role: inferRoleFromPhrase(phrase),
        word_id: word.word_id,
        phrase_function: phrase.function,
      });
    }

    // Also check for pronominal suffixes as implicit participants
    for (const word of phrase.words) {
      if (word.prs && word.prs !== "absent" && word.prs !== "n/a") {
        const suffixKey = `suffix_${word.word_id}`;
        if (seen.has(suffixKey)) continue;
        seen.add(suffixKey);

        result.push({
          id: `ps_${word.word_id}`,
          label: describeSuffix(word),
          label_hebrew: word.prs || "",
          type: pv("person", "medium", "pronominal suffix"),
          quantity: inferSuffixQuantity(word),
          reference_status: pv("unset", "low", "pending pericope pass"),
          semantic_role: pv("not_specified", "low", "suffix — role unclear"),
          word_id: word.word_id,
          phrase_function: phrase.function,
        });
      }
    }
  }

  return result;
}

function isParticipantWord(word: BHSAWord): boolean {
  return ["subs", "nmpr", "prps", "prde"].includes(word.sp);
}

function inferParticipantType(word: BHSAWord): PrefillValue<string> {
  // Named entity type gives highest confidence
  if (word.nametype === "pers") return pv("person", "high", "nametype=pers");
  if (word.nametype === "topo") return pv("place", "high", "nametype=topo");
  if (word.nametype === "gntl") return pv("group", "high", "nametype=gntl");
  if (word.nametype === "ppde") return pv("group", "medium", "nametype=ppde");

  // Part of speech fallbacks
  if (word.sp === "nmpr") return pv("person", "medium", "sp=nmpr, no nametype");
  if (word.sp === "prps") return pv("person", "medium", "sp=prps");

  // Common nouns: we can't reliably determine animate vs. abstract
  return pv("not_specified", "low", "sp=" + word.sp);
}

function inferQuantity(word: BHSAWord): PrefillValue<string> {
  switch (word.nu) {
    case "sg": return pv("one", "high", "nu=sg");
    case "du": return pv("two", "high", "nu=du");
    case "pl": return pv("many", "medium", "nu=pl");  // medium: could be "few", "all", etc.
    default: return pv("not_specified", "low", "nu=" + word.nu);
  }
}

function inferSuffixQuantity(word: BHSAWord): PrefillValue<string> {
  switch (word.prs_nu) {
    case "sg": return pv("one", "high", "prs_nu=sg");
    case "du": return pv("two", "high", "prs_nu=du");
    case "pl": return pv("many", "medium", "prs_nu=pl");
    default: return pv("not_specified", "low", "prs_nu=" + word.prs_nu);
  }
}

function inferRoleFromPhrase(phrase: BHSAEnrichedPhrase): PrefillValue<string> {
  const mapping = PHRASE_ROLE_MAP[phrase.function];
  if (mapping) {
    return pv(mapping.role, mapping.confidence, "phrase.function=" + phrase.function);
  }
  return pv("not_specified", "low", "no mapping for " + phrase.function);
}

function describeSuffix(word: BHSAWord): string {
  const person = word.prs_ps === "p1" ? "1st" : word.prs_ps === "p2" ? "2nd" : "3rd";
  const gender = word.prs_gn === "m" ? "masc" : word.prs_gn === "f" ? "fem" : "";
  const number = word.prs_nu === "sg" ? "sg" : word.prs_nu === "pl" ? "pl" : "";
  return `[suffix: ${person} ${gender} ${number}]`.replace(/\s+/g, " ").trim();
}

// =============================================================================
// LAYER 3: EVENT CORE AND CATEGORY
// =============================================================================

function extractEventCore(clause: BHSAEnrichedClause): PrefillEventCore | null {
  // Find the main verb: look in Pred or PreO phrases first, then any verb
  const predPhrase = clause.phrases.find(
    p => p.function === "Pred" || p.function === "PreO"
  );

  let mainVerb: BHSAWord | undefined;
  if (predPhrase) {
    mainVerb = predPhrase.words.find(w => w.sp === "verb");
  }
  if (!mainVerb) {
    mainVerb = clause.words.find(w => w.sp === "verb");
  }
  if (!mainVerb) return null;

  return {
    lexeme: mainVerb.lex,
    lexeme_utf8: mainVerb.lex_utf8,
    gloss: mainVerb.gloss,
    verbal_stem: mainVerb.vs || "NA",
    verbal_tense: mainVerb.vt || "NA",
  };
}

function inferEventCategory(
  clause: BHSAEnrichedClause,
  eventCore: PrefillEventCore | null
): PrefillValue<string> | null {
  if (!eventCore) return null;

  const category = VERB_EVENT_CATEGORY[eventCore.lexeme];
  if (category) {
    // Special case: HJH is STATE by default but often META as frame-opener
    if (eventCore.lexeme === "HJH[") {
      // If wayyiqtol + בימי or temporal phrase → likely META
      const hasTemporalPhrase = clause.phrases.some(p => p.function === "Time");
      if (clause.typ === "Way0" && hasTemporalPhrase) {
        return pv("META", "medium", "HJH + Way0 + Time phrase → META frame-opener");
      }
      return pv("STATE", "medium", "HJH default → STATE");
    }

    return pv(category, "high", "VERB_EVENT_CATEGORY[" + eventCore.lexeme + "]");
  }

  // No mapping → don't guess
  return null;
}

// =============================================================================
// LAYER 3: SEMANTIC ROLES
// =============================================================================

function extractSemanticRoles(clause: BHSAEnrichedClause): PrefillSemanticRole[] {
  const roles: PrefillSemanticRole[] = [];

  for (const phrase of clause.phrases) {
    // Skip non-argument phrases
    if (phrase.function === "Pred" || phrase.function === "PreO") continue;
    if (phrase.function === "Conj") continue;
    if (phrase.function === "NA") continue;

    const mapping = PHRASE_ROLE_MAP[phrase.function];
    if (!mapping) continue;

    const gloss = phrase.words.map(w => w.gloss).filter(Boolean).join(" ");
    const hebrew = phrase.words.map(w => w.text_utf8).join(" ");

    roles.push({
      role: mapping.role,
      filler: gloss || "[no gloss]",
      filler_hebrew: hebrew,
      source: "BHSA_AUTO",
      confidence: mapping.confidence,
      phrase_function: phrase.function,
    });
  }

  return roles;
}

// =============================================================================
// LAYER 4: EVENT MODIFIERS
// =============================================================================

interface ModifierResult {
  reality: PrefillValue<string>;
  polarity: PrefillValue<string>;
  aspect: PrefillValue<string> | null;
  time_frame: PrefillValue<string> | null;
  volitionality: PrefillValue<string> | null;
}

function inferModifiers(clause: BHSAEnrichedClause): ModifierResult {
  const mainVerb = clause.words.find(w => w.sp === "verb");

  // Polarity: check for negation particles
  const hasNegation = clause.words.some(w => {
    const bare = w.lex.replace(/[\[\]]/g, "");
    return NEGATION_LEXEMES.has(bare);
  });

  return {
    reality: pv("actual", "medium", "narrative default"),
    polarity: hasNegation
      ? pv("negative", "high", "negation particle found")
      : pv("positive", "high", "no negation particle"),
    aspect: mainVerb ? inferAspect(mainVerb) : null,
    time_frame: inferTimeFrame(clause, mainVerb),
    volitionality: mainVerb ? inferVolitionality(mainVerb) : null,
  };
}

function inferAspect(verb: BHSAWord): PrefillValue<string> {
  switch (verb.vt) {
    case "perf":
      return pv("completed", "medium", "vt=perf");
    case "wayq":
      return pv("completed", "high", "vt=wayq");
    case "impf":
      // Imperfect is ambiguous: ongoing, habitual, or future
      return pv("not_specified", "low", "vt=impf — ambiguous");
    case "ptca":
      return pv("ongoing", "medium", "vt=ptca");
    case "impv":
      return pv("not_specified", "low", "vt=impv — commands lack aspect");
    case "infc":
      return pv("not_specified", "low", "vt=infc");
    case "infa":
      return pv("not_specified", "low", "vt=infa");
    default:
      return pv("not_specified", "low", "vt=" + verb.vt);
  }
}

function inferTimeFrame(
  clause: BHSAEnrichedClause,
  verb: BHSAWord | undefined
): PrefillValue<string> | null {
  const txt = clause.txt || "";

  // Narrative text type → retrospective
  if (txt.charAt(0) === "N") {
    return pv("retrospective", "high", "txt starts with N (narrative)");
  }

  // Commands → prospective
  if (verb?.vt === "impv") {
    return pv("prospective", "high", "vt=impv");
  }

  // Quotation could be anything
  if (txt.includes("Q")) {
    return pv("not_specified", "low", "txt includes Q — ambiguous");
  }

  return null;
}

function inferVolitionality(verb: BHSAWord): PrefillValue<string> | null {
  // Only imperatives are clearly volitional from morphology alone
  if (verb.vt === "impv") {
    return pv("volitional", "high", "vt=impv");
  }
  // Cohortative (1st person imperfect with ה-) could be detected but needs
  // morpheme inspection. Leave for human.
  return null;
}

// =============================================================================
// LAYER 5: DISCOURSE FUNCTION
// =============================================================================

function inferDiscourseFunction(clause: BHSAEnrichedClause): PrefillValue<string> | null {
  const mapping = DISCOURSE_FUNCTION_MAP[clause.typ];
  if (mapping) {
    return pv(mapping.fn, mapping.confidence, "DISCOURSE_MAP[" + clause.typ + "]");
  }
  return null;
}

// =============================================================================
// LAYER 6: REGISTER
// =============================================================================

function inferRegister(clause: BHSAEnrichedClause): PrefillValue<string> {
  const txt = clause.txt || "";

  // Nested text types: first char = outermost domain
  if (txt.includes("Q")) return pv("dialogue", "high", "txt includes Q");
  if (txt.includes("D")) return pv("formal", "medium", "txt includes D");
  return pv("narrative", "high", "txt=" + txt + " (narrative default)");
}

// =============================================================================
// PERICOPE-WIDE: REFERENCE STATUS
// =============================================================================

/**
 * Walk through clauses in order and assign new_mention / given.
 * Uses the Hebrew lexeme as the identity key for participants.
 * Mutates the clause results in place.
 */
function assignReferenceStatus(clauses: PrefillClauseResult[]): void {
  const seen = new Map<string, number>(); // lexeme → first occurrence clause_id

  for (const clause of clauses) {
    for (const p of clause.participants) {
      const key = normalizeParticipantKey(p);

      if (seen.has(key)) {
        p.reference_status = pv("given", "high", "seen in clause " + seen.get(key));
      } else {
        p.reference_status = pv("new_mention", "high", "first occurrence");
        seen.set(key, clause.clause_id);
      }
    }
  }
}

function normalizeParticipantKey(p: PrefillParticipant): string {
  // Use Hebrew label as primary key; fall back to English
  const raw = p.label_hebrew || p.label;
  // Strip common affixes for matching (e.g., "the man" and "man" are same participant)
  return raw.trim().toLowerCase();
}

// =============================================================================
// PARTICIPANT REGISTRY
// =============================================================================

/**
 * Build a deduplicated pericope-wide participant list.
 * Groups by normalized key, keeps the first occurrence's data.
 */
function buildParticipantRegistry(clauses: PrefillClauseResult[]): PrefillParticipant[] {
  const registry = new Map<string, PrefillParticipant>();

  for (const clause of clauses) {
    for (const p of clause.participants) {
      const key = normalizeParticipantKey(p);
      if (!registry.has(key)) {
        registry.set(key, { ...p });
      }
    }
  }

  return Array.from(registry.values());
}

// =============================================================================
// HELPERS
// =============================================================================

/** Convenience: create a PrefillValue with source = BHSA_AUTO. */
function pv<T>(
  value: T,
  confidence: "high" | "medium" | "low",
  basis: string
): PrefillValue<T> {
  return {
    value,
    source: "BHSA_AUTO",
    confidence,
    bhsa_basis: basis,
  };
}

/**
 * Find the semantic head of a noun phrase.
 * Heuristic: the first content word (noun, proper noun, adjective, pronoun).
 * Skips articles, prepositions, conjunctions.
 */
function findHeadNoun(phrase: BHSAEnrichedPhrase): BHSAWord | null {
  const contentPOS = new Set(["subs", "nmpr", "adjv", "prps", "prde"]);
  return phrase.words.find(w => contentPOS.has(w.sp)) || null;
}

/**
 * Filter verses to a chapter:verse range.
 */
function filterVerseRange(
  verses: BHSAEnrichedVerse[],
  startCh: number,
  startV: number,
  endCh: number,
  endV: number
): BHSAEnrichedVerse[] {
  return verses.filter(v => {
    if (v.chapter < startCh || v.chapter > endCh) return false;
    if (v.chapter === startCh && v.verse < startV) return false;
    if (v.chapter === endCh && v.verse > endV) return false;
    return true;
  });
}

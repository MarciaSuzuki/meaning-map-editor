// =============================================================================
// MEANING MAP EDITOR \u2014 TYPE DEFINITIONS
// Tripod Ontology v5.3
// =============================================================================

// ---------------------------------------------------------------------------
// BHSA Source Data (static JSON from Text-Fabric extraction)
// ---------------------------------------------------------------------------

export interface BHSAPhrase {
  id: number;
  function: string; // subj, pred, objc, cmpl, etc.
  hebrew: string;
  transliteration: string;
  gloss: string;
}

export interface BHSAClause {
  id: number;
  clause_type: string; // xQtX, WayX, NmCl, etc.
  is_verbless: boolean;
  hebrew_text: string;
  transliteration: string;
  gloss: string;
  phrases: BHSAPhrase[];
}

export interface BHSAVerse {
  book: string;
  chapter: number;
  verse: number;
  reference: string; // e.g., "Ruth 1:16"
  clauses: BHSAClause[];
}

export interface BHSABook {
  name: string;
  chapters: number;
  verses: BHSAVerse[];
}

// ---------------------------------------------------------------------------
// Layer 1: Participants
// ---------------------------------------------------------------------------

export type ParticipantType =
  | 'person' | 'group' | 'divine' | 'animal' | 'place'
  | 'thing' | 'stuff' | 'abstract' | 'plant' | 'event_as_participant'
  | 'not_specified' | 'other';

export type Quantity =
  | 'one' | 'two' | 'few' | 'many' | 'all' | 'mass' | 'generic'
  | 'not_specified' | 'other';

export type ReferenceStatus =
  | 'new_mention' | 'given' | 'inferrable' | 'generic'
  | 'not_specified' | 'other';

export type SemanticRole =
  | 'initiator' | 'affected' | 'experiencer' | 'recipient'
  | 'beneficiary' | 'source' | 'goal' | 'location'
  | 'instrument' | 'companion' | 'manner' | 'time'
  | 'cause' | 'purpose' | 'result' | 'theme'
  | 'not_specified' | 'other';

export interface Participant {
  id: string;
  label: string; // free-text label, e.g., "Ruth", "Naomi"
  type: ParticipantType;
  quantity: Quantity;
  reference_status: ReferenceStatus;
  semantic_role: SemanticRole;
  properties: ParticipantProperty[];
  other_text?: string; // when type = 'other'
}

// ---------------------------------------------------------------------------
// Layer 2: Participant Properties
// ---------------------------------------------------------------------------

export type PropertyDimension =
  | 'physical' | 'quantity_size' | 'sensory' | 'character'
  | 'social' | 'emotional_state' | 'relational' | 'material'
  | 'evaluative' | 'temporal' | 'spatial';

export type PhysicalProperty =
  | 'male' | 'female' | 'young' | 'old' | 'strong' | 'weak'
  | 'beautiful' | 'ugly' | 'big' | 'small' | 'heavy' | 'light'
  | 'fat' | 'thin' | 'healthy' | 'sick';

export type QuantitySizeProperty =
  | 'full' | 'empty' | 'abundant' | 'scarce' | 'whole' | 'broken'
  | 'deep' | 'shallow' | 'wide' | 'narrow';

export type SensoryProperty =
  | 'bright' | 'dark' | 'loud' | 'quiet' | 'sweet' | 'bitter'
  | 'fragrant' | 'foul' | 'soft' | 'hard' | 'smooth' | 'rough'
  | 'hot' | 'cold';

export type CharacterProperty =
  | 'wise' | 'foolish' | 'righteous' | 'wicked' | 'faithful'
  | 'unfaithful' | 'brave' | 'cowardly' | 'humble' | 'proud';

export type SocialProperty =
  | 'rich' | 'poor' | 'free' | 'enslaved' | 'royal' | 'common'
  | 'priest' | 'prophet' | 'powerful' | 'powerless' | 'honored'
  | 'despised';

export type EmotionalStateProperty =
  | 'happy' | 'sad' | 'angry' | 'afraid' | 'peaceful' | 'troubled'
  | 'confident' | 'anxious' | 'grieving' | 'joyful';

export type RelationalProperty =
  | 'married' | 'widowed' | 'orphaned' | 'firstborn' | 'barren'
  | 'pregnant' | 'betrothed' | 'divorced';

export type MaterialProperty =
  | 'gold' | 'silver' | 'bronze' | 'iron' | 'wood' | 'stone'
  | 'clay' | 'linen' | 'leather' | 'woven';

export type EvaluativeProperty =
  | 'clean' | 'unclean' | 'holy' | 'profane' | 'blessed' | 'cursed'
  | 'true' | 'false' | 'precious' | 'worthless';

export type TemporalProperty =
  | 'new' | 'ancient' | 'temporary' | 'permanent' | 'first' | 'last';

export type SpatialProperty =
  | 'near' | 'far' | 'high' | 'low' | 'inner' | 'outer'
  | 'right' | 'left' | 'front' | 'behind';

export type PropertyValue =
  | PhysicalProperty | QuantitySizeProperty | SensoryProperty
  | CharacterProperty | SocialProperty | EmotionalStateProperty
  | RelationalProperty | MaterialProperty | EvaluativeProperty
  | TemporalProperty | SpatialProperty
  | 'not_specified' | 'other';

export interface ParticipantProperty {
  dimension: PropertyDimension;
  value: PropertyValue;
  other_text?: string;
}

// ---------------------------------------------------------------------------
// Layer 3: Relations
// ---------------------------------------------------------------------------

export type KinshipRelation =
  | 'parent_of' | 'child_of' | 'spouse_of' | 'sibling_of'
  | 'grandparent_of' | 'grandchild_of' | 'in_law_of' | 'clan_member'
  | 'not_specified' | 'other';

export type SocialRelation =
  | 'ruler_of' | 'subject_of' | 'master_of' | 'servant_of'
  | 'ally_of' | 'enemy_of' | 'teacher_of' | 'student_of'
  | 'not_specified' | 'other';

export type PossessionRelation =
  | 'owner_of' | 'belonging_to' | 'steward_of' | 'tribute_to'
  | 'not_specified' | 'other';

export type SpatialRelation =
  | 'above' | 'below' | 'beside' | 'inside' | 'outside'
  | 'between' | 'surrounding' | 'facing'
  | 'not_specified' | 'other';

export interface Relation {
  type: 'kinship' | 'social' | 'possession' | 'spatial';
  value: KinshipRelation | SocialRelation | PossessionRelation | SpatialRelation;
  from_participant: string; // participant ID
  to_participant: string;
  other_text?: string;
}

// ---------------------------------------------------------------------------
// Layer 4: Events
// ---------------------------------------------------------------------------

export type EventCategory =
  | 'STATE' | 'MOTION' | 'ACTION' | 'TRANSFER' | 'SPEECH'
  | 'INTERNAL' | 'PROCESS' | 'RITUAL' | 'META'
  | 'not_specified' | 'other';

export const VERBAL_CORES: Record<string, string[]> = {
  STATE: ['be', 'exist', 'remain', 'belong', 'resemble', 'lack', 'need', 'contain'],
  MOTION: ['go', 'come', 'return', 'follow', 'flee', 'walk', 'run', 'enter', 'leave', 'ascend', 'descend', 'cross', 'wander', 'turn', 'approach'],
  ACTION: ['make', 'build', 'break', 'cut', 'strike', 'kill', 'eat', 'drink', 'take', 'give', 'write', 'open', 'close', 'bind', 'gather', 'plant', 'reap'],
  TRANSFER: ['give', 'send', 'bring', 'receive', 'pay', 'offer', 'lend', 'steal', 'return_object'],
  SPEECH: ['say', 'tell', 'call', 'name', 'ask', 'answer', 'command', 'promise', 'bless', 'curse', 'swear', 'praise', 'pray', 'cry_out', 'sing', 'urge'],
  INTERNAL: ['know', 'think', 'believe', 'remember', 'forget', 'see', 'hear', 'feel', 'love', 'hate', 'fear', 'desire', 'trust', 'decide'],
  PROCESS: ['grow', 'die', 'be_born', 'ripen', 'decay', 'heal', 'age', 'change'],
  RITUAL: ['sacrifice', 'anoint', 'purify', 'circumcise', 'consecrate', 'worship'],
  META: ['begin', 'finish', 'continue', 'repeat', 'cause', 'prevent', 'try'],
};

// Verbless predication (Biblical Hebrew nominal clauses)
export type PredicationType =
  | 'identification' | 'classification' | 'attribution'
  | 'possession' | 'location' | 'existence' | 'circumstantial'
  | 'not_specified' | 'other';

export interface VerblessPredication {
  predication_type: PredicationType;
  subject_term: string;
  predicate_term: string;
  other_text?: string;
}

export type EmbeddedRelation =
  | 'content' | 'purpose' | 'result' | 'cause' | 'manner'
  | 'condition' | 'complement' | 'temporal'
  | 'not_specified' | 'other';

export interface SemanticEvent {
  id: string;
  is_primary: boolean;
  embedded_relation?: EmbeddedRelation; // only for non-primary events
  event_category: EventCategory;
  // Verbal events
  verbal_core?: string;
  // Verbless events (STATE + verbless clause)
  verbless_predication?: VerblessPredication;
  participants: Participant[];
  // Per-event modifiers (Pass 1)
  reality: Reality;
  polarity: Polarity;
  time_frame: TimeFrame;
  aspect: Aspect;
  other_text?: string; // when event_category = 'other'
}

// ---------------------------------------------------------------------------
// Layer 6: Reality & Modality
// ---------------------------------------------------------------------------

export type Reality =
  | 'actual' | 'potential' | 'hypothetical' | 'counterfactual'
  | 'obligatory' | 'desired' | 'feared' | 'commanded' | 'permitted'
  | 'not_specified' | 'other';

// ---------------------------------------------------------------------------
// Layer 7: Time Frame
// ---------------------------------------------------------------------------

export type TimeFrame =
  | 'retrospective' | 'immediate' | 'prospective' | 'gnomic'
  | 'not_specified' | 'other';

// ---------------------------------------------------------------------------
// Layer 8: Evidentiality
// ---------------------------------------------------------------------------

export type Evidentiality =
  | 'witnessed_visual' | 'witnessed_sensory' | 'reported' | 'inferred'
  | 'assumed' | 'general_knowledge' | 'divine_revelation' | 'unspecified'
  | 'not_specified' | 'other';

// ---------------------------------------------------------------------------
// Layer 9: Aspect
// ---------------------------------------------------------------------------

export type Aspect =
  | 'completed' | 'ongoing' | 'habitual' | 'inchoative' | 'cessative'
  | 'not_specified' | 'other';

// ---------------------------------------------------------------------------
// Layer 10: Polarity
// ---------------------------------------------------------------------------

export type Polarity =
  | 'positive' | 'negative'
  | 'not_specified' | 'other';

// ---------------------------------------------------------------------------
// Layer 11: Discourse Structure
// ---------------------------------------------------------------------------

export type DiscourseFunction =
  | 'SET' | 'BG' | 'MAIN' | 'EVAL' | 'QUOTE_MARGIN' | 'PEAK'
  | 'not_specified' | 'other';

export type DiscourseRelation =
  | 'sequence' | 'simultaneous' | 'cause' | 'result' | 'purpose'
  | 'condition' | 'contrast' | 'concession' | 'clarification'
  | 'elaboration' | 'evidence' | 'restatement'
  | 'not_specified' | 'other';

// ---------------------------------------------------------------------------
// Layer 12: Pragmatics & Register
// ---------------------------------------------------------------------------

export type Register =
  | 'informal' | 'narrative' | 'formal' | 'ceremonial' | 'elder_speech'
  | 'legal' | 'poetic' | 'prophetic' | 'wisdom' | 'dialogue' | 'lament'
  | 'hymnic' | 'didactic_poetry' | 'love_poetry' | 'victory_song'
  | 'dirge' | 'taunt' | 'blessing_poetry' | 'curse_poetry'
  | 'not_specified' | 'other';

export type SocialAxis =
  | 'equal_to_equal' | 'superior_to_inferior' | 'inferior_to_superior'
  | 'divine_to_human' | 'human_to_divine' | 'formal_public'
  | 'intimate_private'
  | 'not_specified' | 'other';

export type Prominence =
  | 'peak' | 'high' | 'medium' | 'low'
  | 'not_specified' | 'other';

export type Pacing =
  | 'summary' | 'normal' | 'slow' | 'pause'
  | 'not_specified' | 'other';

// ---------------------------------------------------------------------------
// Layer 13: Emotion & Stance
// ---------------------------------------------------------------------------

export type Emotion =
  | 'joy' | 'hope' | 'gratitude' | 'love' | 'compassion' | 'peace'
  | 'trust' | 'relief' | 'awe' | 'pride' | 'contentment' | 'desire'
  | 'zeal' | 'sorrow' | 'fear' | 'anger' | 'disgust' | 'shame'
  | 'guilt' | 'despair' | 'anxiety' | 'loneliness' | 'jealousy'
  | 'resentment' | 'bitterness' | 'awe_fear' | 'reverence' | 'remorse'
  | 'longing'
  | 'not_specified' | 'other';

export type EmotionIntensity =
  | 'low' | 'medium' | 'high' | 'extreme'
  | 'not_specified';

export type NarratorStance =
  | 'neutral' | 'sympathetic' | 'critical' | 'ironic' | 'celebratory'
  | 'lamenting' | 'didactic' | 'suspenseful'
  | 'not_specified' | 'other';

// ---------------------------------------------------------------------------
// Layer 14: Speech Acts, Figurative Language, Key Terms
// ---------------------------------------------------------------------------

export type SpeechAct =
  | 'assertive' | 'directive' | 'commissive' | 'expressive'
  | 'declarative' | 'interrogative' | 'blessing' | 'curse' | 'oath'
  | 'prophecy' | 'praise' | 'lament' | 'thanksgiving' | 'petition'
  | 'instruction'
  | 'not_specified' | 'other';

export type FigurativeLanguage =
  | 'metaphor' | 'simile' | 'metonymy' | 'synecdoche'
  | 'personification' | 'hyperbole' | 'litotes' | 'irony' | 'idiom'
  | 'euphemism' | 'anthropomorphism' | 'rhetorical_question' | 'merism'
  | 'hendiadys' | 'inclusio' | 'word_pair'
  | 'not_specified' | 'other';

export type KeyTermDomain =
  | 'divine' | 'covenant' | 'salvation' | 'sin' | 'worship'
  | 'ethics' | 'kinship' | 'authority' | 'creation'
  | 'not_specified' | 'other';

// ---------------------------------------------------------------------------
// Confidence
// ---------------------------------------------------------------------------

export type Confidence =
  | 'high' | 'medium' | 'low' | 'speculative';

// ---------------------------------------------------------------------------
// Genre System
// ---------------------------------------------------------------------------

export type MajorGenre =
  | 'narrative' | 'law' | 'poetry' | 'prophecy'
  | 'wisdom' | 'discourse_speech' | 'apocalyptic';

export type NarrativeSubgenre =
  | 'historical' | 'birth' | 'call' | 'battle' | 'miracle' | 'death'
  | 'journey' | 'theophany' | 'genealogy' | 'parable' | 'vision' | 'covenant';

export type LawSubgenre =
  | 'apodictic' | 'casuistic' | 'ritual_instruction';

export type PoetrySubgenre =
  | 'hymn_praise' | 'individual_lament' | 'communal_lament'
  | 'thanksgiving_psalm' | 'royal_psalm' | 'wisdom_psalm'
  | 'imprecatory_psalm' | 'love_poetry' | 'victory_song' | 'dirge'
  | 'taunt_poem' | 'blessing' | 'creation_hymn';

export type ProphecySubgenre =
  | 'judgment_oracle' | 'salvation_oracle' | 'woe_oracle'
  | 'call_to_repentance' | 'symbolic_action' | 'dispute_speech';

export type WisdomSubgenre =
  | 'proverb_collection' | 'wisdom_discourse' | 'dialogue_dispute' | 'reflection';

export type DiscourseSpeechSubgenre =
  | 'sermon' | 'farewell_speech' | 'covenant_renewal' | 'prayer' | 'letter';

export type ApocalypticSubgenre =
  | 'vision_report' | 'symbolic_narrative' | 'heavenly_dialogue';

export type Subgenre =
  | NarrativeSubgenre | LawSubgenre | PoetrySubgenre
  | ProphecySubgenre | WisdomSubgenre | DiscourseSpeechSubgenre
  | ApocalypticSubgenre;

// ---------------------------------------------------------------------------
// Layer Activation (Genre-Based Filtering)
// ---------------------------------------------------------------------------

export type LayerActivation = boolean | 'conditional' | 'preset';

export interface GenreProfile {
  genre: MajorGenre;
  subgenre: Subgenre;
  layers: Record<string, LayerActivation>;
  presets?: Record<string, string>; // auto-filled values
  fast_track?: boolean; // e.g., genealogy skips Passes 2-3
}

// ---------------------------------------------------------------------------
// Clause Annotation (Full Composite)
// ---------------------------------------------------------------------------

export interface ClauseAnnotation {
  id: string;
  project_id: string;
  clause_id: number; // BHSA clause ID
  // Pass 1 \u2014 Structural Skeleton
  events: SemanticEvent[];
  relations: Relation[];
  // Pass 2 \u2014 Semantic Context
  discourse_function: DiscourseFunction;
  discourse_relation: DiscourseRelation;
  register: Register;
  social_axis: SocialAxis;
  prominence: Prominence;
  pacing: Pacing;
  evidentiality: Evidentiality;
  // Pass 3 \u2014 Expressive Layer
  emotion: Emotion;
  emotion_intensity: EmotionIntensity;
  narrator_stance: NarratorStance;
  speech_act: SpeechAct;
  figurative_language: FigurativeLanguage[];
  key_term_domain: KeyTermDomain[];
  confidence: Confidence;
  // Metadata
  notes: string;
  other_fields: Record<string, string>; // stores any "other" free-text
  updated_at: string;
  updated_by: string;
}

// ---------------------------------------------------------------------------
// Project
// ---------------------------------------------------------------------------

export interface Project {
  id: string;
  name: string;
  book: string;
  chapter_start: number;
  verse_start: number;
  chapter_end: number;
  verse_end: number;
  genre: MajorGenre;
  subgenre: Subgenre;
  thematic_spine: string; // one-sentence meaning arc
  peak_clause_id?: number; // discourse peak
  status: 'draft' | 'pass1' | 'pass2' | 'pass3' | 'review' | 'validated';
  created_by: string;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// Pass 4: AI Review
// ---------------------------------------------------------------------------

export type FlagSeverity = 'error' | 'warning' | 'suggestion';
export type FlagStatus = 'open' | 'resolved' | 'dismissed';

export interface ReviewFlag {
  id: string;
  project_id: string;
  clause_id: number;
  category: 'consistency' | 'missing_fields' | 'cross_clause' | 'plausibility' | 'genre_expectations';
  severity: FlagSeverity;
  message: string;
  recommendation: string;
  status: FlagStatus;
  resolved_by?: string;
  resolved_at?: string;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Validation Pipeline
// ---------------------------------------------------------------------------

export type ValidationLevel = 'L1_exegete' | 'L2_linguist' | 'L3_consultant';

export interface ValidationEntry {
  id: string;
  project_id: string;
  level: ValidationLevel;
  approved: boolean;
  notes: string;
  variant_reading?: string; // if disagreement, preserve both readings
  user_id: string;
  created_at: string;
}

// =============================================================================
// TRIPOD ONTOLOGY v5.4 \u2014 SHARED CONSTANTS
// Single source of truth for all enumerated values.
// Every field includes 'not_specified' (default) and 'other' (opens text input).
// =============================================================================

// ---------------------------------------------------------------------------
// Helper: wraps a readonly array with display labels
// ---------------------------------------------------------------------------

export interface OntologyOption {
  value: string;
  label: string;
  description?: string;
}

function opts(values: readonly string[]): OntologyOption[] {
  return values.map((v) => ({
    value: v,
    label: v
      .replace(/_/g, ' ')
      .replace(/\\b\\w/g, (c) => c.toUpperCase()),
  }));
}

// ---------------------------------------------------------------------------
// Layer 1: Participants
// ---------------------------------------------------------------------------

export const PARTICIPANT_TYPES = opts([
  'person', 'group', 'divine', 'animal', 'place',
  'thing', 'stuff', 'abstract', 'plant', 'event_as_participant',
  'not_specified', 'other',
] as const);

export const QUANTITIES = opts([
  'one', 'two', 'few', 'many', 'all', 'mass', 'generic',
  'not_specified', 'other',
] as const);

export const REFERENCE_STATUSES = opts([
  'new_mention', 'given', 'inferrable', 'generic',
  'not_specified', 'other',
] as const);

export const SEMANTIC_ROLES = opts([
  'initiator', 'affected', 'experiencer', 'recipient',
  'beneficiary', 'source', 'goal', 'location',
  'instrument', 'companion', 'manner', 'time',
  'cause', 'purpose', 'result', 'theme',
  'identity', 'separated_from',
  'subject', 'predicate', 'domain',
  'not_specified', 'other',
] as const);

export const CLAUSE_TYPES = opts([
  'event', 'identification', 'classification', 'attribution', 'existential',
  'not_specified', 'other',
] as const);

export const NON_EVENT_ROLES = opts([
  'subject', 'predicate', 'domain', 'location',
  'not_specified', 'other',
] as const);

// ---------------------------------------------------------------------------
// Layer 2: Participant Properties (11 dimensions, 114 values)
// ---------------------------------------------------------------------------

export const PROPERTY_DIMENSIONS: Record<string, OntologyOption[]> = {
  physical: opts([
    'old', 'young', 'strong', 'weak', 'beautiful', 'tall', 'short',
    'big', 'small', 'heavy', 'light', 'fat', 'thin', 'healthy', 'sick', 'alive', 'deceased',
    'not_specified', 'other',
  ]),
  quantity_size: opts([
    'full', 'empty', 'abundant', 'scarce', 'whole', 'broken',
    'deep', 'shallow', 'wide', 'narrow',
    'not_specified', 'other',
  ]),
  sensory: opts([
    'bright', 'dark', 'loud', 'quiet', 'sweet', 'bitter',
    'fragrant', 'foul', 'soft', 'hard', 'smooth', 'rough',
    'hot', 'cold',
    'not_specified', 'other',
  ]),
  character: opts([
    'righteous', 'wicked', 'faithful', 'unfaithful', 'wise',
    'foolish', 'brave', 'cowardly', 'humble', 'proud',
    'not_specified', 'other',
  ]),
  social: opts([
    'rich', 'poor', 'noble', 'slave', 'free', 'foreign', 'native',
    'powerful', 'powerless', 'honored', 'despised',
    'not_specified', 'other',
  ]),
  emotional_state: opts([
    'happy', 'sad', 'angry', 'afraid', 'peaceful', 'troubled',
    'confident', 'anxious', 'grieving', 'joyful',
    'not_specified', 'other',
  ]),
  relational: opts([
    'married', 'widowed', 'orphaned', 'firstborn', 'barren',
    'pregnant', 'betrothed', 'divorced',
    'not_specified', 'other',
  ]),
  material: opts([
    'wooden', 'stone', 'golden', 'bronze', 'clay', 'iron',
    'silver', 'linen', 'leather', 'woven',
    'not_specified', 'other',
  ]),
  evaluative: opts([
    'good', 'bad', 'clean', 'unclean', 'holy', 'profane',
    'true', 'false', 'precious', 'worthless',
    'not_specified', 'other',
  ]),
  temporal: opts([
    'ancient', 'new', 'temporary', 'eternal', 'first', 'last',
    'not_specified', 'other',
  ]),
  spatial: opts([
    'near', 'far', 'high', 'low', 'inner', 'outer',
    'right', 'left', 'front', 'behind',
    'not_specified', 'other',
  ]),
};

// ---------------------------------------------------------------------------
// Layer 3: Relations
// ---------------------------------------------------------------------------

export const KINSHIP_RELATIONS = opts([
  'parent_of', 'child_of', 'spouse_of', 'husband_of', 'wife_of',
  'sibling_of', 'grandparent_of', 'grandchild_of',
  'ancestor_of', 'descendant_of', 'in_law', 'clan_member',
  'not_specified', 'other',
] as const);

export const SOCIAL_RELATIONS = opts([
  'ruler_of', 'subject_of', 'master_of', 'servant_of',
  'ally_of', 'enemy_of', 'friend_of', 'teacher_of',
  'student_of', 'colleague_of',
  'not_specified', 'other',
] as const);

export const POSSESSION_RELATIONS = opts([
  'owner_of', 'possesses', 'belongs_to', 'controls', 'lacks',
  'not_specified', 'other',
] as const);

export const SPATIAL_RELATIONS = opts([
  'located_at', 'native_of', 'inhabitant_of', 'from_place',
  'near', 'far_from',
  'not_specified', 'other',
] as const);

export const PART_WHOLE_RELATIONS = opts([
  'part_of', 'whole_of', 'member_of', 'group_of', 'substance_of',
  'not_specified', 'other',
] as const);

// ---------------------------------------------------------------------------
// Layer 4: Events
// ---------------------------------------------------------------------------

export const EVENT_CATEGORIES = opts([
  'STATE', 'MOTION', 'ACTION', 'TRANSFER', 'SPEECH',
  'INTERNAL', 'PROCESS', 'RITUAL', 'META', 'SOCIAL',
  'not_specified', 'other',
] as const);

export const VERBAL_CORES: Record<string, OntologyOption[]> = {
  STATE: opts(['be', 'exist', 'remain', 'dwell', 'sojourn', 'belong', 'resemble', 'lack', 'need', 'contain']),
  MOTION: opts(['go', 'come', 'return', 'follow', 'flee', 'walk', 'run', 'enter', 'leave', 'ascend', 'descend', 'cross', 'wander', 'turn', 'approach']),
  ACTION: opts(['make', 'build', 'break', 'cut', 'strike', 'kill', 'eat', 'drink', 'take', 'give', 'write', 'open', 'close', 'bind', 'gather', 'plant', 'reap']),
  TRANSFER: opts(['give', 'send', 'bring', 'receive', 'pay', 'offer', 'lend', 'steal', 'return_object']),
  SPEECH: opts(['say', 'tell', 'call', 'name', 'ask', 'answer', 'command', 'promise', 'bless', 'curse', 'swear', 'praise', 'pray', 'cry_out', 'sing', 'urge']),
  INTERNAL: opts(['know', 'think', 'believe', 'remember', 'forget', 'see', 'hear', 'feel', 'love', 'hate', 'fear', 'desire', 'trust', 'decide']),
  PROCESS: opts(['grow', 'die', 'be_born', 'ripen', 'decay', 'heal', 'age', 'change']),
  RITUAL: opts(['sacrifice', 'anoint', 'purify', 'circumcise', 'consecrate', 'worship']),
  META: opts(['begin', 'exist', 'finish', 'continue', 'repeat', 'cause', 'prevent', 'try']),
  SOCIAL: opts(['marry', 'divorce', 'adopt', 'inherit', 'covenant', 'judge', 'redeem', 'vow']),
};

export const PREDICATION_TYPES = opts([
  'identification', 'classification', 'attribution',
  'possession', 'location', 'existence', 'circumstantial',
  'not_specified', 'other',
] as const);

export const EMBEDDED_RELATIONS = opts([
  'content', 'purpose', 'result', 'cause', 'manner',
  'condition', 'complement', 'temporal',
  'not_specified', 'other',
] as const);

// ---------------------------------------------------------------------------
// Layers 6\u201310: Event Modifiers
// ---------------------------------------------------------------------------

export const REALITY_VALUES = opts([
  'actual', 'potential', 'hypothetical', 'counterfactual',
  'obligatory', 'desired', 'feared', 'commanded', 'permitted',
  'not_specified', 'other',
] as const);

export const TIME_FRAME_VALUES = opts([
  'retrospective', 'immediate', 'prospective', 'gnomic',
  'not_specified', 'other',
] as const);

export const DURATION_VALUES = opts([
  'point', 'bounded', 'unbounded',
  'not_specified', 'other',
] as const);

export const DURATION_PRECISION_VALUES = opts([
  'exact', 'approximate', 'vague',
  'not_specified', 'other',
] as const);

export const EVIDENTIALITY_VALUES = opts([
  'witnessed_visual', 'witnessed_sensory', 'reported', 'inferred',
  'assumed', 'general_knowledge', 'divine_revelation', 'unspecified',
  'not_specified', 'other',
] as const);

export const ASPECT_VALUES = opts([
  'completed', 'ongoing', 'habitual', 'inchoative', 'cessative',
  'not_specified', 'other',
] as const);

export const POLARITY_VALUES = opts([
  'positive', 'negative',
  'not_specified', 'other',
] as const);

export const VOLITIONALITY_VALUES = opts([
  'volitional', 'non_volitional', 'ambiguous',
  'not_specified', 'other',
] as const);

// ---------------------------------------------------------------------------
// Layer 11: Discourse Structure
// ---------------------------------------------------------------------------

export const DISCOURSE_FUNCTIONS: OntologyOption[] = [
  { value: 'setting', label: 'Setting (SET)' },
  { value: 'background', label: 'Background (BG)' },
  { value: 'mainline', label: 'Mainline (MAIN)' },
  { value: 'evaluation', label: 'Evaluation (EVAL)' },
  { value: 'quote_margin', label: 'Quote Margin (QUOTE_MARGIN)' },
  { value: 'peak', label: 'Peak (PEAK)' },
  { value: 'not_specified', label: 'Not Specified' },
  { value: 'other', label: 'Other' },
];

export const DISCOURSE_RELATIONS = opts([
  'sequence', 'simultaneous', 'cause', 'result', 'purpose',
  'condition', 'contrast', 'concession', 'clarification',
  'elaboration', 'evidence', 'restatement', 'additive', 'resumption',
  'not_specified', 'other',
] as const);

export const INFORMATION_STRUCTURE_TOPICS = opts([
  'unmarked', 'marked_topic', 'contrastive_topic',
  'not_specified', 'other',
] as const);

export const INFORMATION_STRUCTURE_FOCI = opts([
  'unmarked', 'new_info_focus', 'contrastive_focus',
  'not_specified', 'other',
] as const);

export const FORMULAIC_MARKERS = opts([
  'formulaic', 'non_formulaic',
  'not_specified', 'other',
] as const);

// ---------------------------------------------------------------------------
// Layer 12: Pragmatics & Register
// ---------------------------------------------------------------------------

export const REGISTERS = opts([
  'informal', 'narrative', 'formal', 'ceremonial', 'elder_speech',
  'legal', 'poetic', 'prophetic', 'wisdom', 'dialogue', 'lament',
  'hymnic', 'didactic_poetry', 'love_poetry', 'victory_song',
  'dirge', 'taunt', 'blessing_poetry', 'curse_poetry',
  'not_specified', 'other',
] as const);

export const SOCIAL_AXES = opts([
  'equal_to_equal', 'superior_to_inferior', 'inferior_to_superior',
  'divine_to_human', 'human_to_divine', 'formal_public',
  'intimate_private',
  'not_specified', 'other',
] as const);

export const PROMINENCE_VALUES = opts([
  'peak', 'high', 'medium', 'low',
  'not_specified', 'other',
] as const);

export const PACING_VALUES = opts([
  'summary', 'normal', 'slow', 'pause',
  'not_specified', 'other',
] as const);

export const FOCALIZATION_VALUES = opts([
  'narrator_external', 'narrator_aligned', 'character_internal',
  'not_specified', 'other',
] as const);

// ---------------------------------------------------------------------------
// Layer 13: Emotion & Stance
// ---------------------------------------------------------------------------

export const EMOTIONS = opts([
  'joy', 'hope', 'gratitude', 'love', 'compassion', 'peace',
  'trust', 'relief', 'awe', 'pride', 'contentment', 'desire',
  'zeal', 'sorrow', 'fear', 'anger', 'disgust', 'shame',
  'guilt', 'despair', 'anxiety', 'loneliness', 'jealousy',
  'resentment', 'bitterness', 'awe_fear', 'reverence', 'remorse',
  'longing',
  'not_specified', 'other',
] as const);

export const EMOTION_INTENSITIES = opts([
  'low', 'medium', 'high', 'extreme',
  'not_specified', 'other',
] as const);

export const NARRATOR_STANCES = opts([
  'neutral', 'sympathetic', 'critical', 'ironic', 'celebratory',
  'lamenting', 'didactic', 'suspenseful',
  'not_specified', 'other',
] as const);

export const AUDIENCE_RESPONSES = opts([
  'empathy', 'sympathy', 'admiration', 'disapproval', 'fear',
  'hope', 'relief', 'grief', 'joy', 'conviction',
  'not_specified', 'other',
] as const);

export const INFERENCE_SOURCES = opts([
  'lexical', 'contextual', 'cultural', 'behavioral', 'physiological',
  'speech_content', 'narrator_comment', 'reader_inference', 'theological',
  'not_specified', 'other',
] as const);

// ---------------------------------------------------------------------------
// Layer 14: Speech Acts, Figurative Language, Key Terms
// ---------------------------------------------------------------------------

export const SPEECH_ACTS = opts([
  'assertive', 'directive', 'commissive', 'expressive',
  'declarative', 'interrogative', 'blessing', 'curse', 'oath',
  'prophecy', 'praise', 'lament', 'thanksgiving', 'petition',
  'instruction',
  'not_specified', 'other',
] as const);

export const FIGURATIVE_LANGUAGE = opts([
  'metaphor', 'simile', 'metonymy', 'synecdoche',
  'personification', 'hyperbole', 'litotes', 'irony', 'idiom',
  'euphemism', 'anthropomorphism', 'rhetorical_question', 'merism',
  'hendiadys', 'inclusio', 'word_pair',
  'not_specified', 'other',
] as const);

export const FIGURATIVE_TRANSFERABILITY = opts([
  'universal', 'common', 'limited', 'culture_specific', 'language_specific',
  'not_specified', 'other',
] as const);

export const KEY_TERM_DOMAINS = opts([
  'divine', 'covenant', 'salvation', 'sin', 'worship',
  'ethics', 'kinship', 'authority', 'creation', 'land_belonging',
  'not_specified', 'other',
] as const);

export const KEY_TERM_CONSISTENCY = opts([
  'always', 'preferred', 'flexible',
  'not_specified', 'other',
] as const);

// ---------------------------------------------------------------------------
// Confidence
// ---------------------------------------------------------------------------

export const CONFIDENCE_VALUES = opts([
  'high', 'medium', 'low', 'speculative',
  'not_specified', 'other',
] as const);

export const RETRIEVAL_TAG_CATEGORIES = opts([
  'emotion_tags', 'event_tags', 'register_tags', 'discourse_tags',
  'social_tags', 'poetic_tags', 'parallelism_tags', 'proverb_tags',
  'formulaic_tags',
  'not_specified', 'other',
] as const);

export const POETIC_PARALLELISM = opts([
  'synonymous', 'antithetical', 'synthetic', 'climactic',
  'emblematic', 'chiastic', 'staircase', 'none',
  'not_specified', 'other',
] as const);

export const POETIC_LINE_STRUCTURE = opts([
  'bicolon', 'tricolon', 'quatrain', 'monocolon',
  'strophe', 'refrain', 'acrostic_element',
  'not_specified', 'other',
] as const);

export const POETIC_SOUND_PATTERNS = opts([
  'alliteration', 'assonance', 'rhyme', 'rhythm_regular',
  'rhythm_irregular', 'wordplay', 'onomatopoeia', 'tonal_pattern',
  'not_specified', 'other',
] as const);

export const POETIC_COMPRESSION = opts([
  'ellipsis', 'gapping', 'terseness', 'normal',
  'not_specified', 'other',
] as const);

export const PROVERB_TYPES = opts([
  'observational', 'comparative', 'numerical', 'rhetorical_question',
  'conditional', 'admonition', 'consequence', 'characterization',
  'not_specified', 'other',
] as const);

export const WISDOM_FUNCTIONS = opts([
  'teach', 'warn', 'motivate', 'evaluate', 'characterize',
  'console', 'rebuke', 'celebrate',
  'not_specified', 'other',
] as const);

export const WISDOM_AUTHORITY_SOURCES = opts([
  'tradition', 'observation', 'divine', 'elder', 'sage', 'unspecified',
  'not_specified', 'other',
] as const);

export const WISDOM_APPLICABILITY = opts([
  'universal', 'situational', 'cultural', 'contested',
  'not_specified', 'other',
] as const);

// ---------------------------------------------------------------------------
// Genre System
// ---------------------------------------------------------------------------

export const MAJOR_GENRES = opts([
  'narrative', 'law', 'poetry', 'prophecy',
  'wisdom', 'discourse_speech', 'apocalyptic',
] as const);

export const SUBGENRES: Record<string, OntologyOption[]> = {
  narrative: opts([
    'historical', 'birth', 'call', 'battle', 'miracle', 'death',
    'journey', 'theophany', 'genealogy', 'parable', 'vision', 'covenant',
  ]),
  law: opts(['apodictic', 'casuistic', 'ritual_instruction']),
  poetry: opts([
    'hymn_praise', 'individual_lament', 'communal_lament',
    'thanksgiving_psalm', 'royal_psalm', 'wisdom_psalm',
    'imprecatory_psalm', 'love_poetry', 'victory_song', 'dirge',
    'taunt_poem', 'blessing', 'creation_hymn',
  ]),
  prophecy: opts([
    'judgment_oracle', 'salvation_oracle', 'woe_oracle',
    'call_to_repentance', 'symbolic_action', 'dispute_speech',
  ]),
  wisdom: opts(['proverb_collection', 'wisdom_discourse', 'dialogue_dispute', 'reflection']),
  discourse_speech: opts(['sermon', 'farewell_speech', 'covenant_renewal', 'prayer', 'letter']),
  apocalyptic: opts(['vision_report', 'symbolic_narrative', 'heavenly_dialogue']),
};

// ---------------------------------------------------------------------------
// Genre-Based Layer Activation Matrix
// ---------------------------------------------------------------------------

export type LayerKey =
  | 'participants' | 'participant_properties' | 'relations'
  | 'events' | 'semantic_roles' | 'clause_type' | 'non_event_roles'
  | 'reality' | 'time_frame' | 'duration' | 'duration_precision' | 'volitionality'
  | 'evidentiality' | 'aspect' | 'polarity' | 'discourse_structure'
  | 'information_structure' | 'formulaic_marker'
  | 'register' | 'social_axis' | 'prominence' | 'pacing' | 'focalization'
  | 'emotion' | 'narrator_stance' | 'audience_response'
  | 'speech_acts' | 'figurative_language' | 'figurative_transferability'
  | 'key_terms' | 'key_term_consistency' | 'inference_source'
  | 'retrieval_tags' | 'poetic_structure' | 'proverb_features';

export type Activation = true | false | 'conditional' | 'preset';

export const GENRE_LAYER_MATRIX: Record<string, Record<LayerKey, Activation>> = {
  narrative: {
    participants: true, participant_properties: true, relations: true,
    events: true, semantic_roles: true, clause_type: true, non_event_roles: true,
    reality: true, time_frame: true, duration: true, duration_precision: true, volitionality: true,
    evidentiality: 'conditional', aspect: true, polarity: true,
    discourse_structure: true, information_structure: true, formulaic_marker: true,
    register: 'preset', social_axis: true,
    prominence: true, pacing: true, focalization: true, emotion: true, narrator_stance: true,
    audience_response: true, inference_source: true, retrieval_tags: 'conditional',
    speech_acts: 'conditional', figurative_language: 'conditional',
    figurative_transferability: 'conditional', key_terms: true, key_term_consistency: true,
    poetic_structure: false, proverb_features: false,
  },
  law: {
    participants: true, participant_properties: 'conditional', relations: true,
    events: true, semantic_roles: true, clause_type: true, non_event_roles: true,
    reality: 'preset', time_frame: true, duration: true, duration_precision: true, volitionality: true,
    evidentiality: false, aspect: 'conditional', polarity: true,
    discourse_structure: true, information_structure: true, formulaic_marker: true,
    register: 'preset', social_axis: 'preset',
    prominence: 'conditional', pacing: false, focalization: true, emotion: false,
    narrator_stance: false, audience_response: false, inference_source: 'conditional',
    retrieval_tags: 'conditional', speech_acts: true, figurative_language: false,
    figurative_transferability: false, key_terms: true, key_term_consistency: true,
    poetic_structure: false, proverb_features: false,
  },
  poetry: {
    participants: true, participant_properties: true, relations: 'conditional',
    events: true, semantic_roles: true, clause_type: true, non_event_roles: true,
    reality: true, time_frame: true, duration: true, duration_precision: true, volitionality: true,
    evidentiality: 'conditional', aspect: true, polarity: true,
    discourse_structure: true, information_structure: true, formulaic_marker: true,
    register: 'preset', social_axis: true,
    prominence: true, pacing: true, focalization: true, emotion: true, narrator_stance: true,
    audience_response: true, inference_source: true, retrieval_tags: 'conditional',
    speech_acts: true, figurative_language: true, figurative_transferability: true,
    key_terms: true, key_term_consistency: true, poetic_structure: true,
    proverb_features: false,
  },
  prophecy: {
    participants: true, participant_properties: true, relations: true,
    events: true, semantic_roles: true, clause_type: true, non_event_roles: true,
    reality: true, time_frame: true, duration: true, duration_precision: true, volitionality: true,
    evidentiality: true, aspect: true, polarity: true,
    discourse_structure: true, information_structure: true, formulaic_marker: true,
    register: 'preset', social_axis: true,
    prominence: true, pacing: true, focalization: true, emotion: true, narrator_stance: true,
    audience_response: true, inference_source: true, retrieval_tags: 'conditional',
    speech_acts: true, figurative_language: true, figurative_transferability: true,
    key_terms: true, key_term_consistency: true, poetic_structure: 'conditional',
    proverb_features: false,
  },
  wisdom: {
    participants: true, participant_properties: true, relations: 'conditional',
    events: true, semantic_roles: true, clause_type: true, non_event_roles: true,
    reality: true, time_frame: true, duration: true, duration_precision: true, volitionality: true,
    evidentiality: 'conditional', aspect: 'conditional', polarity: true,
    discourse_structure: true, information_structure: true, formulaic_marker: true,
    register: 'preset', social_axis: 'conditional',
    prominence: 'conditional', pacing: false, focalization: true, emotion: 'conditional',
    narrator_stance: true, audience_response: true, inference_source: true,
    retrieval_tags: 'conditional', speech_acts: true, figurative_language: true,
    figurative_transferability: true, key_terms: true, key_term_consistency: true,
    poetic_structure: 'conditional', proverb_features: true,
  },
  discourse_speech: {
    participants: true, participant_properties: 'conditional', relations: true,
    events: true, semantic_roles: true, clause_type: true, non_event_roles: true,
    reality: true, time_frame: true, duration: true, duration_precision: true, volitionality: true,
    evidentiality: true, aspect: true, polarity: true,
    discourse_structure: true, information_structure: true, formulaic_marker: true,
    register: true, social_axis: true,
    prominence: true, pacing: true, focalization: true, emotion: true, narrator_stance: true,
    audience_response: true, inference_source: true, retrieval_tags: 'conditional',
    speech_acts: true, figurative_language: 'conditional',
    figurative_transferability: 'conditional', key_terms: true, key_term_consistency: true,
    poetic_structure: false, proverb_features: false,
  },
  apocalyptic: {
    participants: true, participant_properties: true, relations: true,
    events: true, semantic_roles: true, clause_type: true, non_event_roles: true,
    reality: true, time_frame: true, duration: true, duration_precision: true, volitionality: true,
    evidentiality: true, aspect: true, polarity: true,
    discourse_structure: true, information_structure: true, formulaic_marker: true,
    register: 'preset', social_axis: true,
    prominence: true, pacing: true, focalization: true, emotion: true, narrator_stance: true,
    audience_response: true, inference_source: true, retrieval_tags: 'conditional',
    speech_acts: true, figurative_language: true, figurative_transferability: true,
    key_terms: true, key_term_consistency: true, poetic_structure: 'conditional',
    proverb_features: false,
  },
};

// ---------------------------------------------------------------------------
// Genre Presets (auto-filled values shown with PRE-SET badge)
// ---------------------------------------------------------------------------

export const GENRE_PRESETS: Record<string, Record<string, string>> = {
  narrative: { register: 'narrative' },
  law_apodictic: { reality: 'commanded', register: 'legal', social_axis: 'divine_to_human' },
  law_casuistic: { reality: 'commanded', register: 'legal' },
  law_ritual_instruction: { reality: 'commanded', register: 'legal' },
  poetry_hymn_praise: { register: 'hymnic' },
  poetry_individual_lament: { register: 'lament' },
  poetry_communal_lament: { register: 'lament' },
  poetry_love_poetry: { register: 'love_poetry' },
  poetry_victory_song: { register: 'victory_song' },
  poetry_dirge: { register: 'dirge' },
  prophecy: { register: 'prophetic' },
  wisdom: { register: 'wisdom' },
  discourse_speech_sermon: { register: 'formal' },
  discourse_speech_prayer: { register: 'formal', social_axis: 'human_to_divine' },
  apocalyptic: { register: 'prophetic' },
};

// ---------------------------------------------------------------------------
// Fast-Track Genres (skip Passes 2\u20133)
// ---------------------------------------------------------------------------

export const FAST_TRACK_SUBGENRES = new Set(['genealogy']);

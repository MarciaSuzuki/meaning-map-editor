'use client';

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import ruth from '@/data/bhsa/ruth.json';
import type {
  BHSABook,
  BHSAVerse,
  BHSAClause,
  ClauseAnnotation,
  SemanticEvent,
  Participant,
  ParticipantProperty,
  Relation,
  EmbeddedRelation,
  RetrievalTag,
} from '@/lib/types';
import {
  PARTICIPANT_TYPES,
  QUANTITIES,
  REFERENCE_STATUSES,
  SEMANTIC_ROLES,
  PROPERTY_DIMENSIONS,
  KINSHIP_RELATIONS,
  SOCIAL_RELATIONS,
  POSSESSION_RELATIONS,
  SPATIAL_RELATIONS,
  PART_WHOLE_RELATIONS,
  EVENT_CATEGORIES,
  VERBAL_CORES,
  PREDICATION_TYPES,
  EMBEDDED_RELATIONS,
  REALITY_VALUES,
  TIME_FRAME_VALUES,
  EVIDENTIALITY_VALUES,
  ASPECT_VALUES,
  POLARITY_VALUES,
  DISCOURSE_FUNCTIONS,
  DISCOURSE_RELATIONS,
  REGISTERS,
  SOCIAL_AXES,
  PROMINENCE_VALUES,
  PACING_VALUES,
  EMOTIONS,
  EMOTION_INTENSITIES,
  NARRATOR_STANCES,
  AUDIENCE_RESPONSES,
  INFERENCE_SOURCES,
  SPEECH_ACTS,
  FIGURATIVE_LANGUAGE,
  FIGURATIVE_TRANSFERABILITY,
  KEY_TERM_DOMAINS,
  KEY_TERM_CONSISTENCY,
  RETRIEVAL_TAG_CATEGORIES,
  POETIC_PARALLELISM,
  POETIC_LINE_STRUCTURE,
  POETIC_SOUND_PATTERNS,
  POETIC_COMPRESSION,
  PROVERB_TYPES,
  WISDOM_FUNCTIONS,
  WISDOM_AUTHORITY_SOURCES,
  WISDOM_APPLICABILITY,
  CONFIDENCE_VALUES,
  MAJOR_GENRES,
  SUBGENRES,
  GENRE_LAYER_MATRIX,
  GENRE_PRESETS,
} from '@/lib/ontology';

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
  soft: '#FFF3EB',
};

const PASSES = [
  { label: 'Pass 1: Structure', color: s.telha },
  { label: 'Pass 2: Context', color: s.azul },
  { label: 'Pass 3: Expression', color: s.verde },
  { label: 'Pass 4: AI Review', color: s.dark },
];

const BOOKS: Record<string, BHSABook> = {
  ruth: ruth as BHSABook,
  '1': ruth as BHSABook,
};

const inputStyle = {
  width: '100%',
  padding: '0.45rem 0.6rem',
  borderRadius: 8,
  border: `1px solid ${s.border}`,
  fontSize: '0.8rem',
  fontFamily: s.body,
  backgroundColor: 'white',
};

const confirmedFieldStyle = {
  backgroundColor: '#F2F6E8',
  border: `1px solid ${s.verde}`,
};

const confirmedSectionStyle = {
  backgroundColor: '#F6F7E9',
  border: `1px solid ${s.verde}`,
};

const labelStyle = {
  fontSize: '0.7rem',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.06em',
  color: s.muted,
  fontWeight: 600,
};

const smallMuted = { fontSize: '0.75rem', color: s.muted };

const DEFAULT_PERICOPE = { chapterStart: 1, verseStart: 1, chapterEnd: 1, verseEnd: 5 };

function normalizeRef(ref: string) {
  return ref
    .toLowerCase()
    .replace(/\u2013/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseReferenceInput(raw: string) {
  const cleaned = normalizeRef(raw).replace('ruth', '').trim();
  const match = cleaned.match(/^(\d+)\s*:\s*(\d+)(?:\s*-\s*(\d+)\s*:\s*(\d+)|\s*-\s*(\d+))?$/);
  if (!match) return null;
  const chapterStart = Number(match[1]);
  const verseStart = Number(match[2]);
  let chapterEnd = chapterStart;
  let verseEnd = verseStart;
  if (match[3] && match[4]) {
    chapterEnd = Number(match[3]);
    verseEnd = Number(match[4]);
  } else if (match[5]) {
    verseEnd = Number(match[5]);
  }
  return { chapterStart, verseStart, chapterEnd, verseEnd };
}

function formatRange(range: typeof DEFAULT_PERICOPE) {
  if (range.chapterStart === range.chapterEnd && range.verseStart === range.verseEnd) {
    return `Ruth ${range.chapterStart}:${range.verseStart}`;
  }
  if (range.chapterStart === range.chapterEnd) {
    return `Ruth ${range.chapterStart}:${range.verseStart}-${range.verseEnd}`;
  }
  return `Ruth ${range.chapterStart}:${range.verseStart}-${range.chapterEnd}:${range.verseEnd}`;
}

function getBhsaDiscourse(clauseType: string) {
  if (!clauseType) return 'unknown';
  if (clauseType.startsWith('Way')) return 'mainline';
  return 'background';
}

function getVerseRange(book: BHSABook, range: typeof DEFAULT_PERICOPE) {
  return book.verses.filter((v) => {
    if (v.chapter < range.chapterStart || v.chapter > range.chapterEnd) return false;
    if (v.chapter === range.chapterStart && v.verse < range.verseStart) return false;
    if (v.chapter === range.chapterEnd && v.verse > range.verseEnd) return false;
    return true;
  });
}

function createDefaultParticipant(id: string): Participant {
  return {
    id,
    label: '',
    type: 'not_specified',
    quantity: 'not_specified',
    reference_status: 'not_specified',
    semantic_role: 'not_specified',
    properties: [],
  };
}

function createDefaultRelation(): Relation {
  return {
    type: 'kinship',
    value: 'not_specified',
    from_participant: '',
    to_participant: '',
  };
}

function createDefaultEvent(id: string): SemanticEvent {
  return {
    id,
    is_primary: true,
    event_category: 'not_specified',
    participants: [],
    reality: 'not_specified',
    evidentiality: 'not_specified',
    polarity: 'not_specified',
    time_frame: 'not_specified',
    aspect: 'not_specified',
  };
}

function createDefaultAnnotation(projectId: string, clauseId: number, presets: Record<string, string>): ClauseAnnotation {
  const event = createDefaultEvent(`event_${clauseId}_1`);
  if (presets.reality) event.reality = presets.reality as SemanticEvent['reality'];
  const annotation: ClauseAnnotation = {
    id: `ann_${clauseId}`,
    project_id: projectId,
    clause_id: clauseId,
    events: [event],
    relations: [],
    discourse_function: 'not_specified',
    discourse_relation: 'not_specified',
    register: (presets.register as ClauseAnnotation['register']) ?? 'not_specified',
    social_axis: (presets.social_axis as ClauseAnnotation['social_axis']) ?? 'not_specified',
    prominence: 'not_specified',
    pacing: 'not_specified',
    inference_source: 'not_specified',
    emotion: 'not_specified',
    emotion_intensity: 'not_specified',
    narrator_stance: 'not_specified',
    audience_response: [],
    speech_act: 'not_specified',
    figurative_language: [],
    figurative_transferability: 'not_specified',
    key_term_domain: [],
    key_term_consistency: 'not_specified',
    retrieval_tags: [],
    poetic_parallelism: 'not_specified',
    poetic_line_structure: 'not_specified',
    poetic_sound_patterns: [],
    poetic_compression: 'not_specified',
    proverb_type: 'not_specified',
    wisdom_function: 'not_specified',
    authority_source: 'not_specified',
    applicability: 'not_specified',
    confidence: 'medium',
    notes: '',
    other_fields: {},
    updated_at: new Date().toISOString(),
    updated_by: 'analyst',
  };
  return annotation;
}

function getPresetKey(genre: string, subgenre: string) {
  if (!genre) return null;
  const key = `${genre}_${subgenre}`;
  return GENRE_PRESETS[key] ? key : GENRE_PRESETS[genre] ? genre : null;
}

function hasAnyContent(annotation: ClauseAnnotation) {
  if (!annotation) return false;
  if (annotation.notes.trim()) return true;
  if (annotation.events.some((e) => e.event_category !== 'not_specified')) return true;
  if (annotation.relations.length) return true;
  if (annotation.discourse_function !== 'not_specified') return true;
  if (annotation.emotion !== 'not_specified') return true;
  if (annotation.key_term_domain.length) return true;
  return false;
}

export default function EditorPage() {
  const params = useParams();
  const projectId = params.id as string;
  const book = BOOKS[projectId] ?? BOOKS.ruth;

  const [activePass, setActivePass] = useState(0);
  const [pericopeInput, setPericopeInput] = useState('Ruth 1:1-5');
  const [pericopeRange, setPericopeRange] = useState(DEFAULT_PERICOPE);
  const [pericopeError, setPericopeError] = useState<string | null>(null);

  const [genre, setGenre] = useState('narrative');
  const [subgenre, setSubgenre] = useState('historical');
  const [showJson, setShowJson] = useState(false);
  const [confirmedFields, setConfirmedFields] = useState<Record<number, Record<string, boolean>>>({});
  const [testingLog, setTestingLog] = useState({
    analyst: '',
    duration_minutes: '',
    confidence: 'not_specified',
    notes: '',
  });
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [assistantInput, setAssistantInput] = useState('');
  const [assistantMessages, setAssistantMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [assistantStatus, setAssistantStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [assistantError, setAssistantError] = useState<string | null>(null);
  const [lastFocusedFieldKey, setLastFocusedFieldKey] = useState<string>('');
  const [assistantFocus, setAssistantFocus] = useState('auto');
  const clausePanelRef = useRef<HTMLDivElement | null>(null);

  const [selectedClauseId, setSelectedClauseId] = useState<number | null>(null);
  const [annotations, setAnnotations] = useState<Record<number, ClauseAnnotation>>({});
  const [reviewFlags, setReviewFlags] = useState<Array<{ clause_id: number; message: string; severity: string; recommendation: string }>>([]);
  const [reviewStatus, setReviewStatus] = useState<'idle' | 'loading' | 'error' | 'done'>('idle');
  const [reviewError, setReviewError] = useState<string | null>(null);

  const genreLayers = GENRE_LAYER_MATRIX[genre] ?? {};
  const presetKey = getPresetKey(genre, subgenre);
  const presets = presetKey ? GENRE_PRESETS[presetKey] : {};

  const pericopeVerses = useMemo(() => getVerseRange(book, pericopeRange), [book, pericopeRange]);
  const pericopeClauses = useMemo(() => pericopeVerses.flatMap((v) => v.clauses), [pericopeVerses]);
  const pericopeReadyForReview = useMemo(() => {
    if (pericopeClauses.length === 0) return false;
    return pericopeClauses.every((clause) => {
      const confirmed = confirmedFields[clause.id];
      return confirmed && Object.keys(confirmed).length > 0;
    });
  }, [pericopeClauses, confirmedFields]);

  const selected = useMemo(() => {
    if (!selectedClauseId) return null;
    for (const verse of pericopeVerses) {
      const clause = verse.clauses.find((c) => c.id === selectedClauseId);
      if (clause) return { verse, clause };
    }
    return null;
  }, [selectedClauseId, pericopeVerses]);

  useEffect(() => {
    if (pericopeClauses.length === 0) return;
    setSelectedClauseId((current) => {
      if (current && pericopeClauses.some((c) => c.id === current)) return current;
      return pericopeClauses[0].id;
    });
  }, [pericopeClauses]);

  useLayoutEffect(() => {
    if (!selectedClauseId) return;
    const container = clausePanelRef.current;
    if (!container) return;
    const target = container.querySelector<HTMLElement>(`[data-clause-id="${selectedClauseId}"]`);
    if (!target) return;
    target.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }, [selectedClauseId, pericopeRange]);

  useEffect(() => {
    if (pericopeClauses.length === 0) return;
    setAnnotations((prev) => {
      const next = { ...prev };
      for (const clause of pericopeClauses) {
        if (!next[clause.id]) {
          next[clause.id] = createDefaultAnnotation(projectId, clause.id, presets);
        }
      }
      return next;
    });
  }, [pericopeClauses, presets, projectId]);

  useEffect(() => {
    setTestingLog({
      analyst: '',
      duration_minutes: '',
      confidence: 'not_specified',
      notes: '',
    });
  }, [pericopeRange]);

  useEffect(() => {
    if (activePass === 3 && !pericopeReadyForReview) {
      setActivePass(2);
    }
  }, [activePass, pericopeReadyForReview]);

  function updateAnnotation(clauseId: number, updater: (current: ClauseAnnotation) => ClauseAnnotation) {
    setAnnotations((prev) => {
      const current = prev[clauseId] ?? createDefaultAnnotation(projectId, clauseId, presets);
      const updated = { ...updater(current), updated_at: new Date().toISOString() };
      return { ...prev, [clauseId]: updated };
    });
  }

  function updateEvent(clauseId: number, index: number, updater: (event: SemanticEvent) => SemanticEvent) {
    updateAnnotation(clauseId, (current) => {
      const events = [...current.events];
      events[index] = updater(events[index]);
      return { ...current, events };
    });
  }

  function updateParticipant(clauseId: number, eventIndex: number, participantIndex: number, updater: (p: Participant) => Participant) {
    updateEvent(clauseId, eventIndex, (event) => {
      const participants = [...event.participants];
      participants[participantIndex] = updater(participants[participantIndex]);
      return { ...event, participants };
    });
  }

  function updateParticipantProperty(clauseId: number, eventIndex: number, participantIndex: number, propIndex: number, updater: (p: ParticipantProperty) => ParticipantProperty) {
    updateParticipant(clauseId, eventIndex, participantIndex, (participant) => {
      const properties = [...participant.properties];
      properties[propIndex] = updater(properties[propIndex]);
      return { ...participant, properties };
    });
  }

  function updateRelation(clauseId: number, index: number, updater: (relation: Relation) => Relation) {
    updateAnnotation(clauseId, (current) => {
      const relations = [...current.relations];
      relations[index] = updater(relations[index]);
      return { ...current, relations };
    });
  }

  function removeEvent(clauseId: number, eventIndex: number) {
    updateAnnotation(clauseId, (current) => {
      const events = current.events.filter((_, idx) => idx !== eventIndex);
      if (events.length === 0) {
        events.push(createDefaultEvent(`event_${clauseId}_1`));
      }
      return { ...current, events };
    });
  }

  function removeParticipant(clauseId: number, eventIndex: number, participantIndex: number) {
    updateEvent(clauseId, eventIndex, (event) => {
      const participants = event.participants.filter((_, idx) => idx !== participantIndex);
      return { ...event, participants };
    });
  }

  function removeParticipantProperty(clauseId: number, eventIndex: number, participantIndex: number, propIndex: number) {
    updateParticipant(clauseId, eventIndex, participantIndex, (participant) => {
      const properties = participant.properties.filter((_, idx) => idx !== propIndex);
      return { ...participant, properties };
    });
  }

  function removeRelation(clauseId: number, relationIndex: number) {
    updateAnnotation(clauseId, (current) => {
      const relations = current.relations.filter((_, idx) => idx !== relationIndex);
      return { ...current, relations };
    });
  }

  function confirmField(clauseId: number, key: string) {
    setConfirmedFields((prev) => {
      const current = prev[clauseId] ?? {};
      if (current[key]) return prev;
      return { ...prev, [clauseId]: { ...current, [key]: true } };
    });
    setLastFocusedFieldKey(key);
  }

  function isFieldConfirmed(clauseId: number, key: string) {
    return Boolean(confirmedFields[clauseId]?.[key]);
  }

  function fieldStyle(clauseId: number, key: string) {
    return {
      ...inputStyle,
      ...(isFieldConfirmed(clauseId, key) ? confirmedFieldStyle : {}),
    };
  }

  function getFieldHelp(key: string, annotation: ClauseAnnotation | null) {
    if (!key) {
      return { label: 'General', options: [] as string[], note: '', context: {} as Record<string, string> };
    }
    const options = (list: Array<{ value: string }>) => list.map((opt) => opt.value);
    if (key.includes('event_category')) return { label: 'Event Category', options: options(EVENT_CATEGORIES), note: '' };
    if (key.includes('verbal_core')) {
      const match = key.match(/event:(\d+):/);
      const eventIndex = match ? Number(match[1]) : 0;
      const event = annotation?.events?.[eventIndex];
      const cores = event ? VERBAL_CORES[event.event_category] ?? [] : [];
      return { label: 'Verbal Core', options: options(cores), note: 'Verbal cores depend on the selected event category.' };
    }
    if (key.includes('predication_type')) return { label: 'Predication Type', options: options(PREDICATION_TYPES), note: '' };
    if (key.includes('reality')) return { label: 'Reality', options: options(REALITY_VALUES), note: '' };
    if (key.includes('evidentiality')) return { label: 'Evidentiality', options: options(EVIDENTIALITY_VALUES), note: '' };
    if (key.includes('time_frame')) return { label: 'Time Frame', options: options(TIME_FRAME_VALUES), note: '' };
    if (key.includes('aspect')) return { label: 'Aspect', options: options(ASPECT_VALUES), note: '' };
    if (key.includes('polarity')) return { label: 'Polarity', options: options(POLARITY_VALUES), note: '' };
    if (key.includes('discourse_function')) return { label: 'Discourse Function', options: options(DISCOURSE_FUNCTIONS), note: '' };
    if (key.includes('discourse_relation')) return { label: 'Discourse Relation', options: options(DISCOURSE_RELATIONS), note: '' };
    if (key.includes('register')) return { label: 'Register', options: options(REGISTERS), note: '' };
    if (key.includes('social_axis')) return { label: 'Social Axis', options: options(SOCIAL_AXES), note: '' };
    if (key.includes('prominence')) return { label: 'Prominence', options: options(PROMINENCE_VALUES), note: '' };
    if (key.includes('pacing')) return { label: 'Pacing', options: options(PACING_VALUES), note: '' };
    if (key.includes('emotion_intensity')) return { label: 'Emotion Intensity', options: options(EMOTION_INTENSITIES), note: '' };
    if (key.includes('emotion')) return { label: 'Emotion', options: options(EMOTIONS), note: '' };
    if (key.includes('narrator_stance')) return { label: 'Narrator Stance', options: options(NARRATOR_STANCES), note: '' };
    if (key.includes('speech_act')) return { label: 'Speech Act', options: options(SPEECH_ACTS), note: '' };
    if (key.includes('audience_response')) return { label: 'Audience Response', options: options(AUDIENCE_RESPONSES), note: '' };
    if (key.includes('figurative_language')) return { label: 'Figurative Language', options: options(FIGURATIVE_LANGUAGE), note: '' };
    if (key.includes('figurative_transferability')) return { label: 'Figurative Transferability', options: options(FIGURATIVE_TRANSFERABILITY), note: '' };
    if (key.includes('key_term_domain')) return { label: 'Key Term Domain', options: options(KEY_TERM_DOMAINS), note: '' };
    if (key.includes('key_term_consistency')) return { label: 'Key Term Consistency', options: options(KEY_TERM_CONSISTENCY), note: '' };
    if (key.includes('retrieval_tags')) return { label: 'Retrieval Tags', options: options(RETRIEVAL_TAG_CATEGORIES), note: 'Tags are free-form; categories guide retrieval.' };
    if (key.includes('poetic_parallelism')) return { label: 'Poetic Parallelism', options: options(POETIC_PARALLELISM), note: '' };
    if (key.includes('poetic_line_structure')) return { label: 'Poetic Line Structure', options: options(POETIC_LINE_STRUCTURE), note: '' };
    if (key.includes('poetic_compression')) return { label: 'Poetic Compression', options: options(POETIC_COMPRESSION), note: '' };
    if (key.includes('poetic_sound_patterns')) return { label: 'Poetic Sound Patterns', options: options(POETIC_SOUND_PATTERNS), note: '' };
    if (key.includes('proverb_type')) return { label: 'Proverb Type', options: options(PROVERB_TYPES), note: '' };
    if (key.includes('wisdom_function')) return { label: 'Wisdom Function', options: options(WISDOM_FUNCTIONS), note: '' };
    if (key.includes('authority_source')) return { label: 'Authority Source', options: options(WISDOM_AUTHORITY_SOURCES), note: '' };
    if (key.includes('applicability')) return { label: 'Applicability', options: options(WISDOM_APPLICABILITY), note: '' };
    if (key.includes('participant') && key.includes('type')) return { label: 'Participant Type', options: options(PARTICIPANT_TYPES), note: '' };
    if (key.includes('participant') && (key.includes('semantic_role') || key.includes('participant_role'))) {
      return { label: 'Semantic Role', options: options(SEMANTIC_ROLES), note: '' };
    }
    if (key.includes('participant') && (key.includes('quantity') || key.includes('participant_quantity'))) {
      return { label: 'Participant Quantity', options: options(QUANTITIES), note: '' };
    }
    if (key.includes('participant') && (key.includes('reference_status') || key.includes('reference_status'))) {
      return { label: 'Reference Status', options: options(REFERENCE_STATUSES), note: '' };
    }
    if (key === 'participant_role') return { label: 'Semantic Role', options: options(SEMANTIC_ROLES), note: '' };
    if (key === 'participant_quantity') return { label: 'Participant Quantity', options: options(QUANTITIES), note: '' };
    if (key === 'reference_status') return { label: 'Reference Status', options: options(REFERENCE_STATUSES), note: '' };
    if (key.includes('property:') && key.includes('dimension')) {
      return { label: 'Property Dimension', options: Object.keys(PROPERTY_DIMENSIONS), note: '', context: {} as Record<string, string> };
    }
    if (key.includes('property:') && key.includes('value')) {
      const match = key.match(/event:(\d+):participant:(\d+):property:(\d+)/);
      const eventIndex = match ? Number(match[1]) : -1;
      const participantIndex = match ? Number(match[2]) : -1;
      const propIndex = match ? Number(match[3]) : -1;
      const dimension = annotation?.events?.[eventIndex]?.participants?.[participantIndex]?.properties?.[propIndex]?.dimension;
      const valueOptions = dimension ? PROPERTY_DIMENSIONS[dimension] ?? [] : [];
      return {
        label: 'Property Value',
        options: options(valueOptions),
        note: 'Property values depend on the chosen dimension.',
        context: dimension ? { dimension } : {},
      };
    }
    if (key.includes('relation:') && key.includes(':value')) {
      const match = key.match(/relation:(\d+):value/);
      const relationIndex = match ? Number(match[1]) : -1;
      const relation = annotation?.relations?.[relationIndex];
      const relationType = relation?.type;
      const relationOptions =
        relationType === 'kinship'
          ? KINSHIP_RELATIONS
          : relationType === 'social'
            ? SOCIAL_RELATIONS
            : relationType === 'possession'
              ? POSSESSION_RELATIONS
              : relationType === 'spatial'
                ? SPATIAL_RELATIONS
                : relationType === 'part_whole'
                  ? PART_WHOLE_RELATIONS
                  : [];
      const relationLabel =
        relationType === 'kinship'
          ? 'Kinship Relation'
          : relationType === 'social'
            ? 'Social Relation'
            : relationType === 'possession'
              ? 'Possession Relation'
              : relationType === 'spatial'
                ? 'Spatial Relation'
                : relationType === 'part_whole'
                  ? 'Part-Whole Relation'
                  : 'Relation';
      return {
        label: relationLabel,
        options: options(relationOptions),
        note: 'Relation values depend on the selected relation type.',
        context: relationType ? { relation_type: relationType } : {},
      };
    }
    if (key.includes('relation')) return { label: 'Relation', options: [], note: 'Relation options depend on the selected relation type.' };
    return { label: 'General', options: [] as string[], note: '', context: {} as Record<string, string> };
  }

  async function askAssistant() {
    if (!assistantInput.trim()) return;
    const focusKey = assistantFocus === 'auto' ? lastFocusedFieldKey : assistantFocus;
    const fieldHelp = getFieldHelp(focusKey, activeAnnotation);
    const clauseContext = selected
      ? {
          reference: selected.verse.reference,
          clause_id: selected.clause.id,
          clause_type: selected.clause.clause_type,
          hebrew: selected.clause.hebrew_text,
          transliteration: selected.clause.transliteration,
          gloss: selected.clause.gloss,
          bhsa_discourse: getBhsaDiscourse(selected.clause.clause_type),
        }
      : null;

    setAssistantStatus('loading');
    setAssistantError(null);
    const userMessage = assistantInput.trim();
    setAssistantMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setAssistantInput('');
    try {
      const response = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: projectId,
          genre,
          subgenre,
          active_pass: activePass + 1,
          clause: clauseContext,
          field: {
            key: focusKey || 'general',
            label: fieldHelp.label,
            options: fieldHelp.options,
            note: fieldHelp.note,
            context: fieldHelp.context ?? {},
          },
          question: userMessage,
        }),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Assistant failed');
      }
      const data = await response.json();
      setAssistantMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
      setAssistantStatus('idle');
    } catch (error) {
      setAssistantStatus('error');
      setAssistantError(error instanceof Error ? error.message : 'Assistant failed');
    }
  }

  function handlePericopeApply() {
    const parsed = parseReferenceInput(pericopeInput);
    if (!parsed) {
      setPericopeError("Use a format like 'Ruth 1:1-5' or '1:1-2:3'.");
      return;
    }
    setPericopeError(null);
    setPericopeRange(parsed);
  }

  function handleGenreChange(nextGenre: string) {
    setGenre(nextGenre);
    const subs = SUBGENRES[nextGenre];
    if (subs && subs.length > 0) {
      setSubgenre(subs[0].value);
    }
  }

  function applyPresetsToPericope() {
    setAnnotations((prev) => {
      const next = { ...prev };
      for (const clause of pericopeClauses) {
        const current = next[clause.id] ?? createDefaultAnnotation(projectId, clause.id, presets);
        const updated = { ...current };
        if (presets.register) updated.register = presets.register as ClauseAnnotation['register'];
        if (presets.social_axis) updated.social_axis = presets.social_axis as ClauseAnnotation['social_axis'];
        if (presets.reality) {
          updated.events = updated.events.map((e) => ({ ...e, reality: presets.reality as SemanticEvent['reality'] }));
        }
        next[clause.id] = updated;
      }
      return next;
    });
  }

  async function runAIReview() {
    setReviewStatus('loading');
    setReviewError(null);
    try {
      const payload = {
        project_id: projectId,
        genre,
        subgenre,
        annotations: pericopeClauses.map((c) => annotations[c.id]).filter(Boolean),
      };
      const response = await fetch('/api/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'AI review failed');
      }
      const data = await response.json();
      setReviewFlags(data.flags ?? []);
      setReviewStatus('done');
    } catch (error) {
      setReviewStatus('error');
      setReviewError(error instanceof Error ? error.message : 'AI review failed');
    }
  }

  const pericopeAnnotationJson = useMemo(() => {
    const minutes = Number(testingLog.duration_minutes);
    return {
      project_id: projectId,
      reference: formatRange(pericopeRange),
      genre,
      subgenre,
      team_testing_log: {
        analyst: testingLog.analyst,
        duration_minutes: Number.isFinite(minutes) ? minutes : null,
        confidence: testingLog.confidence,
        notes: testingLog.notes,
      },
      clauses: pericopeClauses
        .map((clause) => {
          const annotation = annotations[clause.id];
          if (!annotation) return null;
          return {
            ...annotation,
            bhsa: {
              clause_type: clause.clause_type,
              discourse: getBhsaDiscourse(clause.clause_type),
            },
          };
        })
        .filter(Boolean),
    };
  }, [annotations, pericopeClauses, pericopeRange, projectId, genre, subgenre]);

  const flaggedClauseIds = new Set(reviewFlags.map((f) => f.clause_id));

  const activeAnnotation = selectedClauseId ? annotations[selectedClauseId] : null;
  const showSemanticRoles = genreLayers.semantic_roles !== false;
  const showParticipantProperties = genreLayers.participant_properties !== false;
  const showFigurative = genreLayers.figurative_language !== false;
  const showKeyTerms = genreLayers.key_terms !== false;
  const showAudienceResponse = genreLayers.audience_response !== false;
  const showInferenceSource = genreLayers.inference_source !== false;
  const showRetrievalTags = genreLayers.retrieval_tags !== false;
  const showFigurativeTransferability = genreLayers.figurative_transferability !== false;
  const showKeyTermConsistency = genreLayers.key_term_consistency !== false;
  const showPoeticStructure = genreLayers.poetic_structure !== false;
  const showProverbFeatures = genreLayers.proverb_features !== false;

  const analysisPassBg = ['#FAF3E7', '#EDF2F5', '#F0F5EA', '#F2F1E8'];

  const clauseScrollOffset = 72;

  return (
    <div style={{ height: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', fontFamily: s.body }}>
      <header style={{ borderBottom: `1px solid ${s.borderLight}`, padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <a href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', color: s.muted }}>
            <span style={{ fontSize: '1.2rem' }}>&larr;</span>
            <img src="/logos/I_CONE_-_telha.svg" alt="Shema" style={{ height: 24, width: 24 }} />
          </a>
          <div>
            <h1 style={{ fontFamily: s.display, fontSize: '1rem', fontWeight: 600, margin: 0 }}>Meaning Map Editor - Ruth</h1>
            <p style={{ fontSize: '0.75rem', color: s.muted, margin: 0 }}>Pericope-first analysis - Human-led - AI review only</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            onClick={() => setShowJson((prev) => !prev)}
            style={{ padding: '0.4rem 0.75rem', borderRadius: 6, fontSize: '0.8rem', fontWeight: 500, border: `1px solid ${s.border}`, color: s.muted, backgroundColor: 'white', cursor: 'pointer' }}
          >
            {showJson ? 'Hide JSON' : 'View JSON'}
          </button>
          <button style={{ padding: '0.4rem 0.75rem', borderRadius: 6, fontSize: '0.8rem', fontWeight: 500, border: `1px solid ${s.border}`, color: s.muted, backgroundColor: 'transparent', cursor: 'pointer' }}>Export JSON</button>
          <button style={{ padding: '0.4rem 0.75rem', borderRadius: 6, fontSize: '0.8rem', fontWeight: 600, border: 'none', color: 'white', backgroundColor: s.telha, cursor: 'pointer' }}>Save</button>
        </div>
      </header>

      <nav style={{ borderBottom: `1px solid ${s.borderLight}`, padding: '0 1.5rem', display: 'flex', gap: '0.25rem' }}>
        {PASSES.map((pass, i) => (
          <button
            key={pass.label}
            onClick={() => {
              if (i === 3 && !pericopeReadyForReview) return;
              setActivePass(i);
            }}
            style={{
              padding: '0.6rem 1rem',
              fontWeight: 500,
              fontSize: '0.85rem',
              borderBottom: i === activePass ? `2px solid ${pass.color}` : '2px solid transparent',
              color: i === activePass ? pass.color : s.muted,
              opacity: i === 3 && !pericopeReadyForReview ? 0.45 : 1,
              background: 'none',
              border: 'none',
              borderBottomWidth: 2,
              borderBottomStyle: 'solid',
              borderBottomColor: i === activePass ? pass.color : 'transparent',
              cursor: i === 3 && !pericopeReadyForReview ? 'not-allowed' : 'pointer',
              fontFamily: s.body,
            }}
          >
            {pass.label}
          </button>
        ))}
      </nav>

      <div style={{ flex: 1, minHeight: 0, display: 'flex', overflow: 'hidden' }}>
        <aside
          ref={clausePanelRef}
          style={{
            width: 340,
            minHeight: 0,
            borderRight: `1px solid ${s.borderLight}`,
            overflowY: 'auto',
            padding: '1rem',
            position: 'relative',
            scrollPaddingTop: clauseScrollOffset,
          }}
        >
          <div style={{ backgroundColor: s.bgCard, borderRadius: 12, padding: '0.9rem', marginBottom: '1rem', border: `1px solid ${s.border}` }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={labelStyle}>Pericope Reference</span>
              <span style={{ fontSize: '0.7rem', color: s.muted }}>{formatRange(pericopeRange)}</span>
            </div>
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              <input
                style={{ ...inputStyle, flex: 1 }}
                value={pericopeInput}
                onChange={(e) => setPericopeInput(e.target.value)}
                placeholder="Ruth 1:1-5"
              />
              <button
                onClick={handlePericopeApply}
                style={{ padding: '0.45rem 0.8rem', borderRadius: 8, border: 'none', backgroundColor: s.telha, color: 'white', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
              >
                Load
              </button>
            </div>
            {pericopeError && <p style={{ fontSize: '0.7rem', color: '#A94442', marginTop: '0.4rem' }}>{pericopeError}</p>}
            <p style={{ fontSize: '0.7rem', color: s.muted, marginTop: '0.5rem' }}>Enter the pericope reference and load. Clauses are segmented per BHSA.</p>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: s.muted, marginBottom: '0.35rem' }}>Clauses in Pericope</h2>
            <p style={{ fontSize: '0.75rem', color: s.muted, margin: 0 }}>{pericopeVerses.length} verses - {pericopeClauses.length} clauses</p>
          </div>

          {pericopeVerses.map((verse) => (
            <div key={verse.reference} style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: s.dark }}>{verse.reference}</span>
                <span style={{ fontSize: '0.65rem', color: s.muted }}>{verse.clauses.length} clauses</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                {verse.clauses.map((clause, index) => {
                  const isSelected = clause.id === selectedClauseId;
                  const isFlagged = flaggedClauseIds.has(clause.id);
                  const clauseAnnotation = annotations[clause.id];
                  const isComplete = clauseAnnotation ? hasAnyContent(clauseAnnotation) : false;
                  const bhsaDiscourse = getBhsaDiscourse(clause.clause_type);
                  return (
                    <button
                      key={clause.id}
                      onClick={() => setSelectedClauseId(clause.id)}
                      data-clause-id={clause.id}
                      style={{
                        textAlign: 'left',
                        borderRadius: 10,
                        border: isSelected ? `1px solid ${s.telha}` : `1px solid transparent`,
                        backgroundColor: isSelected ? s.soft : 'transparent',
                        padding: '0.5rem 0.65rem',
                        cursor: 'pointer',
                        transition: 'all 120ms ease',
                        scrollMarginTop: clauseScrollOffset,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                        <span style={{ fontSize: '0.7rem', color: s.muted }}>Clause {index + 1}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          {isFlagged && <span style={{ fontSize: '0.7rem', color: '#C8730F' }}>FLAG</span>}
                          {isComplete && <span style={{ fontSize: '0.7rem', color: '#2C7A4B' }}>OK</span>}
                          <span style={{ fontSize: '0.65rem', fontWeight: 600, color: bhsaDiscourse === 'mainline' ? s.telha : s.azul }}>
                            {bhsaDiscourse === 'mainline' ? 'Mainline' : bhsaDiscourse === 'background' ? 'Background' : 'Unknown'}
                          </span>
                          <span style={{ fontSize: '0.65rem', fontFamily: s.mono, color: clause.is_verbless ? s.verde : s.telha }}>
                            {clause.clause_type}
                          </span>
                        </div>
                      </div>
                      <div style={{ fontFamily: s.hebrew, fontSize: '0.9rem', lineHeight: 1.4 }}>
                        {clause.hebrew_text}
                      </div>
                      <div style={{ fontSize: '0.65rem', color: s.muted, marginTop: '0.2rem' }}>{clause.gloss}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </aside>

        <section style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '2rem', backgroundColor: analysisPassBg[activePass], transition: 'background-color 320ms ease' }}>
          <div style={{ maxWidth: 760, margin: '0 auto' }}>
            <div style={{ backgroundColor: s.bgCard, borderRadius: 14, border: `1px solid ${s.border}`, padding: '1.25rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.8rem' }}>
                <div>
                  <h2 style={{ fontFamily: s.display, fontSize: '1.2rem', marginBottom: '0.2rem' }}>Pericope Settings</h2>
                  <p style={smallMuted}>Set the genre profile to streamline which ontology layers are asked.</p>
                </div>
                <button
                  onClick={applyPresetsToPericope}
                  style={{ padding: '0.4rem 0.75rem', borderRadius: 8, border: `1px solid ${s.border}`, backgroundColor: 'white', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
                >
                  Apply Presets
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={labelStyle}>Major Genre</label>
                  <select value={genre} onChange={(e) => handleGenreChange(e.target.value)} style={inputStyle}>
                    {MAJOR_GENRES.map((g) => (
                      <option key={g.value} value={g.value}>{g.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Subgenre</label>
                  <select value={subgenre} onChange={(e) => setSubgenre(e.target.value)} style={inputStyle}>
                    {(SUBGENRES[genre] ?? []).map((sg) => (
                      <option key={sg.value} value={sg.value}>{sg.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              {presetKey && (
                <p style={{ fontSize: '0.7rem', color: s.muted, marginTop: '0.6rem' }}>
                  Presets active for {presetKey.replace(/_/g, ' ')}: {Object.keys(presets).length ? Object.entries(presets).map(([k, v]) => `${k} = ${v}`).join(', ') : 'none'}.
                </p>
              )}
            </div>

            {selected && activeAnnotation ? (
              <>
                <div style={{ marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <div>
                      <h2 style={{ fontFamily: s.display, fontSize: '1.4rem', marginBottom: '0.25rem' }}>{selected.verse.reference}</h2>
                      <p style={{ fontSize: '0.85rem', color: s.muted, margin: 0 }}>Clause {selected.verse.clauses.findIndex((c) => c.id === selected.clause.id) + 1} - {selected.clause.clause_type} - {selected.clause.is_verbless ? 'Verbless' : 'Verbal'}</p>
                    </div>
                    <span style={{ padding: '4px 10px', borderRadius: 999, fontSize: '0.7rem', fontFamily: s.mono, backgroundColor: '#E8F0EE', color: s.azul, border: `1px solid ${s.azul}` }}>
                      Pass {activePass + 1}
                    </span>
                  </div>

                  <div style={{ backgroundColor: 'white', borderRadius: 12, border: `1px solid ${s.border}`, padding: '1.5rem' }}>
                    <div style={{ fontFamily: s.hebrew, fontSize: '1.4rem', lineHeight: 1.5, marginBottom: '0.5rem' }}>
                      {selected.clause.hebrew_text}
                    </div>
                    <div style={{ fontSize: '0.9rem', color: s.muted, marginBottom: '0.3rem' }}>{selected.clause.transliteration}</div>
                    <div style={{ fontSize: '0.85rem', color: s.dark }}>{selected.clause.gloss}</div>
                  </div>
                </div>

                <div style={{ backgroundColor: s.bgCard, borderRadius: 14, border: `1px solid ${s.border}`, padding: '1.25rem', marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.8rem' }}>
                    <div>
                      <h2 style={{ fontFamily: s.display, fontSize: '1.05rem', marginBottom: '0.2rem' }}>Team Testing Log</h2>
                      <p style={smallMuted}>Record how long this pericope took and how confident you feel about the work.</p>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '0.75rem' }}>
                    <div>
                      <label style={labelStyle}>Analyst Name</label>
                      <input
                        style={inputStyle}
                        value={testingLog.analyst}
                        onChange={(e) => setTestingLog((prev) => ({ ...prev, analyst: e.target.value }))}
                        placeholder="Analyst name"
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>Time (Minutes)</label>
                      <input
                        type="number"
                        min="0"
                        style={inputStyle}
                        value={testingLog.duration_minutes}
                        onChange={(e) => setTestingLog((prev) => ({ ...prev, duration_minutes: e.target.value }))}
                        placeholder="90"
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>Confidence</label>
                      <select
                        value={testingLog.confidence}
                        onChange={(e) => setTestingLog((prev) => ({ ...prev, confidence: e.target.value }))}
                        style={inputStyle}
                      >
                        <option value="not_specified">Not specified</option>
                        <option value="very_low">Very low</option>
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="very_high">Very high</option>
                      </select>
                    </div>
                  </div>
                  <div style={{ marginTop: '0.75rem' }}>
                    <label style={labelStyle}>Notes</label>
                    <textarea
                      style={{ ...inputStyle, minHeight: 90 }}
                      value={testingLog.notes}
                      onChange={(e) => setTestingLog((prev) => ({ ...prev, notes: e.target.value }))}
                      placeholder="Observations, challenges, or questions for review..."
                    />
                  </div>
                </div>

                {activePass === 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    {genreLayers.events !== false && (
                      <div style={{ backgroundColor: s.bgCard, borderRadius: 12, padding: '1rem', border: `1px solid ${s.border}` }}>
                        <h3 style={labelStyle}>Events</h3>
                        {activeAnnotation.events.map((event, eventIndex) => (
                        <div key={event.id} style={{ marginTop: '0.75rem', backgroundColor: 'white', borderRadius: 12, border: `1px solid ${s.border}`, padding: '1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
                            <span style={{ fontWeight: 600 }}>Event {eventIndex + 1}</span>
                            <label style={{ fontSize: '0.75rem', color: s.muted }}>
                              <input
                                type="checkbox"
                                checked={event.is_primary}
                                onChange={(e) => updateEvent(selected.clause.id, eventIndex, (ev) => ({ ...ev, is_primary: e.target.checked }))}
                                style={{ marginRight: '0.4rem' }}
                              />
                              Primary Event
                            </label>
                            {activeAnnotation.events.length > 1 && (
                              <button
                                onClick={() => removeEvent(selected.clause.id, eventIndex)}
                                style={{ padding: '0.2rem 0.5rem', borderRadius: 6, border: `1px solid ${s.border}`, backgroundColor: 'white', fontSize: '0.7rem', cursor: 'pointer' }}
                              >
                                Remove Event
                              </button>
                            )}
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                            <div>
                              <label style={labelStyle}>Event Category</label>
                              <select
                                value={event.event_category}
                                onChange={(e) => updateEvent(selected.clause.id, eventIndex, (ev) => ({ ...ev, event_category: e.target.value as SemanticEvent['event_category'], verbal_core: undefined }))}
                                onFocus={() => confirmField(selected.clause.id, `event:${eventIndex}:event_category`)}
                                style={fieldStyle(selected.clause.id, `event:${eventIndex}:event_category`)}
                              >
                                {EVENT_CATEGORIES.map((opt) => (
                                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                              </select>
                            </div>
                            {!event.is_primary && (
                              <div>
                                <label style={labelStyle}>Embedded Relation</label>
                                <select
                                  value={event.embedded_relation ?? 'not_specified'}
                                  onChange={(e) => updateEvent(selected.clause.id, eventIndex, (ev) => ({ ...ev, embedded_relation: e.target.value as EmbeddedRelation }))}
                                  onFocus={() => confirmField(selected.clause.id, `event:${eventIndex}:embedded_relation`)}
                                  style={fieldStyle(selected.clause.id, `event:${eventIndex}:embedded_relation`)}
                                >
                                  {EMBEDDED_RELATIONS.map((opt) => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                  ))}
                                </select>
                              </div>
                            )}
                          </div>

                          {selected.clause.is_verbless ? (
                            <div style={{ marginTop: '0.75rem', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                              <div>
                                <label style={labelStyle}>Predication Type</label>
                                <select
                                  value={event.verbless_predication?.predication_type ?? 'not_specified'}
                                  onChange={(e) => updateEvent(selected.clause.id, eventIndex, (ev) => ({
                                    ...ev,
                                    verbless_predication: {
                                      predication_type: e.target.value as any,
                                      subject_term: ev.verbless_predication?.subject_term ?? '',
                                      predicate_term: ev.verbless_predication?.predicate_term ?? '',
                                    },
                                  }))}
                                  onFocus={() => confirmField(selected.clause.id, `event:${eventIndex}:predication_type`)}
                                  style={fieldStyle(selected.clause.id, `event:${eventIndex}:predication_type`)}
                                >
                                  {PREDICATION_TYPES.map((opt) => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label style={labelStyle}>Subject Term</label>
                                <input
                                  style={fieldStyle(selected.clause.id, `event:${eventIndex}:subject_term`)}
                                  value={event.verbless_predication?.subject_term ?? ''}
                                  onChange={(e) => updateEvent(selected.clause.id, eventIndex, (ev) => ({
                                    ...ev,
                                    verbless_predication: {
                                      predication_type: ev.verbless_predication?.predication_type ?? 'not_specified',
                                      subject_term: e.target.value,
                                      predicate_term: ev.verbless_predication?.predicate_term ?? '',
                                    },
                                  }))}
                                  onFocus={() => confirmField(selected.clause.id, `event:${eventIndex}:subject_term`)}
                                />
                              </div>
                              <div>
                                <label style={labelStyle}>Predicate Term</label>
                                <input
                                  style={fieldStyle(selected.clause.id, `event:${eventIndex}:predicate_term`)}
                                  value={event.verbless_predication?.predicate_term ?? ''}
                                  onChange={(e) => updateEvent(selected.clause.id, eventIndex, (ev) => ({
                                    ...ev,
                                    verbless_predication: {
                                      predication_type: ev.verbless_predication?.predication_type ?? 'not_specified',
                                      subject_term: ev.verbless_predication?.subject_term ?? '',
                                      predicate_term: e.target.value,
                                    },
                                  }))}
                                  onFocus={() => confirmField(selected.clause.id, `event:${eventIndex}:predicate_term`)}
                                />
                              </div>
                            </div>
                          ) : (
                            <div style={{ marginTop: '0.75rem' }}>
                              <label style={labelStyle}>Verbal Core</label>
                              <select
                                value={event.verbal_core ?? 'not_specified'}
                                onChange={(e) => updateEvent(selected.clause.id, eventIndex, (ev) => ({ ...ev, verbal_core: e.target.value }))}
                                onFocus={() => confirmField(selected.clause.id, `event:${eventIndex}:verbal_core`)}
                                style={fieldStyle(selected.clause.id, `event:${eventIndex}:verbal_core`)}
                              >
                                <option value="not_specified">Not specified</option>
                                {(VERBAL_CORES[event.event_category] ?? []).map((opt) => (
                                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                              </select>
                            </div>
                          )}

                          <div style={{ marginTop: '0.9rem', display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.75rem' }}>
                            {genreLayers.reality !== false && (
                              <div>
                                <label style={labelStyle}>Reality</label>
                                <select
                                  value={event.reality}
                                  onChange={(e) => updateEvent(selected.clause.id, eventIndex, (ev) => ({ ...ev, reality: e.target.value as SemanticEvent['reality'] }))}
                                  onFocus={() => confirmField(selected.clause.id, `event:${eventIndex}:reality`)}
                                  style={fieldStyle(selected.clause.id, `event:${eventIndex}:reality`)}
                                  disabled={genreLayers.reality === 'preset'}
                                >
                                  {REALITY_VALUES.map((opt) => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                  ))}
                                </select>
                              </div>
                            )}
                            {genreLayers.evidentiality !== false && (
                              <div>
                                <label style={labelStyle}>Evidentiality</label>
                                <select
                                  value={event.evidentiality}
                                  onChange={(e) => updateEvent(selected.clause.id, eventIndex, (ev) => ({ ...ev, evidentiality: e.target.value as SemanticEvent['evidentiality'] }))}
                                  onFocus={() => confirmField(selected.clause.id, `event:${eventIndex}:evidentiality`)}
                                  style={fieldStyle(selected.clause.id, `event:${eventIndex}:evidentiality`)}
                                >
                                  {EVIDENTIALITY_VALUES.map((opt) => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                  ))}
                                </select>
                              </div>
                            )}
                            {genreLayers.time_frame !== false && (
                              <div>
                                <label style={labelStyle}>Time Frame</label>
                                <select
                                  value={event.time_frame}
                                  onChange={(e) => updateEvent(selected.clause.id, eventIndex, (ev) => ({ ...ev, time_frame: e.target.value as SemanticEvent['time_frame'] }))}
                                  onFocus={() => confirmField(selected.clause.id, `event:${eventIndex}:time_frame`)}
                                  style={fieldStyle(selected.clause.id, `event:${eventIndex}:time_frame`)}
                                >
                                  {TIME_FRAME_VALUES.map((opt) => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                  ))}
                                </select>
                              </div>
                            )}
                            {genreLayers.aspect !== false && (
                              <div>
                                <label style={labelStyle}>Aspect</label>
                                <select
                                  value={event.aspect}
                                  onChange={(e) => updateEvent(selected.clause.id, eventIndex, (ev) => ({ ...ev, aspect: e.target.value as SemanticEvent['aspect'] }))}
                                  onFocus={() => confirmField(selected.clause.id, `event:${eventIndex}:aspect`)}
                                  style={fieldStyle(selected.clause.id, `event:${eventIndex}:aspect`)}
                                >
                                  {ASPECT_VALUES.map((opt) => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                  ))}
                                </select>
                              </div>
                            )}
                            {genreLayers.polarity !== false && (
                              <div>
                                <label style={labelStyle}>Polarity</label>
                                <select
                                  value={event.polarity}
                                  onChange={(e) => updateEvent(selected.clause.id, eventIndex, (ev) => ({ ...ev, polarity: e.target.value as SemanticEvent['polarity'] }))}
                                  onFocus={() => confirmField(selected.clause.id, `event:${eventIndex}:polarity`)}
                                  style={fieldStyle(selected.clause.id, `event:${eventIndex}:polarity`)}
                                >
                                  {POLARITY_VALUES.map((opt) => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                  ))}
                                </select>
                              </div>
                            )}
                          </div>

                          {genreLayers.participants !== false && (
                            <div style={{ marginTop: '1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
                              <h4 style={{ fontSize: '0.85rem', margin: 0 }}>Participants</h4>
                              <button
                                onClick={() => updateEvent(selected.clause.id, eventIndex, (ev) => ({
                                  ...ev,
                                  participants: [...ev.participants, createDefaultParticipant(`p_${selected.clause.id}_${eventIndex}_${ev.participants.length + 1}`)],
                                }))}
                                style={{ padding: '0.3rem 0.6rem', borderRadius: 6, border: `1px solid ${s.border}`, backgroundColor: 'white', fontSize: '0.7rem', cursor: 'pointer' }}
                              >
                                Add Participant
                              </button>
                            </div>

                            {event.participants.length === 0 && <p style={smallMuted}>Add participants to define WHO does WHAT.</p>}
                            {event.participants.map((participant, pIndex) => (
                              <div key={participant.id} style={{ border: `1px solid ${s.border}`, borderRadius: 10, padding: '0.8rem', marginBottom: '0.6rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                                  <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Participant {pIndex + 1}</span>
                                  <button
                                    onClick={() => removeParticipant(selected.clause.id, eventIndex, pIndex)}
                                    style={{ padding: '0.2rem 0.5rem', borderRadius: 6, border: `1px solid ${s.border}`, backgroundColor: 'white', fontSize: '0.7rem', cursor: 'pointer' }}
                                  >
                                    Remove Participant
                                  </button>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: showSemanticRoles ? '1.2fr 1fr 1fr' : '1.2fr 1fr', gap: '0.6rem' }}>
                                  <div>
                                    <label style={labelStyle}>Label</label>
                                    <input
                                      style={fieldStyle(selected.clause.id, `event:${eventIndex}:participant:${pIndex}:label`)}
                                      value={participant.label}
                                      onChange={(e) => updateParticipant(selected.clause.id, eventIndex, pIndex, (p) => ({ ...p, label: e.target.value }))}
                                      onFocus={() => confirmField(selected.clause.id, `event:${eventIndex}:participant:${pIndex}:label`)}
                                      placeholder="Ruth, Naomi, Boaz"
                                    />
                                  </div>
                                  <div>
                                    <label style={labelStyle}>Type</label>
                                    <select
                                      value={participant.type}
                                      onChange={(e) => updateParticipant(selected.clause.id, eventIndex, pIndex, (p) => ({ ...p, type: e.target.value as Participant['type'] }))}
                                      onFocus={() => confirmField(selected.clause.id, `event:${eventIndex}:participant:${pIndex}:type`)}
                                      style={fieldStyle(selected.clause.id, `event:${eventIndex}:participant:${pIndex}:type`)}
                                    >
                                      {PARTICIPANT_TYPES.map((opt) => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                      ))}
                                    </select>
                                  </div>
                                  {showSemanticRoles && (
                                    <div>
                                      <label style={labelStyle}>Role</label>
                                      <select
                                        value={participant.semantic_role}
                                        onChange={(e) => updateParticipant(selected.clause.id, eventIndex, pIndex, (p) => ({ ...p, semantic_role: e.target.value as Participant['semantic_role'] }))}
                                        onFocus={() => confirmField(selected.clause.id, `event:${eventIndex}:participant:${pIndex}:semantic_role`)}
                                        style={fieldStyle(selected.clause.id, `event:${eventIndex}:participant:${pIndex}:semantic_role`)}
                                      >
                                        {SEMANTIC_ROLES.map((opt) => (
                                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                      </select>
                                    </div>
                                  )}
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', marginTop: '0.6rem' }}>
                                  <div>
                                    <label style={labelStyle}>Quantity</label>
                                    <select
                                      value={participant.quantity}
                                      onChange={(e) => updateParticipant(selected.clause.id, eventIndex, pIndex, (p) => ({ ...p, quantity: e.target.value as Participant['quantity'] }))}
                                      onFocus={() => confirmField(selected.clause.id, `event:${eventIndex}:participant:${pIndex}:quantity`)}
                                      style={fieldStyle(selected.clause.id, `event:${eventIndex}:participant:${pIndex}:quantity`)}
                                    >
                                      {QUANTITIES.map((opt) => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                      ))}
                                    </select>
                                  </div>
                                  <div>
                                    <label style={labelStyle}>Reference Status</label>
                                    <select
                                      value={participant.reference_status}
                                      onChange={(e) => updateParticipant(selected.clause.id, eventIndex, pIndex, (p) => ({ ...p, reference_status: e.target.value as Participant['reference_status'] }))}
                                      onFocus={() => confirmField(selected.clause.id, `event:${eventIndex}:participant:${pIndex}:reference_status`)}
                                      style={fieldStyle(selected.clause.id, `event:${eventIndex}:participant:${pIndex}:reference_status`)}
                                    >
                                      {REFERENCE_STATUSES.map((opt) => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                      ))}
                                    </select>
                                  </div>
                                </div>

                                {showParticipantProperties && (
                                  <div style={{ marginTop: '0.6rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                                      <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Properties</span>
                                      <button
                                        onClick={() => updateParticipant(selected.clause.id, eventIndex, pIndex, (p) => ({
                                          ...p,
                                          properties: [...p.properties, { dimension: 'physical', value: 'not_specified' }],
                                        }))}
                                        style={{ padding: '0.2rem 0.5rem', borderRadius: 6, border: `1px solid ${s.border}`, backgroundColor: 'white', fontSize: '0.7rem', cursor: 'pointer' }}
                                      >
                                        Add Property
                                      </button>
                                    </div>
                                    {participant.properties.length === 0 && <p style={smallMuted}>Add properties if the text encodes them (e.g., "widowed").</p>}
                                    {participant.properties.map((prop, propIndex) => (
                                      <div key={`${participant.id}_${propIndex}`} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', marginBottom: '0.4rem' }}>
                                        <select
                                          value={prop.dimension}
                                          onChange={(e) => updateParticipantProperty(selected.clause.id, eventIndex, pIndex, propIndex, (pp) => ({ ...pp, dimension: e.target.value as ParticipantProperty['dimension'] }))}
                                          onFocus={() => confirmField(selected.clause.id, `event:${eventIndex}:participant:${pIndex}:property:${propIndex}:dimension`)}
                                          style={fieldStyle(selected.clause.id, `event:${eventIndex}:participant:${pIndex}:property:${propIndex}:dimension`)}
                                        >
                                          {Object.keys(PROPERTY_DIMENSIONS).map((dim) => (
                                            <option key={dim} value={dim}>{dim.replace(/_/g, ' ')}</option>
                                          ))}
                                        </select>
                                        <select
                                          value={prop.value}
                                          onChange={(e) => updateParticipantProperty(selected.clause.id, eventIndex, pIndex, propIndex, (pp) => ({ ...pp, value: e.target.value as ParticipantProperty['value'] }))}
                                          onFocus={() => confirmField(selected.clause.id, `event:${eventIndex}:participant:${pIndex}:property:${propIndex}:value`)}
                                          style={fieldStyle(selected.clause.id, `event:${eventIndex}:participant:${pIndex}:property:${propIndex}:value`)}
                                        >
                                          {PROPERTY_DIMENSIONS[prop.dimension]?.map((opt) => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                          ))}
                                          <option value="not_specified">Not specified</option>
                                        </select>
                                        <button
                                          onClick={() => removeParticipantProperty(selected.clause.id, eventIndex, pIndex, propIndex)}
                                          style={{ gridColumn: '1 / -1', justifySelf: 'flex-end', padding: '0.2rem 0.5rem', borderRadius: 6, border: `1px solid ${s.border}`, backgroundColor: 'white', fontSize: '0.7rem', cursor: 'pointer' }}
                                        >
                                          Remove Property
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                            </div>
                          )}
                        </div>
                      ))}

                        <button
                        onClick={() => updateAnnotation(selected.clause.id, (current) => ({
                          ...current,
                          events: [...current.events, createDefaultEvent(`event_${selected.clause.id}_${current.events.length + 1}`)],
                        }))}
                        style={{ marginTop: '0.75rem', padding: '0.35rem 0.75rem', borderRadius: 8, border: `1px dashed ${s.border}`, backgroundColor: 'transparent', fontSize: '0.75rem', cursor: 'pointer' }}
                      >
                        Add Another Event
                        </button>
                      </div>
                    )}

                    {genreLayers.relations !== false && (
                      <div style={{ backgroundColor: s.bgCard, borderRadius: 12, padding: '1rem', border: `1px solid ${s.border}` }}>
                        <h3 style={labelStyle}>Relations (Between Participants)</h3>
                        <p style={smallMuted}>Use relations to capture kinship, social, possession, or spatial links within the clause.</p>
                        {activeAnnotation.relations.map((relation, rIndex) => (
                        <div key={`${selected.clause.id}_relation_${rIndex}`} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr auto', gap: '0.6rem', marginBottom: '0.6rem', backgroundColor: 'white', borderRadius: 10, border: `1px solid ${s.border}`, padding: '0.6rem' }}>
                          <select
                            value={relation.type}
                            onChange={(e) => updateRelation(selected.clause.id, rIndex, (rel) => ({ ...rel, type: e.target.value as Relation['type'], value: 'not_specified' }))}
                            onFocus={() => confirmField(selected.clause.id, `relation:${rIndex}:type`)}
                            style={fieldStyle(selected.clause.id, `relation:${rIndex}:type`)}
                          >
                            <option value="kinship">Kinship</option>
                            <option value="social">Social</option>
                            <option value="possession">Possession</option>
                            <option value="spatial">Spatial</option>
                            <option value="part_whole">Part-Whole</option>
                          </select>
                          <select
                            value={relation.value}
                            onChange={(e) => updateRelation(selected.clause.id, rIndex, (rel) => ({ ...rel, value: e.target.value as Relation['value'] }))}
                            onFocus={() => confirmField(selected.clause.id, `relation:${rIndex}:value`)}
                            style={fieldStyle(selected.clause.id, `relation:${rIndex}:value`)}
                          >
                            {(relation.type === 'kinship' ? KINSHIP_RELATIONS
                              : relation.type === 'social' ? SOCIAL_RELATIONS
                              : relation.type === 'possession' ? POSSESSION_RELATIONS
                              : relation.type === 'part_whole' ? PART_WHOLE_RELATIONS
                              : SPATIAL_RELATIONS).map((opt) => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                              ))}
                          </select>
                          <select
                            value={relation.from_participant}
                            onChange={(e) => updateRelation(selected.clause.id, rIndex, (rel) => ({ ...rel, from_participant: e.target.value }))}
                            onFocus={() => confirmField(selected.clause.id, `relation:${rIndex}:from`)}
                            style={fieldStyle(selected.clause.id, `relation:${rIndex}:from`)}
                          >
                            <option value="">From participant</option>
                            {activeAnnotation.events.flatMap((ev) => ev.participants).map((p) => (
                              <option key={p.id} value={p.id}>{p.label || p.id}</option>
                            ))}
                          </select>
                          <select
                            value={relation.to_participant}
                            onChange={(e) => updateRelation(selected.clause.id, rIndex, (rel) => ({ ...rel, to_participant: e.target.value }))}
                            onFocus={() => confirmField(selected.clause.id, `relation:${rIndex}:to`)}
                            style={fieldStyle(selected.clause.id, `relation:${rIndex}:to`)}
                          >
                            <option value="">To participant</option>
                            {activeAnnotation.events.flatMap((ev) => ev.participants).map((p) => (
                              <option key={p.id} value={p.id}>{p.label || p.id}</option>
                            ))}
                          </select>
                          <button
                            onClick={() => removeRelation(selected.clause.id, rIndex)}
                            style={{ padding: '0.2rem 0.5rem', borderRadius: 6, border: `1px solid ${s.border}`, backgroundColor: 'white', fontSize: '0.7rem', cursor: 'pointer' }}
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                        <button
                        onClick={() => updateAnnotation(selected.clause.id, (current) => ({
                          ...current,
                          relations: [...current.relations, createDefaultRelation()],
                        }))}
                        style={{ padding: '0.35rem 0.75rem', borderRadius: 8, border: `1px dashed ${s.border}`, backgroundColor: 'transparent', fontSize: '0.75rem', cursor: 'pointer' }}
                      >
                        Add Relation
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {activePass === 1 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    {genreLayers.discourse_structure !== false && (
                      <div style={{ backgroundColor: s.bgCard, borderRadius: 12, padding: '1rem', border: `1px solid ${s.border}` }}>
                        <h3 style={labelStyle}>Discourse Structure</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.6rem' }}>
                          <div>
                            <label style={labelStyle}>Discourse Function</label>
                            <select
                              value={activeAnnotation.discourse_function}
                              onChange={(e) => updateAnnotation(selected.clause.id, (current) => ({ ...current, discourse_function: e.target.value as ClauseAnnotation['discourse_function'] }))}
                              onFocus={() => confirmField(selected.clause.id, 'discourse_function')}
                              style={fieldStyle(selected.clause.id, 'discourse_function')}
                            >
                              {DISCOURSE_FUNCTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label style={labelStyle}>Discourse Relation</label>
                            <select
                              value={activeAnnotation.discourse_relation}
                              onChange={(e) => updateAnnotation(selected.clause.id, (current) => ({ ...current, discourse_relation: e.target.value as ClauseAnnotation['discourse_relation'] }))}
                              onFocus={() => confirmField(selected.clause.id, 'discourse_relation')}
                              style={fieldStyle(selected.clause.id, 'discourse_relation')}
                            >
                              {DISCOURSE_RELATIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    )}

                    <div style={{ backgroundColor: s.bgCard, borderRadius: 12, padding: '1rem', border: `1px solid ${s.border}` }}>
                      <h3 style={labelStyle}>Pragmatics & Register</h3>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.6rem' }}>
                        {genreLayers.register !== false && (
                          <div>
                            <label style={labelStyle}>Register</label>
                            <select
                              value={activeAnnotation.register}
                              onChange={(e) => updateAnnotation(selected.clause.id, (current) => ({ ...current, register: e.target.value as ClauseAnnotation['register'] }))}
                              onFocus={() => confirmField(selected.clause.id, 'register')}
                              style={fieldStyle(selected.clause.id, 'register')}
                              disabled={genreLayers.register === 'preset'}
                            >
                              {REGISTERS.map((opt) => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                              ))}
                            </select>
                          </div>
                        )}
                        {genreLayers.social_axis !== false && (
                          <div>
                            <label style={labelStyle}>Social Axis</label>
                            <select
                              value={activeAnnotation.social_axis}
                              onChange={(e) => updateAnnotation(selected.clause.id, (current) => ({ ...current, social_axis: e.target.value as ClauseAnnotation['social_axis'] }))}
                              onFocus={() => confirmField(selected.clause.id, 'social_axis')}
                              style={fieldStyle(selected.clause.id, 'social_axis')}
                              disabled={genreLayers.social_axis === 'preset'}
                            >
                              {SOCIAL_AXES.map((opt) => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                              ))}
                            </select>
                          </div>
                        )}
                        {genreLayers.prominence !== false && (
                          <div>
                            <label style={labelStyle}>Prominence</label>
                            <select
                              value={activeAnnotation.prominence}
                              onChange={(e) => updateAnnotation(selected.clause.id, (current) => ({ ...current, prominence: e.target.value as ClauseAnnotation['prominence'] }))}
                              onFocus={() => confirmField(selected.clause.id, 'prominence')}
                              style={fieldStyle(selected.clause.id, 'prominence')}
                            >
                              {PROMINENCE_VALUES.map((opt) => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                              ))}
                            </select>
                          </div>
                        )}
                        {genreLayers.pacing !== false && (
                          <div>
                            <label style={labelStyle}>Pacing</label>
                            <select
                              value={activeAnnotation.pacing}
                              onChange={(e) => updateAnnotation(selected.clause.id, (current) => ({ ...current, pacing: e.target.value as ClauseAnnotation['pacing'] }))}
                              onFocus={() => confirmField(selected.clause.id, 'pacing')}
                              style={fieldStyle(selected.clause.id, 'pacing')}
                            >
                              {PACING_VALUES.map((opt) => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>
                    </div>
                    {showInferenceSource && (
                      <div style={{ backgroundColor: s.bgCard, borderRadius: 12, padding: '1rem', border: `1px solid ${s.border}` }}>
                        <h3 style={labelStyle}>Source Tracking</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.75rem', marginTop: '0.6rem' }}>
                          <div>
                            <label style={labelStyle}>Inference Source</label>
                            <select
                              value={activeAnnotation.inference_source}
                              onChange={(e) => updateAnnotation(selected.clause.id, (current) => ({ ...current, inference_source: e.target.value as ClauseAnnotation['inference_source'] }))}
                              onFocus={() => confirmField(selected.clause.id, 'inference_source')}
                              style={fieldStyle(selected.clause.id, 'inference_source')}
                            >
                              {INFERENCE_SOURCES.map((opt) => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activePass === 2 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div style={{ backgroundColor: s.bgCard, borderRadius: 12, padding: '1rem', border: `1px solid ${s.border}` }}>
                      <h3 style={labelStyle}>Emotion & Stance</h3>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.6rem' }}>
                        {genreLayers.emotion !== false && (
                          <div>
                            <label style={labelStyle}>Emotion</label>
                            <select
                              value={activeAnnotation.emotion}
                              onChange={(e) => updateAnnotation(selected.clause.id, (current) => ({ ...current, emotion: e.target.value as ClauseAnnotation['emotion'] }))}
                              onFocus={() => confirmField(selected.clause.id, 'emotion')}
                              style={fieldStyle(selected.clause.id, 'emotion')}
                            >
                              {EMOTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                              ))}
                            </select>
                          </div>
                        )}
                        {genreLayers.emotion !== false && (
                          <div>
                            <label style={labelStyle}>Intensity</label>
                            <select
                              value={activeAnnotation.emotion_intensity}
                              onChange={(e) => updateAnnotation(selected.clause.id, (current) => ({ ...current, emotion_intensity: e.target.value as ClauseAnnotation['emotion_intensity'] }))}
                              onFocus={() => confirmField(selected.clause.id, 'emotion_intensity')}
                              style={fieldStyle(selected.clause.id, 'emotion_intensity')}
                            >
                              {EMOTION_INTENSITIES.map((opt) => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                              ))}
                            </select>
                          </div>
                        )}
                        {genreLayers.narrator_stance !== false && (
                          <div>
                            <label style={labelStyle}>Narrator Stance</label>
                            <select
                              value={activeAnnotation.narrator_stance}
                              onChange={(e) => updateAnnotation(selected.clause.id, (current) => ({ ...current, narrator_stance: e.target.value as ClauseAnnotation['narrator_stance'] }))}
                              onFocus={() => confirmField(selected.clause.id, 'narrator_stance')}
                              style={fieldStyle(selected.clause.id, 'narrator_stance')}
                            >
                              {NARRATOR_STANCES.map((opt) => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                              ))}
                            </select>
                          </div>
                        )}
                        {genreLayers.speech_acts !== false && (
                          <div>
                            <label style={labelStyle}>Speech Act</label>
                            <select
                              value={activeAnnotation.speech_act}
                              onChange={(e) => updateAnnotation(selected.clause.id, (current) => ({ ...current, speech_act: e.target.value as ClauseAnnotation['speech_act'] }))}
                              onFocus={() => confirmField(selected.clause.id, 'speech_act')}
                              style={fieldStyle(selected.clause.id, 'speech_act')}
                            >
                              {SPEECH_ACTS.map((opt) => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>
                    </div>

                    {showAudienceResponse && (
                      <div style={{ backgroundColor: s.bgCard, borderRadius: 12, padding: '1rem', border: `1px solid ${s.border}`, ...(isFieldConfirmed(selected.clause.id, 'audience_response') ? confirmedSectionStyle : {}) }}>
                        <h3 style={labelStyle}>Audience Response</h3>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.6rem' }}>
                          {AUDIENCE_RESPONSES.filter((opt) => opt.value !== 'not_specified' && opt.value !== 'other').map((opt) => (
                            <label key={opt.value} style={{ fontSize: '0.75rem', border: `1px solid ${s.border}`, borderRadius: 6, padding: '0.25rem 0.5rem', backgroundColor: 'white' }}>
                              <input
                                type="checkbox"
                                checked={activeAnnotation.audience_response.includes(opt.value as ClauseAnnotation['audience_response'][number])}
                                onChange={(e) => {
                                  confirmField(selected.clause.id, 'audience_response');
                                  const next = e.target.checked
                                    ? [...activeAnnotation.audience_response, opt.value as ClauseAnnotation['audience_response'][number]]
                                    : activeAnnotation.audience_response.filter((v) => v !== opt.value);
                                  updateAnnotation(selected.clause.id, (current) => ({ ...current, audience_response: next }));
                                }}
                                style={{ marginRight: '0.3rem' }}
                              />
                              {opt.label}
                            </label>
                          ))}
                        </div>
                      </div>
                    )}

                    {showFigurative && (
                      <div style={{ backgroundColor: s.bgCard, borderRadius: 12, padding: '1rem', border: `1px solid ${s.border}`, ...(isFieldConfirmed(selected.clause.id, 'figurative_language') ? confirmedSectionStyle : {}) }}>
                        <h3 style={labelStyle}>Figurative Language</h3>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.6rem' }}>
                          {FIGURATIVE_LANGUAGE.filter((opt) => opt.value !== 'not_specified').map((opt) => (
                            <label key={opt.value} style={{ fontSize: '0.75rem', border: `1px solid ${s.border}`, borderRadius: 6, padding: '0.25rem 0.5rem', backgroundColor: 'white' }}>
                              <input
                                type="checkbox"
                                checked={activeAnnotation.figurative_language.includes(opt.value as ClauseAnnotation['figurative_language'][number])}
                                onChange={(e) => {
                                  confirmField(selected.clause.id, 'figurative_language');
                                  const next = e.target.checked
                                    ? [...activeAnnotation.figurative_language, opt.value as ClauseAnnotation['figurative_language'][number]]
                                    : activeAnnotation.figurative_language.filter((v) => v !== opt.value);
                                  updateAnnotation(selected.clause.id, (current) => ({ ...current, figurative_language: next }));
                                }}
                                style={{ marginRight: '0.3rem' }}
                              />
                              {opt.label}
                            </label>
                          ))}
                        </div>
                        {showFigurativeTransferability && (
                          <div style={{ marginTop: '0.75rem' }}>
                            <label style={labelStyle}>Transferability</label>
                            <select
                              value={activeAnnotation.figurative_transferability}
                              onChange={(e) => updateAnnotation(selected.clause.id, (current) => ({ ...current, figurative_transferability: e.target.value as ClauseAnnotation['figurative_transferability'] }))}
                              onFocus={() => confirmField(selected.clause.id, 'figurative_transferability')}
                              style={fieldStyle(selected.clause.id, 'figurative_transferability')}
                            >
                              {FIGURATIVE_TRANSFERABILITY.map((opt) => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>
                    )}

                    {showKeyTerms && (
                      <div style={{ backgroundColor: s.bgCard, borderRadius: 12, padding: '1rem', border: `1px solid ${s.border}`, ...(isFieldConfirmed(selected.clause.id, 'key_term_domain') ? confirmedSectionStyle : {}) }}>
                        <h3 style={labelStyle}>Key Terms</h3>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.6rem' }}>
                          {KEY_TERM_DOMAINS.filter((opt) => opt.value !== 'not_specified').map((opt) => (
                            <label key={opt.value} style={{ fontSize: '0.75rem', border: `1px solid ${s.border}`, borderRadius: 6, padding: '0.25rem 0.5rem', backgroundColor: 'white' }}>
                              <input
                                type="checkbox"
                                checked={activeAnnotation.key_term_domain.includes(opt.value as ClauseAnnotation['key_term_domain'][number])}
                                onChange={(e) => {
                                  confirmField(selected.clause.id, 'key_term_domain');
                                  const next = e.target.checked
                                    ? [...activeAnnotation.key_term_domain, opt.value as ClauseAnnotation['key_term_domain'][number]]
                                    : activeAnnotation.key_term_domain.filter((v) => v !== opt.value);
                                  updateAnnotation(selected.clause.id, (current) => ({ ...current, key_term_domain: next }));
                                }}
                                style={{ marginRight: '0.3rem' }}
                              />
                              {opt.label}
                            </label>
                          ))}
                        </div>
                        {showKeyTermConsistency && (
                          <div style={{ marginTop: '0.6rem' }}>
                            <label style={labelStyle}>Consistency Level</label>
                            <select
                              value={activeAnnotation.key_term_consistency}
                              onChange={(e) => updateAnnotation(selected.clause.id, (current) => ({ ...current, key_term_consistency: e.target.value as ClauseAnnotation['key_term_consistency'] }))}
                              onFocus={() => confirmField(selected.clause.id, 'key_term_consistency')}
                              style={fieldStyle(selected.clause.id, 'key_term_consistency')}
                            >
                              {KEY_TERM_CONSISTENCY.map((opt) => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                              ))}
                            </select>
                          </div>
                        )}
                        <div style={{ marginTop: '0.6rem' }}>
                          <label style={labelStyle}>Key Term Notes</label>
                          <input
                            style={fieldStyle(selected.clause.id, 'key_terms_text')}
                            value={activeAnnotation.other_fields.key_terms_text ?? ''}
                            onChange={(e) => updateAnnotation(selected.clause.id, (current) => ({
                              ...current,
                              other_fields: { ...current.other_fields, key_terms_text: e.target.value },
                            }))}
                            onFocus={() => confirmField(selected.clause.id, 'key_terms_text')}
                            placeholder="Free-text key terms or consistency notes"
                          />
                        </div>
                      </div>
                    )}

                    {showRetrievalTags && (
                      <div style={{ backgroundColor: s.bgCard, borderRadius: 12, padding: '1rem', border: `1px solid ${s.border}`, ...(isFieldConfirmed(selected.clause.id, 'retrieval_tags') ? confirmedSectionStyle : {}) }}>
                        <h3 style={labelStyle}>Retrieval Tags (LA)</h3>
                        <p style={smallMuted}>Add free-form tags like `grief_at_death` with a category to guide Language Archive retrieval.</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginTop: '0.6rem' }}>
                          {activeAnnotation.retrieval_tags.map((tag, idx) => (
                            <div key={`retrieval_tag_${idx}`} style={{ display: 'grid', gridTemplateColumns: '1fr 2fr auto', gap: '0.5rem', alignItems: 'center' }}>
                              <select
                                value={tag.category}
                                onChange={(e) => {
                                  confirmField(selected.clause.id, 'retrieval_tags');
                                  const next = [...activeAnnotation.retrieval_tags];
                                  next[idx] = { ...next[idx], category: e.target.value as RetrievalTag['category'] };
                                  updateAnnotation(selected.clause.id, (current) => ({ ...current, retrieval_tags: next }));
                                }}
                                onFocus={() => confirmField(selected.clause.id, `retrieval_tag:${idx}:category`)}
                                style={fieldStyle(selected.clause.id, `retrieval_tag:${idx}:category`)}
                              >
                                {RETRIEVAL_TAG_CATEGORIES.filter((opt) => opt.value !== 'not_specified' && opt.value !== 'other').map((opt) => (
                                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                              </select>
                              <input
                                style={fieldStyle(selected.clause.id, `retrieval_tag:${idx}:tag`)}
                                value={tag.tag}
                                onChange={(e) => {
                                  confirmField(selected.clause.id, 'retrieval_tags');
                                  const next = [...activeAnnotation.retrieval_tags];
                                  next[idx] = { ...next[idx], tag: e.target.value };
                                  updateAnnotation(selected.clause.id, (current) => ({ ...current, retrieval_tags: next }));
                                }}
                                onFocus={() => confirmField(selected.clause.id, `retrieval_tag:${idx}:tag`)}
                                placeholder="e.g., grief_at_death"
                              />
                              <button
                                onClick={() => {
                                  const next = activeAnnotation.retrieval_tags.filter((_, i) => i !== idx);
                                  updateAnnotation(selected.clause.id, (current) => ({ ...current, retrieval_tags: next }));
                                }}
                                style={{ padding: '0.3rem 0.6rem', borderRadius: 6, border: `1px solid ${s.border}`, backgroundColor: 'white', fontSize: '0.7rem', cursor: 'pointer' }}
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                        </div>
                        <button
                          onClick={() => {
                            const options = RETRIEVAL_TAG_CATEGORIES.filter((opt) => opt.value !== 'not_specified' && opt.value !== 'other');
                            const category = (options[0]?.value ?? 'emotion_tags') as RetrievalTag['category'];
                            const next = [...activeAnnotation.retrieval_tags, { category, tag: '' }];
                            updateAnnotation(selected.clause.id, (current) => ({ ...current, retrieval_tags: next }));
                            confirmField(selected.clause.id, 'retrieval_tags');
                          }}
                          style={{ marginTop: '0.6rem', padding: '0.35rem 0.75rem', borderRadius: 8, border: `1px dashed ${s.border}`, backgroundColor: 'transparent', fontSize: '0.75rem', cursor: 'pointer' }}
                        >
                          Add Retrieval Tag
                        </button>
                      </div>
                    )}

                    {showPoeticStructure && (
                      <div style={{ backgroundColor: s.bgCard, borderRadius: 12, padding: '1rem', border: `1px solid ${s.border}`, ...(isFieldConfirmed(selected.clause.id, 'poetic_structure') ? confirmedSectionStyle : {}) }}>
                        <h3 style={labelStyle}>Poetic Structure</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.6rem' }}>
                          <div>
                            <label style={labelStyle}>Parallelism</label>
                            <select
                              value={activeAnnotation.poetic_parallelism}
                              onChange={(e) => updateAnnotation(selected.clause.id, (current) => ({ ...current, poetic_parallelism: e.target.value as ClauseAnnotation['poetic_parallelism'] }))}
                              onFocus={() => confirmField(selected.clause.id, 'poetic_structure')}
                              style={fieldStyle(selected.clause.id, 'poetic_parallelism')}
                            >
                              {POETIC_PARALLELISM.map((opt) => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label style={labelStyle}>Line Structure</label>
                            <select
                              value={activeAnnotation.poetic_line_structure}
                              onChange={(e) => updateAnnotation(selected.clause.id, (current) => ({ ...current, poetic_line_structure: e.target.value as ClauseAnnotation['poetic_line_structure'] }))}
                              onFocus={() => confirmField(selected.clause.id, 'poetic_structure')}
                              style={fieldStyle(selected.clause.id, 'poetic_line_structure')}
                            >
                              {POETIC_LINE_STRUCTURE.map((opt) => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label style={labelStyle}>Compression</label>
                            <select
                              value={activeAnnotation.poetic_compression}
                              onChange={(e) => updateAnnotation(selected.clause.id, (current) => ({ ...current, poetic_compression: e.target.value as ClauseAnnotation['poetic_compression'] }))}
                              onFocus={() => confirmField(selected.clause.id, 'poetic_structure')}
                              style={fieldStyle(selected.clause.id, 'poetic_compression')}
                            >
                              {POETIC_COMPRESSION.map((opt) => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div style={{ marginTop: '0.6rem' }}>
                          <label style={labelStyle}>Sound Patterns</label>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.4rem' }}>
                            {POETIC_SOUND_PATTERNS.filter((opt) => opt.value !== 'not_specified' && opt.value !== 'other').map((opt) => (
                              <label key={opt.value} style={{ fontSize: '0.75rem', border: `1px solid ${s.border}`, borderRadius: 6, padding: '0.25rem 0.5rem', backgroundColor: 'white' }}>
                                <input
                                  type="checkbox"
                                  checked={activeAnnotation.poetic_sound_patterns.includes(opt.value as ClauseAnnotation['poetic_sound_patterns'][number])}
                                  onChange={(e) => {
                                    confirmField(selected.clause.id, 'poetic_structure');
                                    const next = e.target.checked
                                      ? [...activeAnnotation.poetic_sound_patterns, opt.value as ClauseAnnotation['poetic_sound_patterns'][number]]
                                      : activeAnnotation.poetic_sound_patterns.filter((v) => v !== opt.value);
                                    updateAnnotation(selected.clause.id, (current) => ({ ...current, poetic_sound_patterns: next }));
                                  }}
                                  style={{ marginRight: '0.3rem' }}
                                />
                                {opt.label}
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {showProverbFeatures && (
                      <div style={{ backgroundColor: s.bgCard, borderRadius: 12, padding: '1rem', border: `1px solid ${s.border}`, ...(isFieldConfirmed(selected.clause.id, 'proverb_features') ? confirmedSectionStyle : {}) }}>
                        <h3 style={labelStyle}>Proverb and Wisdom Features</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.6rem' }}>
                          <div>
                            <label style={labelStyle}>Proverb Type</label>
                            <select
                              value={activeAnnotation.proverb_type}
                              onChange={(e) => updateAnnotation(selected.clause.id, (current) => ({ ...current, proverb_type: e.target.value as ClauseAnnotation['proverb_type'] }))}
                              onFocus={() => confirmField(selected.clause.id, 'proverb_features')}
                              style={fieldStyle(selected.clause.id, 'proverb_type')}
                            >
                              {PROVERB_TYPES.map((opt) => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label style={labelStyle}>Wisdom Function</label>
                            <select
                              value={activeAnnotation.wisdom_function}
                              onChange={(e) => updateAnnotation(selected.clause.id, (current) => ({ ...current, wisdom_function: e.target.value as ClauseAnnotation['wisdom_function'] }))}
                              onFocus={() => confirmField(selected.clause.id, 'proverb_features')}
                              style={fieldStyle(selected.clause.id, 'wisdom_function')}
                            >
                              {WISDOM_FUNCTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label style={labelStyle}>Authority Source</label>
                            <select
                              value={activeAnnotation.authority_source}
                              onChange={(e) => updateAnnotation(selected.clause.id, (current) => ({ ...current, authority_source: e.target.value as ClauseAnnotation['authority_source'] }))}
                              onFocus={() => confirmField(selected.clause.id, 'proverb_features')}
                              style={fieldStyle(selected.clause.id, 'authority_source')}
                            >
                              {WISDOM_AUTHORITY_SOURCES.map((opt) => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label style={labelStyle}>Applicability</label>
                            <select
                              value={activeAnnotation.applicability}
                              onChange={(e) => updateAnnotation(selected.clause.id, (current) => ({ ...current, applicability: e.target.value as ClauseAnnotation['applicability'] }))}
                              onFocus={() => confirmField(selected.clause.id, 'proverb_features')}
                              style={fieldStyle(selected.clause.id, 'applicability')}
                            >
                              {WISDOM_APPLICABILITY.map((opt) => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    )}

                    <div style={{ backgroundColor: s.bgCard, borderRadius: 12, padding: '1rem', border: `1px solid ${s.border}` }}>
                      <h3 style={labelStyle}>Confidence & Notes</h3>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.75rem', marginTop: '0.6rem' }}>
                        <div>
                          <label style={labelStyle}>Confidence</label>
                          <select
                            value={activeAnnotation.confidence}
                            onChange={(e) => updateAnnotation(selected.clause.id, (current) => ({ ...current, confidence: e.target.value as ClauseAnnotation['confidence'] }))}
                            onFocus={() => confirmField(selected.clause.id, 'confidence')}
                            style={fieldStyle(selected.clause.id, 'confidence')}
                          >
                            {CONFIDENCE_VALUES.map((opt) => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label style={labelStyle}>Notes</label>
                          <textarea
                            style={{ ...fieldStyle(selected.clause.id, 'notes'), minHeight: 90 }}
                            value={activeAnnotation.notes}
                            onChange={(e) => updateAnnotation(selected.clause.id, (current) => ({ ...current, notes: e.target.value }))}
                            onFocus={() => confirmField(selected.clause.id, 'notes')}
                            placeholder="Add analyst notes or open questions..."
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activePass === 3 && (
                  <div style={{ backgroundColor: s.bgCard, borderRadius: 12, padding: '1.25rem', border: `1px solid ${s.border}` }}>
                    <h3 style={labelStyle}>AI Review (Pass 4)</h3>
                    {pericopeReadyForReview ? (
                      <>
                        <p style={smallMuted}>AI reviews the completed clause annotations and flags inconsistencies. It does not edit or suggest answers.</p>
                        <button
                          onClick={runAIReview}
                          style={{ padding: '0.45rem 0.9rem', borderRadius: 8, border: 'none', backgroundColor: s.dark, color: 'white', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', marginTop: '0.6rem' }}
                        >
                          {reviewStatus === 'loading' ? 'Reviewing...' : 'Run AI Review'}
                        </button>
                        {reviewStatus === 'error' && reviewError && (
                          <p style={{ fontSize: '0.75rem', color: '#A94442', marginTop: '0.6rem' }}>{reviewError}</p>
                        )}
                        {reviewStatus === 'done' && reviewFlags.length === 0 && (
                          <p style={{ fontSize: '0.75rem', color: s.muted, marginTop: '0.6rem' }}>No issues flagged.</p>
                        )}
                        {reviewFlags.length > 0 && (
                          <div style={{ marginTop: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                            {reviewFlags.map((flag, idx) => (
                              <div key={`flag_${idx}`} style={{ backgroundColor: 'white', borderRadius: 10, border: `1px solid ${s.border}`, padding: '0.7rem' }}>
                                <div style={{ fontSize: '0.75rem', fontWeight: 600 }}>Clause {flag.clause_id} - {flag.severity}</div>
                                <p style={{ fontSize: '0.75rem', color: s.muted, margin: '0.2rem 0' }}>{flag.message}</p>
                                <p style={{ fontSize: '0.75rem', color: s.dark, margin: 0 }}>{flag.recommendation}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <p style={smallMuted}>Pass 4 unlocks after every clause in this pericope has been reviewed.</p>
                        <p style={{ fontSize: '0.75rem', color: s.muted, marginTop: '0.5rem' }}>
                          Remaining clauses: {pericopeClauses.filter((clause) => !confirmedFields[clause.id] || Object.keys(confirmedFields[clause.id]).length === 0).length}
                        </p>
                      </>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div style={{ textAlign: 'center', paddingTop: '5rem' }}>
                <img src="/logos/I_CONE_-_telha.svg" alt="" style={{ height: 48, width: 48, margin: '0 auto 1rem', opacity: 0.3 }} />
                <h2 style={{ fontFamily: s.display, fontSize: '1.15rem', fontWeight: 600, marginBottom: '0.5rem' }}>Meaning Map Editor</h2>
                <p style={{ fontSize: '0.85rem', color: s.muted }}>Select a clause from the left panel to begin annotation.</p>
              </div>
            )}
          </div>
          <div style={{ position: 'sticky', bottom: '1.25rem', display: 'flex', justifyContent: 'flex-end', marginTop: '2rem', pointerEvents: 'none' }}>
            <div style={{ position: 'relative', pointerEvents: 'auto' }}>
              {assistantOpen && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: '3.5rem',
                    right: 0,
                    width: 320,
                    backgroundColor: 'white',
                    border: `1px solid ${s.border}`,
                    borderRadius: 12,
                    boxShadow: '0 10px 25px rgba(0,0,0,0.08)',
                    padding: '0.9rem',
                    zIndex: 20,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Ontology Assistant</span>
                    <button
                      onClick={() => setAssistantOpen(false)}
                      style={{ border: 'none', background: 'transparent', color: s.muted, cursor: 'pointer', fontSize: '0.85rem' }}
                    >
                      Close
                    </button>
                  </div>
                  <div style={{ marginBottom: '0.6rem' }}>
                    <label style={labelStyle}>Focus Field</label>
                    <select
                      value={assistantFocus}
                      onChange={(e) => setAssistantFocus(e.target.value)}
                      style={inputStyle}
                    >
                      <option value="auto">Auto (last clicked field)</option>
                      <option value="event_category">Event Category</option>
                      <option value="verbal_core">Verbal Core</option>
                      <option value="reality">Reality</option>
                      <option value="evidentiality">Evidentiality</option>
                      <option value="time_frame">Time Frame</option>
                      <option value="aspect">Aspect</option>
                      <option value="polarity">Polarity</option>
                      <option value="discourse_function">Discourse Function</option>
                      <option value="discourse_relation">Discourse Relation</option>
                      <option value="register">Register</option>
                      <option value="social_axis">Social Axis</option>
                      <option value="prominence">Prominence</option>
                      <option value="pacing">Pacing</option>
                      <option value="emotion">Emotion</option>
                      <option value="emotion_intensity">Emotion Intensity</option>
                      <option value="narrator_stance">Narrator Stance</option>
                      <option value="speech_act">Speech Act</option>
                      <option value="audience_response">Audience Response</option>
                      <option value="figurative_language">Figurative Language</option>
                      <option value="figurative_transferability">Figurative Transferability</option>
                      <option value="key_term_domain">Key Term Domain</option>
                      <option value="key_term_consistency">Key Term Consistency</option>
                      <option value="poetic_parallelism">Poetic Parallelism</option>
                      <option value="poetic_line_structure">Poetic Line Structure</option>
                      <option value="poetic_sound_patterns">Poetic Sound Patterns</option>
                      <option value="poetic_compression">Poetic Compression</option>
                      <option value="proverb_type">Proverb Type</option>
                      <option value="wisdom_function">Wisdom Function</option>
                      <option value="authority_source">Authority Source</option>
                      <option value="applicability">Applicability</option>
                      <option value="participant_type">Participant Type</option>
                      <option value="participant_role">Semantic Role</option>
                      <option value="participant_quantity">Participant Quantity</option>
                      <option value="reference_status">Reference Status</option>
                    </select>
                  </div>
                  <div style={{ maxHeight: 200, overflowY: 'auto', border: `1px solid ${s.border}`, borderRadius: 8, padding: '0.5rem', marginBottom: '0.6rem', backgroundColor: s.bgCard }}>
                    {assistantMessages.length === 0 && (
                      <p style={{ fontSize: '0.75rem', color: s.muted, margin: 0 }}>
                        Ask about the selected clause and the ontology field you are unsure about.
                      </p>
                    )}
                    {assistantMessages.map((msg, idx) => (
                      <div key={`assistant_msg_${idx}`} style={{ marginBottom: '0.5rem' }}>
                        <div style={{ fontSize: '0.7rem', fontWeight: 600, color: msg.role === 'assistant' ? s.azul : s.telha }}>
                          {msg.role === 'assistant' ? 'Assistant' : 'You'}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: s.dark }}>{msg.content}</div>
                      </div>
                    ))}
                  </div>
                  <textarea
                    style={{ ...inputStyle, minHeight: 70 }}
                    value={assistantInput}
                    onChange={(e) => setAssistantInput(e.target.value)}
                    placeholder="Ask about the selected clause..."
                  />
                  <button
                    onClick={askAssistant}
                    style={{ marginTop: '0.5rem', padding: '0.4rem 0.75rem', borderRadius: 8, border: 'none', backgroundColor: s.telha, color: 'white', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', width: '100%' }}
                  >
                    {assistantStatus === 'loading' ? 'Asking...' : 'Ask Assistant'}
                  </button>
                  {assistantStatus === 'error' && assistantError && (
                    <p style={{ fontSize: '0.7rem', color: '#A94442', marginTop: '0.4rem' }}>{assistantError}</p>
                  )}
                </div>
              )}
              <button
                onClick={() => setAssistantOpen((prev) => !prev)}
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  border: 'none',
                  backgroundColor: s.telha,
                  color: 'white',
                  fontSize: '1.1rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 8px 16px rgba(0,0,0,0.12)',
                }}
                aria-label="Open ontology assistant"
              >
                ?
              </button>
            </div>
          </div>
        </section>

        {showJson && (
          <aside style={{ width: 320, borderLeft: `1px solid ${s.borderLight}`, overflowY: 'auto', padding: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <h2 style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: s.muted, margin: 0 }}>Pericope JSON Output</h2>
              <button
                onClick={() => setShowJson(false)}
                style={{ border: 'none', background: 'transparent', fontSize: '0.85rem', color: s.muted, cursor: 'pointer' }}
              >
                Close
              </button>
            </div>
            <pre style={{ fontSize: '0.7rem', fontFamily: s.mono, color: s.muted, backgroundColor: s.bgCard, padding: '0.75rem', borderRadius: 8, overflow: 'auto' }}>
{JSON.stringify(pericopeAnnotationJson, null, 2)}
            </pre>
          </aside>
        )}
      </div>
    </div>
  );
}

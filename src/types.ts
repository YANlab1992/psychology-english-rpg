export interface TermEntry {
  id: string;
  en: string;
  zh: string;
  note: string;
}

export interface DialogueLine {
  speaker: string;
  text: string;
  portrait?: string;
}

export interface DiagnosticQuestion {
  id: string;
  prompt: string;
  options: string[];
  answer: number;
  feedback: string;
  skill: '术语' | '证据' | '结构' | '表达';
}

export interface BattleSkillContent {
  id: string;
  key: string;
  name: string;
  en: string;
  color: string;
  claim: string;
  prompt: string;
  options: string[];
  answer: number;
  success: string;
  retry: string;
}

export interface EvidenceChallenge {
  id: string;
  title: string;
  location: string;
  observation: string;
  prompt: string;
  options: string[];
  answer: number;
  success: string;
  hint: string;
}

export interface PrologueContent {
  title: string;
  subtitle: string;
  story: Array<{ heading: string; body: string }>;
  dialogues: Record<string, DialogueLine[]>;
  terms: TermEntry[];
  evidenceChallenges: EvidenceChallenge[];
  diagnostic: DiagnosticQuestion[];
  battleSkills: BattleSkillContent[];
}

export interface ChapterQuestion {
  id: string;
  prompt: string;
  options: string[];
  answer: number;
  feedback: string;
  hint: string;
}

export interface ChapterLessonPage {
  heading: string;
  en: string;
  zh: string;
  focus: string;
}

export interface ChapterStation {
  id: string;
  title: string;
  en: string;
  icon: string;
  color: string;
  location: string;
  pages: ChapterLessonPage[];
  terms: TermEntry[];
  challenges: ChapterQuestion[];
}

export interface Chapter1Content {
  title: string;
  subtitle: string;
  story: Array<{ heading: string; body: string; tag: string }>;
  stations: ChapterStation[];
  battleSkills: BattleSkillContent[];
  reviewSentence: string;
}

export interface DiagnosticRecord {
  questionId: string;
  selected: number;
  correct: boolean;
  responseMs: number;
}

export interface ChapterAnswerRecord {
  questionId: string;
  selected: number;
  correct: boolean;
  attempts: number;
}

export interface Chapter1Save {
  completedStations: string[];
  unlockedTerms: string[];
  answers: ChapterAnswerRecord[];
  battleSkillsUsed: string[];
  focusHits: number;
  completedAt?: string;
}

export type GameStage =
  | 'intro' | 'campus' | 'diagnostic' | 'battle' | 'complete'
  | 'chapter1_intro' | 'chapter1_hub' | 'chapter1_battle' | 'chapter1_complete';

export interface SaveData {
  version: 3;
  stage: GameStage;
  talkedToProfessor: boolean;
  talkedToAllies: string[];
  collectedEvidence: string[];
  unlockedTerms: string[];
  diagnostic: DiagnosticRecord[];
  battleSkillsUsed: string[];
  focusHits: number;
  evidenceAttempts: number;
  chapter1: Chapter1Save;
  completedAt?: string;
  updatedAt: string;
}

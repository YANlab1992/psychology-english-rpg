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

export interface DiagnosticRecord {
  questionId: string;
  selected: number;
  correct: boolean;
  responseMs: number;
}

export interface SaveData {
  version: 2;
  stage: 'intro' | 'campus' | 'diagnostic' | 'battle' | 'complete';
  talkedToProfessor: boolean;
  talkedToAllies: string[];
  collectedEvidence: string[];
  unlockedTerms: string[];
  diagnostic: DiagnosticRecord[];
  battleSkillsUsed: string[];
  focusHits: number;
  evidenceAttempts: number;
  completedAt?: string;
  updatedAt: string;
}

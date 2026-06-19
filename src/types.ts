export interface Word {
  de: string;
  ar: string;
  example: string;
  exampleAr: string;
  gender?: 'der' | 'die' | 'das' | '';
  plural?: string;
  type: 'noun' | 'verb' | 'adjective' | 'adverb' | 'preposition' | 'conjunction' | 'pronoun' | 'phrase' | 'number' | 'other';
}

export interface Sentence {
  de: string;
  ar: string;
}

export interface DialogLine {
  speaker: string;
  de: string;
  ar: string;
}

export interface GrammarRule {
  title: string;
  titleAr: string;
  explanation: string;
  explanationAr: string;
  examples: Sentence[];
  table?: {
    headers: string[];
    rows: string[][];
  };
}

export interface Quiz {
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

export interface Lesson {
  id: number;
  title: string;
  titleAr: string;
  level: 'A1' | 'A2' | 'B1' | 'B2';
  topic: string;
  topicAr: string;
  description: string;
  descriptionAr: string;
  words: Word[];
  sentences: Sentence[];
  dialogs: DialogLine[];
  grammar: GrammarRule[];
  quizzes: Quiz[];
  culturalNote?: string;
  culturalNoteAr?: string;
}

export interface UserProgress {
  completedLessons: number[];
  learnedWords: string[];
  quizScores: { [lessonId: number]: number };
  currentLesson: number;
  streak: number;
  lastStudyDate: string;
}

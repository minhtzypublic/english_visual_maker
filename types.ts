
export interface VocabularyItem {
  word: string;
  ipa: string;
}

export interface LessonData {
  topic: string;
  vocabulary: VocabularyItem[];
  level: string;
  style: string;
}

export interface HistoryItem extends Omit<LessonData, 'vocabulary'> {
  id: string;
  imageUrl: string;
  // Fix: Changed `worksheets` to be a partial record, as not all worksheet types may exist for a history item.
  worksheets: Partial<Record<WorksheetType, string>>;
  vocabulary: VocabularyItem[];
}

export interface Illustration {
  id: string;
  word: string;
  imageUrl: string | null;
  isLoading: boolean;
  error: string | null;
}

export type View = 'form' | 'results' | 'history';

export enum ArtStyle {
  Cartoon = 'Cartoon',
  Chibi = 'Chibi',
  Watercolor = 'Watercolor',
  Minimalist = 'Minimalist',
  Realistic = 'Realistic',
}

export enum LearningLevel {
  A1 = 'A1 - Beginner',
  A2 = 'A2 - Elementary',
  B1 = 'B1 - Intermediate',
  B2 = 'B2 - Upper-Intermediate',
}

export enum WorksheetType {
  Matching = 'Matching',
  FillInTheBlanks = 'Fill-in-the-Blanks',
  Crossword = 'Crossword Puzzle',
  SentenceOrdering = 'Sentence Ordering',
}

// --- Crossword Specific Types ---
export interface CrosswordCell {
  letter: string;
  number?: number;
}

export type CrosswordGrid = (CrosswordCell | null)[][];

export interface CrosswordClues {
  across: string[];
  down: string[];
}

export interface CrosswordData {
  grid: CrosswordGrid;
  clues: CrosswordClues;
}

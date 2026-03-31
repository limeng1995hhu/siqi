export type ProblemState = 'pending' | 'correct' | 'error';

export interface QuizQuestion {
  id: number;
  sgf: string;
  type: string;
  question: string;
  options: string;
  correctAnswer: string;
}

export interface ParsedQuestion {
  id: number;
  sgf: string;
  type: string;
  question: string;
  options: { id: number; text: string; correct: boolean }[];
}

export interface TextChoiceOption {
  id: number;
  text: string;
  correct: boolean;
}

export interface TextChoiceProblemProps {
  solveState?: ProblemState;
  initSgf: string;
  question: string;
  options: TextChoiceOption[];
  onSelect?: (optionId: number) => void;
  onStateChange?: (state: ProblemState) => void;
}

// 速成围棋题库类型
export interface SuchengWeiqiRow {
  id: string;
  book: string;
  volume: string;
  chapter: string;
  question_no: string;
  sgf_content: string;
}

export interface SuchengWeiqiQuestion {
  id: number;
  book: string;
  volume: string;
  chapter: string;
  subChapter: string;
  questionNo: string;
  sgfContent: string;
}

export interface DirectoryNode {
  name: string;
  type: 'book' | 'volume' | 'chapter' | 'subChapter' | 'question';
  children?: DirectoryNode[];
  questions?: SuchengWeiqiQuestion[];
  fullPath?: string;
}

// 速成围棋套题会话
export interface SuchengWeiqiSession {
  title: string;
  questions: SuchengWeiqiQuestion[];
}

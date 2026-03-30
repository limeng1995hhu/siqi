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

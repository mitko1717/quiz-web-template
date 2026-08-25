export type DifficultyLevel = 1 | 2 | 3 | 4 | 5;
export type Language = 'en' | 'es' | 'uk';

export enum QuizInputMode {
  MULTIPLE_CHOICE = 'multiple_choice',
  FREE_TEXT = 'free_text'
}

export enum QuestionDirection {
  FORWARD = 'forward',
  REVERSE = 'reverse'
}

export enum QuizContinentScope {
  WORLD = 'world',
  AFRICA = 'africa',
  AMERICAS = 'americas',
  ASIA = 'asia',
  EUROPE = 'europe',
  OCEANIA = 'oceania'
}

export enum HintType {
  REMOVE_OPTION = 'remove_option',
  TEXT_CLUE = 'text_clue'
}

export enum AdaptiveDifficultySuggestion {
  MOVE_UP = 'move_up',
  MOVE_DOWN = 'move_down',
  STAY = 'stay'
}

export type AuthMode = 'guest' | 'localAdmin' | 'google' | 'apple' | 'telegram';

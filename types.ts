
export enum CategoryType {
  ALPHABET = 'Alphabet Fun (p.16)',
  FAMILY = 'My Family (p.18, 22)',
  COLORS = 'Colours (p.24, 30)',
  HOME = 'My Home (p.26, 30, 34)',
  BIRTHDAY = 'My Birthday (p.44)',
  FOOD = 'Yummy Food (p.48)'
}

export interface VocabularyItem {
  id: string;
  word: string;
  translation: string;
  category: CategoryType;
  imageUrl?: string;
  icon?: string;
}

export type AppMode = 'DASHBOARD' | 'STUDY' | 'QUIZ';

export interface QuizQuestion {
  id: string;
  correctItem: VocabularyItem;
  options: string[];
}

export interface Movement {
  id: string;
  type: 'income' | 'expense';
  category: string;
  description?: string;
  amount: number;
  date: Date;
}

export interface MovementFormValue {
  type: 'expense' | 'income';
  amount: number;
  date: string;
  category: string;
  note: string;
}


export interface Category {
  id: string;
  name: string;
  type: CategoryType;
  color: string; // tailwind color class o hex
}

export type CategoryType = 'expense' | 'income';

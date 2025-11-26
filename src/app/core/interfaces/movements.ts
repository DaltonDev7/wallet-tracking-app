export interface Movement {
  id: string;
  userId: string;
  type: MovementType;
  amount: number;       // valor numérico limpio
  date: string;         // YYYY-MM-DD
  categoryId: string;   // ID de la categoría
  note?: string;
  category:any
  description:any
  createdAt: Date;
  updatedAt: Date;
}
export type MovementType = 'income' | 'expense';
/** Lo que se envía desde el formulario para crear un movimiento */
export interface MovementCreateInput {
  type: MovementType;
  amount: number;
  date: string;       // YYYY-MM-DD
  categoryId: string; // ID de categoría seleccionada
  description?: string;
}


export interface MovementView extends Movement {
  categoryName: string;
}


export interface FixedExpense {
  id: string;
  name: string;
  category: string;
  amount: number;
  active: boolean;
  startDate: string;   // 'YYYY-MM' o 'YYYY-MM-01'
  notes?: string;
}


/** Para actualizar un movimiento existente */
export interface MovementUpdateInput {
  type?: MovementType;
  amount?: number;
  date?: string;
  categoryId?: string;
  description?: string;
}

export interface MovementFormValue {
  name: string;              // Nombre del movimiento (Ej: “Supermercado”, “Sueldo”, etc.)
  type: 'income' | 'expense';// Tipo de movimiento
  categoryId: string;        // ID de la categoría seleccionada
  amount: number;            // Monto del movimiento
  date: string;              // Fecha en formato YYYY-MM-DD
  notes?: string;            // Notas opcionales
}


export interface Category {
  id: string;
  name: string;
  type: CategoryType;
  color: string;
  active: boolean;

  userId: string;         // dueño de la categoría
  createdAt?: Date;
  updatedAt?: Date;
}


export type CategoryType = 'expense' | 'income';


export interface FixedIncome {
  id: string;
  name: string;
  category: string;
  amount: number;
  active: boolean;
  startDate: string; // YYYY-MM
  notes?: string;
}



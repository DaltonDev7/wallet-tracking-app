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


export interface BaseIncome {
  id: string;                     // ID único (uuid o Firestore)
  name: string;                   // Nombre: “Sueldo”, “Renta”, “Freelance”, etc.
  category: string;               // Categoría: Sueldo, Freelance, Renta, Otros...
  amount: number;                 // Monto fijo del ingreso
  frequency: 'Mensual' | 'Quincenal' | 'Semanal' | 'Otro';  // Frecuencia del ingreso
  active: boolean;                // Para activar/desactivar ingresos base
  startDate?: string;             // (Opcional) Fecha en que comienza a aplicarse
  endDate?: string;               // (Opcional) Fecha límite (si deja de ser recurrente)
  notes?: string;                 // (Opcional) Notas adicionales
}

import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BaseIncome } from '../../core/interfaces/movements';
import { AddEditIncomeModalComponent } from '../../modals/add-edit-income-modal/add-edit-income-modal.component';

@Component({
  selector: 'app-income',
  standalone: true,
  imports: [CommonModule, FormsModule, AddEditIncomeModalComponent],
  templateUrl: './income.component.html',
  styleUrl: './income.component.scss'
})
export class IncomeComponent {
  // 🔹 Lista de ingresos base (por ahora mock, luego lo conectas a Firebase/tu API)
  baseIncomes: BaseIncome[] = [
    {
      id: '1',
      name: 'Sueldo principal',
      category: 'Sueldo',
      amount: 45000,
      frequency: 'Mensual',
      active: true,
    },
    {
      id: '2',
      name: 'Freelance fijo',
      category: 'Freelance',
      amount: 15000,
      frequency: 'Mensual',
      active: true,
    },
    {
      id: '3',
      name: 'Renta apartamento',
      category: 'Renta',
      amount: 8000,
      frequency: 'Mensual',
      active: false,
    },
  ];

  // 🔹 Mes al que se aplicarán los ingresos base (input type="month")
  selectedMonthToApply: string = this.getCurrentYearMonth();

  // 🔹 Contador de ingresos base activos (para el resumen)
  get activeBaseIncomesCount(): number {
    return this.baseIncomes.filter(i => i.active).length;
  }

  // 🔹 Suma total de los ingresos base activos
  get totalBaseIncome(): number {
    return this.baseIncomes
      .filter(i => i.active)
      .reduce((sum, i) => sum + i.amount, 0);
  }

  constructor() { }

  // Devuelve "YYYY-MM" del mes actual para el input type="month"
  private getCurrentYearMonth(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    return `${year}-${month}`;
  }

  // 👉 Crear un nuevo ingreso base (aquí podrías abrir un modal o navegar a un formulario)
  onAddBaseIncome(): void {
    // TODO: abrir modal / formulario
    console.log('Agregar nuevo ingreso base');

    // Ejemplo rápido para probar:
    const newIncome: BaseIncome = {
      id: crypto.randomUUID?.() ?? Date.now().toString(),
      name: 'Nuevo ingreso',
      category: 'Otro',
      amount: 0,
      frequency: 'Mensual',
      active: true,
    };

    this.baseIncomes = [...this.baseIncomes, newIncome];

    this.incomeBeingEdited = null;
    this.showModal = true;
  }

  // 👉 Editar un ingreso base existente
  onEditBaseIncome(income: BaseIncome): void {
    // TODO: abrir modal con los datos de income
    console.log('Editar ingreso base', income);

    this.incomeBeingEdited = income;
    this.showModal = true;
  }

  // 👉 Eliminar un ingreso base
  onDeleteBaseIncome(income: BaseIncome): void {
    const confirmDelete = confirm(
      `¿Seguro que deseas eliminar el ingreso base "${income.name}"?`
    );
    if (!confirmDelete) return;

    this.baseIncomes = this.baseIncomes.filter(i => i.id !== income.id);
  }

  // 👉 Aplicar los ingresos base al mes seleccionado
  onApplyBaseIncomesToMonth(): void {
    if (!this.selectedMonthToApply) return;

    const [yearStr, monthStr] = this.selectedMonthToApply.split('-');
    const year = Number(yearStr);
    const month = Number(monthStr);

    const activeIncomes = this.baseIncomes.filter(i => i.active);

    // Aquí es donde deberías:
    // - Crear los registros de "movimientos" en tu colección de Firebase
    // - o llamar a tu API para generar los ingresos del mes
    const incomesToApply = activeIncomes.map(i => ({
      baseIncomeId: i.id,
      name: i.name,
      category: i.category,
      amount: i.amount,
      frequency: i.frequency,
      year,
      month,
      createdAt: new Date(),
    }));

    console.log(
      'Aplicando ingresos base al mes:',
      this.selectedMonthToApply,
      incomesToApply
    );

    // TODO: reemplazar esto con la llamada real a tu servicio / Firebase
    // this.incomesService.applyBaseIncomesToMonth(incomesToApply).subscribe(...)
  }






  showModal = false;
  incomeBeingEdited: BaseIncome | null = null;


  onModalClosed() {
    this.showModal = false;
  }

  onIncomeSaved(income: BaseIncome) {
    const exists = this.baseIncomes.some(i => i.id === income.id);

    this.baseIncomes = exists
      ? this.baseIncomes.map(i => (i.id === income.id ? income : i))
      : [...this.baseIncomes, income];

    this.showModal = false;
  }


}

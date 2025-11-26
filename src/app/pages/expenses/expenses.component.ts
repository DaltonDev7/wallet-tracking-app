import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AddEditExpensesModalComponent } from '../../modals/add-edit-expenses-modal/add-edit-expenses-modal.component';
import { FixedExpense } from '../../core/interfaces/movements';
import { ExpensesService } from '../../core/services/expenses.service';
import { ConfirmModalComponent } from '../../modals/confirm-modal/confirm-modal.component';



@Component({
  selector: 'app-expenses',
  standalone: true,
  imports: [CommonModule, FormsModule, AddEditExpensesModalComponent, ConfirmModalComponent],
  templateUrl: './expenses.component.html',
  styleUrl: './expenses.component.scss'
})
export class ExpensesComponent implements OnInit {
  // Lista de gastos fijos
  fixedExpenses: FixedExpense[] = [];
  private fixedExpensesService = inject(ExpensesService);

  // Resumen
  activeFixedExpensesCount = 0;
  totalFixedExpenses = 0;
  showConfirmDelete = false;

  private allFixedExpenses: FixedExpense[] = [];
  expensePendingDelete: FixedExpense | null = null;

  selectedMonthToApply!: string;

  showModal = false;
  expenseBeingEdited: FixedExpense | null = null;

  ngOnInit(): void {


    this.selectedMonthToApply = this.getCurrentMonthForInput();
    this.onApplyFixedExpensesToMonth()
    // this.fixedExpensesService.getUserFixedExpenses$().subscribe(expenses => {
    //   this.fixedExpenses = expenses;
    //   this.recalculateSummary();
    // });

    this.recalculateSummary();
  }


  onMonthChange() {
   this.onApplyFixedExpensesToMonth()
  }

  // Abrir modal para crear nuevo gasto fijo
  onAddFixedExpense(): void {
    this.expenseBeingEdited = null;
    this.showModal = true;
  }

  // Abrir modal para editar un gasto fijo
  onEditFixedExpense(expense: FixedExpense): void {
    // Clonamos para no mutar la fila directamente
    this.expenseBeingEdited = { ...expense };
    this.showModal = true;
  }


  onModalClosed(): void {
    this.showModal = false;
    this.expenseBeingEdited = null;
  }


  async handleConfirmDelete(): Promise<void> {
    if (!this.expensePendingDelete) return;

    const expense = this.expensePendingDelete;

    await this.fixedExpensesService.deleteFixedExpense(expense.id);

    this.expensePendingDelete = null;
    this.showConfirmDelete = false;
    // la suscripción a getUserFixedExpenses$ actualiza la lista sola
  }

  handleCancelDelete(): void {
    this.expensePendingDelete = null;
    this.showConfirmDelete = false;
  }

  async onExpenseSaved(saved: FixedExpense): Promise<void> {
    if (saved.id) {
      // editar
      await this.fixedExpensesService.updateFixedExpense(saved.id, {
        name: saved.name,
        category: saved.category,
        amount: saved.amount,
        active: saved.active,
        startDate: saved.startDate,
        notes: saved.notes,
      });
    } else {
      // crear
      await this.fixedExpensesService.createFixedExpense({
        name: saved.name,
        category: saved.category,
        amount: saved.amount,
        active: saved.active,
        startDate: saved.startDate,
        notes: saved.notes,
        // id lo genera Firestore
      });
    }


    this.showModal = false;
    this.expenseBeingEdited = null;
  }



  confirmDeleteFixedExpense(expense: FixedExpense): void {
    this.expensePendingDelete = expense;
    this.showConfirmDelete = true;
  }

  // Aplicar gastos fijos al mes seleccionado
  onApplyFixedExpensesToMonth(): void {
    console.log(this.selectedMonthToApply)
    if (!this.selectedMonthToApply) return;
    console.log('123')
    this.fixedExpensesService
      .getUserFixedExpensesByMonth$(this.selectedMonthToApply)
      .subscribe(expenses => {
        console.log(expenses)
        this.fixedExpenses = expenses;
        this.recalculateSummary();
      });
  }


  private applyFixedExpensesFilter(): void {
    if (!this.selectedMonthToApply) {
      // Si no hay mes seleccionado, muestra todo
      this.fixedExpenses = [...this.allFixedExpenses];
      this.recalculateSummary();
      return;
    }

    const monthKey = this.selectedMonthToApply; // 'YYYY-MM', viene del <input type="month">

    this.fixedExpenses = this.allFixedExpenses.filter(exp => {
      if (!exp.active) return false;

      // Normalizamos el startDate a 'YYYY-MM'
      const startKey =
        exp.startDate?.length === 7
          ? exp.startDate
          : exp.startDate?.slice(0, 7);

      // Aplica si el gasto empezó en o antes del mes seleccionado
      return !!startKey && startKey <= monthKey;
    });

    this.recalculateSummary();
  }


  // Recalcular resumen (contador activos y total)
  private recalculateSummary(): void {
    const active = this.fixedExpenses.filter(e => e.active);
    this.activeFixedExpensesCount = active.length;
    this.totalFixedExpenses = active.reduce((sum, e) => sum + e.amount, 0);
  }

  // Mes actual en formato yyyy-MM para <input type="month">
  private getCurrentMonthForInput(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }

  // ID simple (en producción usarías el id de Firestore)
  private generateId(): string {
    return Math.random().toString(36).substring(2, 10);
  }
}
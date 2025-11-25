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


  expensePendingDelete: FixedExpense | null = null;

  // Mes al que se aplicarán los gastos fijos (para <input type="month">)
  selectedMonthToApply: string = this.getCurrentMonthForInput();

  // Estado del modal (que todavía no hemos creado)
  showModal = false;
  expenseBeingEdited: FixedExpense | null = null;

  ngOnInit(): void {
    this.fixedExpensesService.getUserFixedExpenses$().subscribe(expenses => {
      this.fixedExpenses = expenses;
      this.recalculateSummary();
    });

    this.recalculateSummary();
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

  // Cerrar modal (sin guardar)
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
    if (!this.selectedMonthToApply) return;
    // aquí luego usarás MovementsService para crear movimientos a partir de los gastos fijos
    console.log('Aplicar gastos fijos al mes:', this.selectedMonthToApply);
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
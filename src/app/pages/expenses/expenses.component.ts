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
  public fixedExpenses: FixedExpense[] = [];
  private fixedExpensesService = inject(ExpensesService);

  // Resumen
  public activeFixedExpensesCount = 0;
  public totalFixedExpenses = 0;
  public showConfirmDelete = false;

  private allFixedExpenses: FixedExpense[] = [];
  public expensePendingDelete: FixedExpense | null = null;

  public selectedMonthToApply!: string;

  public showModal = false;
  public expenseBeingEdited: FixedExpense | null = null;

  ngOnInit(): void {


    this.selectedMonthToApply = this.getCurrentMonthForInput();
    this.onApplyFixedExpensesToMonth()
    this.recalculateSummary();
  }


  onMonthChange() {
   this.onApplyFixedExpensesToMonth()
  }

  onAddFixedExpense(): void {
    this.expenseBeingEdited = null;
    this.showModal = true;
  }


  onEditFixedExpense(expense: FixedExpense): void {

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
  
    this.fixedExpensesService
      .getUserFixedExpensesByMonth$(this.selectedMonthToApply)
      .subscribe(expenses => {
        console.log(expenses)
        this.fixedExpenses = expenses;
        this.recalculateSummary();
      });
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
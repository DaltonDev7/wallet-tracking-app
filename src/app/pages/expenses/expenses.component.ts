import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { DatePickerModule } from 'primeng/datepicker';
import { Subscription } from 'rxjs';
import { AddEditExpensesModalComponent } from '../../modals/add-edit-expenses-modal/add-edit-expenses-modal.component';
import { FixedExpense } from '../../core/interfaces/movements';
import { ExpensesService } from '../../core/services/expenses.service';
import { ConfirmModalComponent } from '../../modals/confirm-modal/confirm-modal.component';
import { CategoryService } from '../../core/services/category.service';

@Component({
  selector: 'app-expenses',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePickerModule, AddEditExpensesModalComponent, ConfirmModalComponent],
  templateUrl: './expenses.component.html',
  styleUrl: './expenses.component.scss'
})
export class ExpensesComponent implements OnInit {

  // Lista de gastos fijos
  private fixedExpensesService = inject(ExpensesService);
  private categoryServices = inject(CategoryService);
  private destroyRef = inject(DestroyRef);
  private expensesSubscription?: Subscription;
  
  // Resumen
  public activeFixedExpensesCount = 0;
  public totalFixedExpenses = 0;
  public showConfirmDelete = false;

  public expensePendingDelete: FixedExpense | null = null;
  public showModal = false;

  public categoriesMap: Record<string, string> = {};
  public fixedExpenses: FixedExpense[] = [];
  public selectedMonthToApply!: string;
  public selectedMonthDate!: Date;
  public expenseBeingEdited: FixedExpense | null = null;

  ngOnInit(): void {

    this.selectedMonthToApply = this.getCurrentMonthForInput();
    this.selectedMonthDate = this.monthKeyToDate(this.selectedMonthToApply);


    this.categoryServices
      .getUserCategories$()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(categories => {
        this.categoriesMap = categories.reduce((acc, c) => {
          acc[c.id] = c.name;
          return acc;
        }, {} as Record<string, string>);

        this.onApplyFixedExpensesToMonth()
      });


    this.recalculateSummary();
  }


  public onMonthChange(value?: Date | null) {
    if (value) {
      this.selectedMonthDate = value;
      this.selectedMonthToApply = this.toMonthKey(value);
    }

    this.onApplyFixedExpensesToMonth()
  }

  public onAddFixedExpense(): void {
    this.expenseBeingEdited = null;
    this.showModal = true;
  }


  public onEditFixedExpense(expense: FixedExpense): void {

    this.expenseBeingEdited = { ...expense };
    this.showModal = true;
  }


  public onModalClosed(): void {
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

    this.expensesSubscription?.unsubscribe();

    this.expensesSubscription = this.fixedExpensesService
      .getUserFixedExpensesByMonth$(this.selectedMonthToApply)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(expenses => {
        this.fixedExpenses = expenses.map(exp => ({
          ...exp,
          category: this.categoriesMap[exp.category] || 'Sin categoría'
        }));

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

  private monthKeyToDate(monthKey: string): Date {
    const [year, month] = monthKey.split('-').map(Number);
    return new Date(year, month - 1, 1);
  }

  private toMonthKey(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }

}

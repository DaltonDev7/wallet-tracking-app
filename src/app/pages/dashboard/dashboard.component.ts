import { CommonModule, CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { Component, DestroyRef, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ChartData, ChartOptions } from 'chart.js';
import { combineLatest, Subscription } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ChartModule } from 'primeng/chart';
import { DatePickerModule } from 'primeng/datepicker';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';

import {
  Category,
  FixedExpense,
  Movement,
  MovementCreateInput,
  MovementView
} from '../../core/interfaces/movements';
import { Combobox } from '../../core/interfaces/combobox';
import { CategoryService } from '../../core/services/category.service';
import { ExpensesService } from '../../core/services/expenses.service';
import { IncomesService } from '../../core/services/incomes.service';
import { MovementsService } from '../../core/services/movement.service';
import { ConfirmModalComponent } from '../../modals/confirm-modal/confirm-modal.component';
import { CreateMovementModalComponent } from '../../modals/create-movement-modal/create-movement-modal.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    DatePipe,
    CurrencyPipe,
    CardModule,
    ButtonModule,
    ChartModule,
    DatePickerModule,
    TagModule,
    InputTextModule,
    SelectModule,
    IconFieldModule,
    InputIconModule,
    CreateMovementModalComponent,
    ConfirmModalComponent
  ],
  providers: [DecimalPipe],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit, OnDestroy {
  private readonly movementsService = inject(MovementsService);
  private readonly categoriesService = inject(CategoryService);
  private readonly incomesService = inject(IncomesService);
  private readonly expensesService = inject(ExpensesService);
  private readonly destroyRef = inject(DestroyRef);

  private summarySubscription?: Subscription;

  public Math = Math;
  readonly isMenuOpen = signal(false);
  readonly isNewMovementOpen = signal(false);
  readonly editingMovement = signal<MovementView | null>(null);

  public categoryMap: Record<string, Category> = {};
  public selectedMonth!: string;
  public selectedMonthDate!: Date;
  public movements: Movement[] = [];
  public filteredMovements: MovementView[] = [];
  public fixedExpensesUser: FixedExpense[] = [];
  public searchTerm = '';
  public selectedCategoryFilter = '';
  public categoryFilterOptions: Combobox<string>[] = [{ label: 'Todas las categorías', value: '' }];

  public totalIncome = 0;
  public totalExpense = 0;
  public remaining = 0;
  public showConfirmDelete = false;
  public movementsPendingDelete: Movement | null = null;

  public pageSize = 10;
  public currentPage = 1;

  readonly months: Combobox<number>[] = [
    { value: 1, label: 'Enero' },
    { value: 2, label: 'Febrero' },
    { value: 3, label: 'Marzo' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Mayo' },
    { value: 6, label: 'Junio' },
    { value: 7, label: 'Julio' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Septiembre' },
    { value: 10, label: 'Octubre' },
    { value: 11, label: 'Noviembre' },
    { value: 12, label: 'Diciembre' }
  ];

  public expenseDoughnutData: ChartData<'doughnut'> = {
    labels: [],
    datasets: []
  };

  readonly expenseDoughnutOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '72%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
          boxWidth: 10,
          padding: 18
        }
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const value = Number(context.raw ?? 0);
            return `${context.label}: ${new Intl.NumberFormat('es-DO', {
              style: 'currency',
              currency: 'DOP',
              maximumFractionDigits: 0
            }).format(value)}`;
          }
        }
      }
    }
  };

  private readonly chartColors = [
    '#2563EB',
    '#0EA5E9',
    '#14B8A6',
    '#22C55E',
    '#8B5CF6',
    '#F97316',
    '#E11D48'
  ];

  ngOnInit(): void {
    this.selectedMonth = this.getCurrentMonth();
    this.selectedMonthDate = this.monthKeyToDate(this.selectedMonth);
    this.loadCategories();
    this.loadSummaryForPeriod();
  }

  ngOnDestroy(): void {
    this.summarySubscription?.unsubscribe();
  }

  public onAddMovement(): void {
    this.editingMovement.set(null);
    this.isNewMovementOpen.set(true);
  }

  public closeModal(): void {
    this.editingMovement.set(null);
    this.isNewMovementOpen.set(false);
  }

  public onPeriodChange(value?: Date | null): void {
    if (value) {
      this.selectedMonthDate = value;
      this.selectedMonth = this.toMonthKey(value);
    }

    this.loadSummaryForPeriod();
  }

  public onSearchChange(): void {
    this.applyFilters();
    this.updateExpenseChart();
  }

  public onCategoryFilterChange(): void {
    this.applyFilters();
    this.updateExpenseChart();
  }

  public movementFilterCategory(): MovementView[] {
    const term = this.searchTerm.trim().toLowerCase();
    const selectedCategory = this.selectedCategoryFilter;

    return this.movements
      .filter((movement) => {
        if (selectedCategory && movement.categoryId !== selectedCategory) {
          return false;
        }

        if (!term) {
          return true;
        }

        const description = String(movement.description ?? '').toLowerCase();
        const categoryName = String(this.categoryMap[movement.categoryId]?.name ?? '').toLowerCase();

        return description.includes(term) || categoryName.includes(term);
      })
      .map((movement) => ({
        ...movement,
        categoryName: this.categoryMap[movement.categoryId]?.name ?? 'Sin categoría'
      }));
  }

  public applyFilters(): void {
    this.filteredMovements = this.movementFilterCategory();
    this.currentPage = 1;
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredMovements.length / this.pageSize));
  }

  get pagedMovements(): MovementView[] {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    return this.filteredMovements.slice(start, end);
  }

  public goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) {
      return;
    }

    this.currentPage = page;
  }

  public nextPage(): void {
    this.goToPage(this.currentPage + 1);
  }

  public prevPage(): void {
    this.goToPage(this.currentPage - 1);
  }

  public onEditMovement(movement: MovementView): void {
    this.editingMovement.set(movement);
    this.isNewMovementOpen.set(true);
  }

  public onDeleteMovement(movement: Movement): void {
    this.movementsPendingDelete = movement;
    this.showConfirmDelete = true;
  }

  public onCloseMovementModal(): void {
    this.editingMovement.set(null);
    this.isNewMovementOpen.set(false);
  }

  public async onSaveMovement(rawValue: {
    id?: string | null;
    type: 'income' | 'expense';
    amount: string | number | null;
    date: string;
    category: string;
    description?: string;
  }): Promise<void> {
    try {
      const amount = this.parseAmount(rawValue.amount);

      if (rawValue.id) {
        await this.movementsService.updateMovement(rawValue.id, {
          type: rawValue.type,
          amount,
          date: rawValue.date,
          categoryId: rawValue.category,
          description: rawValue.description?.trim() || ''
        });
      } else {
        const payload: MovementCreateInput = {
          type: rawValue.type,
          amount,
          date: rawValue.date,
          categoryId: rawValue.category,
          description: rawValue.description?.trim() || ''
        };

        await this.movementsService.createMovement(payload);
      }

      this.editingMovement.set(null);
      this.isNewMovementOpen.set(false);
      this.loadSummaryForPeriod();
    } catch (error) {
      console.error('Error guardando movimiento', error);
    }
  }

  public async handleConfirmDelete(): Promise<void> {
    if (!this.movementsPendingDelete) {
      return;
    }

    await this.movementsService.deleteMovement(this.movementsPendingDelete.id);

    this.movementsPendingDelete = null;
    this.showConfirmDelete = false;
    this.loadSummaryForPeriod();
  }

  public handleCancelDelete(): void {
    this.movementsPendingDelete = null;
    this.showConfirmDelete = false;
  }

  private loadCategories(): void {
    this.categoriesService
      .getUserCategories$()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (categories) => {
          this.categoryMap = categories.reduce<Record<string, Category>>((map, category) => {
            map[category.id] = category;
            return map;
          }, {});
          this.categoryFilterOptions = [
            { label: 'Todas las categorías', value: '' },
            ...categories.map((category) => ({ label: category.name, value: category.id }))
          ];

          this.applyFilters();
          this.updateExpenseChart();
        },
        error: (error) => console.error('Error cargando categorías', error)
      });
  }

  private loadSummaryForPeriod(): void {
    this.summarySubscription?.unsubscribe();

    this.summarySubscription = combineLatest([
      this.incomesService.getUserFixedIncomesByMonth$(this.selectedMonth),
      this.movementsService.getUserMovementsByMonth$(this.selectedMonth),
      this.expensesService.getUserFixedExpensesByMonth$(this.selectedMonth)
    ]).subscribe({
      next: ([fixedIncomes, movements, fixedExpenses]) => {
        this.fixedExpensesUser = fixedExpenses;
        this.movements = movements;
        this.applyFilters();
        this.updateExpenseChart();

        const fixedIncomeTotal = fixedIncomes
          .filter((income) => income.active)
          .reduce((total, income) => total + income.amount, 0);

        const fixedExpenseTotal = fixedExpenses
          .filter((expense) => expense.active)
          .reduce((total, expense) => total + expense.amount, 0);

        const variableIncomeTotal = movements
          .filter((movement) => movement.type === 'income')
          .reduce((total, movement) => total + movement.amount, 0);

        const variableExpenseTotal = movements
          .filter((movement) => movement.type === 'expense')
          .reduce((total, movement) => total + movement.amount, 0);

        this.totalIncome = fixedIncomeTotal + variableIncomeTotal;
        this.totalExpense = fixedExpenseTotal + variableExpenseTotal;
        this.remaining = this.totalIncome - this.totalExpense;
      },
      error: (error) => console.error('Error cargando resumen del dashboard', error)
    });
  }

  private updateExpenseChart(): void {
    const expenses = this.movementFilterCategory().filter((movement) => movement.type === 'expense');
    const activeFixedExpenses = this.fixedExpensesUser.filter((expense) => expense.active);

    if (!expenses.length && !activeFixedExpenses.length) {
      this.expenseDoughnutData = {
        labels: ['Sin datos'],
        datasets: [
          {
            data: [1],
            backgroundColor: ['#CBD5E1'],
            borderWidth: 0
          }
        ]
      };
      return;
    }

    const totalsByCategory = new Map<string, number>();

    for (const movement of expenses) {
      const category = movement.categoryName || 'Sin categoría';
      totalsByCategory.set(category, (totalsByCategory.get(category) ?? 0) + movement.amount);
    }

    for (const expense of activeFixedExpenses) {
      const category = this.categoryMap[expense.category]?.name || 'Sin categoría';
      totalsByCategory.set(category, (totalsByCategory.get(category) ?? 0) + expense.amount);
    }

    const labels = Array.from(totalsByCategory.keys());

    this.expenseDoughnutData = {
      labels,
      datasets: [
        {
          data: labels.map((label) => totalsByCategory.get(label) ?? 0),
          backgroundColor: labels.map((_, index) => this.chartColors[index % this.chartColors.length]),
          borderColor: '#ffffff',
          borderWidth: 3
        }
      ]
    };
  }

  private parseAmount(raw: string | number | null): number {
    if (raw == null) {
      return 0;
    }

    let value = String(raw).trim();
    value = value.replace(/\./g, '');
    value = value.replace(',', '.');

    const amount = Number(value);
    return Number.isNaN(amount) ? 0 : amount;
  }

  private getCurrentMonth(): string {
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

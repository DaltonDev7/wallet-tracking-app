import { CommonModule, CurrencyPipe, DecimalPipe } from '@angular/common';
import { Component, DestroyRef, inject, OnDestroy, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ChartData, ChartOptions } from 'chart.js';
import { combineLatest, map, Observable, Subscription } from 'rxjs';
import { CardModule } from 'primeng/card';
import { ChartModule } from 'primeng/chart';
import { DatePickerModule } from 'primeng/datepicker';
import { SelectModule } from 'primeng/select';

import { Combobox } from '../../core/interfaces/combobox';
import { Category, FixedExpense, FixedIncome, Movement } from '../../core/interfaces/movements';
import { CategoryService } from '../../core/services/category.service';
import { ExpensesService } from '../../core/services/expenses.service';
import { IncomesService } from '../../core/services/incomes.service';
import { MovementsService } from '../../core/services/movement.service';

type MonthSnapshot = {
  monthKey: string;
  monthLabel: string;
  fixedIncomes: FixedIncome[];
  fixedExpenses: FixedExpense[];
  movements: Movement[];
  fixedIncomeTotal: number;
  fixedExpenseTotal: number;
  variableIncomeTotal: number;
  variableExpenseTotal: number;
  totalIncome: number;
  totalExpense: number;
  net: number;
};

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CurrencyPipe,
    DecimalPipe,
    CardModule,
    ChartModule,
    DatePickerModule,
    SelectModule
  ],
  templateUrl: './analytics.component.html',
  styleUrl: './analytics.component.scss'
})
export class AnalyticsComponent implements OnInit, OnDestroy {
  private readonly incomesService = inject(IncomesService);
  private readonly movementsService = inject(MovementsService);
  private readonly expensesService = inject(ExpensesService);
  private readonly categoriesService = inject(CategoryService);
  private readonly destroyRef = inject(DestroyRef);

  private refreshSubscription?: Subscription;
  private categoryMap: Record<string, Category> = {};

  public selectedMonthDate = new Date();
  public monthWindow = 6;

  readonly monthWindowOptions: Combobox<number>[] = [
    { label: 'Últimos 3 meses', value: 3 },
    { label: 'Últimos 6 meses', value: 6 },
    { label: 'Últimos 12 meses', value: 12 }
  ];

  public periodIncomeTotal = 0;
  public periodExpenseTotal = 0;
  public periodNet = 0;
  public savingRate = 0;

  public trendLineData: ChartData<'line'> = { labels: [], datasets: [] };
  public fixedVsVariableData: ChartData<'bar'> = { labels: [], datasets: [] };
  public expenseCategoryDoughnutData: ChartData<'doughnut'> = { labels: [], datasets: [] };
  public topExpenseCategoriesData: ChartData<'bar'> = { labels: [], datasets: [] };

  readonly trendLineOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: { legend: { position: 'bottom' } }
  };

  readonly fixedVsVariableOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom' } },
    scales: {
      x: { stacked: true },
      y: { stacked: true, beginAtZero: true }
    }
  };

  readonly expenseCategoryOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom' } }
  };

  readonly topCategoriesOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y',
    plugins: { legend: { display: false } }
  };

  ngOnInit(): void {
    this.categoriesService
      .getUserCategories$()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((categories) => {
        this.categoryMap = categories.reduce<Record<string, Category>>((map, category) => {
          map[category.id] = category;
          return map;
        }, {});

        this.refreshAnalytics();
      });
  }

  ngOnDestroy(): void {
    this.refreshSubscription?.unsubscribe();
  }

  public onFiltersChange(): void {
    this.refreshAnalytics();
  }

  private refreshAnalytics(): void {
    this.refreshSubscription?.unsubscribe();

    const monthKeys = this.getMonthWindowKeys(this.selectedMonthDate, this.monthWindow);
    const monthlyStreams = monthKeys.map((monthKey) => this.getMonthSnapshot$(monthKey));

    this.refreshSubscription = combineLatest(monthlyStreams).subscribe((snapshots) => {
      this.buildKpis(snapshots);
      this.buildTrendChart(snapshots);
      this.buildFixedVsVariableChart(snapshots);
      this.buildExpenseCategoryChart(snapshots);
      this.buildTopCategoriesChart(snapshots);
    });
  }

  private getMonthSnapshot$(monthKey: string): Observable<MonthSnapshot> {
    return combineLatest([
      this.incomesService.getUserFixedIncomesByMonth$(monthKey),
      this.movementsService.getUserMovementsByMonth$(monthKey),
      this.expensesService.getUserFixedExpensesByMonth$(monthKey)
    ]).pipe(
      map(([fixedIncomes, movements, fixedExpenses]) => {
        const fixedIncomeTotal = fixedIncomes
          .filter((income) => income.active)
          .reduce((sum, income) => sum + income.amount, 0);

        const fixedExpenseTotal = fixedExpenses
          .filter((expense) => expense.active)
          .reduce((sum, expense) => sum + expense.amount, 0);

        const variableIncomeTotal = movements
          .filter((movement) => movement.type === 'income')
          .reduce((sum, movement) => sum + movement.amount, 0);

        const variableExpenseTotal = movements
          .filter((movement) => movement.type === 'expense')
          .reduce((sum, movement) => sum + movement.amount, 0);

        const totalIncome = fixedIncomeTotal + variableIncomeTotal;
        const totalExpense = fixedExpenseTotal + variableExpenseTotal;

        return {
          monthKey,
          monthLabel: this.monthKeyToLabel(monthKey),
          fixedIncomes,
          fixedExpenses,
          movements,
          fixedIncomeTotal,
          fixedExpenseTotal,
          variableIncomeTotal,
          variableExpenseTotal,
          totalIncome,
          totalExpense,
          net: totalIncome - totalExpense
        };
      })
    );
  }

  private buildKpis(snapshots: MonthSnapshot[]): void {
    this.periodIncomeTotal = snapshots.reduce((sum, month) => sum + month.totalIncome, 0);
    this.periodExpenseTotal = snapshots.reduce((sum, month) => sum + month.totalExpense, 0);
    this.periodNet = this.periodIncomeTotal - this.periodExpenseTotal;

    if (this.periodIncomeTotal <= 0) {
      this.savingRate = 0;
      return;
    }

    this.savingRate = (this.periodNet / this.periodIncomeTotal) * 100;
  }

  private buildTrendChart(snapshots: MonthSnapshot[]): void {
    const labels = snapshots.map((month) => month.monthLabel);

    this.trendLineData = {
      labels,
      datasets: [
        {
          label: 'Ingresos',
          data: snapshots.map((month) => month.totalIncome),
          borderColor: '#10B981',
          backgroundColor: 'rgba(16, 185, 129, 0.2)',
          tension: 0.3,
          fill: false
        },
        {
          label: 'Gastos',
          data: snapshots.map((month) => month.totalExpense),
          borderColor: '#EF4444',
          backgroundColor: 'rgba(239, 68, 68, 0.2)',
          tension: 0.3,
          fill: false
        },
        {
          label: 'Balance',
          data: snapshots.map((month) => month.net),
          borderColor: '#3B82F6',
          backgroundColor: 'rgba(59, 130, 246, 0.2)',
          tension: 0.3,
          fill: false
        }
      ]
    };
  }

  private buildFixedVsVariableChart(snapshots: MonthSnapshot[]): void {
    const totals = snapshots.reduce(
      (acc, month) => {
        acc.fixedIncome += month.fixedIncomeTotal;
        acc.variableIncome += month.variableIncomeTotal;
        acc.fixedExpense += month.fixedExpenseTotal;
        acc.variableExpense += month.variableExpenseTotal;
        return acc;
      },
      { fixedIncome: 0, variableIncome: 0, fixedExpense: 0, variableExpense: 0 }
    );

    this.fixedVsVariableData = {
      labels: ['Ingresos', 'Gastos'],
      datasets: [
        {
          label: 'Fijos',
          data: [totals.fixedIncome, totals.fixedExpense],
          backgroundColor: '#6366F1'
        },
        {
          label: 'Variables',
          data: [totals.variableIncome, totals.variableExpense],
          backgroundColor: '#F59E0B'
        }
      ]
    };
  }

  private buildExpenseCategoryChart(snapshots: MonthSnapshot[]): void {
    const categoryTotals = this.buildExpenseCategoryTotals(snapshots);
    const labels = Array.from(categoryTotals.keys());
    const values = labels.map((label) => categoryTotals.get(label) ?? 0);

    if (!labels.length) {
      this.expenseCategoryDoughnutData = {
        labels: ['Sin datos'],
        datasets: [{ data: [1], backgroundColor: ['#CBD5E1'] }]
      };
      return;
    }

    this.expenseCategoryDoughnutData = {
      labels,
      datasets: [
        {
          data: values,
          backgroundColor: this.buildPalette(labels.length)
        }
      ]
    };
  }

  private buildTopCategoriesChart(snapshots: MonthSnapshot[]): void {
    const categoryTotals = this.buildExpenseCategoryTotals(snapshots);
    const sorted = Array.from(categoryTotals.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 7);

    if (!sorted.length) {
      this.topExpenseCategoriesData = {
        labels: ['Sin datos'],
        datasets: [{ data: [0], backgroundColor: ['#CBD5E1'] }]
      };
      return;
    }

    this.topExpenseCategoriesData = {
      labels: sorted.map((item) => item[0]),
      datasets: [
        {
          data: sorted.map((item) => item[1]),
          backgroundColor: '#EF4444'
        }
      ]
    };
  }

  private buildExpenseCategoryTotals(snapshots: MonthSnapshot[]): Map<string, number> {
    const totals = new Map<string, number>();

    for (const month of snapshots) {
      for (const movement of month.movements.filter((item) => item.type === 'expense')) {
        const categoryName = this.categoryMap[movement.categoryId]?.name ?? 'Sin categoría';
        totals.set(categoryName, (totals.get(categoryName) ?? 0) + movement.amount);
      }

      for (const expense of month.fixedExpenses.filter((item) => item.active)) {
        const categoryName = this.categoryMap[expense.category]?.name ?? 'Sin categoría';
        totals.set(categoryName, (totals.get(categoryName) ?? 0) + expense.amount);
      }
    }

    return totals;
  }

  private getMonthWindowKeys(anchorDate: Date, windowSize: number): string[] {
    const keys: string[] = [];
    for (let offset = windowSize - 1; offset >= 0; offset--) {
      const date = new Date(anchorDate.getFullYear(), anchorDate.getMonth() - offset, 1);
      keys.push(this.toMonthKey(date));
    }
    return keys;
  }

  private monthKeyToLabel(monthKey: string): string {
    const [year, month] = monthKey.split('-').map(Number);
    return new Intl.DateTimeFormat('es-DO', { month: 'short', year: '2-digit' }).format(new Date(year, month - 1, 1));
  }

  private toMonthKey(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }

  private buildPalette(size: number): string[] {
    const palette = ['#2563EB', '#0EA5E9', '#14B8A6', '#22C55E', '#F59E0B', '#F97316', '#E11D48', '#8B5CF6'];
    return Array.from({ length: size }, (_, index) => palette[index % palette.length]);
  }
}

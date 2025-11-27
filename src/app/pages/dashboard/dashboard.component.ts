import { CommonModule, DatePipe, CurrencyPipe, DecimalPipe } from '@angular/common';
import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterOutlet } from '@angular/router';
import { Category, Movement, MovementCreateInput, MovementFormValue, MovementView } from '../../core/interfaces/movements';
import { CreateMovementModalComponent } from '../../modals/create-movement-modal/create-movement-modal.component';
import { Combobox } from '../../core/interfaces/combobox';
import { NgChartsModule } from 'ng2-charts';
import { ChartConfiguration, ChartOptions } from 'chart.js';
import { MovementsService } from '../../core/services/movement.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CategoryService } from '../../core/services/category.service';
import { combineLatest } from 'rxjs';
import { IncomesService } from '../../core/services/incomes.service';
import { AnimatedNumberPipe } from '../../core/pipes/animated-number.pipe';
import { ConfirmModalComponent } from '../../modals/confirm-modal/confirm-modal.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DatePipe,
    CurrencyPipe,
    CreateMovementModalComponent,
    NgChartsModule,
    ReactiveFormsModule,
    ConfirmModalComponent
  ],
  providers: [DecimalPipe],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {

  // services
  private movementsService = inject(MovementsService);
  private destroyRef = inject(DestroyRef);
  private movementsServices = inject(MovementsService);
  private categoriesService = inject(CategoryService);
  private incomeServices = inject(IncomesService)
  public Math = Math;
  readonly isMenuOpen = signal(false);
  readonly isNewMovementOpen = signal(false);
  public editingMovement = signal<MovementView | null>(null);
  public years: number[] = [];

  public categoryMap: Record<string, Category> = {};
  public selectedMonth!: string;
  public selectedYear = new Date().getFullYear();

  public movements: Movement[] = [];
  public filteredMovements: MovementView[] = [];

  public searchTerm = '';

  public totalIncome = 0;
  public totalExpense = 0;
  public remaining = this.totalIncome - this.totalExpense;
  public showConfirmDelete = false;

  public movementsPendingDelete: Movement | null = null

  pageSize = 10;
  currentPage = 1;

  months: Combobox<number>[] = [
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
    { value: 12, label: 'Diciembre' },
  ];


  onAddMovement() {
    this.isNewMovementOpen.set(true);
  }

  closeModal() {
    this.isNewMovementOpen.set(false);
  }


  private loadCategories(): void {
    this.categoriesService
      .getUserCategories$()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (cats) => {
          this.categoryMap = {};
          cats.forEach((c) => {
            this.categoryMap[c.id] = c;
          });

          // Si ya hay movimientos cargados, actualizamos el filtro
          this.applyFilters();
        },
        error: (err) => console.error('Error cargando categorías', err),
      });


  }

  private getCurrentMonth(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }


  private loadSummaryForPeriod(): void {

    combineLatest([
      this.incomeServices.getUserFixedIncomesByMonth$(this.selectedMonth),
      this.movementsService.getUserMovementsByMonth$(
        this.selectedMonth
      ),
    ]).subscribe({
      next: (([fixedIncomes, movements]) => {

        this.movements = movements;
        this.applyFilters();

        // 1) Ingresos fijos activos del mes
        const activeFixed = fixedIncomes.filter((i) => i.active);
        const fixedIncomeTotal = activeFixed.reduce(
          (sum, i) => sum + i.amount,
          0
        );

        // 2) Movimientos del mes: ingresos y gastos
        const variableIncomes = movements.filter((m) => m.type === 'income');
        const variableExpenses = movements.filter((m) => m.type === 'expense');

        const variableIncomeTotal = variableIncomes.reduce(
          (sum, m) => sum + m.amount,
          0
        );
        const expenseTotal = variableExpenses.reduce(
          (sum, m) => sum + m.amount,
          0
        );

        // 3) Totales para las cards
        this.totalIncome = fixedIncomeTotal + variableIncomeTotal;
        this.totalExpense = expenseTotal;
        this.remaining = this.totalIncome - this.totalExpense;
      })
    })
  }

  async onSaveMovement(rawValue: any) {
    try {
      const amountNumber = this.parseAmount(rawValue.amount);

      // si viene id => editar, si no => crear
      if (rawValue.id) {
        // EDITAR
        await this.movementsServices.updateMovement(rawValue.id, {
          type: rawValue.type,
          amount: amountNumber,
          date: rawValue.date,
          categoryId: rawValue.category,
          description: rawValue.description?.trim() || '',
        });
      } else {
        // CREAR
        const payload: MovementCreateInput = {
          type: rawValue.type,
          amount: amountNumber,
          date: rawValue.date,
          categoryId: rawValue.category,
          description: rawValue.description?.trim() || '',
        };

        await this.movementsServices.createMovement(payload);
      }

      this.isNewMovementOpen.set(false);
      this.loadMovements(); // refrescar tabla
    } catch (error) {
      console.error('Error guardando movimiento', error);
    }
  }

  private parseAmount(raw: any): number {
    if (raw == null) return 0;

    let str = String(raw).trim();

    // Si estás usando ngx-mask con decimalMarker="," y thousandSeparator=".":
    //  - "12.345,67" => "12345.67"
    // Ajusta esto según tu configuración real:
    str = str.replace(/\./g, '');  // quita separador de miles
    str = str.replace(',', '.');   // usa punto como decimal

    const num = Number(str);
    return isNaN(num) ? 0 : num;
  }


  ngOnInit(): void {
    this.selectedMonth = this.getCurrentMonth();

    this.loadCategories()
    this.loadMovements(); // luego esto leerá de Firestore
    this.loadSummaryForPeriod()
  }


  loadMovements(): void {
    this.movementsService
      .getUserMovementsByMonth$(this.selectedMonth)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (movs) => {
          this.movements = movs;
          this.applyFilters();
          this.updateExpenseChart(); // alimentar la gráfica
        },
        error: (err) => console.error('Error cargando movimientos', err),
      });

  }

  onPeriodChange() {
    this.loadMovements();
    this.loadSummaryForPeriod();
  }

  onSearchChange() {
    this.applyFilters();
  }

  movementFilterCategory(): MovementView[] {
    const term = this.searchTerm.trim().toLowerCase();
    const filtered: MovementView[] = this.movements
      .filter((m) => {
        if (!term) return true;

        const desc = (m.description || '').toLowerCase();
        const categoryName = (this.categoryMap[m.categoryId]?.name || '').toLowerCase();

        return desc.includes(term) || categoryName.includes(term);
      })
      .map((m) => {
        return {
          ...m,
          categoryName: this.categoryMap[m.categoryId]?.name ?? 'Sin categoría',
        }
      })

    return filtered
  }

  applyFilters(): void {

    const filtered = this.movementFilterCategory()

    this.filteredMovements = filtered;

    this.calculateTotals();

    this.currentPage = 1;
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredMovements.length / this.pageSize));
  }

  // Getter para los movimientos de la página actual
  get pagedMovements() {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    return this.filteredMovements.slice(start, end);
  }

  // Navegación de páginas
  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
  }

  nextPage(): void {
    this.goToPage(this.currentPage + 1);
  }

  prevPage(): void {
    this.goToPage(this.currentPage - 1);
  }



  calculateTotals(): void {
    // igual que antes
    const income = this.filteredMovements
      .filter((m) => m.type === 'income')
      .reduce((sum, m) => sum + m.amount, 0);

    const expenses = this.filteredMovements
      .filter((m) => m.type === 'expense')
      .reduce((sum, m) => sum + m.amount, 0);


  }

  onEditMovement(movement: MovementView) {
    this.editingMovement.set(movement);      // modo editar
    this.isNewMovementOpen.set(true);
  }
  onDeleteMovement(movement: Movement) {
    this.movementsPendingDelete = movement;
    this.showConfirmDelete = true;
  }


  onCloseMovementModal() {
    this.isNewMovementOpen.set(false);
  }





  // paleta de colores para las categorías
  private chartColors = [
    '#0EA5E9', // sky-500
    '#22C55E', // emerald-500
    '#F97316', // orange-500
    '#6366F1', // indigo-500
    '#E11D48', // rose-600
    '#14B8A6', // teal-500
    '#A855F7', // purple-500
  ];

  private updateExpenseChart(): void {
    // 1) Tomamos solo los gastos del mes actual / seleccionado
    let movements = this.movementFilterCategory();
    const expenses = movements.filter((m) => m.type === 'expense');

    if (!expenses.length) {
      // Si no hay gastos, dejamos la gráfica vacía o con un label genérico
      this.expenseDoughnutData = {
        labels: ['Sin datos'],
        datasets: [
          {
            data: [1],
            backgroundColor: ['#E5E7EB'], // gray-200
            borderWidth: 0,
          },
        ],
      };
      return;
    }

    // 2) Agrupamos por categoría
    const totalsByCategory = new Map<string, number>();

    for (const m of expenses) {
      const key = m.categoryName || 'Sin categoría';
      const prev = totalsByCategory.get(key) ?? 0;
      totalsByCategory.set(key, prev + m.amount);
    }

    // 3) Construimos labels y data
    const labels = Array.from(totalsByCategory.keys());
    const data = labels.map((label) => totalsByCategory.get(label) ?? 0);

    // 4) Asignamos colores (reutilizamos la paleta si hay más categorías)
    const backgroundColor = labels.map(
      (_label, index) => this.chartColors[index % this.chartColors.length]
    );

    // 5) Creamos un NUEVO objeto para que la gráfica se actualice
    this.expenseDoughnutData = {
      labels,
      datasets: [
        {
          data,
          backgroundColor,
          borderWidth: 0,
        },
      ],
    };
  }



  // --------- DATA DUMMY PARA GRÁFICAS ----------

  // Distribución de gastos por categoría (solo gastos)
  expenseDoughnutData: ChartConfiguration<'doughnut'>['data'] = {
    labels: [],
    datasets: [],
  };

  expenseDoughnutOptions: ChartOptions<'doughnut'> = {

  };


  async handleConfirmDelete(): Promise<void> {
    if (!this.movementsPendingDelete) return;

    const expense = this.movementsPendingDelete;

    await this.movementsServices.deleteMovement(expense.id);

    this.movementsPendingDelete = null;
    this.showConfirmDelete = false;
    this.loadSummaryForPeriod()
  }

  handleCancelDelete(): void {
    this.movementsPendingDelete = null;
    this.showConfirmDelete = false;
  }

}
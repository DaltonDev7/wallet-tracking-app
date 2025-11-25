import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterOutlet } from '@angular/router';
import { Category, Movement, MovementCreateInput, MovementFormValue, MovementView } from '../../core/interfaces/movements';
import { CreateMovementModalComponent } from '../../modals/create-movement-modal/create-movement-modal.component';
import { Combobox } from '../../core/interfaces/combobox';
import { NgChartsModule } from 'ng2-charts';
import { ChartConfiguration, ChartOptions } from 'chart.js';
import { MovementsService } from '../../core/services/movement.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CategoryService } from '../../core/services/category.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe, CurrencyPipe, CreateMovementModalComponent, NgChartsModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {

  // services
  private movementsService = inject(MovementsService);
  private destroyRef = inject(DestroyRef);
  private movementsServices = inject(MovementsService);
  private categoriesService = inject(CategoryService);

  readonly isMenuOpen = signal(false);
  readonly isNewMovementOpen = signal(false);
  editingMovement = signal<MovementView | null>(null);
  public years: number[] = [];

  public categoryMap: Record<string, Category> = {};
  public selectedMonth = new Date().getMonth();
  public selectedYear = new Date().getFullYear();

  public movements: Movement[] = [];
  public filteredMovements: MovementView[] = [];

  public searchTerm = '';

  months: Combobox<string>[] = [
    { value: 'Enero', label: 'Enero' },
    { value: 'Febrero', label: 'Febrero' },
    { value: 'Marzo', label: 'Marzo' },
    { value: 'Abril', label: 'Abril' },
    { value: 'Mayo', label: 'Mayo' },
    { value: 'Junio', label: 'Junio' },
    { value: 'Julio', label: 'Julio' },
    { value: 'Agosto', label: 'Agosto' },
    { value: 'Septiembre', label: 'Septiembre' },
    { value: 'Octubre', label: 'Octubre' },
    { value: 'Noviembre', label: 'Noviembre' },
    { value: 'Diciembre', label: 'Diciembre' },
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
          console.log(this.categoryMap)
          this.applyFilters();
        },
        error: (err) => console.error('Error cargando categorías', err),
      });


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
    this.initYears();
    this.loadCategories()
    this.loadMovements(); // luego esto leerá de Firestore

  }

  initYears() {
    const currentYear = new Date().getFullYear();
    this.years = [currentYear - 1, currentYear, currentYear + 1];
  }

  loadMovements(): void {
    this.movementsService
      .getUserMovementsByMonth$(this.selectedYear, this.selectedMonth)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (movs) => {
          this.movements = movs;
          this.applyFilters();
        },
        error: (err) => console.error('Error cargando movimientos', err),
      });

  }

  onPeriodChange() {
    this.loadMovements();
  }

  onSearchChange() {
    this.applyFilters();
  }

  applyFilters(): void {
    const term = this.searchTerm.trim().toLowerCase();
    console.log(this.movements)
    const filtered: MovementView[] = this.movements
      .filter((m) => {
        if (!term) return true;

        const desc = (m.description || '').toLowerCase();
        const categoryName = (this.categoryMap[m.categoryId]?.name || '').toLowerCase();

        return desc.includes(term) || categoryName.includes(term);
      })
      .map((m) => {
        console.log(m)
        console.log(this.categoryMap[m.categoryId])
        return {
          ...m,
          categoryName: this.categoryMap[m.categoryId]?.name ?? 'Sin categoría',
        }
      })
    // .map((m) => ({
    //   ...m,
    //   categoryName: this.categoryMap[m.categoryId]?.name ?? 'Sin categoría',
    // }));

    this.filteredMovements = filtered;
    console.log(this.filteredMovements)
    this.calculateTotals();
  }



  calculateTotals(): void {
    // igual que antes
    const income = this.filteredMovements
      .filter((m) => m.type === 'income')
      .reduce((sum, m) => sum + m.amount, 0);

    const expenses = this.filteredMovements
      .filter((m) => m.type === 'expense')
      .reduce((sum, m) => sum + m.amount, 0);

    console.log({ income, expenses });
  }

  onEditMovement(movement: MovementView) {
    this.editingMovement.set(movement);      // modo editar
    this.isNewMovementOpen.set(true);
  }
  onDeleteMovement(movement: Movement) {
    // abrir modal de confirmación y borrar en Firebase
  }


  onCloseMovementModal() {
    this.isNewMovementOpen.set(false);
  }





  totalIncome = 35000;
  totalExpense = 21000;
  remaining = this.totalIncome - this.totalExpense;


  // --------- DATA DUMMY PARA GRÁFICAS ----------

  // Distribución de gastos por categoría (solo gastos)
  expenseDoughnutData: ChartConfiguration<'doughnut'>['data'] = {
    labels: ['Comida', 'Transporte', 'Servicios', 'Ocio', 'Otros'],
    datasets: [
      {
        data: [8000, 3000, 4000, 2000, 4000], // RD$ por categoría
        backgroundColor: [
          '#0EA5E9', // sky-500
          '#22C55E', // emerald-500
          '#F97316', // orange-500
          '#6366F1', // indigo-500
          '#E11D48', // rose-600
        ],
        borderWidth: 0,
      },
    ],
  };

  expenseDoughnutOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    cutout: '60%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          font: { size: 11 },
        },
      },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const value = ctx.parsed;
            const total = (ctx.dataset.data as number[]).reduce(
              (acc, n) => acc + n,
              0
            );
            const percent = ((value / total) * 100).toFixed(1);
            const label = ctx.label || 'Categoría';
            return `${label}: RD$ ${value.toLocaleString()} (${percent}%)`;
          },
        },
      },
    },
  };

  // Ingresos vs. gastos por categoría (ejemplo)
  incomeExpenseBarData: ChartConfiguration<'bar'>['data'] = {
    labels: ['Salario', 'Freelance', 'Otros'],
    datasets: [
      {
        label: 'Ingresos',
        data: [25000, 8000, 2000],
        backgroundColor: '#22C55E', // emerald-500
      },
      {
        label: 'Gastos',
        data: [12000, 2000, 7000],
        backgroundColor: '#E11D48', // rose-600
      },
    ],
  };

  incomeExpenseBarOptions: ChartOptions<'bar'> = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { font: { size: 11 } },
      },
    },
    scales: {
      x: {
        ticks: { font: { size: 11 } },
      },
      y: {
        ticks: {
          font: { size: 11 },
          callback: (value) => 'RD$ ' + value,
        },
      },
    },
  };

}
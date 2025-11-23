import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterOutlet } from '@angular/router';
import { Movement, MovementFormValue } from '../../core/interfaces/movements';
import { CreateMovementModalComponent } from '../../modals/create-movement-modal/create-movement-modal.component';
import { Combobox } from '../../core/interfaces/combobox';
import { NgChartsModule } from 'ng2-charts';
import { ChartConfiguration, ChartOptions } from 'chart.js';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe, CurrencyPipe, CreateMovementModalComponent, NgChartsModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {


  readonly isMenuOpen = signal(false);
  readonly isNewMovementOpen = signal(false);




  onAddMovement() {
    this.isNewMovementOpen.set(true);
    console.log('asd')
  }

  closeModal() {
    this.isNewMovementOpen.set(false);
  }

  handleSave(movement: MovementFormValue) {
    console.log('Nuevo movimiento guardado:', movement);
    // Aquí luego:
    // - llamas a tu servicio para guardarlo en Firestore
    // - actualizas lista en pantalla
    this.isNewMovementOpen.set(false);
  }



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


  years: number[] = [];

  selectedMonth = new Date().getMonth();
  selectedYear = new Date().getFullYear();

  movements: Movement[] = [];        // aquí luego vienen los datos de Firebase
  filteredMovements: Movement[] = [];

  // totalIncome = 0;
  // totalExpense = 0;
  // remaining = 0;

  searchTerm = '';

  ngOnInit(): void {
    this.initYears();
    this.loadMovements(); // luego esto leerá de Firestore
  }

  initYears() {
    const currentYear = new Date().getFullYear();
    this.years = [currentYear - 1, currentYear, currentYear + 1];
  }

  loadMovements() {
    // TODO: cargar desde Firebase para el mes/año seleccionados
    // De momento, podrías simular datos.
    this.applyFilters();
  }

  onPeriodChange() {
    this.loadMovements();
  }

  onSearchChange() {
    this.applyFilters();
  }

  applyFilters() {
    // Filtrar por mes, año y búsqueda
    const filtered = this.movements.filter(m => {
      const d = new Date(m.date);
      const sameMonth = d.getMonth() === this.selectedMonth;
      const sameYear = d.getFullYear() === this.selectedYear;
      const matchesPeriod = sameMonth && sameYear;

      const matchesSearch = this.searchTerm
        ? (m.description || '').toLowerCase().includes(this.searchTerm.toLowerCase())
        : true;

      return matchesPeriod && matchesSearch;
    });

    this.filteredMovements = filtered;
    this.calculateTotals();
  }

  calculateTotals() {
    this.totalIncome = this.filteredMovements
      .filter(m => m.type === 'income')
      .reduce((sum, m) => sum + m.amount, 0);

    this.totalExpense = this.filteredMovements
      .filter(m => m.type === 'expense')
      .reduce((sum, m) => sum + m.amount, 0);

    this.remaining = this.totalIncome - this.totalExpense;
  }

  onEditMovement(movement: Movement) {
    // navegar a /movements/:id
  }

  onDeleteMovement(movement: Movement) {
    // abrir modal de confirmación y borrar en Firebase
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
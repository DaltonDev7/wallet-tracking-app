import { CommonModule } from '@angular/common';
import { Component, DestroyRef, EventEmitter, inject, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { NgxMaskDirective } from 'ngx-mask';
import { DatePickerModule } from 'primeng/datepicker';
import { Category, FixedExpense } from '../../core/interfaces/movements';
import { CategoryService } from '../../core/services/category.service';
import { Combobox } from '../../core/interfaces/combobox';





@Component({
  selector: 'app-add-edit-expenses-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgxMaskDirective, DatePickerModule],
  templateUrl: './add-edit-expenses-modal.component.html',
  styleUrl: './add-edit-expenses-modal.component.scss'
})
export class AddEditExpensesModalComponent implements OnInit, OnChanges {
  @Input() expense: FixedExpense | null = null;

  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<FixedExpense>();

  public categoryServices = inject(CategoryService)
  private destroyRef = inject(DestroyRef);
  public categoryList: Combobox<string>[] = []

  form!: FormGroup;

  get isEditMode(): boolean {
    return !!this.expense;
  }

  constructor(private fb: FormBuilder) { }

  ngOnInit(): void {
    this.buildForm();
    if (this.expense) {
      this.patchForm(this.expense);
    }

    // 1. Suscribirse a las categorías del usuario
    this.categoryServices
      .getUserCategories$()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((cats) => {

        const categoryMapper = cats.filter((category) => category.type === "expense").map((category) => {
          return {
            label: category.name, // lo que se muestra
            value: category.id,   // lo que se guarda en el form
          }
        })

        this.categoryList = categoryMapper
      });

  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['expense'] && this.form) {
      if (this.expense) {
        this.patchForm(this.expense);
      } else {
        this.form.reset(this.getDefaultFormValue());
      }
    }
  }

  private buildForm(): void {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(100)]],
      startDate: [this.monthKeyToDate(this.getCurrentMonthForInput()), [Validators.required]],
      active: [true],
      amount: [null, [Validators.required, Validators.min(0)]],
      notes: [''],
      category: ['', [Validators.required]]
    });
  }

  private patchForm(expense: FixedExpense): void {
    this.form.patchValue({
      name: expense.name,
      startDate: this.monthKeyToDate(expense.startDate),
      active: expense.active,
      amount: expense.amount,
      notes: expense.notes ?? '',
      category: expense.category,
    });
  }

  private getDefaultFormValue() {
    return {
      name: '',
      startDate: this.monthKeyToDate(this.getCurrentMonthForInput()),
      active: true,
      amount: null,
      notes: '',
      category: '',
    };
  }

  hasError(controlName: string, errorCode: string): boolean {
    const control = this.form.get(controlName);
    return !!control && control.touched && control.hasError(errorCode);
  }

  onClose(): void {
    this.closed.emit();
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.value;

    const amountNumber = this.parseAmount(raw.amount);

    const payload: FixedExpense = {
      id: this.expense?.id ?? '',
      name: raw.name.trim(),
      category: raw.category ?? '', // si después agregas categoría en el modal, la mapearás aquí
      amount: amountNumber,
      active: raw.active ?? true,
      startDate: this.toMonthKey(raw.startDate),
      notes: raw.notes?.trim() || '',
    };

    this.saved.emit(payload);
  }

  /** Convierte lo que viene del input/mask en número */
  private parseAmount(raw: any): number {
    if (raw == null) return 0;

    let str = String(raw).trim();

    // Si estás usando ngx-mask con separator.2 y estilo "1,000.00" o "1.000,00",
    // limpia separadores de miles y normaliza el decimal.
    str = str.replace(/\./g, ''); // quita puntos (miles)
    str = str.replace(',', '.');  // coma -> punto decimal

    const num = Number(str);
    return isNaN(num) ? 0 : num;
  }

  private getCurrentMonthForInput(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }

  private monthKeyToDate(monthKey: string): Date {
    const normalized = monthKey.length === 7 ? monthKey : monthKey.slice(0, 7);
    const [year, month] = normalized.split('-').map(Number);
    return new Date(year, month - 1, 1);
  }

  private toMonthKey(value: Date | string): string {
    if (value instanceof Date) {
      const year = value.getFullYear();
      const month = String(value.getMonth() + 1).padStart(2, '0');
      return `${year}-${month}`;
    }

    return value.length === 7 ? value : value.slice(0, 7);
  }
}

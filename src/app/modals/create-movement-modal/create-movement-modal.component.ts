import { CommonModule } from '@angular/common';
import { Component, DestroyRef, EventEmitter, inject, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgxMaskDirective } from 'ngx-mask';
import { DatePickerModule } from 'primeng/datepicker';

import { Combobox } from '../../core/interfaces/combobox';
import { Category, MovementView } from '../../core/interfaces/movements';
import { CategoryService } from '../../core/services/category.service';

@Component({
  selector: 'app-create-movement-modal',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, NgxMaskDirective, DatePickerModule],
  templateUrl: './create-movement-modal.component.html',
  styleUrl: './create-movement-modal.component.scss'
})
export class CreateMovementModalComponent implements OnInit, OnChanges {
  @Input() open = false;
  @Input() initialMovement: MovementView | null = null;

  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<{
    id?: string | null;
    type: 'income' | 'expense';
    amount: string | number | null;
    date: string;
    category: string;
    description?: string;
  }>();

  private readonly fb = inject(FormBuilder);
  private readonly categoriesService = inject(CategoryService);
  private readonly destroyRef = inject(DestroyRef);

  readonly form: FormGroup = this.fb.group({
    type: ['expense', Validators.required],
    amount: [null, [Validators.required, Validators.min(1)]],
    date: [new Date(), Validators.required],
    category: ['', Validators.required],
    description: ['']
  });

  private allCategories: Category[] = [];
  categories: Combobox<string>[] = [];

  get isEditMode(): boolean {
    return !!this.initialMovement;
  }

  ngOnInit(): void {
    this.categoriesService
      .getUserCategories$()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((categories) => {
        this.allCategories = categories;
        this.updateCategoryOptions();
      });

    this.form
      .get('type')!
      .valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.updateCategoryOptions();
        this.form.get('category')!.setValue('');
      });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['initialMovement']) {
      return;
    }

    if (this.initialMovement) {
      this.form.patchValue({
        type: this.initialMovement.type,
        amount: this.initialMovement.amount,
        date: this.dateKeyToDate(this.initialMovement.date),
        category: this.initialMovement.categoryId,
        description: this.initialMovement.description || ''
      });
      return;
    }

    this.form.reset({
      type: 'expense',
      amount: null,
      date: new Date(),
      category: '',
      description: ''
    });
  }

  handleClose(): void {
    this.form.reset();
    this.close.emit();
  }

  handleSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.save.emit({
      ...this.form.getRawValue(),
      date: this.toDateKey(this.form.get('date')?.value),
      id: this.initialMovement?.id ?? null
    });

    if (!this.isEditMode) {
      this.form.reset({
        type: 'expense',
        amount: null,
        date: new Date(),
        category: '',
        description: ''
      });
    }
  }

  private updateCategoryOptions(): void {
    const currentType = this.form.get('type')!.value as 'income' | 'expense';

    this.categories = this.allCategories
      .filter((category) => category.type === currentType)
      .map((category) => ({
        label: category.name,
        value: category.id
      }));
  }

  private dateKeyToDate(dateKey: string): Date {
    const [year, month, day] = dateKey.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  private toDateKey(value: Date | string): string {
    if (value instanceof Date) {
      const year = value.getFullYear();
      const month = String(value.getMonth() + 1).padStart(2, '0');
      const day = String(value.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }

    return value;
  }
}

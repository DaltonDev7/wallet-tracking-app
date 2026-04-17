import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NgxMaskDirective } from 'ngx-mask';
import { DatePickerModule } from 'primeng/datepicker';
import { FixedIncome } from '../../core/interfaces/movements';

@Component({
  selector: 'app-add-edit-income-modal',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, NgxMaskDirective, DatePickerModule],
  templateUrl: './add-edit-income-modal.component.html',
  styleUrl: './add-edit-income-modal.component.scss'
})
export class AddEditIncomeModalComponent implements OnInit {
  @Input() income: FixedIncome | null = null;          // null => crear, no null => editar
  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<FixedIncome>();

  form!: FormGroup;

  get isEditMode(): boolean {
    return !!this.income;
  }

  constructor(private fb: FormBuilder) { }

  ngOnInit(): void {
    this.form = this.fb.group({
      name: [this.income?.name ?? '', [Validators.required, Validators.maxLength(100)]],
      amount: [this.income?.amount ?? null, [Validators.required, Validators.min(0)]],
      active: [this.income?.active ?? true],
      notes: [this.income?.notes ?? ''],
      startDate: [
        this.monthKeyToDate(this.income?.startDate ?? this.getCurrentYearMonth()),
        [Validators.required],
      ],
    });

  }

  onClose(): void {
    this.closed.emit();
  }

  private getCurrentYearMonth(): string {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`; // "2025-11"
  }


  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.value;

    const result: FixedIncome = {
      id: this.income?.id ?? '',
      name: raw.name.trim(),
      amount: Number(raw.amount),
      active: raw.active,
      notes: raw.notes?.trim() || '',
      startDate: this.toMonthKey(raw.startDate),
      // endDate: raw.endDate,
    };

    this.saved.emit(result);
  }

  // Helpers para validación en template
  hasError(controlName: string, error: string): boolean {
    const ctrl = this.form.get(controlName);
    return !!ctrl && ctrl.touched && ctrl.hasError(error);
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

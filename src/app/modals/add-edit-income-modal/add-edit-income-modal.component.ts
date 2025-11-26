import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NgxMaskDirective } from 'ngx-mask';
import { FixedIncome } from '../../core/interfaces/movements';

@Component({
  selector: 'app-add-edit-income-modal',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, NgxMaskDirective],
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
        this.income?.startDate ?? this.getCurrentYearMonth(),
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

    const id =
      this.income?.id ||
      (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString());

    const result: FixedIncome = {
      id,
      name: raw.name.trim(),
      category: raw.category,
      amount: Number(raw.amount),
      active: raw.active,
      notes: raw.notes?.trim() || '',
      startDate: raw.startDate,
      // endDate: raw.endDate,
    };

    this.saved.emit(result);
  }

  // Helpers para validación en template
  hasError(controlName: string, error: string): boolean {
    const ctrl = this.form.get(controlName);
    return !!ctrl && ctrl.touched && ctrl.hasError(error);
  }

}
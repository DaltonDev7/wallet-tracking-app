import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Category, CategoryType } from '../../core/interfaces/movements';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-add-edit-category-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './add-edit-category-modal.component.html',
  styleUrl: './add-edit-category-modal.component.scss'
})
export class AddEditCategoryModalComponent implements OnChanges {
  @Input() open = false;
  @Input() mode: 'create' | 'edit' = 'create';
  @Input() initialCategory: Category | null = null;

  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<Omit<Category, 'id'>>();

  form: FormGroup;

  typeOptions: { value: CategoryType; label: string }[] = [
    { value: 'expense', label: 'Gasto' },
    { value: 'income', label: 'Ingreso' },
  ];

  colorOptions = [
    { value: '#f97373', label: 'Rojo suave' },
    { value: '#34d399', label: 'Verde suave' },
    { value: '#60a5fa', label: 'Azul' },
    { value: '#fbbf24', label: 'Amarillo' },
    { value: '#a855f7', label: 'Morado' },
  ];

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(30)]],
      type: ['expense', Validators.required],
      color: ['#f97373', Validators.required],
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['initialCategory'] && this.initialCategory) {
      this.form.patchValue({
        name: this.initialCategory.name,
        type: this.initialCategory.type,
        color: this.initialCategory.color,
      });
    }

    if (changes['mode'] && this.mode === 'create' && !this.initialCategory) {
      this.form.reset({
        name: '',
        type: 'expense',
        color: '#f97373',
      });
    }
  }

  handleClose() {
    this.close.emit();
  }

  handleSubmit() {
    if (this.form.invalid) return;
    this.save.emit(this.form.value as Omit<Category, 'id'>);

    if (this.mode === 'create') {
      this.form.reset({
        name: '',
        type: 'expense',
        color: '#f97373',
      });
    }
  }
}
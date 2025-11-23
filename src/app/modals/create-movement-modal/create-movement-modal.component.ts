import { Component, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MovementFormValue } from '../../core/interfaces/movements';
import { CommonModule } from '@angular/common';
import { NgxMaskDirective, NgxMaskPipe } from 'ngx-mask';

@Component({
  selector: 'app-create-movement-modal',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule,  NgxMaskDirective,
    NgxMaskPipe],
  templateUrl: './create-movement-modal.component.html',
  styleUrl: './create-movement-modal.component.scss'
})
export class CreateMovementModalComponent {
  @Input() open = false;
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<MovementFormValue>();

  form: FormGroup;

  categories = [
    { value: 'food', label: 'Comida' },
    { value: 'transport', label: 'Transporte' },
    { value: 'services', label: 'Servicios' },
    { value: 'leisure', label: 'Ocio' },
    { value: 'other', label: 'Otros' },
  ];

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      type: ['expense', Validators.required],
      amount: [null, [Validators.required, Validators.min(1)]],
      date: [new Date().toISOString().substring(0, 10), Validators.required],
      category: ['', Validators.required],
      note: [''],
    });
  }

  handleClose() {
    this.form.reset()
    this.close.emit();
  }

  handleSubmit() {
    if (this.form.invalid) return;
    this.save.emit(this.form.value as MovementFormValue);
    this.form.reset({
      type: 'expense',
      date: new Date().toISOString().substring(0, 10),
    });
  }
}

import { Component, DestroyRef, EventEmitter, HostListener, inject, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Category, MovementFormValue, MovementView } from '../../core/interfaces/movements';
import { CommonModule } from '@angular/common';
import { NgxMaskDirective, NgxMaskPipe } from 'ngx-mask';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CategoryService } from '../../core/services/category.service';
import { Combobox } from '../../core/interfaces/combobox';
import { MovementsService } from '../../core/services/movement.service';

@Component({
  selector: 'app-create-movement-modal',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, NgxMaskDirective],
  templateUrl: './create-movement-modal.component.html',
  styleUrl: './create-movement-modal.component.scss'
})
export class CreateMovementModalComponent implements OnInit, OnChanges {

  @Input() open = false;
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<{
    name: string;
    type: 'income' | 'expense';
    color: string;
    active: boolean;
  }>();
  // 🔹 cuando es editar, aquí viene el movimiento
  @Input() initialMovement: MovementView | null = null;

  private fb = inject(FormBuilder);
  private categoriesService = inject(CategoryService);
  private destroyRef = inject(DestroyRef);

  form: FormGroup;
  private allCategories: Category[] = [];

  /** Lista lista para el combobox */
  categories: Combobox<string>[] = [];

  constructor(private movementsService: MovementsService) {
    this.form = this.fb.group({
      type: ['expense', Validators.required],
      amount: [null, [Validators.required, Validators.min(1)]],
      date: [new Date().toISOString().substring(0, 10), Validators.required],
      category: ['', Validators.required],
      description: [''],
    });
  }

  get isEditMode(): boolean {
    return !!this.initialMovement;
  }


  ngOnChanges(changes: SimpleChanges): void {
    if (changes['initialMovement']) {
      if (this.initialMovement) {
        // 🔹 MODO EDITAR: llenar el formulario con el movimiento
        this.form.patchValue({
          type: this.initialMovement.type,
          amount: this.initialMovement.amount,        // si usas mask, aquí ya se verá
          date: this.initialMovement.date,
          category: this.initialMovement.categoryId,  // muy importante
          description: this.initialMovement.description || '',
        });
      } else {
        // 🔹 MODO NUEVO: reset a valores por defecto
        this.form.reset({
          type: 'expense',
          amount: null,
          date: new Date().toISOString().substring(0, 10),
          category: '',
          description: '',
        });
      }
    }
  }

  ngOnInit(): void {
    // 1. Suscribirse a las categorías del usuario
    this.categoriesService
      .getUserCategories$()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((cats) => {

        this.allCategories = cats;
        this.updateCategoryOptions();
      });

    // 2. Escuchar cambios en el tipo (income/expense) para filtrar categorías
    this.form
      .get('type')!
      .valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.updateCategoryOptions();
        // si cambias el tipo, resetear la categoría seleccionada
        this.form.get('category')!.setValue('');
      });
  }


  private updateCategoryOptions(): void {
    const currentType = this.form.get('type')!.value as 'income' | 'expense';

    this.categories = this.allCategories
      .filter((c) => c.type === currentType)
      .map((c) => ({
        label: c.name, // lo que se muestra
        value: c.id,   // lo que se guarda en el form
      }));
  }

  handleClose() {
    this.form.reset()
    this.close.emit();
  }

  handleSubmit() {
    if (this.form.invalid) return;

    const value = this.form.value;

    const payload = {
      ...value,
      id: this.initialMovement?.id ?? null, // 👈 clave para saber si editar o crear
    };

    this.save.emit(payload);

    // si quieres que al cerrar después de crear vuelva limpio:
    if (!this.isEditMode) {
      this.form.reset({
        type: 'expense',
        date: new Date().toISOString().substring(0, 10),
      });
    }
  }
}

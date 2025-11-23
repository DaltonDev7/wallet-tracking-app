import { Component, signal } from '@angular/core';
import { Category } from '../../core/interfaces/movements';
import { CommonModule } from '@angular/common';
import { AddEditCategoryModalComponent } from '../../modals/add-edit-category-modal/add-edit-category-modal.component';

@Component({
  selector: 'app-category',
  standalone: true,
  imports: [CommonModule, AddEditCategoryModalComponent],
  templateUrl: './category.component.html',
  styleUrl: './category.component.scss'
})
export class CategoryComponent {
  readonly categories = signal<Category[]>([
    { id: '1', name: 'Comida', type: 'expense', color: '#f97373' },
    { id: '2', name: 'Transporte', type: 'expense', color: '#60a5fa' },
    { id: '3', name: 'Salario', type: 'income', color: '#34d399' },
  ]);

  readonly modalOpen = signal(false);
  readonly modalMode = signal<'create' | 'edit'>('create');
  readonly editingCategory = signal<Category | null>(null);

  openCreate() {
    this.modalMode.set('create');
    this.editingCategory.set(null);
    this.modalOpen.set(true);
  }

  openEdit(cat: Category) {
    this.modalMode.set('edit');
    this.editingCategory.set(cat);
    this.modalOpen.set(true);
  }

  closeModal() {
    this.modalOpen.set(false);
  }

  saveCategory(data: Omit<Category, 'id'>) {
    if (this.modalMode() === 'create') {
      const newCategory: Category = {
        id: crypto.randomUUID(),
        ...data,
      };
      this.categories.update((cats) => [...cats, newCategory]);
    } else {
      const current = this.editingCategory();
      if (!current) return;
      this.categories.update((cats) =>
        cats.map((c) => (c.id === current.id ? { ...current, ...data } : c)),
      );
    }

    this.modalOpen.set(false);
  }

  deleteCategory(cat: Category) {
    const ok = confirm(`¿Eliminar la categoría "${cat.name}"? Esta acción no se puede deshacer.`);
    if (!ok) return;

    this.categories.update((cats) => cats.filter((c) => c.id !== cat.id));
  }
}

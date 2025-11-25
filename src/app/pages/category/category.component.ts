import { Component, effect, inject, OnInit, Signal, signal } from '@angular/core';
import { Category } from '../../core/interfaces/movements';
import { CommonModule } from '@angular/common';
import { AddEditCategoryModalComponent } from '../../modals/add-edit-category-modal/add-edit-category-modal.component';
import { CategoryService } from '../../core/services/category.service';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-category',
  standalone: true,
  imports: [CommonModule, AddEditCategoryModalComponent],
  templateUrl: './category.component.html',
  styleUrl: './category.component.scss'
})
export class CategoryComponent implements OnInit {

  private categoriesService = inject(CategoryService);


  readonly modalOpen = signal(false);
  readonly modalMode = signal<'create' | 'edit'>('create');
  readonly editingCategory = signal<Category | null>(null);

  constructor() {
    effect(() => {
      console.log('Categorías cambiaron:', this.categories());
    });
  }

  categories: Signal<Category[]> = toSignal(this.categoriesService.getUserCategories$(), {
    initialValue: [] as Category[],
  });

  ngOnInit(): void {
    const cats = this.categories();
    console.log('Categorías actuales:', cats);

    cats.forEach((x) => {
      console.log(x)
    })

    cats.forEach(c => console.log('Cat:', c.name));



  }

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

  async saveCategory(categoryInput: { name: string; type: 'income' | 'expense'; color: string; active: boolean }) {
    try {
      if (this.modalMode() === 'create') {
        await this.categoriesService.createCategory(categoryInput as any);
      } else if (this.modalMode() === 'edit' && this.editingCategory()) {
        await this.categoriesService.updateCategory(this.editingCategory()!.id, categoryInput as any).then(() => {

        })
      }
      this.modalOpen.set(false);

    } catch (err) {
      console.error('Error guardando categoría', err);
      // aquí podrías mostrar un toast
    }
  }

  async deleteCategory(category: Category) {
    const ok = confirm(`¿Eliminar la categoría "${category.name}"?`);
    if (!ok) return;

    try {
      await this.categoriesService.deleteCategory(category.id).then(() => {

      })
    } catch (err) {
      console.error('Error eliminando categoría', err);
    }
  }


}

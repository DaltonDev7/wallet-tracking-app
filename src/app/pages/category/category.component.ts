import { Component, effect, inject, OnInit, Signal, signal } from '@angular/core';
import { Category } from '../../core/interfaces/movements';
import { CommonModule } from '@angular/common';
import { AddEditCategoryModalComponent } from '../../modals/add-edit-category-modal/add-edit-category-modal.component';
import { CategoryService } from '../../core/services/category.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { ConfirmModalComponent } from '../../modals/confirm-modal/confirm-modal.component';

@Component({
  selector: 'app-category',
  standalone: true,
  imports: [CommonModule, AddEditCategoryModalComponent, ConfirmModalComponent],
  templateUrl: './category.component.html',
  styleUrl: './category.component.scss'
})
export class CategoryComponent implements OnInit {

  private categoriesService = inject(CategoryService);

  public showConfirmDelete = false;
  readonly modalOpen = signal(false);
  readonly modalMode = signal<'create' | 'edit'>('create');
  readonly editingCategory = signal<Category | null>(null);
  public categoryPending: Category | null = null;

  constructor() {
    effect(() => {
      console.log('Categorías cambiaron:', this.categories());
    });
  }

  categories: Signal<Category[]> = toSignal(this.categoriesService.getUserCategories$(), {
    initialValue: [] as Category[],
  });

  ngOnInit(): void {
   
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
    this.categoryPending = category;
    this.showConfirmDelete = true;
  }

  async handleConfirmDelete(): Promise<void> {
    if (!this.categoryPending) return;
    if (!this.categoryPending.id) return;
    await this.categoriesService.deleteCategory(this.categoryPending.id);
    this.categoryPending = null;
    this.showConfirmDelete = false;
  }


  handleCancelDelete(): void {
    this.categoryPending = null;
    this.showConfirmDelete = false;
  }


}

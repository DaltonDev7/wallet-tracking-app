import { inject, Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  CollectionReference,
} from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';

import { authState } from 'rxfire/auth';
import { filter, switchMap, map } from 'rxjs/operators';
import { Observable, of } from 'rxjs';
import { Category } from '../interfaces/movements';

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private firestore = inject(Firestore);
  private auth = inject(Auth);

  private categoriesCollection(userId: string): CollectionReference {
    return collection(this.firestore, 'users', userId, 'categories') as CollectionReference;
  }

  /** Escucha las categorías del usuario logueado */
  getUserCategories$(): Observable<Category[]> {
    return authState(this.auth).pipe(
      filter((user): user is NonNullable<typeof user> => !!user),
      switchMap(user => {
        const colRef = this.categoriesCollection(user.uid);
        return collectionData(colRef, { idField: 'id' }) as Observable<Category[]>;
      }),
      map(categories =>
        categories.map(c => ({
          ...c,
          createdAt: c['createdAt'] ? (c['createdAt'] as any).toDate?.() ?? c['createdAt'] : undefined,
          updatedAt: c['updatedAt'] ? (c['updatedAt'] as any).toDate?.() ?? c['updatedAt'] : undefined,
        })) as Category[]
      )
    );
  }

  /** Crear nueva categoría para el usuario logueado */
  async createCategory(partial: Omit<Category, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) throw new Error('No hay usuario autenticado');

    const colRef = this.categoriesCollection(user.uid);
    const now = new Date();

    await addDoc(colRef, {
      ...partial,
      userId: user.uid,
      createdAt: now,
      updatedAt: now,
    });
  }

  /** Actualizar categoría existente del usuario actual */
  async updateCategory(id: string, changes: Partial<Category>): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) throw new Error('No hay usuario autenticado');

    const docRef = doc(this.firestore, 'users', user.uid, 'categories', id);
    const now = new Date();

    await updateDoc(docRef, {
      ...changes,
      updatedAt: now,
    } as any);
  }

  /** Eliminar categoría */
  async deleteCategory(id: string): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) throw new Error('No hay usuario autenticado');

    const docRef = doc(this.firestore, 'users', user.uid, 'categories', id);
    await deleteDoc(docRef);
  }
}

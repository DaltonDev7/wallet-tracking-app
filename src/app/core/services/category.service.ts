import { inject, Injectable } from '@angular/core';
import { Firestore, collection, collectionData, addDoc, doc, updateDoc, deleteDoc } from '@angular/fire/firestore';
import { Auth, authState, User } from '@angular/fire/auth';
import { Observable, of } from 'rxjs';
import { switchMap, map } from 'rxjs/operators';
import { Category } from '../interfaces/movements';

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private firestore = inject(Firestore);
  private auth = inject(Auth);

  getUserCategories$(): Observable<Category[]> {
    return authState(this.auth).pipe(
      switchMap((user: User | null) => {
        if (!user) {
          console.log('No hay usuario autenticado');
          return of([]);
        }
        
        console.log('Cargando categorías para usuario:', user.uid);
        const colRef = collection(this.firestore, 'users', user.uid, 'categories');
        
        return collectionData(colRef, { idField: 'id' });
      }),
      map((categories: any[]) => {
        console.log('Categorías recibidas:', categories);
        return categories.map(c => ({
          ...c,
          createdAt: c.createdAt?.toDate ? c.createdAt.toDate() : c.createdAt,
          updatedAt: c.updatedAt?.toDate ? c.updatedAt.toDate() : c.updatedAt,
        })) as Category[];
      })
    );
  }

  async createCategory(partial: Omit<Category, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) throw new Error('No hay usuario autenticado');
    
    const colRef = collection(this.firestore, 'users', user.uid, 'categories');
    await addDoc(colRef, {
      ...partial,
      userId: user.uid,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  async updateCategory(id: string, changes: Partial<Category>): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) throw new Error('No hay usuario autenticado');
    
    const docRef = doc(this.firestore, 'users', user.uid, 'categories', id);
    await updateDoc(docRef, {
      ...changes,
      updatedAt: new Date(),
    });
  }

  async deleteCategory(id: string): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) throw new Error('No hay usuario autenticado');
    
    const docRef = doc(this.firestore, 'users', user.uid, 'categories', id);
    await deleteDoc(docRef);
  }
}
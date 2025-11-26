import { inject, Injectable } from '@angular/core';
import { Auth, authState } from '@angular/fire/auth';
import { collectionData, Firestore } from '@angular/fire/firestore';
import { collection, addDoc, doc, updateDoc, deleteDoc, orderBy, query, where } from 'firebase/firestore';
import { Observable, filter, switchMap, map } from 'rxjs';
import { FixedExpense } from '../interfaces/movements';

@Injectable({
  providedIn: 'root'
})
export class ExpensesService {

  private firestore = inject(Firestore);
  private auth = inject(Auth);

  // Colección: users/{uid}/fixed-expenses
  private fixedExpensesCollection(userId: string) {
    return collection(this.firestore, 'users', userId, 'fixed-expenses');
  }


  getUserFixedExpensesByMonth$(monthKey: string): Observable<FixedExpense[]> {
    // monthKey viene en formato 'YYYY-MM' desde el <input type="month">
    return authState(this.auth).pipe(
      filter((user): user is NonNullable<typeof user> => !!user),
      switchMap(user => {
        const colRef = this.fixedExpensesCollection(user.uid);

        const qRef = query(
          colRef,
          where('startDate', '==', monthKey),
          orderBy('startDate', 'asc')      // requerido cuando usas rango en startDate
        );

        return collectionData(qRef, { idField: 'id' }) as Observable<any[]>;
      }),
      map(docs =>
        docs.map(d => ({
          id: d.id,
          name: d.name,
          category: d.category ?? '',
          amount: d.amount,
          active: d.active,
          startDate: d.startDate,
          notes: d.notes ?? '',
        })) as FixedExpense[]
      )
    );
  }


  getUserFixedExpenses$(): Observable<FixedExpense[]> {
    return authState(this.auth).pipe(
      filter((user): user is NonNullable<typeof user> => !!user),
      switchMap(user => {
        const colRef = this.fixedExpensesCollection(user.uid);
        return collectionData(colRef, { idField: 'id' }) as Observable<any[]>;
      }),
      map(docs =>
        docs.map(d => ({
          id: d.id,
          name: d.name,
          category: d.category ?? '',
          amount: d.amount,
          active: d.active,
          startDate: d.startDate,
          notes: d.notes ?? '',
        })) as FixedExpense[]
      )
    );
  }

  async createFixedExpense(input: Omit<FixedExpense, 'id'>): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) throw new Error('No hay usuario autenticado');

    const colRef = this.fixedExpensesCollection(user.uid);
    await addDoc(colRef, {
      name: input.name,
      category: input.category,
      amount: input.amount,
      active: input.active,
      startDate: input.startDate,
      notes: input.notes ?? '',
      userId: user.uid,       // 👈 queda asociado al usuario
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  async updateFixedExpense(id: string, changes: Partial<FixedExpense>): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) throw new Error('No hay usuario autenticado');

    const ref = doc(this.firestore, 'users', user.uid, 'fixed-expenses', id);
    await updateDoc(ref, {
      ...changes,
      updatedAt: new Date(),
    } as any);
  }

  async deleteFixedExpense(id: string): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) throw new Error('No hay usuario autenticado');

    const ref = doc(this.firestore, 'users', user.uid, 'fixed-expenses', id);
    await deleteDoc(ref);
  }
}

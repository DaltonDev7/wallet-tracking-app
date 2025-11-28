import { inject, Injectable } from '@angular/core';
import { Auth, authState } from '@angular/fire/auth';
import { collectionData, Firestore } from '@angular/fire/firestore';
import { collection, query, where, orderBy, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Observable, filter, switchMap, map } from 'rxjs';
import { FixedIncome } from '../interfaces/movements';

@Injectable({
  providedIn: 'root'
})
export class IncomesService {
  private firestore = inject(Firestore);
  private auth = inject(Auth);

  // Colección: users/{uid}/fixed-incomes
  private fixedIncomesCollection(userId: string) {
    return collection(this.firestore, 'users', userId, 'fixed-incomes');
  }

  /**
   * Ingresos fijos del usuario para un mes específico.
   * monthKey viene en formato 'YYYY-MM' desde el <input type="month">
   */
  getUserFixedIncomesByMonth$(monthKey: string): Observable<FixedIncome[]> {

    return authState(this.auth).pipe(
      filter((user): user is NonNullable<typeof user> => !!user),
      switchMap((user) => {

        const colRef = this.fixedIncomesCollection(user.uid);

        const qRef = query(
          colRef,
          where('startDate', '==', monthKey),
          orderBy('startDate', 'asc')
        );

        return collectionData(qRef, { idField: 'id' }) as Observable<any[]>;
      }),
      map(
        (docs) =>
          docs.map(
            (d) =>
              ({
                id: d.id,
                name: d.name,
                category: d.category ?? '',
                amount: d.amount,
                active: d.active,
                startDate: d.startDate,
                notes: d.notes ?? '',
              }) as FixedIncome
          ) as FixedIncome[]
      )
    );
  }

  /**
   * Todos los ingresos fijos del usuario (sin filtro de mes)
   */
  getUserFixedIncomes$(): Observable<FixedIncome[]> {
    return authState(this.auth).pipe(
      filter((user): user is NonNullable<typeof user> => !!user),
      switchMap((user) => {
        const colRef = this.fixedIncomesCollection(user.uid);
        return collectionData(colRef, { idField: 'id' }) as Observable<any[]>;
      }),
      map(
        (docs) =>
          docs.map(
            (d) =>
              ({
                id: d.id,
                name: d.name,
                category: d.category ?? '',
                amount: d.amount,
                active: d.active,
                startDate: d.startDate,
                notes: d.notes ?? '',
              }) as FixedIncome
          ) as FixedIncome[]
      )
    );
  }

  /**
   * Crear ingreso fijo
   */
  async createFixedIncome(
    input: Omit<FixedIncome, 'id'>
  ): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) throw new Error('No hay usuario autenticado');
    console.log(input)
    const colRef = this.fixedIncomesCollection(user.uid);
    await addDoc(colRef, {
      name: input.name,
      amount: input.amount,
      active: input.active,
      startDate: input.startDate,
      notes: input.notes ?? '',
      userId: user.uid,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  /**
   * Actualizar ingreso fijo
   */
  async updateFixedIncome(
    id: string,
    changes: Partial<FixedIncome>
  ): Promise<void> {
    console.log("123456")
    const user = this.auth.currentUser;
    if (!user) throw new Error('No hay usuario autenticado');

    const ref = doc(this.firestore, 'users', user.uid, 'fixed-incomes', id);
    await updateDoc(ref, {
      ...changes,
      updatedAt: new Date(),
    } as any);
  }

  /**
   * Eliminar ingreso fijo
   */
  async deleteFixedIncome(id: string): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) throw new Error('No hay usuario autenticado');

    const ref = doc(this.firestore, 'users', user.uid, 'fixed-incomes', id);
    await deleteDoc(ref);
  }
}

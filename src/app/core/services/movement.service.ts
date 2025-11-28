import { inject, Injectable } from '@angular/core';
import {
  Firestore,
  CollectionReference,
  collection,
  collectionData,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
} from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import { authState } from 'rxfire/auth';

import { Observable, map, filter, switchMap, of } from 'rxjs';
import { Movement, MovementCreateInput, MovementUpdateInput } from '../interfaces/movements';


@Injectable({ providedIn: 'root' })
export class MovementsService {
  private firestore = inject(Firestore);
  private auth = inject(Auth);

  /** Referencia a la colección de movimientos del usuario */


  /** Devuelve todos los movimientos del usuario logueado */
  getUserMovements$(): Observable<Movement[]> {
    return authState(this.auth).pipe(
      filter((user): user is NonNullable<typeof user> => !!user),
      switchMap((user) => {
        const colRef = this.movementsCollection(user.uid);
        return collectionData(colRef, { idField: 'id' }) as Observable<any[]>;
      }),
      map((docs) =>
        docs.map((d) => ({
          id: d.id,
          userId: d.userId,
          type: d.type,
          amount: d.amount,
          date: d.date,
          categoryId: d.categoryId,
          note: d.note,
          createdAt: d.createdAt?.toDate?.() ?? d.createdAt,
          updatedAt: d.updatedAt?.toDate?.() ?? d.updatedAt,
        })) as Movement[]
      )
    );
  }

  /** Crea un movimiento para el usuario actual */
  async createMovement(input: MovementCreateInput): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) throw new Error('No hay usuario autenticado');

    const colRef = this.movementsCollection(user.uid);
    const now = new Date();

    await addDoc(colRef, {
      userId: user.uid,
      type: input.type,
      amount: input.amount,
      date: input.date,
      categoryId: input.categoryId,
      description: input.description ?? null,
      createdAt: now,
      updatedAt: now,
    });
  }

  /** Actualiza un movimiento existente del usuario actual */
  async updateMovement(id: string, changes: MovementUpdateInput): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) throw new Error('No hay usuario autenticado');

    const docRef = doc(this.firestore, 'users', user.uid, 'movements', id);
    const now = new Date();

    await updateDoc(docRef, {
      ...changes,
      updatedAt: now,
    } as any);
  }

  /** Elimina un movimiento */
  async deleteMovement(id: string): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) throw new Error('No hay usuario autenticado');

    const docRef = doc(this.firestore, 'users', user.uid, 'movements', id);
    await deleteDoc(docRef);
  }


  private movementsCollection(userId: string): CollectionReference {
    return collection(this.firestore, 'users', userId, 'movements') as CollectionReference;
  }

  /** Movimientos del usuario para un mes/año específicos */
  getUserMovementsByMonth$(monthKey: string): Observable<Movement[]> {
  // monthKey viene como 'YYYY-MM' desde el <input type="month">
  if (!monthKey) {
    return of([]); // necesitas importar of desde 'rxjs'
  }

  const [yearStr, monthStr] = monthKey.split('-'); // '2025-11' -> ['2025','11']
  const year = Number(yearStr);
  const month = Number(monthStr); // 1–12

  const monthStrPadded = String(month).padStart(2, '0');
  const start = `${year}-${monthStrPadded}-01`; // inclusive

  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  const nextMonthStr = String(nextMonth).padStart(2, '0');
  const end = `${nextYear}-${nextMonthStr}-01`; // exclusivo

  return authState(this.auth).pipe(
    filter((user): user is NonNullable<typeof user> => !!user),
    switchMap((user) => {
      const colRef = this.movementsCollection(user.uid);
      const qRef = query(
        colRef,
        where('date', '>=', start),
        where('date', '<', end),
        orderBy('date', 'desc')
      );
      return collectionData(qRef, { idField: 'id' }) as Observable<any[]>;
    }),
    map(
      (docs) =>
        docs.map(
          (d) =>
            ({
              id: d.id,
              type: d.type,
              amount: d.amount,
              date: d.date,
              categoryId: d.categoryId,
              description: d.description,
            }) as Movement
        ) as Movement[]
    )
  );
}

}

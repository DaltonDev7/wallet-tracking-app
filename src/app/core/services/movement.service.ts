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
import { Auth, authState, User } from '@angular/fire/auth'; // 👈 Cambia este import
import { Observable, map, switchMap, of } from 'rxjs';
import { Movement, MovementCreateInput, MovementUpdateInput } from '../interfaces/movements';

@Injectable({ providedIn: 'root' })
export class MovementsService {
  private firestore = inject(Firestore);
  private auth = inject(Auth);

  /** Devuelve todos los movimientos del usuario logueado */
  getUserMovements$(): Observable<Movement[]> {
    return authState(this.auth).pipe(
      switchMap((user: User | null) => {
        if (!user) return of([]);
        
        const colRef = collection(this.firestore, 'users', user.uid, 'movements');
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

    const colRef = collection(this.firestore, 'users', user.uid, 'movements');
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
    });
  }

  /** Elimina un movimiento */
  async deleteMovement(id: string): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) throw new Error('No hay usuario autenticado');

    const docRef = doc(this.firestore, 'users', user.uid, 'movements', id);
    await deleteDoc(docRef);
  }

  /** Movimientos del usuario para un mes/año específicos */
  getUserMovementsByMonth$(monthKey: string): Observable<Movement[]> {
    if (!monthKey) {
      return of([]);
    }

    const [yearStr, monthStr] = monthKey.split('-');
    const year = Number(yearStr);
    const month = Number(monthStr);

    const monthStrPadded = String(month).padStart(2, '0');
    const start = `${year}-${monthStrPadded}-01`;

    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;
    const nextMonthStr = String(nextMonth).padStart(2, '0');
    const end = `${nextYear}-${nextMonthStr}-01`;

    return authState(this.auth).pipe(
      switchMap((user: User | null) => {
        if (!user) return of([]);
        
        const colRef = collection(this.firestore, 'users', user.uid, 'movements');
        const qRef = query(
          colRef,
          where('date', '>=', start),
          where('date', '<', end),
          orderBy('date', 'desc')
        );
        return collectionData(qRef, { idField: 'id' }) as Observable<any[]>;
      }),
      map((docs) =>
        docs.map((d) => ({
          id: d.id,
          type: d.type,
          amount: d.amount,
          date: d.date,
          categoryId: d.categoryId,
          description: d.description,
          createdAt: d.createdAt?.toDate?.() ?? d.createdAt,
          updatedAt: d.updatedAt?.toDate?.() ?? d.updatedAt,
        })) as Movement[]
      )
    );
  }
}
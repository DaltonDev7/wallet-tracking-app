import { inject, Injectable } from '@angular/core';
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  UserCredential,
} from 'firebase/auth';

import { Auth, authState } from '@angular/fire/auth';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private auth = inject(Auth);

  // Observable del usuario (útil para mostrar nombre, foto, etc.)
  user$ = authState(this.auth);

  async signInWithGoogle(): Promise<UserCredential> {
    const provider = new GoogleAuthProvider();
    // Puedes pedir solo correo básico
    provider.setCustomParameters({
      prompt: 'select_account', // fuerza selector de cuenta
    });

    return await signInWithPopup(this.auth, provider);
  }

  async logout(): Promise<void> {
    await signOut(this.auth);
  }
}

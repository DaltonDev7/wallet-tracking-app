import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { authState } from '@angular/fire/auth';
import { Auth } from '@angular/fire/auth';
import { map, take } from 'rxjs';
import { routesEnum } from '../enums/router.enum';

export const authGuard: CanActivateFn = (route, state) => {
 const auth = inject(Auth);
  const router = inject(Router);

  return authState(auth).pipe(
    take(1), // tomamos solo 1 emisión
    map((user) => {
      if (user) {
        // Usuario logueado → permitir acceso
        return true;
      } else {
        // No logueado → redirigir
        router.navigate([routesEnum.signIn]);
        return false;
      }
    })
  );
};

import { inject } from '@angular/core';
import { Auth, authState } from '@angular/fire/auth';
import { CanActivateFn, Router } from '@angular/router';
import { take, map } from 'rxjs';
import { routesEnum } from '../enums/router.enum';

export const redirectIfAuthenticatedGuard: CanActivateFn = (route, state) => {
  const auth = inject(Auth);
  const router = inject(Router);

  return authState(auth).pipe(
    take(1),
    map((user) => {
      if (user) {

        router.navigate(['']);
        return false;
      } else {

        return true;
      }
    })
  );
};
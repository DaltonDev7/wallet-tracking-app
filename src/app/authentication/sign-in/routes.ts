import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path:'',
        loadComponent: () => import('./sign-in.component').then((m) => m.SignInComponent)
    },
];


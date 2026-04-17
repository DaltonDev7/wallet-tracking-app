import { Routes } from "@angular/router";

export const routes: Routes = [
    {
        path:'',
        loadComponent: () => import('./notfound.component').then((m) => m.NotfoundComponent)
    },
];

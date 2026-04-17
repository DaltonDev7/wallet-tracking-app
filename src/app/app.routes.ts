import { Routes } from '@angular/router';
import { routesEnum } from './core/enums/router.enum';
import { authGuard } from './core/guards/auth.guard';
import { redirectIfAuthenticatedGuard } from './core/guards/redirect-if-authenticated.guard';

export const routes: Routes = [
    {
        path: routesEnum.analytics,
        canActivate: [authGuard],
        loadComponent: () => import('./pages/home/home.component').then((m) => m.HomeComponent),
        children: [
            {
                path: '',
                loadComponent: () => import('./pages/analytics/analytics.component').then((m) => m.AnalyticsComponent)
            }
        ]
    },
    {
        path:'',
        canActivate: [authGuard],
        loadComponent: () => import('./pages/home/home.component').then((m) => m.HomeComponent),
        loadChildren: () => import('./pages/home/router').then(x => x.routes)
    },
    {
        path: routesEnum.signIn,
        canActivate: [redirectIfAuthenticatedGuard],
        loadChildren : () => import('./authentication/sign-in/routes').then(x => x.routes)
    },
    {
        path:'**',
        loadChildren : () => import('./pages/notfound/routes').then(x => x.routes)
    }
];

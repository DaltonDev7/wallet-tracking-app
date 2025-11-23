import { Routes } from '@angular/router';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { CategoryComponent } from './pages/category/category.component';
import { HomeComponent } from './pages/home/home.component';
import { routesEnum } from './core/enums/router.enum';
import { authGuard } from './core/guards/auth.guard';
import { redirectIfAuthenticatedGuard } from './core/guards/redirect-if-authenticated.guard';

export const routes: Routes = [
    {
        path:'',
        component: HomeComponent,
        canActivate: [authGuard],
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

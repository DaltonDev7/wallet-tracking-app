import { Routes } from '@angular/router';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { CategoryComponent } from './pages/category/category.component';
import { HomeComponent } from './pages/home/home.component';
import { routesEnum } from './core/enums/router.enum';

export const routes: Routes = [
    {
        path:'',
        component: HomeComponent,
        loadChildren: () => import('./pages/home/router').then(x => x.routes)
    },
    {
        path: routesEnum.signIn,
        loadChildren : () => import('./authentication/sign-in/routes').then(x => x.routes)
    }
];

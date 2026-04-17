import { Routes } from "@angular/router";
import { routesEnum } from "../../core/enums/router.enum";

export const routes: Routes = [
    {
        path:'',
        loadComponent: () => import('../dashboard/dashboard.component').then((m) => m.DashboardComponent)
    },
    {
        path: routesEnum.category,
        loadComponent: () => import('../category/category.component').then((m) => m.CategoryComponent)
    },
    {
        path: routesEnum.income,
        loadComponent: () => import('../income/income.component').then((m) => m.IncomeComponent)
    },
    {
        path: routesEnum.expenses,
        loadComponent: () => import('../expenses/expenses.component').then((m) => m.ExpensesComponent)
    },
    {
        path: routesEnum.analytics,
        loadComponent: () => import('../analytics/analytics.component').then((m) => m.AnalyticsComponent)
    },
];

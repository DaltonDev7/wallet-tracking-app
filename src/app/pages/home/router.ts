import { Routes } from "@angular/router";
import { DashboardComponent } from "../dashboard/dashboard.component";
import { CategoryComponent } from "../category/category.component";
import { routesEnum } from "../../core/enums/router.enum";
import { IncomeComponent } from "../income/income.component";
import { AddEditExpensesModalComponent } from "../../modals/add-edit-expenses-modal/add-edit-expenses-modal.component";
import { ExpensesComponent } from "../expenses/expenses.component";

export const routes: Routes = [
    {
        path:'',
        component: DashboardComponent
    },
    {
        path: routesEnum.category,
        component: CategoryComponent
    },
    {
        path: routesEnum.income,
        component: IncomeComponent
    },
    {
        path: routesEnum.expenses,
        component: ExpensesComponent
    },



];

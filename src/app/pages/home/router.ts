import { Routes } from "@angular/router";
import { DashboardComponent } from "../dashboard/dashboard.component";
import { CategoryComponent } from "../category/category.component";
import { routesEnum } from "../../core/enums/router.enum";

export const routes: Routes = [
    {
        path:'',
        component: DashboardComponent
    },
    {
        path: routesEnum.category,
        component: CategoryComponent
    }
];

import { Routes } from "@angular/router";
import { adminGuard } from "./core/guards/admin.guard";
import { appHomeGuard } from "./core/guards/app-home.guard";
import { authGuard } from "./core/guards/auth.guard";
import { ShellComponent } from "./shared/components/shell.component";

export const routes: Routes = [
  {
    path: "",
    loadComponent: () =>
      import("./features/landing/landing.component").then(
        (m) => m.LandingComponent,
      ),
  },
  {
    path: "login",
    loadComponent: () =>
      import("./features/auth/login.component").then((m) => m.LoginComponent),
  },
  {
    path: "app",
    component: ShellComponent,
    canActivate: [authGuard],
    children: [
      {
        path: "",
        pathMatch: "full",
        canActivate: [appHomeGuard],
        children: [],
      },
      {
        path: "dashboard",
        canActivate: [adminGuard],
        loadComponent: () =>
          import("./features/dashboard/dashboard.component").then(
            (m) => m.DashboardComponent,
          ),
      },
      {
        path: "expenses",
        loadComponent: () =>
          import("./features/expenses/expenses.component").then(
            (m) => m.ExpensesComponent,
          ),
      },
      {
        path: "incomes",
        canActivate: [adminGuard],
        loadComponent: () =>
          import("./features/incomes/incomes.component").then(
            (m) => m.IncomesComponent,
          ),
      },
      {
        path: "sponsors",
        loadComponent: () =>
          import("./features/sponsors/sponsors.component").then(
            (m) => m.SponsorsComponent,
          ),
      },
      {
        path: "registrations",
        loadComponent: () =>
          import("./features/registrations/registrations.component").then(
            (m) => m.RegistrationsComponent,
          ),
      },
      {
        path: "participation-requests",
        loadComponent: () =>
          import("./features/participation-requests/participation-requests.component").then(
            (m) => m.ParticipationRequestsComponent,
          ),
      },
      {
        path: "profile",
        loadComponent: () =>
          import("./features/profile/profile.component").then(
            (m) => m.ProfileComponent,
          ),
      },
      {
        path: "users",
        canActivate: [adminGuard],
        loadComponent: () =>
          import("./features/users/users.component").then(
            (m) => m.UsersComponent,
          ),
      },
    ],
  },
  { path: "**", redirectTo: "" },
];

import { Routes } from "@angular/router";
import { adminGuard } from "./core/guards/admin.guard";
import { appHomeGuard } from "./core/guards/app-home.guard";
import { authGuard } from "./core/guards/auth.guard";
import { treasurerGuard } from "./core/guards/treasurer.guard";
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
        loadComponent: () =>
          import("./features/dashboard/dashboard.component").then(
            (m) => m.DashboardComponent,
          ),
      },
      {
        path: "transactions",
        loadComponent: () =>
          import("./features/transactions/transactions.component").then(
            (m) => m.TransactionsComponent,
          ),
      },
      {
        path: "tesoreria",
        canActivate: [treasurerGuard],
        loadComponent: () =>
          import("./features/tesoreria/tesoreria.component").then(
            (m) => m.TesoreriaComponent,
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
        path: "tournaments",
        loadComponent: () =>
          import("./features/tournaments/tournaments.component").then(
            (m) => m.TournamentsComponent,
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
      {
        path: "audit",
        canActivate: [adminGuard],
        loadComponent: () =>
          import("./features/audit/audit.component").then(
            (m) => m.AuditComponent,
          ),
      },
    ],
  },
  { path: "**", redirectTo: "" },
];

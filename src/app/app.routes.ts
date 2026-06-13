import { Routes } from "@angular/router";

export const routes: Routes = [
  {
    path: "",
    loadComponent: () =>
      import("./features/landing/landing.component").then(
        (m) => m.LandingComponent,
      ),
  },
  {
    // Il gestionale è stato dismesso: tutte le sue pagine mostrano l'avviso
    // di trasferimento al nuovo gestionale (vedi MigratedPageComponent).
    path: "gestionale-trasferito",
    loadComponent: () =>
      import("./shared/components/migrated-page.component").then(
        (m) => m.MigratedPageComponent,
      ),
  },
  { path: "login", redirectTo: "gestionale-trasferito", pathMatch: "full" },
  { path: "app", redirectTo: "gestionale-trasferito", pathMatch: "prefix" },
  { path: "**", redirectTo: "" },
];

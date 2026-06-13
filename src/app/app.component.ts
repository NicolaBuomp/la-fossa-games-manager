import { Component, inject } from "@angular/core";
import { RouterOutlet } from "@angular/router";
import { ThemeService } from "./core/services/theme.service";
import { CookieBannerComponent } from "./shared/components/cookie-banner.component";
import { SnackbarComponent } from "./shared/components/snackbar.component";

@Component({
  selector: "lfg-root",
  standalone: true,
  imports: [RouterOutlet, CookieBannerComponent, SnackbarComponent],
  template: `
    <router-outlet />
    <lfg-snackbar />
    <lfg-cookie-banner />
  `,
})
export class AppComponent {
  private readonly theme = inject(ThemeService);

  constructor() {
    this.theme.ensureApplied();
  }
}

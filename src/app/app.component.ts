import { Component, inject } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { NavigationEnd, Router, RouterOutlet } from "@angular/router";
import { filter, map } from "rxjs";
import { ThemeService } from "./core/services/theme.service";
import { CookieBannerComponent } from "./shared/components/cookie-banner.component";
import { SnackbarComponent } from "./shared/components/snackbar.component";
import {
  SunsetBannerComponent,
  SunsetNoticeComponent,
} from "./shared/components/sunset-notice.component";

@Component({
  selector: "lfg-root",
  standalone: true,
  imports: [
    RouterOutlet,
    CookieBannerComponent,
    SnackbarComponent,
    SunsetBannerComponent,
    SunsetNoticeComponent,
  ],
  template: `
    @if (showSunsetNotice()) {
      <lfg-sunset-banner />
    }
    <router-outlet />
    <lfg-snackbar />
    <lfg-cookie-banner />
    @if (showSunsetNotice()) {
      <lfg-sunset-notice />
    }
  `,
})
export class AppComponent {
  private readonly theme = inject(ThemeService);
  private readonly router = inject(Router);

  // L'avviso di fine supporto riguarda solo il gestionale (/login e /app):
  // la landing pubblica resta pulita.
  protected readonly showSunsetNotice = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map(
        (event) =>
          event.urlAfterRedirects.startsWith("/login") ||
          event.urlAfterRedirects.startsWith("/app"),
      ),
    ),
    { initialValue: false },
  );

  constructor() {
    this.theme.ensureApplied();
  }
}

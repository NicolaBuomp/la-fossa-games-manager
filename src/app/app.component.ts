import { Component, inject } from "@angular/core";
import { RouterOutlet } from "@angular/router";
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
    <lfg-sunset-banner />
    <router-outlet />
    <lfg-snackbar />
    <lfg-cookie-banner />
    <lfg-sunset-notice />
  `,
})
export class AppComponent {
  private readonly theme = inject(ThemeService);

  constructor() {
    this.theme.ensureApplied();
  }
}

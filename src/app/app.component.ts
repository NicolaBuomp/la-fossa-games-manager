import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CookieBannerComponent } from './shared/components/cookie-banner.component';

@Component({
  selector: 'lfg-root',
  standalone: true,
  imports: [RouterOutlet, CookieBannerComponent],
  template: `
    <router-outlet />
    <lfg-cookie-banner />
  `
})
export class AppComponent {}

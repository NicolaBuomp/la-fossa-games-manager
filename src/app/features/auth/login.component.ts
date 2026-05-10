import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <main class="grid min-h-screen place-items-center bg-paper px-4 py-8">
      <section class="w-full max-w-md rounded-lg border border-black/10 bg-white p-6 shadow-sm">
        <a routerLink="/" class="text-xs font-bold uppercase tracking-[0.18em] text-neutral-500">La Fossa Games</a>
        <h1 class="mt-4 font-display text-3xl uppercase">Accesso staff</h1>
        <p class="mt-2 text-sm leading-6 text-neutral-600">Usa username e password associati a un profilo attivo.</p>

        @if (error) {
          <div class="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{{ error }}</div>
        }

        <form class="mt-6" (ngSubmit)="submit()">
          <fieldset [disabled]="loading" class="space-y-4 disabled:opacity-70">
            <label class="block">
              <span class="text-xs font-bold uppercase tracking-wide text-neutral-500">Username</span>
              <input name="username" type="text" autocomplete="username" required [(ngModel)]="username" class="mt-1 w-full rounded-lg border border-black/10 bg-neutral-50 px-3 py-3 outline-none focus:border-ink disabled:cursor-not-allowed disabled:opacity-70">
            </label>
            <label class="block">
              <span class="text-xs font-bold uppercase tracking-wide text-neutral-500">Password</span>
              <input name="password" type="password" required [(ngModel)]="password" class="mt-1 w-full rounded-lg border border-black/10 bg-neutral-50 px-3 py-3 outline-none focus:border-ink disabled:cursor-not-allowed disabled:opacity-70">
            </label>
            <button class="w-full rounded-lg bg-ink px-4 py-3 text-sm font-bold uppercase tracking-wide text-white disabled:opacity-60">
              {{ loading ? 'Accesso...' : 'Entra' }}
            </button>
          </fieldset>
        </form>
      </section>
    </main>
  `
})
export class LoginComponent implements OnInit {
  username = '';
  password = '';
  loading = false;
  error = '';

  constructor(
    private readonly auth: AuthService,
    private readonly router: Router,
    private readonly route: ActivatedRoute
  ) {}

  async ngOnInit(): Promise<void> {
    await this.auth.ensureReady();
    if (this.auth.isAuthenticated() && this.auth.isActive()) {
      await this.router.navigateByUrl(this.redirectUrl());
    }
  }

  async submit(): Promise<void> {
    this.loading = true;
    this.error = '';
    try {
      await this.auth.signIn(this.username, this.password);
      await this.router.navigateByUrl(this.redirectUrl());
    } catch (error) {
      this.error = this.loginErrorMessage(error);
    } finally {
      this.loading = false;
    }
  }

  private loginErrorMessage(error: unknown): string {
    const message = error instanceof Error ? error.message.toLowerCase() : '';
    if (
      message.includes('invalid login credentials') ||
      message.includes('username o password') ||
      message.includes('invalid credentials')
    ) {
      return 'Username o password non corretti.';
    }

    return 'Accesso non riuscito. Controlla le credenziali e riprova.';
  }

  private redirectUrl(): string {
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
    if (returnUrl?.startsWith('/app')) {
      return returnUrl;
    }

    return '/app';
  }
}

import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
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

        <form class="mt-6 space-y-4" (ngSubmit)="submit()">
          <label class="block">
            <span class="text-xs font-bold uppercase tracking-wide text-neutral-500">Username</span>
            <input name="username" type="text" autocomplete="username" required [(ngModel)]="username" class="mt-1 w-full rounded-lg border border-black/10 bg-neutral-50 px-3 py-3 outline-none focus:border-ink">
          </label>
          <label class="block">
            <span class="text-xs font-bold uppercase tracking-wide text-neutral-500">Password</span>
            <input name="password" type="password" required [(ngModel)]="password" class="mt-1 w-full rounded-lg border border-black/10 bg-neutral-50 px-3 py-3 outline-none focus:border-ink">
          </label>
          <button [disabled]="loading" class="w-full rounded-lg bg-ink px-4 py-3 text-sm font-bold uppercase tracking-wide text-white disabled:opacity-60">
            {{ loading ? 'Accesso...' : 'Entra' }}
          </button>
        </form>
      </section>
    </main>
  `
})
export class LoginComponent {
  username = '';
  password = '';
  loading = false;
  error = '';

  constructor(
    private readonly auth: AuthService,
    private readonly router: Router
  ) {}

  async submit(): Promise<void> {
    this.loading = true;
    this.error = '';
    try {
      await this.auth.signIn(this.username, this.password);
      if (!this.auth.isActive()) {
        this.error = 'Profilo non attivo o non configurato.';
        return;
      }
      await this.router.navigateByUrl('/app/dashboard');
    } catch (error) {
      this.error = error instanceof Error ? error.message : 'Accesso non riuscito.';
    } finally {
      this.loading = false;
    }
  }
}

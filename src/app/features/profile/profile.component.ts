import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { ProfileService } from '../../core/services/profile.service';

@Component({
  standalone: true,
  imports: [FormsModule],
  template: `
    <section class="space-y-5">
      <div>
        <p class="text-xs font-bold uppercase tracking-[0.18em] text-neutral-500">Account</p>
        <h1 class="font-display text-3xl uppercase sm:text-5xl">Profilo utente</h1>
        <p class="mt-2 max-w-2xl text-sm leading-6 text-neutral-600">
          Modifica i dati personali e aggiorna la password di accesso.
        </p>
      </div>

      @if (success()) {
        <p class="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">{{ success() }}</p>
      }

      @if (error()) {
        <p class="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{{ error() }}</p>
      }

      <div class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(320px,420px)]">
        <form class="rounded-lg border border-black/10 bg-white p-5 shadow-sm" (ngSubmit)="saveProfile()">
          <div class="flex flex-wrap items-start justify-between gap-3 border-b border-black/5 pb-4">
            <div>
              <h2 class="font-display text-xl uppercase">Dati personali</h2>
              <p class="mt-1 text-sm text-neutral-500">{{ auth.user()?.email }}</p>
            </div>
            <span class="rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-neutral-600">
              {{ auth.profile()?.role }}
            </span>
          </div>

          <div class="mt-5 grid gap-4 sm:grid-cols-2">
            <label class="block">
              <span class="text-xs font-bold uppercase tracking-wide text-neutral-500">Nome</span>
              <input name="firstName" required [(ngModel)]="firstName" class="mt-1 w-full rounded-lg border border-black/10 bg-neutral-50 px-3 py-3 outline-none focus:border-ink">
            </label>
            <label class="block">
              <span class="text-xs font-bold uppercase tracking-wide text-neutral-500">Cognome</span>
              <input name="lastName" required [(ngModel)]="lastName" class="mt-1 w-full rounded-lg border border-black/10 bg-neutral-50 px-3 py-3 outline-none focus:border-ink">
            </label>
          </div>

          <button [disabled]="savingProfile()" class="mt-5 min-h-11 rounded-lg bg-ink px-5 text-sm font-bold uppercase tracking-wide text-white disabled:opacity-60">
            {{ savingProfile() ? 'Salvataggio...' : 'Salva dati' }}
          </button>
        </form>

        <form class="rounded-lg border border-black/10 bg-white p-5 shadow-sm" (ngSubmit)="savePassword()">
          <h2 class="font-display text-xl uppercase">Password</h2>
          <p class="mt-1 text-sm leading-6 text-neutral-500">Imposta una nuova password per il tuo account.</p>

          <div class="mt-5 space-y-4">
            <label class="block">
              <span class="text-xs font-bold uppercase tracking-wide text-neutral-500">Nuova password</span>
              <input name="password" type="password" minlength="6" required [(ngModel)]="password" class="mt-1 w-full rounded-lg border border-black/10 bg-neutral-50 px-3 py-3 outline-none focus:border-ink">
            </label>
            <label class="block">
              <span class="text-xs font-bold uppercase tracking-wide text-neutral-500">Conferma password</span>
              <input name="passwordConfirm" type="password" minlength="6" required [(ngModel)]="passwordConfirm" class="mt-1 w-full rounded-lg border border-black/10 bg-neutral-50 px-3 py-3 outline-none focus:border-ink">
            </label>
          </div>

          <button [disabled]="savingPassword()" class="mt-5 min-h-11 rounded-lg bg-fossa px-5 text-sm font-bold uppercase tracking-wide text-ink disabled:opacity-60">
            {{ savingPassword() ? 'Aggiornamento...' : 'Aggiorna password' }}
          </button>
        </form>
      </div>
    </section>
  `
})
export class ProfileComponent implements OnInit {
  firstName = '';
  lastName = '';
  password = '';
  passwordConfirm = '';
  savingProfile = signal(false);
  savingPassword = signal(false);
  success = signal('');
  error = signal('');

  constructor(
    readonly auth: AuthService,
    private readonly profiles: ProfileService
  ) {}

  ngOnInit(): void {
    this.fillName();
  }

  async saveProfile(): Promise<void> {
    this.resetMessages();
    this.savingProfile.set(true);
    try {
      await this.profiles.updateOwnFullName(this.fullName());
      await this.auth.loadProfile();
      this.fillName();
      this.success.set('Dati personali aggiornati.');
    } catch (error) {
      this.error.set(this.message(error, 'Aggiornamento dati non riuscito.'));
    } finally {
      this.savingProfile.set(false);
    }
  }

  async savePassword(): Promise<void> {
    this.resetMessages();
    if (this.password !== this.passwordConfirm) {
      this.error.set('Le password non coincidono.');
      return;
    }

    this.savingPassword.set(true);
    try {
      await this.auth.updatePassword(this.password);
      this.password = '';
      this.passwordConfirm = '';
      this.success.set('Password aggiornata.');
    } catch (error) {
      this.error.set(this.message(error, 'Aggiornamento password non riuscito.'));
    } finally {
      this.savingPassword.set(false);
    }
  }

  private fillName(): void {
    const parts = (this.auth.profile()?.full_name ?? '').trim().split(/\s+/).filter(Boolean);
    this.firstName = parts.shift() ?? '';
    this.lastName = parts.join(' ');
  }

  private fullName(): string {
    return [this.firstName, this.lastName].map((part) => part.trim()).filter(Boolean).join(' ');
  }

  private resetMessages(): void {
    this.error.set('');
    this.success.set('');
  }

  private message(error: unknown, fallback: string): string {
    return error instanceof Error ? error.message : fallback;
  }
}

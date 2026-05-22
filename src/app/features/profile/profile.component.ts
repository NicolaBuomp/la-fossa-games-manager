import { Component, inject, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { AuthService } from "../../core/services/auth.service";
import { ProfileService } from "../../core/services/profile.service";
import { SnackbarService } from "../../core/services/snackbar.service";

@Component({
  standalone: true,
  imports: [FormsModule],
  template: `
    <section class="space-y-5">
      <div>
        <p class="text-xs font-bold uppercase tracking-[0.18em] text-muted">
          Account
        </p>
        <h1 class="font-display text-3xl uppercase sm:text-5xl">
          Profilo utente
        </h1>
        <p class="mt-2 max-w-2xl text-sm leading-6 text-muted">
          Aggiorna la password di accesso.
        </p>
      </div>

      @if (success()) {
        <p class="state-success rounded-lg border p-3 text-sm font-semibold">
          {{ success() }}
        </p>
      }

      @if (error()) {
        <p class="state-danger rounded-lg border p-3 text-sm font-semibold">
          {{ error() }}
        </p>
      }

      <div class="max-w-xl space-y-5">
        <!-- Form nome visualizzato -->
        <form
          class="rounded-lg border border-soft bg-surface p-5 shadow-sm"
          (ngSubmit)="saveName()"
        >
          <fieldset [disabled]="savingName()" class="disabled:opacity-70">
            <div
              class="flex flex-wrap items-start justify-between gap-3 border-b border-soft pb-4"
            >
              <div>
                <h2 class="font-display text-xl uppercase">Il tuo profilo</h2>
                <p class="mt-1 text-sm text-muted">
                  {{ auth.profile()?.username || auth.user()?.email }}
                </p>
              </div>
              <span
                class="state-neutral rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-wide"
              >
                {{ auth.profile()?.roles?.join(', ') }}
              </span>
            </div>

            <div class="mt-5">
              <label class="block">
                <span class="text-xs font-bold uppercase tracking-wide text-muted">Nome visualizzato</span>
                <input
                  name="fullName"
                  type="text"
                  [(ngModel)]="fullName"
                  class="mt-1 w-full rounded-lg border border-soft bg-surface-muted px-3 py-3 outline-none disabled:cursor-not-allowed disabled:opacity-70"
                  placeholder="Es. Mario Rossi"
                />
              </label>
            </div>

            <button
              class="bg-accent text-on-accent mt-5 min-h-11 rounded-lg px-5 text-sm font-bold uppercase tracking-wide disabled:opacity-60"
            >
              {{ savingName() ? "Salvataggio..." : "Salva nome" }}
            </button>
          </fieldset>
        </form>

        <!-- Form password -->
        <form
          class="rounded-lg border border-soft bg-surface p-5 shadow-sm"
          (ngSubmit)="savePassword()"
        >
          <fieldset [disabled]="savingPassword()" class="disabled:opacity-70">
            <h2 class="font-display text-xl uppercase">Password</h2>
            <p class="mt-2 text-sm leading-6 text-muted">
              Imposta una nuova password per il tuo account.
            </p>

            <div class="mt-5 space-y-4">
              <label class="block">
                <span
                  class="text-xs font-bold uppercase tracking-wide text-muted"
                  >Nuova password</span
                >
                <input
                  name="password"
                  type="password"
                  minlength="6"
                  required
                  [(ngModel)]="password"
                  class="mt-1 w-full rounded-lg border border-soft bg-surface-muted px-3 py-3 outline-none disabled:cursor-not-allowed disabled:opacity-70"
                />
              </label>
              <label class="block">
                <span
                  class="text-xs font-bold uppercase tracking-wide text-muted"
                  >Conferma password</span
                >
                <input
                  name="passwordConfirm"
                  type="password"
                  minlength="6"
                  required
                  [(ngModel)]="passwordConfirm"
                  class="mt-1 w-full rounded-lg border border-soft bg-surface-muted px-3 py-3 outline-none disabled:cursor-not-allowed disabled:opacity-70"
                />
              </label>
            </div>

            <button
              class="bg-accent text-on-accent mt-5 min-h-11 rounded-lg px-5 text-sm font-bold uppercase tracking-wide disabled:opacity-60"
            >
              {{ savingPassword() ? "Aggiornamento..." : "Aggiorna password" }}
            </button>
          </fieldset>
        </form>
      </div>
    </section>
  `,
})
export class ProfileComponent {
  password = "";
  passwordConfirm = "";
  fullName = "";
  savingPassword = signal(false);
  savingName = signal(false);
  success = signal("");
  error = signal("");
  private readonly snackbar = inject(SnackbarService);
  private readonly profileService = inject(ProfileService);

  constructor(readonly auth: AuthService) {
    this.fullName = auth.profile()?.full_name ?? "";
  }

  async saveName(): Promise<void> {
    const name = this.fullName.trim();
    if (!name) return;
    this.resetMessages();
    this.savingName.set(true);
    try {
      await this.profileService.updateOwnFullName(name);
      await this.auth.refreshProfile();
      this.success.set("Nome aggiornato.");
      this.snackbar.success("Nome aggiornato.");
    } catch (error) {
      const message = this.message(error, "Aggiornamento nome non riuscito.");
      this.error.set(message);
      this.snackbar.error(message);
    } finally {
      this.savingName.set(false);
    }
  }

  async savePassword(): Promise<void> {
    this.resetMessages();
    if (this.password !== this.passwordConfirm) {
      this.error.set("Le password non coincidono.");
      this.snackbar.warning("Le password non coincidono.");
      return;
    }

    this.savingPassword.set(true);
    try {
      await this.auth.updatePassword(this.password);
      this.password = "";
      this.passwordConfirm = "";
      this.success.set("Password aggiornata.");
      this.snackbar.success("Password aggiornata.");
    } catch (error) {
      const message = this.message(
        error,
        "Aggiornamento password non riuscito.",
      );
      this.error.set(message);
      this.snackbar.error(message);
    } finally {
      this.savingPassword.set(false);
    }
  }

  private resetMessages(): void {
    this.error.set("");
    this.success.set("");
  }

  private message(error: unknown, fallback: string): string {
    return error instanceof Error ? error.message : fallback;
  }
}

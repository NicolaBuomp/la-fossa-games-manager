import { Component, OnInit, inject, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ProfileService } from "../../core/services/profile.service";
import { SnackbarService } from "../../core/services/snackbar.service";
import {
  CreateUserResult,
  Profile,
  ResetPasswordResult,
  UserRole,
} from "../../core/types/models";
import {
  ConfirmModalComponent,
  EmptyStateComponent,
  StatusBadgeComponent,
} from "../../shared/components/ui.component";

@Component({
  standalone: true,
  imports: [
    FormsModule,
    ConfirmModalComponent,
    EmptyStateComponent,
    StatusBadgeComponent,
  ],
  template: `
    <section class="space-y-5">
      <div>
        <p class="text-xs font-bold uppercase tracking-[0.18em] text-muted">
          Solo admin
        </p>
        <h1 class="font-display text-3xl uppercase">Utenti</h1>
        <p class="mt-2 max-w-2xl text-sm leading-6 text-muted">
          Gestione dei profili applicativi collegati agli utenti Supabase Auth.
          I nuovi utenti accedono con username e password iniziale standard, poi
          la cambiano dal profilo.
        </p>
      </div>

      @if (error()) {
        <p class="state-danger rounded-lg border p-3 text-sm">
          {{ error() }}
        </p>
      }

      @if (createdUser()) {
        <div class="state-success rounded-lg border p-4 text-sm">
          <p class="font-bold">Utente creato: {{ createdUser()?.username }}</p>
          <div class="mt-2 flex flex-wrap items-center gap-3">
            <span class="font-semibold">Password iniziale:</span>
            <span class="font-mono font-bold tracking-widest">
              {{
                showPassword() ? createdUser()?.temporaryPassword : "••••••••"
              }}
            </span>
            <button
              type="button"
              class="state-success rounded-md border px-3 py-1 text-xs font-bold uppercase transition"
              (click)="showPassword.set(!showPassword())"
            >
              {{ showPassword() ? "Nascondi" : "Mostra" }}
            </button>
            <button
              type="button"
              class="state-success rounded-md border px-3 py-1 text-xs font-bold uppercase transition"
              (click)="copyPassword()"
            >
              {{ copied() ? "Copiata ✓" : "Copia" }}
            </button>
          </div>
          <p class="mt-2 text-xs">
            Comunica la password all'utente in modo sicuro, poi chiudi questa
            sezione.
          </p>
        </div>
      }

      @if (resetUser()) {
        <div class="state-warning rounded-lg border p-4 text-sm">
          <p class="font-bold">
            Password resettata per: {{ resetUser()?.username }}
          </p>
          <div class="mt-2 flex flex-wrap items-center gap-3">
            <span class="font-semibold">Password temporanea:</span>
            <span class="font-mono font-bold tracking-widest">
              {{
                showResetPassword()
                  ? resetUser()?.temporaryPassword
                  : "••••••••"
              }}
            </span>
            <button
              type="button"
              class="state-warning rounded-md border px-3 py-1 text-xs font-bold uppercase transition"
              (click)="showResetPassword.set(!showResetPassword())"
            >
              {{ showResetPassword() ? "Nascondi" : "Mostra" }}
            </button>
            <button
              type="button"
              class="state-warning rounded-md border px-3 py-1 text-xs font-bold uppercase transition"
              (click)="copyResetPassword()"
            >
              {{ resetCopied() ? "Copiata ✓" : "Copia" }}
            </button>
          </div>
          <p class="mt-2 text-xs">
            Comunica questa password all'utente: al prossimo accesso potrà
            cambiarla dal profilo.
          </p>
        </div>
      }

      <form
        class="rounded-lg border border-soft bg-surface p-4"
        (ngSubmit)="createUser()"
      >
        <fieldset [disabled]="creating()" class="disabled:opacity-70">
          <div class="grid gap-3 sm:grid-cols-2">
            <label class="grid gap-1 text-sm font-bold">
              Nome
              <input
                name="firstName"
                required
                [(ngModel)]="form.firstName"
                class="rounded-lg border border-soft bg-surface-muted px-3 py-3 font-normal outline-none disabled:cursor-not-allowed disabled:opacity-70"
              />
            </label>
            <label class="grid gap-1 text-sm font-bold">
              Cognome
              <input
                name="lastName"
                required
                [(ngModel)]="form.lastName"
                class="rounded-lg border border-soft bg-surface-muted px-3 py-3 font-normal outline-none disabled:cursor-not-allowed disabled:opacity-70"
              />
            </label>
            <label class="grid gap-1 text-sm font-bold">
              Username
              <input
                name="username"
                required
                pattern="[a-zA-Z0-9._-]{3,32}"
                [(ngModel)]="form.username"
                class="rounded-lg border border-soft bg-surface-muted px-3 py-3 font-normal outline-none disabled:cursor-not-allowed disabled:opacity-70"
              />
            </label>
            <label class="grid gap-1 text-sm font-bold">
              Tipo utente
              <select
                name="role"
                required
                [(ngModel)]="form.role"
                class="rounded-lg border border-soft bg-surface-muted px-3 py-3 font-normal outline-none disabled:cursor-not-allowed disabled:opacity-70"
              >
                <option value="staff">Staff</option>
                <option value="admin">Admin</option>
              </select>
            </label>
          </div>
          <div class="mt-4 flex justify-end">
            <button
              class="min-h-11 rounded-lg bg-ink px-4 text-sm font-bold uppercase tracking-wide text-white disabled:opacity-60"
            >
              {{ creating() ? "Creazione..." : "Crea utente" }}
            </button>
          </div>
        </fieldset>
      </form>

      @if (!items().length) {
        <lfg-empty-state
          title="Nessun profilo visibile"
          text="Crea un nuovo utente dal modulo qui sopra."
        />
      } @else {
        <div class="grid gap-3">
          @for (item of items(); track item.id) {
            <article class="rounded-lg border border-soft bg-surface p-4">
              <div class="flex flex-wrap items-start justify-between gap-3">
                <div class="min-w-0">
                  <h2 class="truncate text-base font-bold">
                    {{ item.full_name || item.email || item.id }}
                  </h2>
                  <p class="mt-1 break-all text-xs text-muted">
                    {{ item.username || item.email }}
                  </p>
                </div>
                <div class="flex gap-2">
                  <lfg-status-badge
                    [label]="item.role"
                    [className]="
                      item.role === 'admin'
                        ? 'border-fossa bg-fossa text-ink'
                        : 'state-neutral'
                    "
                  />
                  <lfg-status-badge
                    [label]="item.active ? 'Attivo' : 'Disattivo'"
                    [className]="item.active ? 'state-success' : 'state-danger'"
                  />
                </div>
              </div>
              <div
                class="mt-4 grid gap-2 border-t border-soft pt-3 sm:grid-cols-[1fr_auto]"
              >
                <select
                  class="min-h-11 rounded-lg border border-soft bg-surface-muted px-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-70"
                  [disabled]="updatingUserId() === item.id"
                  [ngModel]="item.role"
                  (ngModelChange)="setRole(item, $event)"
                >
                  <option value="staff">Staff</option>
                  <option value="admin">Admin</option>
                </select>
                <div class="flex flex-wrap gap-2">
                  <button
                    class="min-h-11 rounded-lg bg-surface-muted px-4 text-sm font-bold uppercase tracking-wide disabled:cursor-not-allowed disabled:opacity-60"
                    [disabled]="updatingUserId() === item.id"
                    (click)="resetPassword(item)"
                  >
                    Reset password
                  </button>
                  <button
                    class="min-h-11 rounded-lg bg-surface-muted px-4 text-sm font-bold uppercase tracking-wide disabled:cursor-not-allowed disabled:opacity-60"
                    [disabled]="updatingUserId() === item.id"
                    (click)="toggleActive(item)"
                  >
                    {{ item.active ? "Disattiva" : "Attiva" }}
                  </button>
                </div>
              </div>
            </article>
          }
        </div>
      }
    </section>

    <lfg-confirm
      [open]="!!confirmPending()"
      [message]="confirmMessage()"
      [confirmLabel]="'Reset password'"
      (confirm)="doConfirm()"
      (cancel)="confirmPending.set(null)"
    />
  `,
})
export class UsersComponent implements OnInit {
  items = signal<Profile[]>([]);
  error = signal("");
  creating = signal(false);
  updatingUserId = signal<string | null>(null);
  createdUser = signal<CreateUserResult | null>(null);
  resetUser = signal<ResetPasswordResult | null>(null);
  showPassword = signal(false);
  showResetPassword = signal(false);
  copied = signal(false);
  resetCopied = signal(false);
  confirmPending = signal<(() => Promise<void>) | null>(null);
  confirmMessage = signal("");
  private readonly snackbar = inject(SnackbarService);
  form = {
    firstName: "",
    lastName: "",
    username: "",
    role: "staff" as UserRole,
  };

  constructor(private readonly profiles: ProfileService) {}

  ngOnInit(): void {
    void this.load();
  }

  async load(): Promise<void> {
    try {
      this.items.set(await this.profiles.list());
    } catch (error) {
      this.setError(this.message(error));
    }
  }

  async setRole(item: Profile, role: UserRole): Promise<void> {
    if (this.updatingUserId()) return;
    this.updatingUserId.set(item.id);
    try {
      await this.profiles.updateRole(item.id, role);
      await this.load();
      this.snackbar.success("Ruolo aggiornato.");
    } catch (error) {
      this.setError(this.message(error));
    } finally {
      this.updatingUserId.set(null);
    }
  }

  async createUser(): Promise<void> {
    if (this.creating()) return;
    this.creating.set(true);
    this.error.set("");
    this.createdUser.set(null);
    this.resetUser.set(null);
    this.showPassword.set(false);
    this.copied.set(false);
    try {
      const created = await this.profiles.createUser(this.form);
      this.createdUser.set(created);
      this.snackbar.success(`Utente ${created.username} creato.`);
      this.form = { firstName: "", lastName: "", username: "", role: "staff" };
      await this.load();
    } catch (error) {
      this.setError(this.message(error));
    } finally {
      this.creating.set(false);
    }
  }

  copyPassword(): void {
    const pwd = this.createdUser()?.temporaryPassword;
    if (!pwd) return;
    void navigator.clipboard.writeText(pwd).then(() => {
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    });
  }

  copyResetPassword(): void {
    const pwd = this.resetUser()?.temporaryPassword;
    if (!pwd) return;
    void navigator.clipboard.writeText(pwd).then(() => {
      this.resetCopied.set(true);
      setTimeout(() => this.resetCopied.set(false), 2000);
    });
  }

  resetPassword(item: Profile): void {
    if (this.updatingUserId()) return;
    const label =
      item.username || item.full_name || item.email || "questo utente";
    this.confirmMessage.set(
      `Resettare la password per ${label}? Verrà generata una password temporanea.`,
    );
    this.confirmPending.set(async () => {
      this.updatingUserId.set(item.id);
      this.error.set("");
      this.createdUser.set(null);
      this.resetUser.set(null);
      this.showResetPassword.set(false);
      this.resetCopied.set(false);
      try {
        const result = await this.profiles.resetPassword(item.id);
        this.resetUser.set(result);
        this.snackbar.success(`Password resettata per ${result.username}.`);
      } catch (error) {
        this.setError(this.message(error));
      } finally {
        this.updatingUserId.set(null);
      }
    });
  }

  async doConfirm(): Promise<void> {
    const fn = this.confirmPending();
    this.confirmPending.set(null);
    if (fn) await fn();
  }

  async toggleActive(item: Profile): Promise<void> {
    if (this.updatingUserId()) return;
    this.updatingUserId.set(item.id);
    try {
      await this.profiles.setActive(item.id, !item.active);
      await this.load();
      this.snackbar.success(
        item.active ? "Utente disattivato." : "Utente attivato.",
      );
    } catch (error) {
      this.setError(this.message(error));
    } finally {
      this.updatingUserId.set(null);
    }
  }

  private message(error: unknown): string {
    return error instanceof Error ? error.message : "Operazione non riuscita.";
  }

  private setError(message: string): void {
    this.error.set(message);
    this.snackbar.error(message);
  }
}

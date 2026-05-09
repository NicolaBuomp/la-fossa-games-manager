import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ProfileService } from '../../core/services/profile.service';
import { CreateUserResult, Profile, UserRole } from '../../core/types/models';
import { EmptyStateComponent, StatusBadgeComponent } from '../../shared/components/ui.component';

@Component({
  standalone: true,
  imports: [FormsModule, EmptyStateComponent, StatusBadgeComponent],
  template: `
    <section class="space-y-4">
      <div>
        <p class="text-xs font-bold uppercase tracking-[0.18em] text-neutral-500">Solo admin</p>
        <h1 class="font-display text-3xl uppercase">Utenti</h1>
        <p class="mt-2 max-w-2xl text-sm leading-6 text-neutral-600">
          Gestione dei profili applicativi collegati agli utenti Supabase Auth. I nuovi utenti accedono con username e password iniziale standard, poi la cambiano dal profilo.
        </p>
      </div>

      @if (error()) {
        <p class="rounded-lg bg-red-50 p-3 text-sm text-red-700">{{ error() }}</p>
      }

      @if (createdUser()) {
        <div class="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
          <p class="font-bold">Utente creato: {{ createdUser()?.username }}</p>
          <div class="mt-2 flex flex-wrap items-center gap-3">
            <span class="text-emerald-800">Password iniziale:</span>
            <span class="font-mono font-bold tracking-widest">
              {{ showPassword() ? createdUser()?.temporaryPassword : '••••••••' }}
            </span>
            <button
              type="button"
              class="rounded-md bg-emerald-100 px-3 py-1 text-xs font-bold uppercase text-emerald-800 transition hover:bg-emerald-200"
              (click)="showPassword.set(!showPassword())"
            >{{ showPassword() ? 'Nascondi' : 'Mostra' }}</button>
            <button
              type="button"
              class="rounded-md bg-emerald-100 px-3 py-1 text-xs font-bold uppercase text-emerald-800 transition hover:bg-emerald-200"
              (click)="copyPassword()"
            >{{ copied() ? 'Copiata ✓' : 'Copia' }}</button>
          </div>
          <p class="mt-2 text-xs text-emerald-700">Comunica la password all'utente in modo sicuro, poi chiudi questa sezione.</p>
        </div>
      }

      <form class="rounded-lg border border-black/10 bg-white p-4" (ngSubmit)="createUser()">
        <div class="grid gap-3 sm:grid-cols-2">
          <label class="grid gap-1 text-sm font-bold">
            Nome
            <input name="firstName" required [(ngModel)]="form.firstName" class="rounded-lg border border-black/10 bg-neutral-50 px-3 py-3 font-normal outline-none focus:border-ink">
          </label>
          <label class="grid gap-1 text-sm font-bold">
            Cognome
            <input name="lastName" required [(ngModel)]="form.lastName" class="rounded-lg border border-black/10 bg-neutral-50 px-3 py-3 font-normal outline-none focus:border-ink">
          </label>
          <label class="grid gap-1 text-sm font-bold">
            Username
            <input name="username" required pattern="[a-zA-Z0-9._-]{3,32}" [(ngModel)]="form.username" class="rounded-lg border border-black/10 bg-neutral-50 px-3 py-3 font-normal outline-none focus:border-ink">
          </label>
          <label class="grid gap-1 text-sm font-bold">
            Tipo utente
            <select name="role" required [(ngModel)]="form.role" class="rounded-lg border border-black/10 bg-neutral-50 px-3 py-3 font-normal outline-none focus:border-ink">
              <option value="staff">Staff</option>
              <option value="admin">Admin</option>
            </select>
          </label>
        </div>
        <div class="mt-4 flex justify-end">
          <button [disabled]="creating()" class="min-h-11 rounded-lg bg-ink px-4 text-sm font-bold uppercase tracking-wide text-white disabled:opacity-60">
            {{ creating() ? 'Creazione...' : 'Crea utente' }}
          </button>
        </div>
      </form>

      @if (!items().length) {
        <lfg-empty-state title="Nessun profilo visibile" text="Crea un nuovo utente dal modulo qui sopra." />
      } @else {
        <div class="grid gap-3">
          @for (item of items(); track item.id) {
            <article class="rounded-lg border border-black/10 bg-white p-4">
              <div class="flex flex-wrap items-start justify-between gap-3">
                <div class="min-w-0">
                  <h2 class="truncate text-base font-bold">{{ item.full_name || item.email || item.id }}</h2>
                  <p class="mt-1 break-all text-xs text-neutral-500">{{ item.username || item.email }}</p>
                </div>
                <div class="flex gap-2">
                  <lfg-status-badge [label]="item.role" [className]="item.role === 'admin' ? 'border-fossa bg-fossa text-ink' : 'border-neutral-300 bg-neutral-100 text-neutral-700'" />
                  <lfg-status-badge [label]="item.active ? 'Attivo' : 'Disattivo'" [className]="item.active ? 'border-emerald-200 bg-emerald-100 text-emerald-800' : 'border-red-200 bg-red-100 text-red-800'" />
                </div>
              </div>
              <div class="mt-4 grid gap-2 border-t border-black/5 pt-3 sm:grid-cols-[1fr_auto]">
                <select class="min-h-11 rounded-lg border border-black/10 bg-neutral-50 px-3 text-sm font-semibold" [ngModel]="item.role" (ngModelChange)="setRole(item, $event)">
                  <option value="staff">Staff</option>
                  <option value="admin">Admin</option>
                </select>
                <button class="min-h-11 rounded-lg bg-neutral-100 px-4 text-sm font-bold uppercase tracking-wide" (click)="toggleActive(item)">
                  {{ item.active ? 'Disattiva' : 'Attiva' }}
                </button>
              </div>
            </article>
          }
        </div>
      }
    </section>
  `
})
export class UsersComponent implements OnInit {
  items = signal<Profile[]>([]);
  error = signal('');
  creating = signal(false);
  createdUser = signal<CreateUserResult | null>(null);
  showPassword = signal(false);
  copied = signal(false);
  form = {
    firstName: '',
    lastName: '',
    username: '',
    role: 'staff' as UserRole
  };

  constructor(private readonly profiles: ProfileService) {}

  ngOnInit(): void {
    void this.load();
  }

  async load(): Promise<void> {
    try {
      this.items.set(await this.profiles.list());
    } catch (error) {
      this.error.set(this.message(error));
    }
  }

  async setRole(item: Profile, role: UserRole): Promise<void> {
    try {
      await this.profiles.updateRole(item.id, role);
      await this.load();
    } catch (error) {
      this.error.set(this.message(error));
    }
  }

  async createUser(): Promise<void> {
    this.creating.set(true);
    this.error.set('');
    this.createdUser.set(null);
    this.showPassword.set(false);
    this.copied.set(false);
    try {
      const created = await this.profiles.createUser(this.form);
      this.createdUser.set(created);
      this.form = { firstName: '', lastName: '', username: '', role: 'staff' };
      await this.load();
    } catch (error) {
      this.error.set(this.message(error));
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

  async toggleActive(item: Profile): Promise<void> {
    try {
      await this.profiles.setActive(item.id, !item.active);
      await this.load();
    } catch (error) {
      this.error.set(this.message(error));
    }
  }

  private message(error: unknown): string {
    return error instanceof Error ? error.message : 'Operazione non riuscita.';
  }
}

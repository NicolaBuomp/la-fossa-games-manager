import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ProfileService } from '../../core/services/profile.service';
import { Profile, UserRole } from '../../core/types/models';
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
          Gestione dei profili applicativi collegati agli utenti Supabase Auth.
        </p>
      </div>

      @if (error()) {
        <p class="rounded-lg bg-red-50 p-3 text-sm text-red-700">{{ error() }}</p>
      }

      @if (!items().length) {
        <lfg-empty-state title="Nessun profilo visibile" text="Crea utenti da Supabase Auth e assicurati che il trigger abbia generato i profili." />
      } @else {
        <div class="grid gap-3">
          @for (item of items(); track item.id) {
            <article class="rounded-lg border border-black/10 bg-white p-4">
              <div class="flex flex-wrap items-start justify-between gap-3">
                <div class="min-w-0">
                  <h2 class="truncate text-base font-bold">{{ item.full_name || item.email || item.id }}</h2>
                  <p class="mt-1 break-all text-xs text-neutral-500">{{ item.email }}</p>
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

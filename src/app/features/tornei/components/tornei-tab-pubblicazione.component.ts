import { Component, EventEmitter, Input, Output, inject, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { AuthService } from "../../../core/services/auth.service";
import { SnackbarService } from "../../../core/services/snackbar.service";
import { TournamentsService } from "../../../core/services/tournaments.service";
import { OperationalTournament } from "../../../core/types/models";
import {
  TOURNAMENT_PUBLIC_STATUS,
  TOURNAMENT_PUBLIC_STATUSES,
  TOURNAMENT_STATUSES,
} from "../../../core/types/constants";

@Component({
  selector: "lfg-tornei-tab-pubblicazione",
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="animate-fade-in">
      <div class="rounded-xl border border-soft bg-surface p-4 shadow-sm">
        @if (!auth.isAdmin()) {
          <p class="rounded-lg bg-surface-muted p-4 text-sm font-semibold text-muted">
            La pubblicazione sul sito pubblico è riservata agli admin.
          </p>
        } @else {
          <div class="grid gap-4 sm:grid-cols-2">
            <label class="grid gap-1 text-sm font-bold">
              Stato operativo
              <div class="relative">
                <select
                  [(ngModel)]="localStatus"
                  class="w-full appearance-none rounded-lg border border-soft bg-surface-muted px-3 py-3 pr-9 font-normal"
                >
                  @for (status of tournamentStatuses; track status.id) {
                    <option [value]="status.id">{{ status.label }}</option>
                  }
                </select>
                <svg class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/></svg>
              </div>
            </label>
            <label class="grid gap-1 text-sm font-bold">
              Visibilità pubblica
              <div class="relative">
                <select
                  [(ngModel)]="localPublicStatus"
                  class="w-full appearance-none rounded-lg border border-soft bg-surface-muted px-3 py-3 pr-9 font-normal"
                >
                  @for (status of publicStatuses; track status.id) {
                    <option [value]="status.id">{{ status.label }}</option>
                  }
                </select>
                <svg class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/></svg>
              </div>
            </label>
          </div>

          <div class="mt-4 rounded-lg bg-surface-muted p-4 text-sm font-semibold leading-6 text-muted">
            <p><span class="font-black text-primary">Nascosto:</span> non compare sul sito.</p>
            <p><span class="font-black text-primary">Iscrizioni aperte:</span> visibile nei form pubblici.</p>
            <p><span class="font-black text-primary">Pubblicato:</span> mostra calendario e risultati.</p>
            <p><span class="font-black text-primary">Risultati pubblici:</span> mostra anche le classifiche.</p>
          </div>

          <button
            type="button"
            class="bg-strong text-on-strong mt-4 rounded-lg px-4 py-3 text-sm font-black uppercase disabled:opacity-60"
            [disabled]="saving()"
            (click)="save()"
          >
            {{ saving() ? "Salvataggio..." : "Salva pubblicazione" }}
          </button>
        }
      </div>
    </div>
  `,
})
export class TorneiTabPubblicazioneComponent {
  @Input({ required: true }) tournament!: () => OperationalTournament;
  @Output() reloadRequired = new EventEmitter<void>();

  readonly auth = inject(AuthService);
  private readonly service = inject(TournamentsService);
  private readonly snackbar = inject(SnackbarService);

  readonly tournamentStatuses = TOURNAMENT_STATUSES;
  readonly publicStatuses = TOURNAMENT_PUBLIC_STATUSES;

  saving = signal(false);

  get localStatus() { return this.tournament().status; }
  set localStatus(value: string) { (this.tournament() as OperationalTournament).status = value as OperationalTournament["status"]; }

  get localPublicStatus() { return this.tournament().public_status; }
  set localPublicStatus(value: string) { (this.tournament() as OperationalTournament).public_status = value as OperationalTournament["public_status"]; }

  async save(): Promise<void> {
    if (!this.auth.isAdmin() || this.saving()) return;
    this.saving.set(true);
    const t = this.tournament();
    try {
      const publishedAt =
        t.public_status === TOURNAMENT_PUBLIC_STATUS.Published ||
        t.public_status === TOURNAMENT_PUBLIC_STATUS.ResultsPublished
          ? t.published_at ?? new Date().toISOString()
          : null;
      await this.service.updatePublication(t.id, {
        status: t.status,
        public_status: t.public_status,
        published_at: publishedAt,
      });
      this.snackbar.success("Pubblicazione aggiornata.");
      this.reloadRequired.emit();
    } catch (err) {
      this.snackbar.error(err instanceof Error ? err.message : "Errore nel salvataggio.");
    } finally {
      this.saving.set(false);
    }
  }
}

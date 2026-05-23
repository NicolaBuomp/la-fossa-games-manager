import { Component, EventEmitter, Input, Output, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { SnackbarService } from "../../../core/services/snackbar.service";
import { TournamentsService, SaveMatchResultInput } from "../../../core/services/tournaments.service";
import { OperationalTournament, TournamentMatch, TournamentMatchStatus } from "../../../core/types/models";
import { TOURNAMENT_MATCH_STATUSES } from "../../../core/types/constants";
import { EmptyStateComponent, StatusBadgeComponent } from "../../../shared/components/ui.component";
import { inject } from "@angular/core";

@Component({
  selector: "lfg-tornei-tab-partite",
  standalone: true,
  imports: [FormsModule, EmptyStateComponent, StatusBadgeComponent],
  template: `
    <div class="animate-fade-in">
      @if (!tournament().tournament_matches.length) {
        <lfg-empty-state
          title="Calendario non generato"
          text="Genera i gironi per creare automaticamente le partite."
          icon="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      } @else {
        <div class="grid gap-3 lg:grid-cols-2">
          @for (match of tournament().tournament_matches; track match.id) {
            <article class="rounded-xl border border-soft bg-surface p-4 shadow-sm">
              <div class="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p class="text-xs font-black uppercase tracking-[0.16em] text-muted">
                    {{ match.tournament_groups?.name || match.round_label || "Partita" }}
                  </p>
                  <p class="mt-1 text-xs font-semibold text-muted">
                    {{ match.starts_at ? dateTimeLabel(match.starts_at) : "Orario da definire" }}
                  </p>
                </div>
                <lfg-status-badge
                  [label]="matchStatusLabel(match.status)"
                  [className]="matchStatusClass(match.status)"
                />
              </div>

              <div class="mt-3 flex items-center gap-2">
                <p class="min-w-0 flex-1 truncate text-sm font-black">{{ match.home_team?.name || "Casa" }}</p>
                <span class="flex-shrink-0 text-xs font-black text-muted">
                  @if (match.status === 'completed') {
                    {{ match.home_score }} – {{ match.away_score }}
                  } @else {
                    vs
                  }
                </span>
                <p class="min-w-0 flex-1 truncate text-right text-sm font-black">{{ match.away_team?.name || "Trasferta" }}</p>
              </div>

              <!-- Mobile: bottone apri modal -->
              <button
                type="button"
                class="bg-accent text-on-accent mt-3 w-full rounded-lg px-4 py-3 text-sm font-black uppercase sm:hidden"
                (click)="scoreModalMatch.set(match)"
              >
                Inserisci risultato
              </button>

              <!-- Desktop: form inline -->
              <div class="mt-4 hidden sm:block">
                <div class="grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
                  <div>
                    <p class="text-right text-base font-black">{{ match.home_team?.name || "Casa" }}</p>
                    <div class="flex justify-end mt-3">
                      <input
                        type="number"
                        min="0"
                        inputmode="numeric"
                        [(ngModel)]="match.home_score"
                        class="h-14 w-20 rounded-lg border border-soft bg-surface-muted text-center text-2xl font-black"
                        [class.border-red-400]="match.home_score < 0"
                      />
                    </div>
                  </div>
                  <div class="text-center text-xs font-black uppercase text-muted">vs</div>
                  <div>
                    <p class="text-base font-black">{{ match.away_team?.name || "Trasferta" }}</p>
                    <div class="mt-3">
                      <input
                        type="number"
                        min="0"
                        inputmode="numeric"
                        [(ngModel)]="match.away_score"
                        class="h-14 w-20 rounded-lg border border-soft bg-surface-muted text-center text-2xl font-black"
                        [class.border-red-400]="match.away_score < 0"
                      />
                    </div>
                  </div>
                </div>
                <div class="mt-4 grid gap-3 sm:grid-cols-3">
                  <label class="grid gap-1 text-xs font-bold uppercase text-muted">
                    Stato
                    <select
                      [(ngModel)]="match.status"
                      class="rounded-lg border border-soft bg-surface-muted px-3 py-2 text-sm font-bold text-primary"
                    >
                      @for (status of matchStatuses; track status.id) {
                        <option [value]="status.id">{{ status.label }}</option>
                      }
                    </select>
                  </label>
                  <label class="grid gap-1 text-xs font-bold uppercase text-muted">
                    Orario
                    <input
                      type="datetime-local"
                      [ngModel]="datetimeLocal(match.starts_at)"
                      (ngModelChange)="setMatchStart(match, $event)"
                      class="rounded-lg border border-soft bg-surface-muted px-3 py-2 text-sm font-bold text-primary"
                    />
                  </label>
                  <label class="grid gap-1 text-xs font-bold uppercase text-muted">
                    Campo
                    <input
                      type="text"
                      [(ngModel)]="match.field_label"
                      class="rounded-lg border border-soft bg-surface-muted px-3 py-2 text-sm font-bold text-primary"
                    />
                  </label>
                </div>
                <button
                  type="button"
                  class="bg-accent text-on-accent mt-4 w-full rounded-lg px-4 py-3 text-sm font-black uppercase disabled:opacity-60"
                  [disabled]="savingMatchId() === match.id || !canSaveMatch(match)"
                  (click)="saveMatch(match)"
                >
                  {{ savingMatchId() === match.id ? "Salvataggio..." : "Salva risultato" }}
                </button>
              </div>
            </article>
          }
        </div>
      }
    </div>

    <!-- Mini-modal punteggio mobile -->
    @if (scoreModalMatch(); as m) {
      <div
        class="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center"
        (click)="scoreModalMatch.set(null)"
      >
        <div
          class="animate-slide-up w-full max-w-sm rounded-t-2xl bg-surface p-6 sm:rounded-2xl"
          (click)="$event.stopPropagation()"
        >
          <p class="text-xs font-black uppercase tracking-[0.16em] text-muted">
            {{ m.tournament_groups?.name || m.round_label || "Partita" }}
          </p>
          <div class="mt-4 flex items-center gap-3">
            <p class="min-w-0 flex-1 truncate text-sm font-black">{{ m.home_team?.name || "Casa" }}</p>
            <input
              type="number"
              min="0"
              inputmode="numeric"
              [(ngModel)]="m.home_score"
              class="h-16 w-16 flex-shrink-0 rounded-xl border border-soft bg-surface-muted text-center text-3xl font-black outline-none"
            />
            <span class="flex-shrink-0 text-lg font-black text-muted">–</span>
            <input
              type="number"
              min="0"
              inputmode="numeric"
              [(ngModel)]="m.away_score"
              class="h-16 w-16 flex-shrink-0 rounded-xl border border-soft bg-surface-muted text-center text-3xl font-black outline-none"
            />
            <p class="min-w-0 flex-1 truncate text-right text-sm font-black">{{ m.away_team?.name || "Trasferta" }}</p>
          </div>
          <label class="mt-4 grid gap-1 text-xs font-bold uppercase text-muted">
            Stato
            <select
              [(ngModel)]="m.status"
              class="rounded-lg border border-soft bg-surface-muted px-3 py-2 text-sm font-bold text-primary"
            >
              @for (status of matchStatuses; track status.id) {
                <option [value]="status.id">{{ status.label }}</option>
              }
            </select>
          </label>
          <div class="mt-4 flex gap-3">
            <button
              type="button"
              class="flex-1 rounded-lg border border-soft bg-surface-muted py-3 text-sm font-bold uppercase"
              (click)="scoreModalMatch.set(null)"
            >
              Annulla
            </button>
            <button
              type="button"
              class="bg-accent text-on-accent flex-1 rounded-lg py-3 text-sm font-black uppercase disabled:opacity-60"
              [disabled]="savingMatchId() === m.id || !canSaveMatch(m)"
              (click)="saveMatchFromModal(m)"
            >
              {{ savingMatchId() === m.id ? "Salvataggio..." : "Salva" }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class TorneiTabPartiteComponent {
  @Input({ required: true }) tournament!: () => OperationalTournament;
  @Output() reloadRequired = new EventEmitter<void>();

  private readonly service = inject(TournamentsService);
  private readonly snackbar = inject(SnackbarService);

  readonly matchStatuses = TOURNAMENT_MATCH_STATUSES;
  savingMatchId = signal<string | null>(null);
  scoreModalMatch = signal<TournamentMatch | null>(null);

  async saveMatch(match: TournamentMatch): Promise<void> {
    if (!this.canSaveMatch(match) || this.savingMatchId()) return;
    this.savingMatchId.set(match.id);
    try {
      await this.service.saveMatchResult({
        matchId: match.id,
        groupId: match.group_id,
        homeScore: Number(match.home_score || 0),
        awayScore: Number(match.away_score || 0),
        status: match.status,
        startsAt: match.starts_at,
        fieldLabel: match.field_label,
      });
      this.snackbar.success("Risultato salvato.");
      this.reloadRequired.emit();
    } catch (err) {
      this.snackbar.error(err instanceof Error ? err.message : "Errore nel salvataggio.");
    } finally {
      this.savingMatchId.set(null);
    }
  }

  async saveMatchFromModal(match: TournamentMatch): Promise<void> {
    await this.saveMatch(match);
    this.scoreModalMatch.set(null);
  }

  canSaveMatch(match: TournamentMatch): boolean {
    return Number(match.home_score) >= 0 && Number(match.away_score) >= 0;
  }

  setMatchStart(match: TournamentMatch, value: string): void {
    match.starts_at = value ? new Date(value).toISOString() : null;
  }

  datetimeLocal(value: string | null): string {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    const offset = date.getTimezoneOffset();
    const local = new Date(date.getTime() - offset * 60_000);
    return local.toISOString().slice(0, 16);
  }

  dateTimeLabel(value: string): string {
    return new Intl.DateTimeFormat("it-IT", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  }

  matchStatusLabel(status: TournamentMatchStatus): string {
    return this.matchStatuses.find((item) => item.id === status)?.label ?? "Programmata";
  }

  matchStatusClass(status: TournamentMatchStatus): string {
    return this.matchStatuses.find((item) => item.id === status)?.className ?? "state-neutral";
  }
}

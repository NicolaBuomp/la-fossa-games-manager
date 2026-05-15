import { Component, OnInit, computed, inject, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { AuthService } from "../../core/services/auth.service";
import { SnackbarService } from "../../core/services/snackbar.service";
import {
  GenerateGroupStageResult,
  ResetTournamentScheduleResult,
  TournamentsService,
} from "../../core/services/tournaments.service";
import {
  OperationalTournament,
  TournamentMatch,
  TournamentMatchStatus,
  TournamentPublicStatus,
  TournamentStanding,
  TournamentStatus,
} from "../../core/types/models";
import {
  ConfirmModalComponent,
  EmptyStateComponent,
  KpiPanelComponent,
  StatusBadgeComponent,
  SummaryCardComponent,
} from "../../shared/components/ui.component";

type TournamentTab =
  | "teams"
  | "groups"
  | "matches"
  | "standings"
  | "publication";

@Component({
  selector: "lfg-tournaments",
  standalone: true,
  imports: [
    FormsModule,
    EmptyStateComponent,
    KpiPanelComponent,
    SummaryCardComponent,
    StatusBadgeComponent,
    ConfirmModalComponent,
  ],
  template: `
    <section class="space-y-5">
      <div class="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p class="text-xs font-bold uppercase tracking-[0.18em] text-muted">
            Gestione competizioni
          </p>
          <h1 class="font-display text-3xl uppercase">Tornei</h1>
        </div>
        <button
          type="button"
          [disabled]="loading()"
          class="rounded-lg bg-surface px-4 py-2 text-sm font-bold uppercase tracking-wide shadow-sm ring-1 ring-black/15 transition hover:bg-surface-muted disabled:opacity-60"
          (click)="load()"
        >
          {{ loading() ? "Aggiornamento..." : "Aggiorna" }}
        </button>
      </div>

      @if (error()) {
        <p class="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {{ error() }}
        </p>
      }

      <lfg-kpi-panel title="KPI tornei" storageKey="tournaments">
        <section class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <lfg-summary-card
            label="Tornei"
            [value]="tournaments().length.toString()"
            [hint]="publishedCount() + ' pubblicati'"
          />
          <lfg-summary-card
            label="Squadre/iscritti"
            [value]="teamCount().toString()"
            [hint]="paidTeamCount() + ' pagati'"
            tone="income"
          />
          <lfg-summary-card
            label="Partite"
            [value]="matchCount().toString()"
            [hint]="completedMatchCount() + ' completate'"
          />
          <lfg-summary-card
            label="Risultati aperti"
            [value]="openMatchCount().toString()"
            hint="Da aggiornare"
            [tone]="openMatchCount() ? 'warning' : 'income'"
          />
        </section>
      </lfg-kpi-panel>

      @if (!tournaments().length && !loading()) {
        <lfg-empty-state
          title="Nessun torneo disponibile"
          text="Crea o sincronizza i tornei dalla sezione iscrizioni."
        />
      } @else {
        <section class="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          @for (tournament of tournaments(); track tournament.id) {
            <button
              type="button"
              class="min-w-0 rounded-lg border px-4 py-3 text-left transition"
              [class.border-accent]="selectedTournamentId() === tournament.id"
              [class.bg-accent]="selectedTournamentId() === tournament.id"
              [class.text-on-accent]="selectedTournamentId() === tournament.id"
              [class.border-soft]="selectedTournamentId() !== tournament.id"
              [class.bg-surface]="selectedTournamentId() !== tournament.id"
              (click)="selectTournament(tournament.id)"
            >
              <span class="block truncate text-sm font-black uppercase">
                {{ tournament.name }}
              </span>
              <span class="mt-1 block text-[11px] font-semibold opacity-70">
                {{ tournament.tournament_teams.length }} iscrizioni
              </span>
            </button>
          }
        </section>

        @if (activeTournament(); as tournament) {
          <section class="rounded-lg border border-soft bg-surface p-4 shadow-sm">
            <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div class="flex flex-wrap items-center gap-2">
                  <h2 class="font-display text-2xl uppercase">
                    {{ tournament.name }}
                  </h2>
                  <lfg-status-badge
                    [label]="tournamentStatusLabel(tournament.status)"
                    [className]="tournamentStatusClass(tournament.status)"
                  />
                  @if (
                    tournament.public_status !== "registrations_open" ||
                    tournament.status !== "registrations_open"
                  ) {
                    <lfg-status-badge
                      [label]="publicStatusLabel(tournament.public_status)"
                      [className]="publicStatusClass(tournament.public_status)"
                    />
                  }
                </div>
                <p class="mt-2 text-sm font-semibold text-muted">
                  {{ tournament.tournament_teams.length }} iscrizioni ·
                  {{ tournament.tournament_groups.length }} gironi ·
                  {{ tournament.tournament_matches.length }} partite
                </p>
              </div>
              <div class="grid grid-cols-3 gap-2 text-center lg:min-w-80">
                <div class="rounded-lg bg-surface-muted px-3 py-2">
                  <p class="text-lg font-black">{{ paidFor(tournament) }}</p>
                  <p class="text-[10px] font-bold uppercase text-muted">
                    Pagate
                  </p>
                </div>
                <div class="rounded-lg bg-surface-muted px-3 py-2">
                  <p class="text-lg font-black">
                    {{ tournament.tournament_matches.length }}
                  </p>
                  <p class="text-[10px] font-bold uppercase text-muted">
                    Match
                  </p>
                </div>
                <div class="rounded-lg bg-surface-muted px-3 py-2">
                  <p class="text-lg font-black">
                    {{ completedFor(tournament) }}
                  </p>
                  <p class="text-[10px] font-bold uppercase text-muted">
                    Chiusi
                  </p>
                </div>
              </div>
            </div>
          </section>

          <nav class="grid grid-cols-2 gap-2 sm:grid-cols-5">
            @for (tab of tabs; track tab.id) {
              <button
                type="button"
                class="rounded-lg border px-3 py-2.5 text-xs font-black uppercase tracking-wide transition"
                [class.border-accent]="activeTab() === tab.id"
                [class.bg-accent]="activeTab() === tab.id"
                [class.text-on-accent]="activeTab() === tab.id"
                [class.border-soft]="activeTab() !== tab.id"
                [class.bg-surface]="activeTab() !== tab.id"
                (click)="activeTab.set(tab.id)"
              >
                {{ tab.label }}
              </button>
            }
          </nav>

          @if (activeTab() === "teams") {
            <section class="grid min-w-0 max-w-full gap-2 sm:grid-cols-2 xl:grid-cols-3">
              @for (team of tournament.tournament_teams; track team.id) {
                <article class="w-full min-w-0 max-w-full overflow-hidden rounded-lg border border-soft bg-surface p-4 shadow-sm">
                  <div class="grid min-w-0 gap-2 sm:flex sm:items-start sm:justify-between sm:gap-3">
                    <div class="min-w-0">
                      <p class="truncate text-lg font-black">{{ team.name }}</p>
                      <p class="mt-1 text-xs font-semibold text-muted">
                        {{ team.team_participants.length }} partecipanti
                      </p>
                    </div>
                    <div class="justify-self-start sm:shrink-0">
                      <lfg-status-badge
                        [label]="team.paid ? 'Pagata' : 'Da pagare'"
                        [className]="team.paid ? 'state-success' : 'state-warning'"
                      />
                    </div>
                  </div>
                  @if (team.captain_name || team.vice_captain_name) {
                    <div class="mt-3 min-w-0 rounded-lg bg-surface-muted p-3 text-sm">
                      @if (team.captain_name) {
                        <p class="truncate">
                          <span class="font-bold">Capitano:</span>
                          {{ team.captain_name }}
                        </p>
                      }
                      @if (team.vice_captain_name) {
                        <p class="mt-1 truncate">
                          <span class="font-bold">Vice:</span>
                          {{ team.vice_captain_name }}
                        </p>
                      }
                    </div>
                  }
                </article>
              }
            </section>
          }

          @if (activeTab() === "groups") {
            <section class="space-y-4">
              <div class="rounded-lg border border-soft bg-surface p-4 shadow-sm">
                <div class="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
                  <div>
                    <p class="text-xs font-bold uppercase tracking-[0.18em] text-muted">
                      Sorteggio gironi
                    </p>
                    <p class="mt-1 text-sm font-semibold text-muted">
                      Genera gironi e calendario iniziale. L'operazione sostituisce gironi,
                      partite e classifiche già presenti per questo torneo.
                    </p>
                  </div>
                  <div class="grid gap-2 sm:grid-cols-[8rem_1fr] lg:flex">
                    <label class="grid gap-1 text-xs font-bold uppercase text-muted">
                      Gironi
                      <input
                        type="number"
                        min="1"
                        max="12"
                        [(ngModel)]="groupCount"
                        class="w-full rounded-lg border border-soft bg-surface-muted px-3 py-3 text-base font-black text-primary lg:w-24"
                      />
                    </label>
                    <button
                      type="button"
                      class="bg-strong text-on-strong rounded-lg px-4 py-3 text-sm font-black uppercase disabled:opacity-60 lg:self-end"
                      [disabled]="!tournament.tournament_teams.length || generating()"
                      (click)="askGenerateGroups(tournament)"
                    >
                      Genera
                    </button>
                    @if (auth.isAdmin()) {
                      <button
                        type="button"
                        class="state-danger rounded-lg border px-4 py-3 text-sm font-black uppercase disabled:opacity-60 lg:self-end"
                        [disabled]="
                          generating() ||
                          (!tournament.tournament_groups.length &&
                            !tournament.tournament_matches.length &&
                            !tournament.tournament_standings.length)
                        "
                        (click)="askResetSchedule(tournament)"
                      >
                        Reset
                      </button>
                    }
                  </div>
                </div>
                @if (lastGenerateResult()) {
                  <p class="mt-3 rounded-lg bg-surface-muted p-3 text-sm font-semibold">
                    {{ generateResultLabel(lastGenerateResult()!) }}
                  </p>
                }
                @if (lastResetResult()) {
                  <p class="mt-3 rounded-lg bg-surface-muted p-3 text-sm font-semibold">
                    {{ resetResultLabel(lastResetResult()!) }}
                  </p>
                }
              </div>

              @if (!tournament.tournament_groups.length) {
                <lfg-empty-state
                  title="Gironi non generati"
                  text="Scegli il numero di gironi e conferma il sorteggio."
                />
              } @else {
                <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  @for (group of tournament.tournament_groups; track group.id) {
                    <article class="rounded-lg border border-soft bg-surface p-4 shadow-sm">
                      <h3 class="font-display text-xl uppercase">{{ group.name }}</h3>
                      <div class="mt-3 grid gap-2">
                        @for (item of group.tournament_group_teams ?? []; track item.id) {
                          <div class="flex items-center justify-between gap-3 rounded-lg bg-surface-muted px-3 py-2">
                            <span class="font-bold">
                              {{ item.tournament_teams?.name || "Squadra" }}
                            </span>
                            @if (item.seed) {
                              <span class="text-xs font-black text-muted">
                                #{{ item.seed }}
                              </span>
                            }
                          </div>
                        }
                      </div>
                    </article>
                  }
                </div>
              }
            </section>
          }

          @if (activeTab() === "matches") {
            <section class="grid gap-3 lg:grid-cols-2">
              @if (!tournament.tournament_matches.length) {
                <lfg-empty-state
                  title="Calendario non generato"
                  text="Genera i gironi per creare automaticamente le partite."
                />
              }
              @for (match of tournament.tournament_matches; track match.id) {
                <article class="rounded-lg border border-soft bg-surface p-4 shadow-sm">
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

                  <div class="mt-4 grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
                    <div class="grid grid-cols-[1fr_5rem] items-center gap-3 rounded-lg bg-surface-muted p-3 sm:block sm:bg-transparent sm:p-0">
                      <p class="min-w-0 truncate text-base font-black sm:text-right">
                        {{ match.home_team?.name || "Casa" }}
                      </p>
                      <input
                        type="number"
                        min="0"
                        inputmode="numeric"
                        [(ngModel)]="match.home_score"
                        class="h-14 rounded-lg border border-soft bg-surface text-center text-2xl font-black sm:mt-3 sm:w-20 sm:bg-surface-muted"
                        [class.border-red-400]="match.home_score < 0"
                      />
                    </div>

                    <div class="hidden text-center text-xs font-black uppercase text-muted sm:block">
                      vs
                    </div>

                    <div class="grid grid-cols-[1fr_5rem] items-center gap-3 rounded-lg bg-surface-muted p-3 sm:block sm:bg-transparent sm:p-0">
                      <p class="min-w-0 truncate text-base font-black">
                        {{ match.away_team?.name || "Trasferta" }}
                      </p>
                      <input
                        type="number"
                        min="0"
                        inputmode="numeric"
                        [(ngModel)]="match.away_score"
                        class="h-14 rounded-lg border border-soft bg-surface text-center text-2xl font-black sm:mt-3 sm:w-20 sm:bg-surface-muted"
                        [class.border-red-400]="match.away_score < 0"
                      />
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
                </article>
              }
            </section>
          }

          @if (activeTab() === "standings") {
            <section class="grid gap-4 lg:grid-cols-2">
              @if (!tournament.tournament_standings.length) {
                <lfg-empty-state
                  title="Classifiche non disponibili"
                  text="Le classifiche vengono create dopo la generazione dei gironi."
                />
              }
              @for (group of tournament.tournament_groups; track group.id) {
                <article class="overflow-hidden rounded-lg border border-soft bg-surface shadow-sm">
                  <header class="border-b border-soft px-4 py-3">
                    <h3 class="font-display text-xl uppercase">{{ group.name }}</h3>
                  </header>
                  <div class="hidden overflow-x-auto sm:block">
                    <table class="w-full min-w-[34rem] text-sm">
                      <thead class="bg-surface-muted text-left text-[10px] uppercase tracking-wide text-muted">
                        <tr>
                          <th class="px-3 py-2">#</th>
                          <th class="px-3 py-2">Squadra</th>
                          <th class="px-3 py-2 text-right">Pt</th>
                          <th class="px-3 py-2 text-right">G</th>
                          <th class="px-3 py-2 text-right">V</th>
                          <th class="px-3 py-2 text-right">N</th>
                          <th class="px-3 py-2 text-right">P</th>
                          <th class="px-3 py-2 text-right">DR</th>
                        </tr>
                      </thead>
                      <tbody>
                        @for (standing of standingsFor(tournament, group.id); track standing.id) {
                          <tr class="border-t border-soft">
                            <td class="px-3 py-2 font-black">{{ standing.rank }}</td>
                            <td class="px-3 py-2 font-bold">
                              {{ standing.tournament_teams?.name || "Squadra" }}
                            </td>
                            <td class="px-3 py-2 text-right font-black">{{ standing.points }}</td>
                            <td class="px-3 py-2 text-right">{{ standing.played }}</td>
                            <td class="px-3 py-2 text-right">{{ standing.wins }}</td>
                            <td class="px-3 py-2 text-right">{{ standing.draws }}</td>
                            <td class="px-3 py-2 text-right">{{ standing.losses }}</td>
                            <td class="px-3 py-2 text-right">{{ standing.goal_diff }}</td>
                          </tr>
                        }
                      </tbody>
                    </table>
                  </div>
                  <div class="grid gap-2 p-3 sm:hidden">
                    @for (standing of standingsFor(tournament, group.id); track standing.id) {
                      <div class="rounded-lg bg-surface-muted p-3">
                        <div class="flex items-start justify-between gap-3">
                          <div class="min-w-0">
                            <p class="truncate text-sm font-black">
                              {{ standing.rank }}. {{ standing.tournament_teams?.name || "Squadra" }}
                            </p>
                            <p class="mt-1 text-xs font-semibold text-muted">
                              {{ standing.played }} giocate · DR {{ standing.goal_diff }}
                            </p>
                          </div>
                          <div class="text-right">
                            <p class="text-xl font-black">{{ standing.points }}</p>
                            <p class="text-[10px] font-bold uppercase text-muted">Pt</p>
                          </div>
                        </div>
                        <div class="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                          <div class="rounded-md bg-surface px-2 py-1.5">
                            <p class="font-black">{{ standing.wins }}</p>
                            <p class="text-[10px] uppercase text-muted">V</p>
                          </div>
                          <div class="rounded-md bg-surface px-2 py-1.5">
                            <p class="font-black">{{ standing.draws }}</p>
                            <p class="text-[10px] uppercase text-muted">N</p>
                          </div>
                          <div class="rounded-md bg-surface px-2 py-1.5">
                            <p class="font-black">{{ standing.losses }}</p>
                            <p class="text-[10px] uppercase text-muted">P</p>
                          </div>
                        </div>
                      </div>
                    }
                  </div>
                </article>
              }
            </section>
          }

          @if (activeTab() === "publication") {
            <section class="rounded-lg border border-soft bg-surface p-4 shadow-sm">
              @if (!auth.isAdmin()) {
                <p class="rounded-lg bg-surface-muted p-4 text-sm font-semibold text-muted">
                  La pubblicazione sul sito pubblico è riservata agli admin.
                </p>
              } @else {
                <div class="grid gap-4 sm:grid-cols-2">
                  <label class="grid gap-1 text-sm font-bold">
                    Stato operativo
                    <select
                      [(ngModel)]="tournament.status"
                      class="rounded-lg border border-soft bg-surface-muted px-3 py-3 font-normal"
                    >
                      @for (status of tournamentStatuses; track status.id) {
                        <option [value]="status.id">{{ status.label }}</option>
                      }
                    </select>
                  </label>
                  <label class="grid gap-1 text-sm font-bold">
                    Visibilità pubblica
                    <select
                      [(ngModel)]="tournament.public_status"
                      class="rounded-lg border border-soft bg-surface-muted px-3 py-3 font-normal"
                    >
                      @for (status of publicStatuses; track status.id) {
                        <option [value]="status.id">{{ status.label }}</option>
                      }
                    </select>
                  </label>
                </div>
                <div class="mt-4 rounded-lg bg-surface-muted p-4 text-sm font-semibold leading-6 text-muted">
                  <p>
                    <span class="font-black text-primary">Nascosto:</span>
                    non compare sul sito.
                  </p>
                  <p>
                    <span class="font-black text-primary">Iscrizioni aperte:</span>
                    visibile nei form pubblici.
                  </p>
                  <p>
                    <span class="font-black text-primary">Pubblicato:</span>
                    mostra calendario e risultati.
                  </p>
                  <p>
                    <span class="font-black text-primary">Risultati pubblici:</span>
                    mostra anche le classifiche.
                  </p>
                </div>
                <button
                  type="button"
                  class="bg-strong text-on-strong mt-4 rounded-lg px-4 py-3 text-sm font-black uppercase disabled:opacity-60"
                  [disabled]="savingPublication()"
                  (click)="savePublication(tournament)"
                >
                  {{ savingPublication() ? "Salvataggio..." : "Salva pubblicazione" }}
                </button>
              }
            </section>
          }
        }
      }
    </section>

    <lfg-confirm
      [open]="!!pendingGenerateTournament()"
      confirmLabel="Genera"
      [message]="generateConfirmMessage()"
      (confirm)="confirmGenerateGroups()"
      (cancel)="pendingGenerateTournament.set(null)"
    />

    <lfg-confirm
      [open]="!!pendingResetTournament()"
      confirmLabel="Reset"
      [message]="resetConfirmMessage()"
      (confirm)="confirmResetSchedule()"
      (cancel)="pendingResetTournament.set(null)"
    />
  `,
})
export class TournamentsComponent implements OnInit {
  readonly auth = inject(AuthService);
  private readonly service = inject(TournamentsService);
  private readonly snackbar = inject(SnackbarService);

  readonly tabs: { id: TournamentTab; label: string }[] = [
    { id: "teams", label: "Squadre" },
    { id: "groups", label: "Gironi" },
    { id: "matches", label: "Partite" },
    { id: "standings", label: "Classifiche" },
    { id: "publication", label: "Pubblicazione" },
  ];

  readonly matchStatuses: { id: TournamentMatchStatus; label: string }[] = [
    { id: "scheduled", label: "Programmata" },
    { id: "live", label: "Live" },
    { id: "completed", label: "Completata" },
    { id: "cancelled", label: "Annullata" },
  ];

  readonly tournamentStatuses: { id: TournamentStatus; label: string }[] = [
    { id: "draft", label: "Bozza" },
    { id: "registrations_open", label: "Iscrizioni aperte" },
    { id: "registrations_closed", label: "Iscrizioni chiuse" },
    { id: "groups_generated", label: "Gironi generati" },
    { id: "in_progress", label: "In corso" },
    { id: "completed", label: "Completato" },
    { id: "archived", label: "Archiviato" },
  ];

  readonly publicStatuses: { id: TournamentPublicStatus; label: string }[] = [
    { id: "hidden", label: "Nascosto" },
    { id: "registrations_open", label: "Iscrizioni aperte" },
    { id: "published", label: "Pubblicato" },
    { id: "results_published", label: "Risultati pubblici" },
  ];

  tournaments = signal<OperationalTournament[]>([]);
  selectedTournamentId = signal<string | null>(null);
  activeTab = signal<TournamentTab>("teams");
  loading = signal(false);
  generating = signal(false);
  savingPublication = signal(false);
  savingMatchId = signal<string | null>(null);
  pendingGenerateTournament = signal<OperationalTournament | null>(null);
  pendingResetTournament = signal<OperationalTournament | null>(null);
  lastGenerateResult = signal<GenerateGroupStageResult | null>(null);
  lastResetResult = signal<ResetTournamentScheduleResult | null>(null);
  error = signal("");
  groupCount = 2;

  activeTournament = computed(() => {
    const id = this.selectedTournamentId();
    return this.tournaments().find((tournament) => tournament.id === id);
  });

  ngOnInit(): void {
    void this.load();
  }

  async load(): Promise<void> {
    if (this.loading()) return;
    this.loading.set(true);
    this.error.set("");
    try {
      const tournaments = await this.service.listOperational();
      this.tournaments.set(tournaments);
      if (
        !this.selectedTournamentId() ||
        !tournaments.some(
          (tournament) => tournament.id === this.selectedTournamentId(),
        )
      ) {
        this.selectedTournamentId.set(tournaments[0]?.id ?? null);
      }
    } catch (error) {
      this.setError(error);
    } finally {
      this.loading.set(false);
    }
  }

  selectTournament(id: string): void {
    this.selectedTournamentId.set(id);
    this.lastGenerateResult.set(null);
    this.lastResetResult.set(null);
  }

  askGenerateGroups(tournament: OperationalTournament): void {
    this.pendingGenerateTournament.set(tournament);
  }

  askResetSchedule(tournament: OperationalTournament): void {
    if (!this.auth.isAdmin()) return;
    this.pendingResetTournament.set(tournament);
  }

  async confirmGenerateGroups(): Promise<void> {
    const tournament = this.pendingGenerateTournament();
    this.pendingGenerateTournament.set(null);
    if (!tournament || this.generating()) return;

    this.generating.set(true);
    this.error.set("");
    try {
      const result = await this.service.generateGroupStage(
        tournament.id,
        this.groupCount,
      );
      this.lastGenerateResult.set(result);
      this.lastResetResult.set(null);
      this.snackbar.success(this.generateResultLabel(result));
      await this.load();
      this.activeTab.set("groups");
    } catch (error) {
      this.setError(error);
    } finally {
      this.generating.set(false);
    }
  }

  async confirmResetSchedule(): Promise<void> {
    const tournament = this.pendingResetTournament();
    this.pendingResetTournament.set(null);
    if (!tournament || this.generating() || !this.auth.isAdmin()) return;

    this.generating.set(true);
    this.error.set("");
    try {
      const result = await this.service.resetTournamentSchedule(tournament.id);
      this.lastResetResult.set(result);
      this.lastGenerateResult.set(null);
      this.snackbar.success(this.resetResultLabel(result));
      await this.load();
      this.activeTab.set("groups");
    } catch (error) {
      this.setError(error);
    } finally {
      this.generating.set(false);
    }
  }

  async saveMatch(match: TournamentMatch): Promise<void> {
    if (!this.canSaveMatch(match) || this.savingMatchId()) return;
    this.savingMatchId.set(match.id);
    this.error.set("");
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
      await this.load();
    } catch (error) {
      this.setError(error);
    } finally {
      this.savingMatchId.set(null);
    }
  }

  async savePublication(tournament: OperationalTournament): Promise<void> {
    if (!this.auth.isAdmin() || this.savingPublication()) return;
    this.savingPublication.set(true);
    this.error.set("");
    try {
      const publishedAt =
        tournament.public_status === "published" ||
        tournament.public_status === "results_published"
          ? tournament.published_at ?? new Date().toISOString()
          : null;
      await this.service.updatePublication(tournament.id, {
        status: tournament.status,
        public_status: tournament.public_status,
        published_at: publishedAt,
      });
      this.snackbar.success("Pubblicazione aggiornata.");
      await this.load();
    } catch (error) {
      this.setError(error);
    } finally {
      this.savingPublication.set(false);
    }
  }

  setMatchStart(match: TournamentMatch, value: string): void {
    match.starts_at = value ? new Date(value).toISOString() : null;
  }

  canSaveMatch(match: TournamentMatch): boolean {
    return Number(match.home_score) >= 0 && Number(match.away_score) >= 0;
  }

  standingsFor(
    tournament: OperationalTournament,
    groupId: string,
  ): TournamentStanding[] {
    return tournament.tournament_standings.filter(
      (standing) => standing.group_id === groupId,
    );
  }

  generateConfirmMessage(): string {
    const tournament = this.pendingGenerateTournament();
    if (!tournament) return "";
    return `Generare ${this.groupCount} gironi per ${tournament.name}? Verranno sostituiti gironi, partite e classifiche esistenti.`;
  }

  resetConfirmMessage(): string {
    const tournament = this.pendingResetTournament();
    if (!tournament) return "";
    return `Resettare gironi, calendario, risultati e classifiche di ${tournament.name}? Le iscrizioni e le squadre resteranno intatte.`;
  }

  generateResultLabel(result: GenerateGroupStageResult): string {
    return `${result.groups_created} gironi, ${result.teams_assigned} squadre assegnate, ${result.matches_created} partite create.`;
  }

  resetResultLabel(result: ResetTournamentScheduleResult): string {
    return `${result.groups_deleted} gironi, ${result.matches_deleted} partite e ${result.standings_deleted} righe classifica rimosse.`;
  }

  teamCount(): number {
    return this.tournaments().reduce(
      (sum, tournament) => sum + tournament.tournament_teams.length,
      0,
    );
  }

  paidTeamCount(): number {
    return this.tournaments().reduce(
      (sum, tournament) =>
        sum + tournament.tournament_teams.filter((team) => team.paid).length,
      0,
    );
  }

  matchCount(): number {
    return this.tournaments().reduce(
      (sum, tournament) => sum + tournament.tournament_matches.length,
      0,
    );
  }

  completedMatchCount(): number {
    return this.tournaments().reduce(
      (sum, tournament) =>
        sum +
        tournament.tournament_matches.filter(
          (match) => match.status === "completed",
        ).length,
      0,
    );
  }

  openMatchCount(): number {
    return this.matchCount() - this.completedMatchCount();
  }

  publishedCount(): number {
    return this.tournaments().filter(
      (tournament) =>
        tournament.public_status === "published" ||
        tournament.public_status === "results_published",
    ).length;
  }

  paidFor(tournament: OperationalTournament): number {
    return tournament.tournament_teams.filter((team) => team.paid).length;
  }

  completedFor(tournament: OperationalTournament): number {
    return tournament.tournament_matches.filter(
      (match) => match.status === "completed",
    ).length;
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
    return (
      this.matchStatuses.find((item) => item.id === status)?.label ??
      "Programmata"
    );
  }

  matchStatusClass(status: TournamentMatchStatus): string {
    return (
      {
        scheduled: "state-neutral",
        live: "state-warning",
        completed: "state-success",
        cancelled: "state-danger",
      } satisfies Record<TournamentMatchStatus, string>
    )[status];
  }

  tournamentStatusLabel(status: TournamentStatus): string {
    return (
      this.tournamentStatuses.find((item) => item.id === status)?.label ??
      "Iscrizioni aperte"
    );
  }

  tournamentStatusClass(status: TournamentStatus): string {
    if (status === "completed") return "state-success";
    if (status === "in_progress" || status === "groups_generated") {
      return "state-warning";
    }
    if (status === "archived") return "state-neutral";
    return "state-info";
  }

  publicStatusLabel(status: TournamentPublicStatus): string {
    return (
      this.publicStatuses.find((item) => item.id === status)?.label ??
      "Nascosto"
    );
  }

  publicStatusClass(status: TournamentPublicStatus): string {
    if (status === "hidden") return "state-neutral";
    if (status === "results_published") return "state-success";
    return "state-info";
  }

  private setError(error: unknown): void {
    const message =
      error instanceof Error ? error.message : "Operazione non riuscita.";
    this.error.set(message);
    this.snackbar.error(message);
  }
}

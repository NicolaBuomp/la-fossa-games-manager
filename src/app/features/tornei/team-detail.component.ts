import { Component, OnInit, computed, inject, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { AuthService } from "../../core/services/auth.service";
import { RegistrationsService } from "../../core/services/registrations.service";
import { SnackbarService } from "../../core/services/snackbar.service";
import { TournamentsService } from "../../core/services/tournaments.service";
import {
  DEFAULT_TOURNAMENT_CODE,
  DIRECT_TOURNAMENT_CODES,
  DUO_TOURNAMENT_CODES,
  TOURNAMENT_MIN_PARTICIPANTS_BY_CODE,
} from "../../core/types/constants";
import {
  InsertTeamParticipant,
  InsertTournamentTeam,
  OperationalTournament,
  TournamentTeamWithParticipants,
} from "../../core/types/models";
import {
  ConfirmModalComponent,
  EmptyStateComponent,
} from "../../shared/components/ui.component";
import { ParticipantModalComponent } from "../registrations/components/participant-modal.component";
import { TeamParticipantRowComponent } from "./components/team-participant-row.component";

@Component({
  selector: "lfg-team-detail",
  standalone: true,
  imports: [
    FormsModule,
    EmptyStateComponent,
    ConfirmModalComponent,
    ParticipantModalComponent,
    TeamParticipantRowComponent,
  ],
  template: `
    @if (loading() && !team()) {
      <div
        class="bg-strong -mx-4 -mt-4 mb-6 px-4 pb-6 pt-5 sm:-mx-6 sm:-mt-6 sm:px-6"
      >
        <div class="h-4 w-40 animate-pulse rounded bg-white/10 mb-3"></div>
        <div class="h-8 w-56 animate-pulse rounded bg-white/10"></div>
      </div>
    } @else if (!team()) {
      <lfg-empty-state
        title="Squadra non trovata"
        text="La squadra richiesta non esiste o è stata rimossa."
      />
    } @else {
      <!-- HERO HEADER DARK -->
      <header
        class="bg-strong text-on-strong -mx-4 -mt-4 px-4 pb-5 pt-5 sm:-mx-6 sm:-mt-6 sm:px-6"
      >
        <!-- Breadcrumb back -->
        <button
          type="button"
          class="mb-3 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide opacity-60 hover:opacity-100 transition-opacity"
          (click)="goBack()"
        >
          ← {{ tournament()?.name || "Tornei" }} / Iscritti
        </button>

        <!-- Team name + paid badge -->
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div class="min-w-0">
            <h1
              class="font-display text-2xl uppercase leading-tight sm:text-3xl"
            >
              {{ team()!.name }}
            </h1>
            @if (team()!.captain_name) {
              <p class="mt-1 text-xs font-semibold opacity-70">
                Cap: {{ team()!.captain_name }}
                @if (team()!.captain_contact) {
                  · {{ team()!.captain_contact }}
                }
              </p>
            }
            @if (team()!.vice_captain_name) {
              <p class="text-xs font-semibold opacity-60">
                Vice: {{ team()!.vice_captain_name }}
                @if (team()!.vice_captain_contact) {
                  · {{ team()!.vice_captain_contact }}
                }
              </p>
            }
          </div>
          <!-- Tappable paid badge -->
          <button
            type="button"
            class="rounded-lg border px-3 py-2 text-sm font-black uppercase tracking-wide transition"
            [class.state-success]="team()!.paid"
            [class.state-warning]="!team()!.paid"
            (click)="togglePaidConfirm()"
          >
            {{ team()!.paid ? "✓ Pagato" : "⚠ Da pagare" }}
          </button>
        </div>

        <!-- Team meta -->
        <p class="mt-3 text-xs font-semibold opacity-50">
          {{ participantCount(team()!) }} partecipanti
          @if (tournament()?.fee) {
            · Quota: €{{ tournament()!.fee }}
          }
          @if (team()!.created_at) {
            · Iscritto il {{ dateLabel(team()!.created_at) }}
          }
        </p>
      </header>

      <div class="space-y-5 pt-6">
        @if (error()) {
          <p
            class="form-error"
          >
            {{ error() }}
          </p>
        }

        <!-- Sezione modifica dettagli (espandibile) -->
        @if (auth.isAdmin()) {
          <section
            class="rounded-xl border border-soft bg-surface shadow-sm overflow-hidden"
          >
            <button
              type="button"
              class="flex w-full items-center justify-between px-4 py-3 text-sm font-black uppercase tracking-wide transition hover:bg-surface-muted"
              (click)="editExpanded.set(!editExpanded())"
            >
              <span>Modifica dettagli</span>
              <span
                class="text-muted transition-transform duration-200"
                [style.transform]="editExpanded() ? 'rotate(180deg)' : ''"
              >
                ▾
              </span>
            </button>

            @if (editExpanded()) {
              <div class="border-t border-soft px-4 pb-4 pt-3 animate-fade-in">
                <div class="grid gap-3 sm:grid-cols-2">
                  <label
                    class="col-span-full grid gap-1 text-xs font-bold uppercase text-muted"
                  >
                    Nome squadra <span class="text-red-400">*</span>
                    <input
                      type="text"
                      [(ngModel)]="teamForm.name"
                      class="rounded-lg border border-soft bg-surface-muted px-3 py-2.5 text-sm font-normal"
                    />
                  </label>
                  <label
                    class="grid gap-1 text-xs font-bold uppercase text-muted"
                  >
                    Capitano
                    <input
                      type="text"
                      [(ngModel)]="teamForm.captain_name"
                      class="rounded-lg border border-soft bg-surface-muted px-3 py-2.5 text-sm font-normal"
                    />
                  </label>
                  <label
                    class="grid gap-1 text-xs font-bold uppercase text-muted"
                  >
                    Tel capitano
                    <input
                      type="tel"
                      [(ngModel)]="teamForm.captain_contact"
                      class="rounded-lg border border-soft bg-surface-muted px-3 py-2.5 text-sm font-normal"
                    />
                  </label>
                  <label
                    class="grid gap-1 text-xs font-bold uppercase text-muted"
                  >
                    Vicecapitano
                    <input
                      type="text"
                      [(ngModel)]="teamForm.vice_captain_name"
                      class="rounded-lg border border-soft bg-surface-muted px-3 py-2.5 text-sm font-normal"
                    />
                  </label>
                  <label
                    class="grid gap-1 text-xs font-bold uppercase text-muted"
                  >
                    Tel vice
                    <input
                      type="tel"
                      [(ngModel)]="teamForm.vice_captain_contact"
                      class="rounded-lg border border-soft bg-surface-muted px-3 py-2.5 text-sm font-normal"
                    />
                  </label>
                  <label
                    class="col-span-full grid gap-1 text-xs font-bold uppercase text-muted"
                  >
                    Note
                    <textarea
                      [(ngModel)]="teamForm.notes"
                      rows="2"
                      class="rounded-lg border border-soft bg-surface-muted px-3 py-2.5 text-sm font-normal"
                    ></textarea>
                  </label>
                </div>
                <div class="mt-3 flex gap-2">
                  <button
                    type="button"
                    class="bg-accent text-on-accent rounded-lg px-4 py-2.5 text-xs font-black uppercase disabled:opacity-60"
                    [disabled]="savingTeam() || !teamForm.name"
                    (click)="saveTeam()"
                  >
                    {{ savingTeam() ? "Salvataggio..." : "Salva" }}
                  </button>
                  <button
                    type="button"
                    class="rounded-lg border border-soft bg-surface-muted px-4 py-2.5 text-xs font-bold uppercase"
                    (click)="editExpanded.set(false)"
                  >
                    Annulla
                  </button>
                </div>
              </div>
            }
          </section>
        }

        <!-- Roster giocatori -->
        <section>
          <div class="mb-3 flex items-center justify-between gap-3">
            <h2
              class="text-xs font-bold uppercase tracking-[0.18em] text-muted"
            >
              {{ isDirect() ? "Partecipanti" : "Giocatori" }}
            </h2>
            @if (auth.isAdmin() && !isDirect() && canAddParticipant()) {
              <!-- Desktop add button -->
              <button
                type="button"
                class="hidden sm:inline-flex bg-strong text-on-strong rounded-lg px-3 py-1.5 text-xs font-black uppercase"
                (click)="openAddParticipant()"
              >
                + Aggiungi
              </button>
            }
          </div>

          @if (!team()!.team_participants.length) {
            <lfg-empty-state
              title="Nessun partecipante"
              [text]="
                isDirect()
                  ? 'Nessun partecipante registrato.'
                  : 'Aggiungi il primo giocatore con il pulsante.'
              "
            />
          } @else {
            <div class="space-y-2">
              @for (
                participant of sortedParticipants();
                track participant.id;
                let i = $index
              ) {
                <div
                  style="animation: cardIn 0.3s ease both;"
                  [style.animation-delay]="i * 50 + 'ms'"
                >
                  <lfg-team-participant-row
                    [participant]="participant"
                    [isAdmin]="auth.isAdmin()"
                    [isFipavSport]="isFipavSport()"
                    (save)="saveParticipant(participant.id, $event)"
                    (delete)="askDeleteParticipant($event)"
                  />
                </div>
              }
            </div>
          }
        </section>
      </div>

      <!-- Mobile FAB aggiungi giocatore -->
      @if (auth.isAdmin() && !isDirect() && canAddParticipant()) {
        <button
          type="button"
          class="bg-accent text-on-accent fixed bottom-24 right-5 z-30 flex h-14 w-14 items-center justify-center rounded-full shadow-lg text-2xl font-black sm:hidden"
          style="line-height:1"
          (click)="openAddParticipant()"
          aria-label="Aggiungi giocatore"
        >
          +
        </button>
      }

      <!-- Add participant modal -->
      <lfg-participant-modal
        [open]="() => addParticipantOpen()"
        [isFipavSport]="() => isFipavSport()"
        [formValue]="participantForm"
        [editing]="false"
        [loading]="savingParticipant"
        [error]="modalError"
        (close)="addParticipantOpen.set(false)"
        (save)="createParticipant($event)"
      />

      <!-- Confirm paid toggle -->
      <lfg-confirm
        [open]="!!confirmPending()"
        [message]="confirmMessage()"
        (confirm)="doConfirm()"
        (cancel)="confirmPending.set(null)"
      />
    }
  `,
  styles: [
    `
      @keyframes cardIn {
        from {
          opacity: 0;
          transform: translateY(6px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
    `,
  ],
})
export class TeamDetailComponent implements OnInit {
  readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly registrationsService = inject(RegistrationsService);
  private readonly tournamentsService = inject(TournamentsService);
  private readonly snackbar = inject(SnackbarService);

  team = signal<TournamentTeamWithParticipants | null>(null);
  tournament = signal<OperationalTournament | null>(null);
  loading = signal(false);
  error = signal("");
  editExpanded = signal(false);
  savingTeam = signal(false);
  savingParticipant = signal(false);
  addParticipantOpen = signal(false);
  modalError = signal("");
  confirmPending = signal<(() => Promise<void>) | null>(null);
  confirmMessage = signal("");

  teamForm: Partial<InsertTournamentTeam> = {};
  participantForm: InsertTeamParticipant = this.emptyParticipantForm();

  isDirect = computed(() =>
    DIRECT_TOURNAMENT_CODES.includes(this.tournament()?.code ?? ""),
  );
  isDuo = computed(() =>
    DUO_TOURNAMENT_CODES.includes(this.tournament()?.code ?? ""),
  );
  isFipavSport = computed(
    () => this.tournament()?.code === DEFAULT_TOURNAMENT_CODE.Volleyball,
  );

  sortedParticipants = computed(() => {
    const participants = this.team()?.team_participants ?? [];
    return [...participants].sort((a, b) =>
      `${a.last_name} ${a.first_name}`.localeCompare(
        `${b.last_name} ${b.first_name}`,
        "it",
      ),
    );
  });

  canAddParticipant = computed(() => {
    const t = this.tournament();
    const team = this.team();
    if (!t || !team) return false;
    const limit = TOURNAMENT_MIN_PARTICIPANTS_BY_CODE[t.code ?? ""] ?? null;
    return !limit || team.team_participants.length < limit;
  });

  ngOnInit(): void {
    void this.load();
  }

  async load(): Promise<void> {
    const teamId = this.route.snapshot.params["teamId"] as string;
    const tournamentId = this.route.snapshot.params["id"] as string;
    if (!teamId) return;
    this.loading.set(true);
    this.error.set("");
    try {
      const [teamData, tournamentData] = await Promise.all([
        this.registrationsService.getTeamWithParticipants(teamId),
        tournamentId
          ? this.tournamentsService.getOperational(tournamentId)
          : Promise.resolve(null),
      ]);
      this.team.set(teamData);
      this.tournament.set(tournamentData);
      if (teamData) {
        this.teamForm = {
          tournament_id: teamData.tournament_id,
          name: teamData.name,
          captain_name: teamData.captain_name,
          captain_contact: teamData.captain_contact ?? "",
          vice_captain_name: teamData.vice_captain_name ?? "",
          vice_captain_contact: teamData.vice_captain_contact ?? "",
          notes: teamData.notes ?? "",
        };
      }
    } catch (err) {
      this.error.set(
        err instanceof Error ? err.message : "Errore nel caricamento.",
      );
    } finally {
      this.loading.set(false);
    }
  }

  goBack(): void {
    const tournamentId = this.route.snapshot.params["id"] as string;
    void this.router.navigate(["/app/tornei", tournamentId], {
      queryParams: { tab: "iscritti" },
    });
  }

  togglePaidConfirm(): void {
    const t = this.team();
    if (!t) return;
    this.confirmMessage.set(
      t.paid ? "Segna come non pagato?" : "Segna come pagato?",
    );
    this.confirmPending.set(async () => {
      try {
        await this.registrationsService.updateTeam(t.id, { paid: !t.paid });
        this.snackbar.success(
          t.paid ? "Segnato come non pagato." : "Segnato come pagato.",
        );
        await this.load();
      } catch (err) {
        this.snackbar.error(err instanceof Error ? err.message : "Errore.");
      }
    });
  }

  async saveTeam(): Promise<void> {
    const t = this.team();
    if (!t || this.savingTeam() || !this.teamForm.name) return;
    this.savingTeam.set(true);
    try {
      await this.registrationsService.updateTeam(t.id, {
        name: (this.teamForm.name ?? "").trim(),
        captain_name: this.teamForm.captain_name?.trim() || null,
        captain_contact: this.teamForm.captain_contact?.trim() || null,
        vice_captain_name: this.teamForm.vice_captain_name?.trim() || null,
        vice_captain_contact:
          this.teamForm.vice_captain_contact?.trim() || null,
        notes: this.teamForm.notes?.trim() || null,
      });
      this.snackbar.success("Squadra aggiornata.");
      this.editExpanded.set(false);
      await this.load();
    } catch (err) {
      this.snackbar.error(err instanceof Error ? err.message : "Errore.");
    } finally {
      this.savingTeam.set(false);
    }
  }

  openAddParticipant(): void {
    const t = this.team();
    if (!t) return;
    this.participantForm = { ...this.emptyParticipantForm(), team_id: t.id };
    this.modalError.set("");
    this.addParticipantOpen.set(true);
  }

  async saveParticipant(
    participantId: string,
    payload: InsertTeamParticipant,
  ): Promise<void> {
    try {
      const t = this.tournament();
      const normalized: InsertTeamParticipant = {
        ...payload,
        first_name: payload.first_name.trim(),
        last_name: payload.last_name.trim(),
        contact: payload.contact?.trim() || null,
        registered:
          t?.code === DEFAULT_TOURNAMENT_CODE.Volleyball
            ? Boolean(payload.registered)
            : false,
      };
      await this.registrationsService.updateParticipant(
        participantId,
        normalized,
      );
      this.snackbar.success("Partecipante aggiornato.");
      await this.load();
    } catch (err) {
      this.snackbar.error(err instanceof Error ? err.message : "Errore.");
    }
  }

  async createParticipant(payload: InsertTeamParticipant): Promise<void> {
    if (this.savingParticipant()) return;
    this.savingParticipant.set(true);
    this.modalError.set("");
    try {
      const t = this.tournament();
      const team = this.team();
      if (team && !this.canAddParticipant()) {
        throw new Error(`Limite partecipanti raggiunto.`);
      }
      const normalized: InsertTeamParticipant = {
        ...payload,
        first_name: payload.first_name.trim(),
        last_name: payload.last_name.trim(),
        contact: payload.contact?.trim() || null,
        registered:
          t?.code === DEFAULT_TOURNAMENT_CODE.Volleyball
            ? Boolean(payload.registered)
            : false,
      };
      await this.registrationsService.createParticipant(normalized);
      this.snackbar.success("Partecipante aggiunto.");
      this.addParticipantOpen.set(false);
      await this.load();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Errore.";
      this.modalError.set(msg);
      this.snackbar.error(msg);
    } finally {
      this.savingParticipant.set(false);
    }
  }

  askDeleteParticipant(participantId: string): void {
    this.confirmMessage.set("Eliminare questo partecipante?");
    this.confirmPending.set(async () => {
      try {
        await this.registrationsService.removeParticipant(participantId);
        this.snackbar.success("Partecipante eliminato.");
        await this.load();
      } catch (err) {
        this.snackbar.error(err instanceof Error ? err.message : "Errore.");
      }
    });
  }

  async doConfirm(): Promise<void> {
    const fn = this.confirmPending();
    this.confirmPending.set(null);
    if (fn) await fn();
  }

  dateLabel(dateStr: string): string {
    try {
      return new Intl.DateTimeFormat("it-IT", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(new Date(dateStr));
    } catch {
      return dateStr;
    }
  }

  participantCount(team: TournamentTeamWithParticipants): number {
    if (team.team_participants.length > 0) return team.team_participants.length;
    let fallback = 0;
    if (team.captain_name?.trim()) fallback += 1;
    if (team.vice_captain_name?.trim()) fallback += 1;
    return fallback;
  }

  private emptyParticipantForm(): InsertTeamParticipant {
    return {
      team_id: "",
      first_name: "",
      last_name: "",
      contact: "",
      registered: false,
    };
  }
}

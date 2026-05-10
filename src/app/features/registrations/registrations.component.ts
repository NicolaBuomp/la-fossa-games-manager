import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { ExportService } from '../../core/services/export.service';
import { LoadingService } from '../../core/services/loading.service';
import { ProfileService } from '../../core/services/profile.service';
import { RegistrationsService } from '../../core/services/registrations.service';
import {
  InsertTeamParticipant,
  InsertTournament,
  InsertTournamentTeam,
  TeamParticipant,
  Tournament,
  TournamentTeamWithParticipants,
  TournamentWithTeams
} from '../../core/types/models';
import { ConfirmModalComponent, EmptyStateComponent, KpiPanelComponent, ModalComponent, StatusBadgeComponent, SummaryCardComponent } from '../../shared/components/ui.component';

type ModalMode = 'tournament' | 'team' | 'participant' | 'direct' | null;
type PaymentFilter = 'all' | 'paid' | 'pending';
type DirectPerson = { first_name: string; last_name: string; contact: string };
type DirectForm = { tournament_id: string; paid: boolean; person1: DirectPerson; person2: DirectPerson };

const SOLO_CODES = ['fifa', 'ping-pong'];
const DUO_CODES = ['briscola', 'calcio-balilla'];
const DIRECT_CODES = [...SOLO_CODES, ...DUO_CODES];

@Component({
  standalone: true,
  imports: [FormsModule, EmptyStateComponent, KpiPanelComponent, ModalComponent, StatusBadgeComponent, SummaryCardComponent, ConfirmModalComponent],
  template: `
    <section class="space-y-4">
      <div class="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p class="text-xs font-bold uppercase tracking-[0.18em] text-neutral-500">Tornei e iscritti</p>
          <h1 class="font-display text-3xl uppercase">Iscrizioni</h1>
        </div>
        <button class="rounded-lg bg-white px-4 py-2 text-sm font-bold ring-1 ring-black/10" (click)="export()">CSV</button>
      </div>

      <lfg-kpi-panel title="KPI iscrizioni">
        <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <lfg-summary-card label="Iscritti" [value]="String(teamCount())" [hint]="participantCount() + ' persone'" />
          <lfg-summary-card label="Pagati" [value]="eur(paidAmount())" [hint]="paidCount() + ' iscrizioni'" tone="income" />
          <lfg-summary-card label="Da incassare" [value]="eur(pendingAmount())" [hint]="pendingCount() + ' iscrizioni'" tone="warning" />
        </div>
      </lfg-kpi-panel>

      <div class="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        <button
          class="shrink-0 rounded-full px-4 py-2 text-sm font-bold ring-1 ring-black/10"
          [class.bg-ink]="paymentFilter() === 'all'"
          [class.text-white]="paymentFilter() === 'all'"
          [class.bg-white]="paymentFilter() !== 'all'"
          (click)="paymentFilter.set('all')">
          Tutte
        </button>
        <button
          class="shrink-0 rounded-full px-4 py-2 text-sm font-bold ring-1 ring-black/10"
          [class.bg-ink]="paymentFilter() === 'paid'"
          [class.text-white]="paymentFilter() === 'paid'"
          [class.bg-white]="paymentFilter() !== 'paid'"
          (click)="paymentFilter.set('paid')">
          Pagate
        </button>
        <button
          class="shrink-0 rounded-full px-4 py-2 text-sm font-bold ring-1 ring-black/10"
          [class.bg-ink]="paymentFilter() === 'pending'"
          [class.text-white]="paymentFilter() === 'pending'"
          [class.bg-white]="paymentFilter() !== 'pending'"
          (click)="paymentFilter.set('pending')">
          Da pagare
        </button>
      </div>

      @if (error()) {
        <p class="rounded-lg bg-red-50 p-3 text-sm text-red-700">{{ error() }}</p>
      }

      @if (!tournaments().length) {
        <lfg-empty-state title="Nessun torneo" text="I tornei vengono creati automaticamente al primo accesso." />
      } @else {
        <div class="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          @for (tournament of tournaments(); track tournament.id) {
            <button
              class="shrink-0 rounded-full px-4 py-2 text-sm font-bold ring-1 ring-black/10"
              [class.bg-ink]="selectedTournamentId() === tournament.id"
              [class.text-white]="selectedTournamentId() === tournament.id"
              [class.bg-white]="selectedTournamentId() !== tournament.id"
              (click)="selectTournament(tournament.id)">
              {{ tournament.name }}
            </button>
          }
        </div>

        @if (activeTournament(); as tournament) {
          <article class="rounded-lg border border-black/10 bg-white p-4 shadow-sm">
            <div class="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 class="font-display text-2xl uppercase">{{ tournament.name }}</h2>
                <p class="mt-1 text-sm text-neutral-500">
                  {{ filteredTournamentTeams(tournament).length }} {{ isDirect(tournament) ? 'iscritti visibili' : 'squadre visibili' }}
                  @if (tournament.fee) { · quota {{ eur(tournament.fee) }} }
                </p>
              </div>
              <div class="flex flex-wrap gap-2">
                @if (auth.isAdmin()) {
                  <button class="rounded-md bg-neutral-100 px-3 py-2 text-xs font-bold uppercase" (click)="editTournament(tournament)">Modifica</button>
                }
                @if (isDirect(tournament)) {
                  <button class="rounded-md bg-ink px-3 py-2 text-xs font-bold uppercase text-white" (click)="newDirectEntry(tournament)">
                    {{ isDuo(tournament) ? 'Aggiungi coppia' : 'Aggiungi partecipante' }}
                  </button>
                } @else {
                  <button class="rounded-md bg-ink px-3 py-2 text-xs font-bold uppercase text-white" (click)="newTeam(tournament.id)">Aggiungi squadra</button>
                }
              </div>
            </div>
          </article>

          @if (isDirect(tournament)) {
            <!-- Tornei a iscrizione diretta: ping pong, fifa, briscola, calcio balilla -->
            @if (!tournament.tournament_teams.length) {
              <lfg-empty-state
                [title]="isDuo(tournament) ? 'Nessuna coppia iscritta' : 'Nessun partecipante iscritto'"
                [text]="isDuo(tournament) ? 'Aggiungi la prima coppia.' : 'Aggiungi il primo partecipante.'" />
            } @else if (!filteredTournamentTeams(tournament).length) {
              <lfg-empty-state title="Nessuna iscrizione per questo stato" text="Cambia filtro per vedere altre iscrizioni." />
            } @else {
              <div class="grid gap-3 xl:grid-cols-2">
                @for (team of filteredTournamentTeams(tournament); track team.id) {
                  <article class="rounded-lg border border-black/10 bg-white p-4 shadow-sm">
                    <div class="flex flex-wrap items-start justify-between gap-3">
                      <div class="min-w-0">
                        @if (isDuo(tournament)) {
                          <div class="grid gap-3 sm:grid-cols-2">
                            @for (p of team.team_participants; track p.id) {
                              <div>
                                <p class="text-sm font-black">{{ personName(p) }}</p>
                                @if (p.contact) { <p class="text-xs text-neutral-500">{{ p.contact }}</p> }
                              </div>
                            }
                          </div>
                        } @else {
                          <p class="text-base font-black">{{ personName(team.team_participants[0]) }}</p>
                          @if (team.team_participants[0]?.contact) {
                            <p class="text-xs text-neutral-500">{{ team.team_participants[0].contact }}</p>
                          }
                        }
                        <p class="mt-1 text-xs font-semibold text-neutral-500">{{ insertMeta(team) }}</p>
                      </div>
                      <div class="text-right">
                        @if (tournament.fee) { <p class="font-black">{{ eur(teamFee(team)) }}</p> }
                        <lfg-status-badge
                          [label]="team.paid ? 'Pagato' : 'Da pagare'"
                          [className]="team.paid ? 'border-emerald-200 bg-emerald-100 text-emerald-800' : 'border-amber-200 bg-amber-100 text-amber-800'" />
                      </div>
                    </div>
                    <div class="mt-4 flex flex-wrap justify-end gap-2 border-t border-black/5 pt-3">
                      @if (tournament.fee) {
                        <button class="rounded-md bg-neutral-100 px-3 py-1.5 text-xs font-bold uppercase" (click)="togglePaid(team)">
                          {{ team.paid ? 'Segna non pagato' : 'Segna pagato' }}
                        </button>
                      }
                      <button class="rounded-md bg-neutral-100 px-3 py-1.5 text-xs font-bold uppercase" (click)="editDirectEntry(tournament, team)">Modifica</button>
                      @if (auth.isAdmin()) {
                        <button class="rounded-md bg-red-50 px-3 py-1.5 text-xs font-bold uppercase text-red-700" (click)="askRemoveTeam(team)">Elimina</button>
                      }
                    </div>
                  </article>
                }
              </div>
            }
          } @else {
            <!-- Tornei a squadre: calcio e pallavolo -->
            @if (!tournament.tournament_teams.length) {
              <lfg-empty-state title="Nessuna squadra" text="Aggiungi una squadra iscritta a questo torneo." />
            } @else if (!filteredTournamentTeams(tournament).length) {
              <lfg-empty-state title="Nessuna squadra per questo stato" text="Cambia filtro per vedere altre iscrizioni." />
            } @else {
              <div class="grid gap-3 xl:grid-cols-2">
                @for (team of filteredTournamentTeams(tournament); track team.id) {
                  <article class="rounded-lg border border-black/10 bg-white p-4 shadow-sm">
                    <div class="flex flex-wrap items-start justify-between gap-3">
                      <div class="min-w-0">
                        <h3 class="truncate text-lg font-black">{{ team.name }}</h3>
                        <p class="mt-1 text-xs font-semibold uppercase tracking-wide text-neutral-500">{{ teamHint(tournament, team) }}</p>
                        <p class="mt-1 text-xs font-semibold text-neutral-500">{{ insertMeta(team) }}</p>
                      </div>
                      <div class="text-right">
                        <p class="font-black">{{ eur(teamFee(team)) }}</p>
                        <lfg-status-badge
                          [label]="team.paid ? 'Pagata' : 'Da pagare'"
                          [className]="team.paid ? 'border-emerald-200 bg-emerald-100 text-emerald-800' : 'border-amber-200 bg-amber-100 text-amber-800'" />
                      </div>
                    </div>

                    @if (team.notes) {
                      <p class="mt-3 text-sm text-neutral-600">{{ team.notes }}</p>
                    }

                    @if (tournament.sport === 'calcio') {
                      <div class="mt-4 grid gap-2 rounded-lg border border-black/5 p-3 sm:grid-cols-2">
                        <div>
                          <p class="text-[10px] font-bold uppercase tracking-wide text-neutral-500">Capitano</p>
                          <p class="text-sm font-bold">{{ namePart(team.captain_name) || 'Non inserito' }}</p>
                          @if (team.captain_contact) { <p class="text-xs text-neutral-500">{{ team.captain_contact }}</p> }
                        </div>
                        <div>
                          <p class="text-[10px] font-bold uppercase tracking-wide text-neutral-500">Vicecapitano</p>
                          <p class="text-sm font-bold">{{ namePart(team.vice_captain_name) || 'Non inserito' }}</p>
                          @if (team.vice_captain_contact) { <p class="text-xs text-neutral-500">{{ team.vice_captain_contact }}</p> }
                        </div>
                      </div>
                    } @else {
                      <div class="mt-4 divide-y divide-black/5 rounded-lg border border-black/5">
                        @if (!team.team_participants.length) {
                          <p class="px-3 py-4 text-sm text-neutral-500">Nessuna persona inserita.</p>
                        } @else {
                          @for (participant of team.team_participants; track participant.id) {
                            <div class="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
                              <div>
                                <p class="text-sm font-bold">{{ personName(participant) }}</p>
                                @if (participant.contact) {
                                  <p class="text-xs text-neutral-500">{{ participant.contact }}</p>
                                }
                              </div>
                              <div class="flex gap-2">
                                <button class="rounded-md bg-neutral-100 px-2.5 py-1.5 text-[10px] font-bold uppercase" (click)="editParticipant(participant)">Modifica</button>
                                @if (auth.isAdmin()) {
                                  <button class="rounded-md bg-red-50 px-2.5 py-1.5 text-[10px] font-bold uppercase text-red-700" (click)="askRemoveParticipant(participant)">Elimina</button>
                                }
                              </div>
                            </div>
                          }
                        }
                      </div>
                    }

                    <div class="mt-4 flex flex-wrap justify-end gap-2 border-t border-black/5 pt-3">
                      <button class="rounded-md bg-neutral-100 px-3 py-1.5 text-xs font-bold uppercase" (click)="togglePaid(team)">{{ team.paid ? 'Segna non pagata' : 'Segna pagata' }}</button>
                      <button class="rounded-md bg-neutral-100 px-3 py-1.5 text-xs font-bold uppercase" (click)="editTeam(team)">Modifica squadra</button>
                      @if (tournament.sport !== 'calcio' && canAddParticipant(tournament, team)) {
                        <button class="rounded-md bg-neutral-100 px-3 py-1.5 text-xs font-bold uppercase" (click)="newParticipant(team.id)">Aggiungi persona</button>
                      }
                      @if (auth.isAdmin()) {
                        <button class="rounded-md bg-red-50 px-3 py-1.5 text-xs font-bold uppercase text-red-700" (click)="askRemoveTeam(team)">Elimina squadra</button>
                      }
                    </div>
                  </article>
                }
              </div>
            }
          }
        }
      }
    </section>

    <!-- Modal: modifica torneo -->
    <lfg-modal [open]="modalMode() === 'tournament'" title="Modifica torneo" (close)="closeModal()">
      <form class="grid gap-4" (ngSubmit)="saveTournament()">
        <fieldset [disabled]="saving()" class="grid gap-4 disabled:opacity-70">
          <div class="grid gap-3 sm:grid-cols-2">
            <label class="grid gap-1 text-sm font-bold">Nome torneo <input required name="tournamentName" [(ngModel)]="tournamentForm.name" class="rounded-lg border border-black/10 bg-neutral-50 px-3 py-3 font-normal disabled:cursor-not-allowed disabled:opacity-70"></label>
            <label class="grid gap-1 text-sm font-bold">Quota <input type="number" min="0" step="0.01" name="tournamentFee" [(ngModel)]="tournamentForm.fee" class="rounded-lg border border-black/10 bg-neutral-50 px-3 py-3 font-normal disabled:cursor-not-allowed disabled:opacity-70"></label>
          </div>
          <button class="rounded-lg bg-ink px-4 py-3 text-sm font-bold uppercase text-white disabled:opacity-60">{{ saving() ? 'Salvataggio…' : 'Salva torneo' }}</button>
        </fieldset>
      </form>
    </lfg-modal>

    <!-- Modal: nuova/modifica squadra (calcio/pallavolo) -->
    <lfg-modal [open]="modalMode() === 'team'" [title]="editingTeam() ? 'Modifica squadra' : 'Nuova squadra'" (close)="closeModal()">
      <form class="grid gap-4" (ngSubmit)="saveTeam()">
        <fieldset [disabled]="saving()" class="grid gap-4 disabled:opacity-70">
          <label class="grid gap-1 text-sm font-bold">Squadra <input required name="teamName" [(ngModel)]="teamForm.name" class="rounded-lg border border-black/10 bg-neutral-50 px-3 py-3 font-normal disabled:cursor-not-allowed disabled:opacity-70"></label>
          @if (selectedTeamSport() === 'calcio') {
            <div class="grid gap-3 sm:grid-cols-2">
              <label class="grid gap-1 text-sm font-bold">Capitano <input required name="captainName" [(ngModel)]="teamForm.captain_name" class="rounded-lg border border-black/10 bg-neutral-50 px-3 py-3 font-normal disabled:cursor-not-allowed disabled:opacity-70"></label>
              <label class="grid gap-1 text-sm font-bold">Contatto capitano <input name="captainContact" [(ngModel)]="teamForm.captain_contact" class="rounded-lg border border-black/10 bg-neutral-50 px-3 py-3 font-normal disabled:cursor-not-allowed disabled:opacity-70"></label>
            </div>
            <div class="grid gap-3 sm:grid-cols-2">
              <label class="grid gap-1 text-sm font-bold">Vicecapitano <input required name="viceCaptainName" [(ngModel)]="teamForm.vice_captain_name" class="rounded-lg border border-black/10 bg-neutral-50 px-3 py-3 font-normal disabled:cursor-not-allowed disabled:opacity-70"></label>
              <label class="grid gap-1 text-sm font-bold">Contatto vicecapitano <input name="viceCaptainContact" [(ngModel)]="teamForm.vice_captain_contact" class="rounded-lg border border-black/10 bg-neutral-50 px-3 py-3 font-normal disabled:cursor-not-allowed disabled:opacity-70"></label>
            </div>
          }
          <label class="flex items-center gap-3 rounded-lg bg-neutral-50 p-3 text-sm font-bold"><input type="checkbox" name="teamPaid" [(ngModel)]="teamForm.paid" class="h-5 w-5 accent-emerald-600 disabled:cursor-not-allowed disabled:opacity-70"> Squadra pagata</label>
          <label class="grid gap-1 text-sm font-bold">Note <textarea rows="3" name="teamNotes" [(ngModel)]="teamForm.notes" class="rounded-lg border border-black/10 bg-neutral-50 px-3 py-3 font-normal disabled:cursor-not-allowed disabled:opacity-70"></textarea></label>
          <button class="rounded-lg bg-ink px-4 py-3 text-sm font-bold uppercase text-white disabled:opacity-60">{{ saving() ? 'Salvataggio…' : 'Salva squadra' }}</button>
        </fieldset>
      </form>
    </lfg-modal>

    <!-- Modal: nuovo/modifica partecipante (pallavolo) -->
    <lfg-modal [open]="modalMode() === 'participant'" [title]="editingParticipant() ? 'Modifica partecipante' : 'Nuovo partecipante'" (close)="closeModal()">
      <form class="grid gap-4" (ngSubmit)="saveParticipant()">
        <fieldset [disabled]="saving()" class="grid gap-4 disabled:opacity-70">
          <div class="grid gap-3 sm:grid-cols-2">
            <label class="grid gap-1 text-sm font-bold">Nome <input required name="firstName" [(ngModel)]="participantForm.first_name" class="rounded-lg border border-black/10 bg-neutral-50 px-3 py-3 font-normal disabled:cursor-not-allowed disabled:opacity-70"></label>
            <label class="grid gap-1 text-sm font-bold">Cognome <input required name="lastName" [(ngModel)]="participantForm.last_name" class="rounded-lg border border-black/10 bg-neutral-50 px-3 py-3 font-normal disabled:cursor-not-allowed disabled:opacity-70"></label>
          </div>
          <label class="grid gap-1 text-sm font-bold">Contatto <input name="participantContact" [(ngModel)]="participantForm.contact" class="rounded-lg border border-black/10 bg-neutral-50 px-3 py-3 font-normal disabled:cursor-not-allowed disabled:opacity-70"></label>
          @if (selectedParticipantSport() === 'pallavolo') {
            <label class="flex items-center gap-3 rounded-lg bg-neutral-50 p-3 text-sm font-bold">
              <input type="checkbox" name="participantRegistered" [(ngModel)]="participantForm.registered" class="h-5 w-5 accent-emerald-600 disabled:cursor-not-allowed disabled:opacity-70"> Tesserato
            </label>
          }
          <button class="rounded-lg bg-ink px-4 py-3 text-sm font-bold uppercase text-white disabled:opacity-60">{{ saving() ? 'Salvataggio…' : 'Salva partecipante' }}</button>
        </fieldset>
      </form>
    </lfg-modal>

    <!-- Modal: iscrizione diretta (solo/duo) -->
    <lfg-modal [open]="modalMode() === 'direct'" [title]="directModalTitle()" (close)="closeModal()">
      <form class="grid gap-4" (ngSubmit)="saveDirectEntry()">
        <fieldset [disabled]="saving()" class="grid gap-4 disabled:opacity-70">
          @if (activeTournament()?.fee) {
            <label class="flex items-center gap-3 rounded-lg bg-neutral-50 p-3 text-sm font-bold">
              <input type="checkbox" name="directPaid" [(ngModel)]="directForm.paid" class="h-5 w-5 accent-emerald-600 disabled:cursor-not-allowed disabled:opacity-70">
              {{ isDuoSelected() ? 'Coppia pagata' : 'Iscrizione pagata' }}
            </label>
          }
          <fieldset class="grid gap-3 rounded-lg border border-black/10 p-4">
            <legend class="px-1 text-xs font-black uppercase tracking-[0.16em] text-neutral-500">{{ isDuoSelected() ? 'Persona 1' : 'Partecipante' }}</legend>
            <div class="grid gap-3 sm:grid-cols-2">
              <label class="grid gap-1 text-sm font-bold">Nome <input required name="p1First" [(ngModel)]="directForm.person1.first_name" class="rounded-lg border border-black/10 bg-neutral-50 px-3 py-3 font-normal disabled:cursor-not-allowed disabled:opacity-70"></label>
              <label class="grid gap-1 text-sm font-bold">Cognome <input required name="p1Last" [(ngModel)]="directForm.person1.last_name" class="rounded-lg border border-black/10 bg-neutral-50 px-3 py-3 font-normal disabled:cursor-not-allowed disabled:opacity-70"></label>
            </div>
            <label class="grid gap-1 text-sm font-bold">Contatto <input name="p1Contact" [(ngModel)]="directForm.person1.contact" class="rounded-lg border border-black/10 bg-neutral-50 px-3 py-3 font-normal disabled:cursor-not-allowed disabled:opacity-70"></label>
          </fieldset>
          @if (isDuoSelected()) {
            <fieldset class="grid gap-3 rounded-lg border border-black/10 p-4">
              <legend class="px-1 text-xs font-black uppercase tracking-[0.16em] text-neutral-500">Persona 2</legend>
              <div class="grid gap-3 sm:grid-cols-2">
                <label class="grid gap-1 text-sm font-bold">Nome <input required name="p2First" [(ngModel)]="directForm.person2.first_name" class="rounded-lg border border-black/10 bg-neutral-50 px-3 py-3 font-normal disabled:cursor-not-allowed disabled:opacity-70"></label>
                <label class="grid gap-1 text-sm font-bold">Cognome <input required name="p2Last" [(ngModel)]="directForm.person2.last_name" class="rounded-lg border border-black/10 bg-neutral-50 px-3 py-3 font-normal disabled:cursor-not-allowed disabled:opacity-70"></label>
              </div>
              <label class="grid gap-1 text-sm font-bold">Contatto <input name="p2Contact" [(ngModel)]="directForm.person2.contact" class="rounded-lg border border-black/10 bg-neutral-50 px-3 py-3 font-normal disabled:cursor-not-allowed disabled:opacity-70"></label>
            </fieldset>
          }
          <button class="rounded-lg bg-ink px-4 py-3 text-sm font-bold uppercase text-white disabled:opacity-60">{{ saving() ? 'Salvataggio…' : 'Salva' }}</button>
        </fieldset>
      </form>
    </lfg-modal>

    <lfg-confirm
      [open]="!!confirmPending()"
      [message]="confirmMessage()"
      (confirm)="doConfirm()"
      (cancel)="confirmPending.set(null)"
    />
  `
})
export class RegistrationsComponent implements OnInit {
  tournaments = signal<TournamentWithTeams[]>([]);
  userNames = signal<Record<string, string>>({});
  selectedTournamentId = signal<string | null>(null);
  error = signal('');
  modalMode = signal<ModalMode>(null);
  editingTournament = signal<Tournament | null>(null);
  editingTeam = signal<TournamentTeamWithParticipants | null>(null);
  editingParticipant = signal<TeamParticipant | null>(null);
  editingDirectTeam = signal<TournamentTeamWithParticipants | null>(null);
  saving = signal(false);
  paymentFilter = signal<PaymentFilter>('all');
  confirmPending = signal<(() => Promise<void>) | null>(null);
  confirmMessage = signal('');
  tournamentForm: InsertTournament = this.emptyTournamentForm();
  teamForm: InsertTournamentTeam = this.emptyTeamForm('');
  participantForm: InsertTeamParticipant = this.emptyParticipantForm('');
  directForm: DirectForm = this.emptyDirectForm('');

  constructor(
    readonly auth: AuthService,
    private readonly service: RegistrationsService,
    private readonly exporter: ExportService,
    private readonly profiles: ProfileService,
    private readonly globalLoading: LoadingService
  ) {}

  ngOnInit(): void { void this.load(); }

  async load(): Promise<void> {
    this.globalLoading.start();
    this.error.set('');
    try {
      const tournaments = await this.service.listTournaments();
      this.tournaments.set(tournaments);
      this.userNames.set(await this.profiles.displayNames(tournaments.flatMap((t) => t.tournament_teams.map((team) => team.created_by))));
      if (!this.selectedTournamentId() || !tournaments.some((t) => t.id === this.selectedTournamentId())) {
        this.selectedTournamentId.set(tournaments[0]?.id ?? null);
      }
    } catch (error) {
      this.error.set(this.message(error));
    } finally { this.globalLoading.stop(); }
  }

  activeTournament(): TournamentWithTeams | undefined {
    return this.tournaments().find((t) => t.id === this.selectedTournamentId());
  }

  selectTournament(id: string): void { this.selectedTournamentId.set(id); }

  // ─── Helpers: direct-entry sports ───────────────────────────────────────────

  isDirect(tournament: TournamentWithTeams): boolean {
    return DIRECT_CODES.includes(tournament.code ?? '');
  }

  isDuo(tournament: TournamentWithTeams): boolean {
    return DUO_CODES.includes(tournament.code ?? '');
  }

  isDuoSelected(): boolean {
    const tournament = this.findTournament(this.directForm.tournament_id);
    return DUO_CODES.includes(tournament?.code ?? '');
  }

  directModalTitle(): string {
    const editing = !!this.editingDirectTeam();
    return this.isDuoSelected()
      ? (editing ? 'Modifica coppia' : 'Nuova coppia')
      : (editing ? 'Modifica partecipante' : 'Nuovo partecipante');
  }

  // ─── Direct entry CRUD ──────────────────────────────────────────────────────

  newDirectEntry(tournament: TournamentWithTeams): void {
    this.editingDirectTeam.set(null);
    this.directForm = this.emptyDirectForm(tournament.id);
    this.modalMode.set('direct');
  }

  editDirectEntry(tournament: TournamentWithTeams, team: TournamentTeamWithParticipants): void {
    this.editingDirectTeam.set(team);
    const p1 = team.team_participants[0];
    const p2 = team.team_participants[1];
    this.directForm = {
      tournament_id: team.tournament_id,
      paid: team.paid,
      person1: { first_name: p1?.first_name ?? '', last_name: p1?.last_name ?? '', contact: p1?.contact ?? '' },
      person2: { first_name: p2?.first_name ?? '', last_name: p2?.last_name ?? '', contact: p2?.contact ?? '' }
    };
    this.modalMode.set('direct');
  }

  async saveDirectEntry(): Promise<void> {
    if (this.saving()) return;
    this.saving.set(true);
    try {
      const duo = this.isDuoSelected();
      const p1 = this.normalizedDirectPerson(this.directForm.person1);
      const p2 = this.normalizedDirectPerson(this.directForm.person2);
      const current = this.editingDirectTeam();
      const teamName = duo
        ? `${p1.first_name} / ${p2.first_name}`
        : `${p1.first_name} ${p1.last_name}`;

      if (current) {
        await this.service.updateTeam(current.id, { name: teamName, paid: this.directForm.paid });
        if (current.team_participants[0]) {
          await this.service.updateParticipant(current.team_participants[0].id, {
            team_id: current.id, first_name: p1.first_name, last_name: p1.last_name,
            contact: p1.contact.trim() || null, gender: 'uomo', registered: false
          });
        }
        if (duo && current.team_participants[1]) {
          await this.service.updateParticipant(current.team_participants[1].id, {
            team_id: current.id, first_name: p2.first_name, last_name: p2.last_name,
            contact: p2.contact.trim() || null, gender: 'uomo', registered: false
          });
        }
      } else {
        const team = await this.service.createTeam({
          tournament_id: this.directForm.tournament_id,
          name: teamName,
          captain_name: null, captain_contact: null,
          vice_captain_name: null, vice_captain_contact: null,
          fee: this.tournamentFee(this.directForm.tournament_id),
          paid: this.directForm.paid, notes: null
        });
        await this.service.createParticipant({
          team_id: team.id, first_name: p1.first_name, last_name: p1.last_name,
          contact: p1.contact.trim() || null, gender: 'uomo', registered: false
        });
        if (duo) {
          await this.service.createParticipant({
            team_id: team.id, first_name: p2.first_name, last_name: p2.last_name,
            contact: p2.contact.trim() || null, gender: 'uomo', registered: false
          });
        }
      }
      this.selectedTournamentId.set(this.directForm.tournament_id);
      this.closeModal();
      await this.load();
    } catch (error) {
      this.error.set(this.message(error));
    } finally { this.saving.set(false); }
  }

  // ─── Tournament CRUD ────────────────────────────────────────────────────────

  editTournament(tournament: Tournament): void {
    if (!this.auth.isAdmin()) return;
    this.editingTournament.set(tournament);
    this.tournamentForm = { name: tournament.name, sport: tournament.sport, fee: tournament.fee, date: null, notes: null };
    this.modalMode.set('tournament');
  }

  async saveTournament(): Promise<void> {
    const current = this.editingTournament();
    if (!this.auth.isAdmin() || !current || this.saving()) return;
    this.saving.set(true);
    try {
      const saved = await this.service.updateTournament(current.id, {
        name: this.tournamentForm.name.trim(),
        fee: Number(this.tournamentForm.fee || 0)
      });
      this.selectedTournamentId.set(saved.id);
      this.closeModal();
      await this.load();
    } catch (error) {
      this.error.set(this.message(error));
    } finally { this.saving.set(false); }
  }

  askRemoveTournament(tournament: Tournament): void {
    this.confirmMessage.set(`Eliminare il torneo "${tournament.name}" con tutte le squadre e i partecipanti?`);
    this.confirmPending.set(async () => {
      try { await this.service.removeTournament(tournament.id); await this.load(); }
      catch (error) { this.error.set(this.message(error)); }
    });
  }

  // ─── Team CRUD (calcio/pallavolo) ───────────────────────────────────────────

  newTeam(tournamentId: string): void {
    this.editingTeam.set(null);
    this.teamForm = this.emptyTeamForm(tournamentId);
    this.modalMode.set('team');
  }

  editTeam(team: TournamentTeamWithParticipants): void {
    this.editingTeam.set(team);
    this.teamForm = {
      tournament_id: team.tournament_id, name: team.name,
      captain_name: team.captain_name, captain_contact: team.captain_contact,
      vice_captain_name: team.vice_captain_name, vice_captain_contact: team.vice_captain_contact,
      fee: team.fee, paid: team.paid, notes: team.notes
    };
    this.modalMode.set('team');
  }

  async saveTeam(): Promise<void> {
    if (this.saving()) return;
    this.saving.set(true);
    try {
      const isFootball = this.selectedTeamSport() === 'calcio';
      const payload = {
        ...this.teamForm,
        captain_name: isFootball ? this.namePart(this.teamForm.captain_name) || null : null,
        captain_contact: isFootball ? this.teamForm.captain_contact?.trim() || null : null,
        vice_captain_name: isFootball ? this.namePart(this.teamForm.vice_captain_name) || null : null,
        vice_captain_contact: isFootball ? this.teamForm.vice_captain_contact?.trim() || null : null,
        fee: this.tournamentFee(this.teamForm.tournament_id),
        notes: this.teamForm.notes || null
      };
      const current = this.editingTeam();
      await (current ? this.service.updateTeam(current.id, payload) : this.service.createTeam(payload));
      this.selectedTournamentId.set(payload.tournament_id);
      this.closeModal();
      await this.load();
    } catch (error) {
      this.error.set(this.message(error));
    } finally { this.saving.set(false); }
  }

  async togglePaid(team: TournamentTeamWithParticipants): Promise<void> {
    try { await this.service.updateTeam(team.id, { paid: !team.paid }); await this.load(); }
    catch (error) { this.error.set(this.message(error)); }
  }

  askRemoveTeam(team: TournamentTeamWithParticipants): void {
    this.confirmMessage.set(`Eliminare questa iscrizione?`);
    this.confirmPending.set(async () => {
      try { await this.service.removeTeam(team.id); await this.load(); }
      catch (error) { this.error.set(this.message(error)); }
    });
  }

  // ─── Participant CRUD (pallavolo) ────────────────────────────────────────────

  newParticipant(teamId: string): void {
    const team = this.findTeam(teamId);
    const tournament = team ? this.findTournament(team.tournament_id) : undefined;
    if (team && tournament && !this.canAddParticipant(tournament, team)) return;
    this.editingParticipant.set(null);
    this.participantForm = this.emptyParticipantForm(teamId);
    this.modalMode.set('participant');
  }

  editParticipant(participant: TeamParticipant): void {
    this.editingParticipant.set(participant);
    this.participantForm = {
      team_id: participant.team_id, first_name: participant.first_name,
      last_name: participant.last_name, contact: participant.contact,
      gender: participant.gender, registered: participant.registered
    };
    this.modalMode.set('participant');
  }

  async saveParticipant(): Promise<void> {
    if (this.saving()) return;
    this.saving.set(true);
    try {
      const current = this.editingParticipant();
      const team = this.findTeam(this.participantForm.team_id);
      const tournament = team ? this.findTournament(team.tournament_id) : undefined;
      if (!current && team && tournament && !this.canAddParticipant(tournament, team)) {
        this.error.set(`Limite persone raggiunto per ${tournament.name}.`);
        this.closeModal();
        return;
      }
      const payload = {
        ...this.participantForm,
        first_name: this.namePart(this.participantForm.first_name),
        last_name: this.namePart(this.participantForm.last_name),
        contact: this.participantForm.contact?.trim() || null,
        gender: 'uomo' as const,
        registered: tournament?.sport === 'pallavolo' ? Boolean(this.participantForm.registered) : false
      };
      await (current ? this.service.updateParticipant(current.id, payload) : this.service.createParticipant(payload));
      this.closeModal();
      await this.load();
    } catch (error) {
      this.error.set(this.message(error));
    } finally { this.saving.set(false); }
  }

  askRemoveParticipant(participant: TeamParticipant): void {
    this.confirmMessage.set(`Eliminare "${this.personName(participant)}"?`);
    this.confirmPending.set(async () => {
      try { await this.service.removeParticipant(participant.id); await this.load(); }
      catch (error) { this.error.set(this.message(error)); }
    });
  }

  async doConfirm(): Promise<void> {
    const fn = this.confirmPending();
    this.confirmPending.set(null);
    if (fn) await fn();
  }

  closeModal(): void { this.modalMode.set(null); }

  // ─── Stats ───────────────────────────────────────────────────────────────────

  teamCount(): number {
    return this.tournaments().reduce((sum, t) => sum + t.tournament_teams.length, 0);
  }

  participantCount(): number {
    return this.tournaments().reduce(
      (sum, t) => sum + t.tournament_teams.reduce((s, team) => s + this.teamPeopleCount(t, team), 0), 0
    );
  }

  paidCount(): number { return this.allTeams().filter((t) => t.paid).length; }
  pendingCount(): number { return this.allTeams().filter((t) => !t.paid).length; }
  paidAmount(): number { return this.allTeams().filter((t) => t.paid).reduce((s, t) => s + this.teamFee(t), 0); }
  pendingAmount(): number { return this.allTeams().filter((t) => !t.paid).reduce((s, t) => s + this.teamFee(t), 0); }
  filteredTournamentTeams(tournament: TournamentWithTeams): TournamentTeamWithParticipants[] {
    return this.filterTeams(tournament.tournament_teams);
  }

  eur(value: number): string { return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(value); }
  formatDateTime(value: string): string { return new Intl.DateTimeFormat('it-IT', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value)); }
  insertMeta(team: TournamentTeamWithParticipants): string { return `Inserita da ${this.userNames()[team.created_by ?? ''] ?? 'Utente non disponibile'} · ${this.formatDateTime(team.created_at)}`; }

  personName(participant: Pick<TeamParticipant, 'first_name' | 'last_name'> | null | undefined): string {
    if (!participant) return '';
    return [this.namePart(participant.first_name), this.namePart(participant.last_name)].filter(Boolean).join(' ');
  }

  teamHint(tournament: TournamentWithTeams, team: TournamentTeamWithParticipants): string {
    if (tournament.sport === 'calcio') {
      const contacts = this.footballContactCount(team);
      return contacts ? `${contacts} referenti` : 'Referenti non inseriti';
    }

    const limit = this.participantLimit(tournament);
    return limit ? `${team.team_participants.length}/${limit} persone` : `${team.team_participants.length} partecipanti`;
  }

  canAddParticipant(tournament: TournamentWithTeams, team: TournamentTeamWithParticipants): boolean {
    const limit = this.participantLimit(tournament);
    return !limit || team.team_participants.length < limit;
  }

  teamFee(team: TournamentTeamWithParticipants): number { return this.tournamentFee(team.tournament_id); }

  selectedTeamSport(): string {
    return this.findTournament(this.teamForm.tournament_id)?.sport ?? 'calcio';
  }

  selectedParticipantSport(): string {
    const team = this.findTeam(this.participantForm.team_id);
    return team ? this.findTournament(team.tournament_id)?.sport ?? 'altro' : 'altro';
  }

  sportLabel(sport: string): string {
    if (sport === 'pallavolo') return 'Pallavolo';
    if (sport === 'calcio') return 'Calcio';
    return 'Altro';
  }

  export(): void {
    const rows = this.tournaments().flatMap((tournament) =>
      this.filterTeams(tournament.tournament_teams).flatMap((team) =>
        team.team_participants.length
          ? team.team_participants.map((p) => this.exportRow(tournament, team, p))
          : [this.exportRow(tournament, team, null)]
      )
    );
    this.exporter.downloadCsv('tornei-squadre-partecipanti-la-fossa-games.csv', rows);
  }

  private participantLimit(tournament: TournamentWithTeams): number | null {
    return ({
      'pallavolo': 6,
      'briscola': 2,
      'fifa': 1,
      'ping-pong': 1,
      'calcio-balilla': 2
    } as Record<string, number>)[tournament.code ?? ''] ?? null;
  }

  private teamPeopleCount(tournament: TournamentWithTeams, team: TournamentTeamWithParticipants): number {
    return tournament.sport === 'calcio' ? this.footballContactCount(team) : team.team_participants.length;
  }

  private footballContactCount(team: TournamentTeamWithParticipants): number {
    return [team.captain_name, team.vice_captain_name].filter((value) => Boolean(this.namePart(value))).length;
  }

  private allTeams(): TournamentTeamWithParticipants[] {
    return this.tournaments().flatMap((t) => t.tournament_teams);
  }

  private filterTeams(teams: TournamentTeamWithParticipants[]): TournamentTeamWithParticipants[] {
    const payment = this.paymentFilter();
    if (payment === 'paid') return teams.filter((team) => team.paid);
    if (payment === 'pending') return teams.filter((team) => !team.paid);
    return teams;
  }

  private findTournament(tournamentId: string): TournamentWithTeams | undefined {
    return this.tournaments().find((t) => t.id === tournamentId);
  }

  private findTeam(teamId: string): TournamentTeamWithParticipants | undefined {
    return this.allTeams().find((team) => team.id === teamId);
  }

  private tournamentFee(tournamentId: string): number {
    return Number(this.findTournament(tournamentId)?.fee || 0);
  }

  private emptyTournamentForm(): InsertTournament {
    return { name: '', sport: 'calcio', fee: 0, date: null, notes: null };
  }

  private emptyTeamForm(tournamentId: string): InsertTournamentTeam {
    return { tournament_id: tournamentId, name: '', captain_name: '', captain_contact: '', vice_captain_name: '', vice_captain_contact: '', fee: 0, paid: false, notes: '' };
  }

  private emptyParticipantForm(teamId: string): InsertTeamParticipant {
    return { team_id: teamId, first_name: '', last_name: '', contact: '', gender: 'uomo', registered: false };
  }

  private emptyDirectForm(tournamentId: string): DirectForm {
    return { tournament_id: tournamentId, paid: false, person1: { first_name: '', last_name: '', contact: '' }, person2: { first_name: '', last_name: '', contact: '' } };
  }

  private exportRow(tournament: TournamentWithTeams, team: TournamentTeamWithParticipants, participant: TeamParticipant | null): Record<string, unknown> {
    return {
      torneo: tournament.name,
      sport: this.sportLabel(tournament.sport),
      iscrizione: team.name,
      quota: tournament.fee,
      pagata: team.paid ? 'si' : 'no',
      capitano: this.namePart(team.captain_name),
      contatto_capitano: team.captain_contact ?? '',
      vicecapitano: this.namePart(team.vice_captain_name),
      contatto_vicecapitano: team.vice_captain_contact ?? '',
      nome: this.namePart(participant?.first_name ?? ''),
      cognome: this.namePart(participant?.last_name ?? ''),
      contatto: participant?.contact ?? '',
      tesserato: participant && tournament.sport === 'pallavolo' ? (participant.registered ? 'si' : 'no') : ''
    };
  }

  private normalizedDirectPerson(person: DirectPerson): DirectPerson {
    return {
      first_name: this.namePart(person.first_name),
      last_name: this.namePart(person.last_name),
      contact: person.contact
    };
  }

  namePart(value: string | null | undefined): string {
    return (value ?? '')
      .trim()
      .toLocaleLowerCase('it-IT')
      .replace(/(^|[\s'-])(\p{L})/gu, (_match, prefix: string, letter: string) => `${prefix}${letter.toLocaleUpperCase('it-IT')}`);
  }

  private message(error: unknown): string {
    return error instanceof Error ? error.message : 'Operazione non riuscita.';
  }

  protected readonly String = String;
}

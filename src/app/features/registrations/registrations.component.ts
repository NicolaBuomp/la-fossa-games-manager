import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { ExportService } from '../../core/services/export.service';
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
import { EmptyStateComponent, ModalComponent, StatusBadgeComponent, SummaryCardComponent } from '../../shared/components/ui.component';

type ModalMode = 'tournament' | 'team' | 'participant' | null;

@Component({
  standalone: true,
  imports: [FormsModule, EmptyStateComponent, ModalComponent, StatusBadgeComponent, SummaryCardComponent],
  template: `
    <section class="space-y-4">
      <div class="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p class="text-xs font-bold uppercase tracking-[0.18em] text-neutral-500">Tornei e squadre</p>
          <h1 class="font-display text-3xl uppercase">Iscrizioni</h1>
        </div>
        <div class="flex gap-2">
          <button class="rounded-lg bg-white px-4 py-2 text-sm font-bold ring-1 ring-black/10" (click)="export()">CSV</button>
        </div>
      </div>

      <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <lfg-summary-card label="Tornei" [value]="String(tournaments().length)" hint="Eventi creati" />
        <lfg-summary-card label="Squadre" [value]="String(teamCount())" [hint]="participantCount() + ' partecipanti'" />
        <lfg-summary-card label="Pagate" [value]="eur(paidAmount())" [hint]="paidCount() + ' squadre'" tone="income" />
        <lfg-summary-card label="Da incassare" [value]="eur(pendingAmount())" [hint]="pendingCount() + ' squadre'" tone="warning" />
      </div>

      @if (error()) {
        <p class="rounded-lg bg-red-50 p-3 text-sm text-red-700">{{ error() }}</p>
      }

      @if (!tournaments().length) {
        <lfg-empty-state title="Nessun torneo" text="Crea un torneo, poi aggiungi squadre e partecipanti." />
      } @else {
        <div class="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          @for (tournament of tournaments(); track tournament.id) {
            <button
              class="shrink-0 rounded-full px-4 py-2 text-sm font-bold ring-1 ring-black/10"
              [class.bg-ink]="selectedTournamentId() === tournament.id"
              [class.text-white]="selectedTournamentId() === tournament.id"
              [class.bg-white]="selectedTournamentId() !== tournament.id"
              (click)="selectTournament(tournament.id)">
              {{ tournament.name }} · {{ sportLabel(tournament.sport) }}
            </button>
          }
        </div>

        @if (activeTournament(); as tournament) {
          <article class="rounded-lg border border-black/10 bg-white p-4 shadow-sm">
            <div class="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 class="font-display text-2xl uppercase">{{ tournament.name }}</h2>
                <p class="mt-1 text-sm text-neutral-500">{{ sportLabel(tournament.sport) }} · {{ tournament.tournament_teams.length }} squadre · quota {{ eur(tournament.fee) }}</p>
              </div>
              <div class="flex flex-wrap gap-2">
                <button class="rounded-md bg-neutral-100 px-3 py-2 text-xs font-bold uppercase" (click)="editTournament(tournament)">Modifica</button>
                <button class="rounded-md bg-ink px-3 py-2 text-xs font-bold uppercase text-white" (click)="newTeam(tournament.id)">Aggiungi squadra</button>
              </div>
            </div>
          </article>

          @if (!tournament.tournament_teams.length) {
            <lfg-empty-state title="Nessuna squadra" text="Aggiungi una squadra iscritta a questo torneo." />
          } @else {
            <div class="grid gap-3 xl:grid-cols-2">
              @for (team of tournament.tournament_teams; track team.id) {
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
                        <p class="text-sm font-bold">{{ team.captain_name || 'Non inserito' }}</p>
                        @if (team.captain_contact) { <p class="text-xs text-neutral-500">{{ team.captain_contact }}</p> }
                      </div>
                      <div>
                        <p class="text-[10px] font-bold uppercase tracking-wide text-neutral-500">Vicecapitano</p>
                        <p class="text-sm font-bold">{{ team.vice_captain_name || 'Non inserito' }}</p>
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
                              <p class="text-sm font-bold">{{ participant.first_name }} {{ participant.last_name }}</p>
                              @if (tournament.sport === 'pallavolo') {
                                <p class="text-xs text-neutral-500">
                                  {{ participant.gender === 'uomo' ? 'Uomo' : 'Donna' }} · {{ participant.registered ? 'Tesserato' : 'Non tesserato' }}
                                  @if (participant.contact) { · {{ participant.contact }} }
                                </p>
                              } @else if (participant.contact) {
                                <p class="text-xs text-neutral-500">{{ participant.contact }}</p>
                              }
                            </div>
                            <div class="flex gap-2">
                              <button class="rounded-md bg-neutral-100 px-2.5 py-1.5 text-[10px] font-bold uppercase" (click)="editParticipant(participant)">Modifica</button>
                              @if (auth.isAdmin()) {
                                <button class="rounded-md bg-red-50 px-2.5 py-1.5 text-[10px] font-bold uppercase text-red-700" (click)="removeParticipant(participant)">Elimina</button>
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
                      <button class="rounded-md bg-red-50 px-3 py-1.5 text-xs font-bold uppercase text-red-700" (click)="removeTeam(team)">Elimina squadra</button>
                    }
                  </div>
                </article>
              }
            </div>
          }
        }
      }
    </section>

    <lfg-modal [open]="modalMode() === 'tournament'" title="Modifica torneo" (close)="closeModal()">
      <form class="grid gap-4" (ngSubmit)="saveTournament()">
        <div class="grid gap-3 sm:grid-cols-2">
          <label class="grid gap-1 text-sm font-bold">Nome torneo <input required name="tournamentName" [(ngModel)]="tournamentForm.name" class="rounded-lg border border-black/10 bg-neutral-50 px-3 py-3 font-normal"></label>
          <label class="grid gap-1 text-sm font-bold">Quota torneo <input type="number" min="0" step="0.01" name="tournamentFee" [(ngModel)]="tournamentForm.fee" class="rounded-lg border border-black/10 bg-neutral-50 px-3 py-3 font-normal"></label>
        </div>
        <button class="rounded-lg bg-ink px-4 py-3 text-sm font-bold uppercase text-white">Salva torneo</button>
      </form>
    </lfg-modal>

    <lfg-modal [open]="modalMode() === 'team'" [title]="editingTeam() ? 'Modifica squadra' : 'Nuova squadra'" (close)="closeModal()">
      <form class="grid gap-4" (ngSubmit)="saveTeam()">
        <label class="grid gap-1 text-sm font-bold">Squadra <input required name="teamName" [(ngModel)]="teamForm.name" class="rounded-lg border border-black/10 bg-neutral-50 px-3 py-3 font-normal"></label>
        @if (selectedTeamSport() === 'calcio') {
          <div class="grid gap-3 sm:grid-cols-2">
            <label class="grid gap-1 text-sm font-bold">Capitano <input required name="captainName" [(ngModel)]="teamForm.captain_name" class="rounded-lg border border-black/10 bg-neutral-50 px-3 py-3 font-normal"></label>
            <label class="grid gap-1 text-sm font-bold">Contatto capitano <input name="captainContact" [(ngModel)]="teamForm.captain_contact" class="rounded-lg border border-black/10 bg-neutral-50 px-3 py-3 font-normal"></label>
          </div>
          <div class="grid gap-3 sm:grid-cols-2">
            <label class="grid gap-1 text-sm font-bold">Vicecapitano <input required name="viceCaptainName" [(ngModel)]="teamForm.vice_captain_name" class="rounded-lg border border-black/10 bg-neutral-50 px-3 py-3 font-normal"></label>
            <label class="grid gap-1 text-sm font-bold">Contatto vicecapitano <input name="viceCaptainContact" [(ngModel)]="teamForm.vice_captain_contact" class="rounded-lg border border-black/10 bg-neutral-50 px-3 py-3 font-normal"></label>
          </div>
        }
        <label class="flex items-center gap-3 rounded-lg bg-neutral-50 p-3 text-sm font-bold"><input type="checkbox" name="teamPaid" [(ngModel)]="teamForm.paid" class="h-5 w-5 accent-emerald-600"> Squadra pagata</label>
        <label class="grid gap-1 text-sm font-bold">Note <textarea rows="3" name="teamNotes" [(ngModel)]="teamForm.notes" class="rounded-lg border border-black/10 bg-neutral-50 px-3 py-3 font-normal"></textarea></label>
        <button class="rounded-lg bg-ink px-4 py-3 text-sm font-bold uppercase text-white">Salva squadra</button>
      </form>
    </lfg-modal>

    <lfg-modal [open]="modalMode() === 'participant'" [title]="editingParticipant() ? 'Modifica partecipante' : 'Nuovo partecipante'" (close)="closeModal()">
      <form class="grid gap-4" (ngSubmit)="saveParticipant()">
        <div class="grid gap-3 sm:grid-cols-2">
          <label class="grid gap-1 text-sm font-bold">Nome <input required name="firstName" [(ngModel)]="participantForm.first_name" class="rounded-lg border border-black/10 bg-neutral-50 px-3 py-3 font-normal"></label>
          <label class="grid gap-1 text-sm font-bold">Cognome <input required name="lastName" [(ngModel)]="participantForm.last_name" class="rounded-lg border border-black/10 bg-neutral-50 px-3 py-3 font-normal"></label>
        </div>
        <label class="grid gap-1 text-sm font-bold">Contatto <input name="participantContact" [(ngModel)]="participantForm.contact" class="rounded-lg border border-black/10 bg-neutral-50 px-3 py-3 font-normal"></label>
        @if (selectedParticipantSport() === 'pallavolo') {
          <div class="grid gap-3 sm:grid-cols-2">
            <label class="grid gap-1 text-sm font-bold">Sesso
              <select name="participantGender" [(ngModel)]="participantForm.gender" class="rounded-lg border border-black/10 bg-neutral-50 px-3 py-3 font-normal">
                <option value="uomo">Uomo</option>
                <option value="donna">Donna</option>
              </select>
            </label>
            <label class="flex items-center gap-3 rounded-lg bg-neutral-50 p-3 text-sm font-bold"><input type="checkbox" name="participantRegistered" [(ngModel)]="participantForm.registered" class="h-5 w-5 accent-emerald-600"> Tesserato</label>
          </div>
        }
        <button class="rounded-lg bg-ink px-4 py-3 text-sm font-bold uppercase text-white">Salva partecipante</button>
      </form>
    </lfg-modal>
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
  tournamentForm: InsertTournament = this.emptyTournamentForm();
  teamForm: InsertTournamentTeam = this.emptyTeamForm('');
  participantForm: InsertTeamParticipant = this.emptyParticipantForm('');

  constructor(
    readonly auth: AuthService,
    private readonly service: RegistrationsService,
    private readonly exporter: ExportService,
    private readonly profiles: ProfileService
  ) {}

  ngOnInit(): void {
    void this.load();
  }

  async load(): Promise<void> {
    this.error.set('');
    try {
      const tournaments = await this.service.listTournaments();
      this.tournaments.set(tournaments);
      this.userNames.set(await this.profiles.displayNames(tournaments.flatMap((tournament) => tournament.tournament_teams.map((team) => team.created_by))));
      if (!this.selectedTournamentId() || !tournaments.some((tournament) => tournament.id === this.selectedTournamentId())) {
        this.selectedTournamentId.set(tournaments[0]?.id ?? null);
      }
    } catch (error) {
      this.error.set(this.message(error));
    }
  }

  activeTournament(): TournamentWithTeams | undefined {
    return this.tournaments().find((tournament) => tournament.id === this.selectedTournamentId());
  }

  selectTournament(id: string): void {
    this.selectedTournamentId.set(id);
  }

  editTournament(tournament: Tournament): void {
    this.editingTournament.set(tournament);
    this.tournamentForm = { name: tournament.name, sport: tournament.sport, fee: tournament.fee, date: null, notes: null };
    this.modalMode.set('tournament');
  }

  async saveTournament(): Promise<void> {
    try {
      const payload = { ...this.tournamentForm, sport: this.tournamentForm.sport || 'calcio', fee: Number(this.tournamentForm.fee || 0), date: null, notes: null };
      const current = this.editingTournament();
      if (!current) return;
      const saved = await this.service.updateTournament(current.id, payload);
      this.selectedTournamentId.set(saved.id);
      this.closeModal();
      await this.load();
    } catch (error) {
      this.error.set(this.message(error));
    }
  }

  async removeTournament(tournament: Tournament): Promise<void> {
    if (!confirm(`Eliminare il torneo "${tournament.name}" con tutte le squadre e i partecipanti?`)) return;
    try {
      await this.service.removeTournament(tournament.id);
      await this.load();
    } catch (error) {
      this.error.set(this.message(error));
    }
  }

  newTeam(tournamentId: string): void {
    this.editingTeam.set(null);
    this.teamForm = this.emptyTeamForm(tournamentId);
    this.modalMode.set('team');
  }

  editTeam(team: TournamentTeamWithParticipants): void {
    this.editingTeam.set(team);
    this.teamForm = {
      tournament_id: team.tournament_id,
      name: team.name,
      captain_name: team.captain_name,
      captain_contact: team.captain_contact,
      vice_captain_name: team.vice_captain_name,
      vice_captain_contact: team.vice_captain_contact,
      fee: team.fee,
      paid: team.paid,
      notes: team.notes
    };
    this.modalMode.set('team');
  }

  async saveTeam(): Promise<void> {
    try {
      const isFootball = this.selectedTeamSport() === 'calcio';
      const payload = {
        ...this.teamForm,
        captain_name: isFootball ? this.teamForm.captain_name?.trim() || null : null,
        captain_contact: isFootball ? this.teamForm.captain_contact?.trim() || null : null,
        vice_captain_name: isFootball ? this.teamForm.vice_captain_name?.trim() || null : null,
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
    }
  }

  async togglePaid(team: TournamentTeamWithParticipants): Promise<void> {
    try {
      await this.service.updateTeam(team.id, { paid: !team.paid });
      await this.load();
    } catch (error) {
      this.error.set(this.message(error));
    }
  }

  async removeTeam(team: TournamentTeamWithParticipants): Promise<void> {
    if (!confirm(`Eliminare la squadra "${team.name}" con tutti i partecipanti?`)) return;
    try {
      await this.service.removeTeam(team.id);
      await this.load();
    } catch (error) {
      this.error.set(this.message(error));
    }
  }

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
      team_id: participant.team_id,
      first_name: participant.first_name,
      last_name: participant.last_name,
      contact: participant.contact,
      gender: participant.gender,
      registered: participant.registered
    };
    this.modalMode.set('participant');
  }

  async saveParticipant(): Promise<void> {
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
        first_name: this.participantForm.first_name.trim(),
        last_name: this.participantForm.last_name.trim(),
        contact: this.participantForm.contact?.trim() || null,
        gender: tournament?.sport === 'pallavolo' ? this.participantForm.gender || 'uomo' : 'uomo',
        registered: tournament?.sport === 'pallavolo' ? Boolean(this.participantForm.registered) : false
      };
      await (current ? this.service.updateParticipant(current.id, payload) : this.service.createParticipant(payload));
      this.closeModal();
      await this.load();
    } catch (error) {
      this.error.set(this.message(error));
    }
  }

  async removeParticipant(participant: TeamParticipant): Promise<void> {
    if (!confirm(`Eliminare "${participant.first_name} ${participant.last_name}"?`)) return;
    try {
      await this.service.removeParticipant(participant.id);
      await this.load();
    } catch (error) {
      this.error.set(this.message(error));
    }
  }

  closeModal(): void {
    this.modalMode.set(null);
  }

  export(): void {
    const rows = this.tournaments().flatMap((tournament) =>
      tournament.tournament_teams.flatMap((team) =>
        team.team_participants.length
          ? team.team_participants.map((participant) => this.exportRow(tournament, team, participant))
          : [this.exportRow(tournament, team, null)]
      )
    );
    this.exporter.downloadCsv('tornei-squadre-partecipanti-la-fossa-games.csv', rows);
  }

  teamCount(): number {
    return this.tournaments().reduce((sum, tournament) => sum + tournament.tournament_teams.length, 0);
  }

  participantCount(): number {
    return this.tournaments().reduce(
      (sum, tournament) => sum + tournament.tournament_teams.reduce((teamSum, team) => teamSum + team.team_participants.length, 0),
      0
    );
  }

  paidCount(): number {
    return this.allTeams().filter((team) => team.paid).length;
  }

  pendingCount(): number {
    return this.allTeams().filter((team) => !team.paid).length;
  }

  paidAmount(): number {
    return this.allTeams().filter((team) => team.paid).reduce((sum, team) => sum + this.teamFee(team), 0);
  }

  pendingAmount(): number {
    return this.allTeams().filter((team) => !team.paid).reduce((sum, team) => sum + this.teamFee(team), 0);
  }

  eur(value: number): string {
    return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(value);
  }

  formatDate(value: string): string {
    return new Intl.DateTimeFormat('it-IT').format(new Date(value));
  }

  formatDateTime(value: string): string {
    return new Intl.DateTimeFormat('it-IT', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value));
  }

  insertMeta(team: TournamentTeamWithParticipants): string {
    return `Inserita da ${this.userNames()[team.created_by ?? ''] ?? 'Utente non disponibile'} · ${this.formatDateTime(team.created_at)}`;
  }

  emptyTournamentForm(): InsertTournament {
    return { name: '', sport: 'calcio', fee: 0, date: null, notes: null };
  }

  emptyTeamForm(tournamentId: string): InsertTournamentTeam {
    return {
      tournament_id: tournamentId,
      name: '',
      captain_name: '',
      captain_contact: '',
      vice_captain_name: '',
      vice_captain_contact: '',
      fee: 0,
      paid: false,
      notes: ''
    };
  }

  emptyParticipantForm(teamId: string): InsertTeamParticipant {
    return { team_id: teamId, first_name: '', last_name: '', contact: '', gender: 'uomo', registered: false };
  }

  private allTeams(): TournamentTeamWithParticipants[] {
    return this.tournaments().flatMap((tournament) => tournament.tournament_teams);
  }

  teamFee(team: TournamentTeamWithParticipants): number {
    return this.tournamentFee(team.tournament_id);
  }

  selectedTeamSport(): string {
    return this.tournaments().find((tournament) => tournament.id === this.teamForm.tournament_id)?.sport ?? 'calcio';
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

  teamHint(tournament: TournamentWithTeams, team: TournamentTeamWithParticipants): string {
    if (tournament.sport === 'calcio') return 'Referenti squadra';
    const limit = this.participantLimit(tournament);
    return limit ? `${team.team_participants.length}/${limit} persone` : `${team.team_participants.length} partecipanti`;
  }

  canAddParticipant(tournament: TournamentWithTeams, team: TournamentTeamWithParticipants): boolean {
    const limit = this.participantLimit(tournament);
    return !limit || team.team_participants.length < limit;
  }

  private participantLimit(tournament: TournamentWithTeams): number | null {
    return {
      briscola: 2,
      fifa: 1,
      'ping-pong': 1,
      'calcio-balilla': 2
    }[tournament.code ?? ''] ?? null;
  }

  private findTournament(tournamentId: string): TournamentWithTeams | undefined {
    return this.tournaments().find((tournament) => tournament.id === tournamentId);
  }

  private findTeam(teamId: string): TournamentTeamWithParticipants | undefined {
    return this.tournaments().flatMap((tournament) => tournament.tournament_teams).find((team) => team.id === teamId);
  }

  private tournamentFee(tournamentId: string): number {
    return Number(this.tournaments().find((tournament) => tournament.id === tournamentId)?.fee || 0);
  }

  private exportRow(tournament: TournamentWithTeams, team: TournamentTeamWithParticipants, participant: TeamParticipant | null): Record<string, unknown> {
    return {
      torneo: tournament.name,
      sport: this.sportLabel(tournament.sport),
      squadra: team.name,
      quota: tournament.fee,
      pagata: team.paid ? 'si' : 'no',
      capitano: team.captain_name ?? '',
      contatto_capitano: team.captain_contact ?? '',
      vicecapitano: team.vice_captain_name ?? '',
      contatto_vicecapitano: team.vice_captain_contact ?? '',
      nome: participant?.first_name ?? '',
      cognome: participant?.last_name ?? '',
      contatto: participant?.contact ?? '',
      sesso: participant && tournament.sport === 'pallavolo' ? this.genderLabel(participant.gender) : '',
      tesserato: participant && tournament.sport === 'pallavolo' ? (participant.registered ? 'si' : 'no') : ''
    };
  }

  private message(error: unknown): string {
    return error instanceof Error ? error.message : 'Operazione non riuscita.';
  }

  private genderLabel(gender: string): string {
    return gender === 'donna' ? 'Donna' : 'Uomo';
  }

  protected readonly String = String;
}

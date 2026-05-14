import { Component, OnInit, computed, inject, signal } from "@angular/core";
import { AuthService } from "../../core/services/auth.service";
import { ExportService } from "../../core/services/export.service";
import { ProfileService } from "../../core/services/profile.service";
import { RegistrationsService } from "../../core/services/registrations.service";
import { SnackbarService } from "../../core/services/snackbar.service";
import {
  InsertTeamParticipant,
  InsertTournament,
  InsertTournamentTeam,
  TeamParticipant,
  Tournament,
  TournamentTeamWithParticipants,
  TournamentWithTeams,
} from "../../core/types/models";
import {
  ConfirmModalComponent,
  EmptyStateComponent,
  KpiPanelComponent,
  SummaryCardComponent,
} from "../../shared/components/ui.component";
import {
  FilterOption,
  StatusFilterPillsComponent,
} from "../../shared/components/status-filter-pills.component";
import { DirectEntryModalComponent } from "./components/direct-entry-modal.component";
import { ParticipantModalComponent } from "./components/participant-modal.component";
import { RegistrationsTableComponent } from "./components/registrations-table.component";
import { TeamModalComponent } from "./components/team-modal.component";
import { TournamentHeaderCardComponent } from "./components/tournament-header-card.component";
import { TournamentModalComponent } from "./components/tournament-modal.component";
import { TournamentSelectorComponent } from "./components/tournament-selector.component";

type ModalMode = "tournament" | "team" | "participant" | "direct" | null;
type PaymentFilter = "all" | "paid" | "pending";
type DirectPerson = { first_name: string; last_name: string; contact: string };
type DirectForm = {
  tournament_id: string;
  paid: boolean;
  person1: DirectPerson;
  person2: DirectPerson;
};

const SOLO_CODES = ["fifa", "ping-pong"];
const DUO_CODES = ["briscola", "calcio-balilla"];
const DIRECT_CODES = [...SOLO_CODES, ...DUO_CODES];

@Component({
  selector: "lfg-registrations",
  standalone: true,
  imports: [
    EmptyStateComponent,
    KpiPanelComponent,
    SummaryCardComponent,
    ConfirmModalComponent,
    TournamentSelectorComponent,
    TournamentHeaderCardComponent,
    TournamentModalComponent,
    TeamModalComponent,
    ParticipantModalComponent,
    DirectEntryModalComponent,
    RegistrationsTableComponent,
    StatusFilterPillsComponent,
  ],
  template: `
    <section class="space-y-5">
      <div class="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p class="text-xs font-bold uppercase tracking-[0.18em] text-muted">
            Tornei e iscritti
          </p>
          <h1 class="font-display text-3xl uppercase">Iscrizioni</h1>
        </div>
        <button
          class="rounded-lg bg-surface px-4 py-2 text-sm font-bold ring-1 ring-black/15"
          (click)="export()"
        >
          CSV
        </button>
      </div>

      <lfg-kpi-panel title="KPI iscrizioni">
        <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <lfg-summary-card
            label="Iscritti"
            [value]="teamCount().toString()"
            [hint]="participantCount() + ' persone'"
          />
          <lfg-summary-card
            label="Pagati"
            [value]="eur(paidAmount())"
            [hint]="paidCount() + ' iscrizioni'"
            tone="income"
          />
          <lfg-summary-card
            label="Da incassare"
            [value]="eur(pendingAmount())"
            [hint]="pendingCount() + ' iscrizioni'"
            tone="warning"
          />
        </div>
      </lfg-kpi-panel>

      <lfg-status-filter-pills
        [options]="paymentFilterOptions"
        (filterChange)="setPaymentFilter($event)"
      />

      @if (error()) {
        <p class="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {{ error() }}
        </p>
      }

      @if (!tournaments().length) {
        <lfg-empty-state
          title="Nessun torneo"
          text="I tornei vengono creati automaticamente al primo accesso."
        />
      } @else {
        <lfg-tournament-selector
          [tournaments]="tournaments"
          [selectedTournamentId]="selectedTournamentId"
          (selectTournament)="selectTournament($event)"
        />

        @if (activeTournament(); as tournament) {
          <lfg-tournament-header-card
            [tournament]="activeTournament"
            [isTeamTournament]="isActiveTeamTournament"
            (editTournament)="editTournament(tournament)"
            (addTeamOrParticipant)="openNewTeamOrDirectModal(tournament)"
          />

          <lfg-registrations-table
            [items]="() => filteredTeams()"
            [tournament]="activeTournament"
            [isDirect]="isActiveDirectTournament"
            [isDuo]="isDuoSelected"
            [auth]="auth"
            (editTeam)="editTeam($event)"
            (editDirectEntry)="editDirectEntry($event)"
            (togglePaid)="togglePaid($event)"
            (addParticipant)="newParticipant($event)"
            (deleteTeam)="askRemoveTeam($event)"
            (editParticipant)="editParticipant($event)"
            (deleteParticipant)="askRemoveParticipant($event)"
          />
        }
      }
    </section>

    <!-- Tournament Modal -->
    <lfg-tournament-modal
      [open]="() => modalMode() === 'tournament'"
      [title]="() => editingTournament() ? 'Modifica torneo' : 'Nuovo torneo'"
      [tournament]="editingTournament"
      [loading]="saving"
      [error]="modalError"
      (close)="closeModal()"
      (save)="saveTournament($event)"
    />

    <!-- Team Modal -->
    <lfg-team-modal
      [open]="() => modalMode() === 'team'"
      [profiles]="() => profiles()"
      [formValue]="teamForm"
      [editing]="!!editingTeam()"
      [loading]="saving"
      [error]="modalError"
      (close)="closeModal()"
      (save)="saveTeam($event)"
    />

    <!-- Participant Modal -->
    <lfg-participant-modal
      [open]="() => modalMode() === 'participant'"
      [isFipavSport]="() => selectedParticipantSport() === 'pallavolo'"
      [formValue]="participantForm"
      [editing]="!!editingParticipant()"
      [loading]="saving"
      [error]="modalError"
      (close)="closeModal()"
      (save)="saveParticipant($event)"
    />

    <!-- Direct Entry Modal -->
    <lfg-direct-entry-modal
      [open]="() => modalMode() === 'direct'"
      [isDuo]="isDuoSelected"
      [modalTitle]="directModalTitle"
      [formValue]="directForm"
      [fee]="activeTournament()?.fee"
      [loading]="saving"
      [error]="modalError"
      (close)="closeModal()"
      (save)="saveDirectEntry($event)"
    />

    <!-- Confirm Modal -->
    <lfg-confirm
      [open]="!!confirmPending()"
      [message]="confirmMessage()"
      (confirm)="doConfirm()"
      (cancel)="confirmPending.set(null)"
    />
  `,
})
export class RegistrationsComponent implements OnInit {
  readonly auth = inject(AuthService);
  private readonly service = inject(RegistrationsService);
  private readonly exporter = inject(ExportService);
  private readonly profilesService = inject(ProfileService);
  private readonly snackbar = inject(SnackbarService);

  // State
  tournaments = signal<TournamentWithTeams[]>([]);
  profiles = signal<any[]>([]);
  selectedTournamentId = signal<string | null>(null);
  paymentFilter = signal<PaymentFilter>("all");
  modalMode = signal<ModalMode>(null);
  saving = signal(false);
  modalError = signal("");
  error = signal("");
  editingTournament = signal<Tournament | null>(null);
  editingTeam = signal<TournamentTeamWithParticipants | null>(null);
  editingParticipant = signal<TeamParticipant | null>(null);
  editingDirectTeam = signal<TournamentTeamWithParticipants | null>(null);
  confirmPending = signal<(() => Promise<void>) | null>(null);
  confirmMessage = signal("");
  selectedParticipantSport = signal("");

  // Forms
  teamForm: InsertTournamentTeam = this.emptyTeamForm();
  participantForm: InsertTeamParticipant = this.emptyParticipantForm();
  directForm: DirectForm = this.emptyDirectForm();

  // Computed
  activeTournament = computed(() => {
    const id = this.selectedTournamentId();
    return this.tournaments().find((t) => t.id === id);
  });

  filteredTeams = computed(() => {
    const t = this.activeTournament();
    if (!t) return [];
    const teams = t.tournament_teams || [];
    return this.filterTeamsByPayment(teams);
  });

  filteredDirects = computed(() => {
    const t = this.activeTournament();
    if (!t || !this.isDirect(t)) return [];
    const teams = t.tournament_teams || [];
    return this.filterTeamsByPayment(teams);
  });

  paymentFilterOptions = computed<FilterOption[]>(() => [
    { label: "Tutte", value: "all", active: this.paymentFilter() === "all" },
    { label: "Pagate", value: "paid", active: this.paymentFilter() === "paid" },
    {
      label: "Da pagare",
      value: "pending",
      active: this.paymentFilter() === "pending",
    },
  ]);

  teamCount = computed(() =>
    this.tournaments().reduce(
      (sum, t) => sum + (t.tournament_teams?.length || 0),
      0,
    ),
  );

  participantCount = computed(() => {
    let count = 0;
    for (const t of this.tournaments()) {
      if (this.isDirect(t)) {
        count +=
          (t.tournament_teams?.length || 0) * (this.isDuoTournament(t) ? 2 : 1);
      } else {
        for (const team of t.tournament_teams || []) {
          count += team.team_participants?.length || 0;
        }
      }
    }
    return count;
  });

  paidCount = computed(() => {
    const paid = this.tournaments().reduce(
      (sum, t) =>
        sum + (t.tournament_teams?.filter((team) => team.paid).length || 0),
      0,
    );
    return paid;
  });

  pendingCount = computed(() => {
    const pending = this.tournaments().reduce(
      (sum, t) =>
        sum +
        (t.tournament_teams?.filter((team) => !team.paid && t.fee).length || 0),
      0,
    );
    return pending;
  });

  paidAmount = computed(() => {
    let sum = 0;
    for (const t of this.tournaments()) {
      for (const team of t.tournament_teams || []) {
        if (team.paid && t.fee) sum += t.fee;
      }
    }
    return sum;
  });

  pendingAmount = computed(() => {
    let sum = 0;
    for (const t of this.tournaments()) {
      for (const team of t.tournament_teams || []) {
        if (!team.paid && t.fee) sum += t.fee;
      }
    }
    return sum;
  });

  isDuoSelected = computed(() => {
    const t = this.activeTournament();
    return t ? this.isDuoTournament(t) : false;
  });

  isActiveTeamTournament = computed(() => {
    const t = this.activeTournament();
    return t ? !this.isDirect(t) : false;
  });

  isActiveDirectTournament = computed(() => {
    const t = this.activeTournament();
    return t ? this.isDirect(t) : false;
  });

  directModalTitle = computed(() => {
    if (this.isDuoSelected()) {
      return this.editingDirectTeam() ? "Modifica coppia" : "Nuova coppia";
    } else {
      return this.editingDirectTeam()
        ? "Modifica partecipante"
        : "Nuovo partecipante";
    }
  });

  ngOnInit(): void {
    void this.load();
  }

  async load(): Promise<void> {
    this.error.set("");
    try {
      const [tournaments, profiles] = await Promise.all([
        this.service.listTournaments(),
        this.profilesService.list(),
      ]);
      this.tournaments.set(tournaments);
      this.profiles.set(profiles);
      if (!this.selectedTournamentId() && tournaments.length) {
        this.selectedTournamentId.set(tournaments[0].id);
      }
    } catch (e) {
      this.setError(e);
    }
  }

  selectTournament(id: string): void {
    this.selectedTournamentId.set(id);
  }

  setPaymentFilter(value: string): void {
    this.paymentFilter.set(value as PaymentFilter);
  }

  editTournament(tournament: Tournament): void {
    if (!this.auth.isAdmin()) return;
    this.error.set("");
    this.editingTournament.set(tournament);
    this.modalMode.set("tournament");
  }

  async saveTournament(payload: InsertTournament): Promise<void> {
    if (this.saving()) return;
    this.saving.set(true);
    this.modalError.set("");
    try {
      const current = this.editingTournament();
      if (current) {
        await this.service.updateTournament(current.id, payload);
      } else {
        await this.service.createTournament(payload);
      }
      this.closeModal();
      await this.load();
    } catch (e) {
      this.setModalError(e);
    } finally {
      this.saving.set(false);
    }
  }

  openNewTeamOrDirectModal(tournament: TournamentWithTeams): void {
    this.error.set("");
    if (this.isDirect(tournament)) {
      this.editingDirectTeam.set(null);
      this.directForm = this.emptyDirectForm();
      this.directForm.tournament_id = tournament.id;
      this.modalMode.set("direct");
    } else {
      this.editingTeam.set(null);
      this.teamForm = this.emptyTeamForm();
      this.teamForm.tournament_id = tournament.id;
      this.modalMode.set("team");
    }
  }

  editTeam(team: TournamentTeamWithParticipants): void {
    this.error.set("");
    this.editingTeam.set(team);
    this.teamForm = {
      tournament_id: team.tournament_id,
      name: team.name,
      captain_name: team.captain_name,
      captain_contact: team.captain_contact || "",
      vice_captain_name: team.vice_captain_name || "",
      vice_captain_contact: team.vice_captain_contact || "",
      fee: team.fee,
      paid: team.paid,
      notes: team.notes || "",
    };
    this.modalMode.set("team");
  }

  async saveTeam(payload: InsertTournamentTeam): Promise<void> {
    if (this.saving()) return;
    this.saving.set(true);
    this.modalError.set("");
    try {
      const normalizedPayload: InsertTournamentTeam = {
        ...payload,
        name: payload.name.trim(),
        captain_name: payload.captain_name?.trim() || null,
        captain_contact: payload.captain_contact?.trim() || null,
        vice_captain_name: payload.vice_captain_name?.trim() || null,
        vice_captain_contact: payload.vice_captain_contact?.trim() || null,
        fee: this.tournamentFee(payload.tournament_id),
        notes: payload.notes?.trim() || null,
      };
      const current = this.editingTeam();
      if (current) {
        await this.service.updateTeam(current.id, normalizedPayload);
      } else {
        await this.service.createTeam(normalizedPayload);
      }
      this.closeModal();
      await this.load();
    } catch (e) {
      this.setModalError(e);
    } finally {
      this.saving.set(false);
    }
  }

  editParticipant(participant: TeamParticipant): void {
    this.error.set("");
    this.editingParticipant.set(participant);
    const tournament = this.activeTournament();
    this.selectedParticipantSport.set(tournament?.sport || "");
    this.participantForm = {
      team_id: participant.team_id,
      first_name: participant.first_name,
      last_name: participant.last_name,
      contact: participant.contact || "",
      gender: participant.gender || "uomo",
      registered: participant.registered || false,
    };
    this.modalMode.set("participant");
  }

  newParticipant(teamId: string): void {
    const team = this.findTeam(teamId);
    const tournament = team
      ? this.tournaments().find((t) => t.id === team.tournament_id)
      : undefined;
    if (team && tournament && !this.canAddParticipant(tournament, team)) {
      const message = `Limite persone raggiunto per ${tournament.name}.`;
      this.error.set(message);
      this.snackbar.warning(message);
      return;
    }
    this.error.set("");
    this.editingParticipant.set(null);
    this.participantForm = this.emptyParticipantForm();
    this.participantForm.team_id = teamId;
    this.selectedParticipantSport.set(tournament?.sport || "");
    this.modalMode.set("participant");
  }

  async saveParticipant(payload: InsertTeamParticipant): Promise<void> {
    if (this.saving()) return;
    this.saving.set(true);
    this.modalError.set("");
    try {
      const team = this.findTeam(payload.team_id);
      const tournament = team
        ? this.tournaments().find((t) => t.id === team.tournament_id)
        : undefined;
      const current = this.editingParticipant();
      if (
        !current &&
        team &&
        tournament &&
        !this.canAddParticipant(tournament, team)
      ) {
        throw new Error(`Limite persone raggiunto per ${tournament.name}.`);
      }
      const registeredCount =
        team?.team_participants.filter(
          (participant) =>
            participant.registered && participant.id !== current?.id,
        ).length ?? 0;
      if (
        tournament?.sport === "pallavolo" &&
        payload.registered &&
        registeredCount >= 1
      ) {
        throw new Error(
          "Per il Green Volley è consentito massimo 1 tesserato FIPAV per squadra.",
        );
      }
      const normalizedPayload: InsertTeamParticipant = {
        ...payload,
        first_name: payload.first_name.trim(),
        last_name: payload.last_name.trim(),
        contact: payload.contact?.trim() || null,
        registered:
          tournament?.sport === "pallavolo" ? Boolean(payload.registered) : false,
      };
      if (current) {
        await this.service.updateParticipant(current.id, normalizedPayload);
      } else {
        await this.service.createParticipant(normalizedPayload);
      }
      this.closeModal();
      await this.load();
    } catch (e) {
      this.setModalError(e);
    } finally {
      this.saving.set(false);
    }
  }

  editDirectEntry(team: TournamentTeamWithParticipants): void {
    this.error.set("");
    this.editingDirectTeam.set(team);
    const p1 = team.team_participants?.[0];
    const p2 = team.team_participants?.[1];
    this.directForm = {
      tournament_id: team.tournament_id,
      paid: team.paid,
      person1: {
        first_name: p1?.first_name || "",
        last_name: p1?.last_name || "",
        contact: p1?.contact || "",
      },
      person2: {
        first_name: p2?.first_name || "",
        last_name: p2?.last_name || "",
        contact: p2?.contact || "",
      },
    };
    this.modalMode.set("direct");
  }

  async saveDirectEntry(payload: DirectForm): Promise<void> {
    if (this.saving()) return;
    this.saving.set(true);
    this.modalError.set("");
    try {
      const tournament = this.tournaments().find(
        (t) => t.id === payload.tournament_id,
      );
      if (!tournament) throw new Error("Torneo non trovato");

      const isDuo = this.isDuoTournament(tournament);
      const p1 = this.normalizeDirectPerson(payload.person1);
      const p2 = this.normalizeDirectPerson(payload.person2);
      const teamName = isDuo
        ? `${p1.first_name} / ${p2.first_name}`
        : `${p1.first_name} ${p1.last_name}`;
      const current = this.editingDirectTeam();

      if (current) {
        await this.service.updateTeam(current.id, {
          name: teamName,
          paid: payload.paid,
        });

        if (current.team_participants?.[0]) {
          await this.service.updateParticipant(
            current.team_participants[0].id,
            {
              team_id: current.id,
              first_name: p1.first_name,
              last_name: p1.last_name,
              contact: p1.contact,
              gender: "uomo",
              registered: false,
            },
          );
        }

        if (isDuo && current.team_participants?.[1]) {
          await this.service.updateParticipant(
            current.team_participants[1].id,
            {
              team_id: current.id,
              first_name: p2.first_name,
              last_name: p2.last_name,
              contact: p2.contact,
              gender: "uomo",
              registered: false,
            },
          );
        }
      } else {
        const team = await this.service.createTeam({
          tournament_id: payload.tournament_id,
          name: teamName,
          captain_name: null,
          captain_contact: null,
          vice_captain_name: null,
          vice_captain_contact: null,
          fee: tournament.fee,
          paid: payload.paid,
          notes: null,
        });

        await this.service.createParticipant({
          team_id: team.id,
          first_name: p1.first_name,
          last_name: p1.last_name,
          contact: p1.contact,
          gender: "uomo",
          registered: false,
        });

        if (isDuo) {
          await this.service.createParticipant({
            team_id: team.id,
            first_name: p2.first_name,
            last_name: p2.last_name,
            contact: p2.contact,
            gender: "uomo",
            registered: false,
          });
        }
      }

      this.closeModal();
      await this.load();
    } catch (e) {
      this.setModalError(e);
    } finally {
      this.saving.set(false);
    }
  }

  askRemoveTeam(teamId: string): void {
    this.confirmMessage.set("Eliminare questa iscrizione?");
    this.confirmPending.set(async () => {
      try {
        await this.service.removeTeam(teamId);
        await this.load();
      } catch (e) {
        this.setError(e);
      }
    });
  }

  askRemoveParticipant(participantId: string): void {
    this.confirmMessage.set("Eliminare questo partecipante?");
    this.confirmPending.set(async () => {
      try {
        await this.service.removeParticipant(participantId);
        await this.load();
      } catch (e) {
        this.setError(e);
      }
    });
  }

  askRemoveDirectEntry(teamId: string): void {
    this.confirmMessage.set("Eliminare questa iscrizione?");
    this.confirmPending.set(async () => {
      try {
        await this.service.removeTeam(teamId);
        await this.load();
      } catch (e) {
        this.setError(e);
      }
    });
  }

  async doConfirm(): Promise<void> {
    const fn = this.confirmPending();
    this.confirmPending.set(null);
    if (fn) await fn();
  }

  closeModal(): void {
    this.modalMode.set(null);
    this.editingTournament.set(null);
    this.editingTeam.set(null);
    this.editingParticipant.set(null);
    this.editingDirectTeam.set(null);
    this.modalError.set("");
  }

  export(): void {
    const rows: any[] = [];
    for (const tournament of this.tournaments()) {
      for (const team of tournament.tournament_teams || []) {
        if (this.isDirect(tournament)) {
          rows.push({
            tournament: tournament.name,
            sport: tournament.sport,
            iscritti: team.team_participants
              ?.map((p) => `${p.first_name} ${p.last_name}`)
              .join(", "),
            pagato: team.paid ? "Sì" : "No",
          });
        } else {
          if (!team.team_participants?.length) {
            rows.push({
              tournament: tournament.name,
              sport: tournament.sport,
              squadra: team.name,
              capitano: team.captain_name,
              vice_capitano: team.vice_captain_name,
              pagato: team.paid ? "Sì" : "No",
            });
          } else {
            for (const participant of team.team_participants) {
              rows.push({
                tournament: tournament.name,
                sport: tournament.sport,
                squadra: team.name,
                partecipante: `${participant.first_name} ${participant.last_name}`,
                contatto: participant.contact,
                pagato: team.paid ? "Sì" : "No",
              });
            }
          }
        }
      }
    }
    this.exporter.downloadCsv(
      "tornei-squadre-partecipanti-la-fossa-games.csv",
      rows,
    );
  }

  isDirect(t: TournamentWithTeams): boolean {
    return DIRECT_CODES.includes(t.code || "");
  }

  async togglePaid(team: TournamentTeamWithParticipants): Promise<void> {
    try {
      await this.service.updateTeam(team.id, { paid: !team.paid });
      await this.load();
    } catch (e) {
      this.setError(e);
    }
  }

  isDuoTournament(t: TournamentWithTeams): boolean {
    return DUO_CODES.includes(t.code || "");
  }

  private filterTeamsByPayment(
    teams: TournamentTeamWithParticipants[],
  ): TournamentTeamWithParticipants[] {
    const filter = this.paymentFilter();
    if (filter === "paid") return teams.filter((t) => t.paid);
    if (filter === "pending") return teams.filter((t) => !t.paid);
    return teams;
  }

  private canAddParticipant(
    tournament: TournamentWithTeams,
    team: TournamentTeamWithParticipants,
  ): boolean {
    const limit =
      (
        {
          pallavolo: 5,
          briscola: 2,
          fifa: 1,
          "ping-pong": 1,
          "calcio-balilla": 2,
        } as Record<string, number>
      )[tournament.code ?? ""] ?? null;
    return !limit || team.team_participants.length < limit;
  }

  private findTeam(teamId: string): TournamentTeamWithParticipants | undefined {
    return this.tournaments()
      .flatMap((tournament) => tournament.tournament_teams)
      .find((team) => team.id === teamId);
  }

  private tournamentFee(tournamentId: string): number {
    return Number(
      this.tournaments().find((tournament) => tournament.id === tournamentId)
        ?.fee || 0,
    );
  }

  private normalizeDirectPerson(person: DirectPerson): DirectPerson {
    return {
      first_name: person.first_name.trim(),
      last_name: person.last_name.trim(),
      contact: person.contact.trim(),
    };
  }

  private emptyTeamForm(): InsertTournamentTeam {
    return {
      tournament_id: "",
      name: "",
      captain_name: "",
      captain_contact: "",
      vice_captain_name: "",
      vice_captain_contact: "",
      fee: 0,
      paid: false,
      notes: "",
    };
  }

  private emptyParticipantForm(): InsertTeamParticipant {
    return {
      team_id: "",
      first_name: "",
      last_name: "",
      contact: "",
      gender: "uomo",
      registered: false,
    };
  }

  private emptyDirectForm(): DirectForm {
    return {
      tournament_id: "",
      paid: false,
      person1: { first_name: "", last_name: "", contact: "" },
      person2: { first_name: "", last_name: "", contact: "" },
    };
  }

  private setError(e: unknown): void {
    const msg = e instanceof Error ? e.message : "Operazione non riuscita";
    this.error.set(msg);
    this.snackbar.error(msg);
  }

  private setModalError(e: unknown): void {
    const msg = e instanceof Error ? e.message : "Operazione non riuscita";
    this.modalError.set(msg);
    this.snackbar.error(msg);
  }

  eur(value: number): string {
    return new Intl.NumberFormat("it-IT", {
      style: "currency",
      currency: "EUR",
    }).format(value);
  }
}

import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  computed,
  inject,
  signal,
} from "@angular/core";
import { Router } from "@angular/router";
import { AuthService } from "../../../core/services/auth.service";
import { RegistrationsService } from "../../../core/services/registrations.service";
import { SnackbarService } from "../../../core/services/snackbar.service";
import {
  InsertTeamParticipant,
  InsertTournamentTeam,
  TeamParticipant,
  TournamentTeamWithParticipants,
  TournamentWithTeams,
} from "../../../core/types/models";
import {
  DIRECT_TOURNAMENT_CODES,
  DUO_TOURNAMENT_CODES,
  FILTER_ALL,
  PARTICIPANT_GENDER,
  TOURNAMENT_MIN_PARTICIPANTS_BY_CODE,
  TOURNAMENT_SPORT,
} from "../../../core/types/constants";
import {
  FilterOption,
  StatusFilterPillsComponent,
} from "../../../shared/components/status-filter-pills.component";
import {
  ConfirmModalComponent,
  EmptyStateComponent,
  SummaryCardComponent,
} from "../../../shared/components/ui.component";
import { DirectEntryModalComponent } from "../../registrations/components/direct-entry-modal.component";
import { ParticipantModalComponent } from "../../registrations/components/participant-modal.component";
import { RegistrationsTableComponent } from "../../registrations/components/registrations-table.component";
import { TeamModalComponent } from "../../registrations/components/team-modal.component";

type ModalMode = "team" | "participant" | "direct" | null;
type PaymentFilter = typeof FILTER_ALL | "paid" | "pending";
type DirectPerson = { first_name: string; last_name: string; contact: string };
type DirectForm = {
  tournament_id: string;
  paid: boolean;
  person1: DirectPerson;
  person2: DirectPerson;
};

@Component({
  selector: "lfg-tornei-tab-iscritti",
  standalone: true,
  imports: [
    EmptyStateComponent,
    SummaryCardComponent,
    ConfirmModalComponent,
    TeamModalComponent,
    ParticipantModalComponent,
    DirectEntryModalComponent,
    RegistrationsTableComponent,
    StatusFilterPillsComponent,
  ],
  template: `
    <div class="animate-fade-in space-y-4">
      <!-- KPI -->
      <div class="grid grid-cols-3 items-stretch gap-3">
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

      <!-- Search + filter -->
      <input
        type="search"
        placeholder="Cerca per nome squadra o capitano…"
        class="w-full rounded-lg border border-soft bg-surface px-4 py-2.5 text-sm outline-none placeholder:text-muted"
        [value]="searchQuery()"
        (input)="searchQuery.set($any($event.target).value)"
      />
      <lfg-status-filter-pills
        [options]="paymentFilterOptions"
        (filterChange)="paymentFilter.set($any($event))"
      />

      @if (error()) {
        <p class="rounded-lg bg-red-50 p-3 text-sm text-red-700">{{ error() }}</p>
      }

      @if (!tournament().tournament_teams.length) {
        <lfg-empty-state
          title="Nessuna iscrizione"
          [text]="isDirect() ? 'Aggiungi il primo partecipante.' : 'Aggiungi la prima squadra.'"
          icon="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
        />
      } @else {
        <lfg-registrations-table
          [items]="() => filteredTeams()"
          [tournament]="tournament"
          [isDirect]="() => isDirect()"
          [isDuo]="() => isDuo()"
          [auth]="auth"
          (editTeam)="onEditTeam($event)"
          (editDirectEntry)="onEditDirect($event)"
          (togglePaid)="onTogglePaid($event)"
          (addParticipant)="onNewParticipant($event)"
          (deleteTeam)="onAskRemoveTeam($event)"
          (editParticipant)="onEditParticipant($event)"
          (deleteParticipant)="onAskRemoveParticipant($event)"
          (openTeamDetail)="openTeamDetail($event)"
        />
      }

      <!-- Desktop add button -->
      <div class="hidden sm:block">
        <button
          type="button"
          class="bg-strong text-on-strong rounded-lg px-5 py-3 text-sm font-black uppercase"
          (click)="onAddNew()"
        >
          + {{ isDirect() ? 'Aggiungi partecipante' : 'Aggiungi squadra' }}
        </button>
      </div>
    </div>

    <!-- Mobile FAB -->
    <button
      type="button"
      class="bg-accent text-on-accent fixed bottom-4 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full shadow-lg text-2xl font-black sm:hidden"
      style="line-height:1"
      (click)="onAddNew()"
      aria-label="Aggiungi"
    >
      +
    </button>

    <!-- Team Modal -->
    <lfg-team-modal
      [open]="() => modalMode() === 'team'"
      [formValue]="teamForm"
      [editing]="!!editingTeam()"
      [loading]="saving"
      [error]="modalError"
      (close)="closeModal()"
      (save)="onSaveTeam($event)"
    />

    <!-- Participant Modal -->
    <lfg-participant-modal
      [open]="() => modalMode() === 'participant'"
      [isFipavSport]="() => tournament().sport === 'pallavolo'"
      [formValue]="participantForm"
      [editing]="!!editingParticipant()"
      [loading]="saving"
      [error]="modalError"
      (close)="closeModal()"
      (save)="onSaveParticipant($event)"
    />

    <!-- Direct Entry Modal -->
    <lfg-direct-entry-modal
      [open]="() => modalMode() === 'direct'"
      [isDuo]="() => isDuo()"
      [modalTitle]="() => directModalTitle()"
      [formValue]="directForm"
      [fee]="tournament().fee"
      [loading]="saving"
      [error]="modalError"
      (close)="closeModal()"
      (save)="onSaveDirect($event)"
    />

    <!-- Confirm -->
    <lfg-confirm
      [open]="!!confirmPending()"
      [message]="confirmMessage()"
      (confirm)="doConfirm()"
      (cancel)="confirmPending.set(null)"
    />
  `,
})
export class TorneiTabIscrittiComponent implements OnChanges {
  @Input({ required: true }) tournament!: () => TournamentWithTeams;
  @Input({ required: true }) tournamentId!: string;
  @Output() reloadRequired = new EventEmitter<void>();

  readonly auth = inject(AuthService);
  private readonly service = inject(RegistrationsService);
  private readonly snackbar = inject(SnackbarService);
  private readonly router = inject(Router);

  modalMode = signal<ModalMode>(null);
  saving = signal(false);
  modalError = signal("");
  error = signal("");
  editingTeam = signal<TournamentTeamWithParticipants | null>(null);
  editingParticipant = signal<TeamParticipant | null>(null);
  editingDirectTeam = signal<TournamentTeamWithParticipants | null>(null);
  confirmPending = signal<(() => Promise<void>) | null>(null);
  confirmMessage = signal("");
  searchQuery = signal("");
  paymentFilter = signal<PaymentFilter>(FILTER_ALL);

  teamForm: InsertTournamentTeam = this.emptyTeamForm();
  participantForm: InsertTeamParticipant = this.emptyParticipantForm();
  directForm: DirectForm = this.emptyDirectForm();

  ngOnChanges(): void {
    this.searchQuery.set("");
    this.paymentFilter.set(FILTER_ALL);
  }

  isDirect = computed(() => DIRECT_TOURNAMENT_CODES.includes(this.tournament().code ?? ""));
  isDuo = computed(() => DUO_TOURNAMENT_CODES.includes(this.tournament().code ?? ""));

  filteredTeams = computed(() => {
    const teams = this.tournament().tournament_teams ?? [];
    const q = this.searchQuery().toLowerCase().trim();
    const filter = this.paymentFilter();
    let result = teams;
    if (filter === "paid") result = result.filter((t) => t.paid);
    if (filter === "pending") result = result.filter((t) => !t.paid);
    if (!q) return result;
    return result.filter(
      (t) => t.name.toLowerCase().includes(q) || (t.captain_name ?? "").toLowerCase().includes(q),
    );
  });

  teamCount = computed(() => this.tournament().tournament_teams?.length ?? 0);
  participantCount = computed(() => {
    const t = this.tournament();
    if (this.isDirect()) return this.teamCount() * (this.isDuo() ? 2 : 1);
    return (t.tournament_teams ?? []).reduce((sum, team) => sum + (team.team_participants?.length ?? 0), 0);
  });
  paidCount = computed(() => (this.tournament().tournament_teams ?? []).filter((t) => t.paid).length);
  pendingCount = computed(() => (this.tournament().tournament_teams ?? []).filter((t) => !t.paid && this.tournament().fee).length);
  paidAmount = computed(() => (this.tournament().tournament_teams ?? []).filter((t) => t.paid).length * (this.tournament().fee ?? 0));
  pendingAmount = computed(() => (this.tournament().tournament_teams ?? []).filter((t) => !t.paid).length * (this.tournament().fee ?? 0));

  paymentFilterOptions = computed<FilterOption[]>(() => [
    { label: "Tutte", value: FILTER_ALL, active: this.paymentFilter() === FILTER_ALL },
    { label: "Pagate", value: "paid", active: this.paymentFilter() === "paid" },
    { label: "Da pagare", value: "pending", active: this.paymentFilter() === "pending" },
  ]);

  directModalTitle = computed(() => {
    if (this.isDuo()) return this.editingDirectTeam() ? "Modifica coppia" : "Nuova coppia";
    return this.editingDirectTeam() ? "Modifica partecipante" : "Nuovo partecipante";
  });

  openTeamDetail(teamId: string): void {
    void this.router.navigate(["/app/tornei", this.tournamentId, "squadre", teamId]);
  }

  onAddNew(): void {
    const t = this.tournament();
    this.error.set("");
    if (this.isDirect()) {
      this.editingDirectTeam.set(null);
      this.directForm = { ...this.emptyDirectForm(), tournament_id: t.id };
      this.modalMode.set("direct");
    } else {
      this.editingTeam.set(null);
      this.teamForm = { ...this.emptyTeamForm(), tournament_id: t.id };
      this.modalMode.set("team");
    }
  }

  onEditTeam(team: TournamentTeamWithParticipants): void {
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

  onEditDirect(team: TournamentTeamWithParticipants): void {
    this.editingDirectTeam.set(team);
    const p1 = team.team_participants?.[0];
    const p2 = team.team_participants?.[1];
    this.directForm = {
      tournament_id: team.tournament_id,
      paid: team.paid,
      person1: { first_name: p1?.first_name || "", last_name: p1?.last_name || "", contact: p1?.contact || "" },
      person2: { first_name: p2?.first_name || "", last_name: p2?.last_name || "", contact: p2?.contact || "" },
    };
    this.modalMode.set("direct");
  }

  onNewParticipant(teamId: string): void {
    const team = this.findTeam(teamId);
    const t = this.tournament();
    if (team && !this.canAddParticipant(t, team)) {
      const msg = `Limite persone raggiunto per ${t.name}.`;
      this.error.set(msg);
      this.snackbar.warning(msg);
      return;
    }
    this.editingParticipant.set(null);
    this.participantForm = { ...this.emptyParticipantForm(), team_id: teamId };
    this.modalMode.set("participant");
  }

  onEditParticipant(participant: TeamParticipant): void {
    this.editingParticipant.set(participant);
    this.participantForm = {
      team_id: participant.team_id,
      first_name: participant.first_name,
      last_name: participant.last_name,
      contact: participant.contact || "",
      gender: participant.gender || PARTICIPANT_GENDER.Male,
      registered: participant.registered || false,
    };
    this.modalMode.set("participant");
  }

  async onTogglePaid(team: TournamentTeamWithParticipants): Promise<void> {
    try {
      await this.service.updateTeam(team.id, { paid: !team.paid });
      this.reloadRequired.emit();
    } catch (err) {
      this.snackbar.error(err instanceof Error ? err.message : "Errore.");
    }
  }

  onAskRemoveTeam(teamId: string): void {
    this.confirmMessage.set("Eliminare questa iscrizione?");
    this.confirmPending.set(async () => {
      try {
        await this.service.removeTeam(teamId);
        this.reloadRequired.emit();
      } catch (err) {
        this.snackbar.error(err instanceof Error ? err.message : "Errore.");
      }
    });
  }

  onAskRemoveParticipant(participantId: string): void {
    this.confirmMessage.set("Eliminare questo partecipante?");
    this.confirmPending.set(async () => {
      try {
        await this.service.removeParticipant(participantId);
        this.reloadRequired.emit();
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

  async onSaveTeam(payload: InsertTournamentTeam): Promise<void> {
    if (this.saving()) return;
    if (!payload.captain_contact?.trim()) {
      const msg = "Inserisci il numero di telefono del capitano.";
      this.modalError.set(msg);
      this.snackbar.warning(msg);
      return;
    }
    this.saving.set(true);
    this.modalError.set("");
    try {
      const normalized: InsertTournamentTeam = {
        ...payload,
        name: payload.name.trim(),
        captain_name: payload.captain_name?.trim() || null,
        captain_contact: payload.captain_contact?.trim() || null,
        vice_captain_name: payload.vice_captain_name?.trim() || null,
        vice_captain_contact: payload.vice_captain_contact?.trim() || null,
        fee: this.tournament().fee,
        notes: payload.notes?.trim() || null,
      };
      const current = this.editingTeam();
      if (current) {
        await this.service.updateTeam(current.id, normalized);
      } else {
        await this.service.createTeam(normalized);
      }
      this.closeModal();
      this.reloadRequired.emit();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Errore.";
      this.modalError.set(msg);
      this.snackbar.error(msg);
    } finally {
      this.saving.set(false);
    }
  }

  async onSaveParticipant(payload: InsertTeamParticipant): Promise<void> {
    if (this.saving()) return;
    this.saving.set(true);
    this.modalError.set("");
    try {
      const t = this.tournament();
      const team = this.findTeam(payload.team_id);
      const current = this.editingParticipant();
      if (!current && team && !this.canAddParticipant(t, team)) {
        throw new Error(`Limite persone raggiunto per ${t.name}.`);
      }
      const registeredCount = team?.team_participants.filter(
        (p) => p.registered && p.id !== current?.id,
      ).length ?? 0;
      if (t.sport === TOURNAMENT_SPORT.Volleyball && payload.registered && registeredCount >= 1) {
        throw new Error("Per il Green Volley è consentito massimo 1 tesserato FIPAV per squadra.");
      }
      const normalized: InsertTeamParticipant = {
        ...payload,
        first_name: payload.first_name.trim(),
        last_name: payload.last_name.trim(),
        contact: payload.contact?.trim() || null,
        registered: t.sport === TOURNAMENT_SPORT.Volleyball ? Boolean(payload.registered) : false,
      };
      if (current) {
        await this.service.updateParticipant(current.id, normalized);
      } else {
        await this.service.createParticipant(normalized);
      }
      this.closeModal();
      this.reloadRequired.emit();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Errore.";
      this.modalError.set(msg);
      this.snackbar.error(msg);
    } finally {
      this.saving.set(false);
    }
  }

  async onSaveDirect(payload: DirectForm): Promise<void> {
    if (this.saving()) return;
    const hasPhone = (v: string) => Boolean(v?.trim());
    if (!hasPhone(payload.person1.contact) && (!this.isDuo() || !hasPhone(payload.person2.contact))) {
      const msg = "Inserisci il numero di telefono di almeno un partecipante.";
      this.modalError.set(msg);
      this.snackbar.warning(msg);
      return;
    }
    this.saving.set(true);
    this.modalError.set("");
    try {
      const t = this.tournament();
      const norm = (p: DirectPerson) => ({ first_name: p.first_name.trim(), last_name: p.last_name.trim(), contact: p.contact.trim() });
      const p1 = norm(payload.person1);
      const p2 = norm(payload.person2);
      const teamName = this.isDuo() ? `${p1.first_name} / ${p2.first_name}` : `${p1.first_name} ${p1.last_name}`;
      const current = this.editingDirectTeam();

      if (current) {
        await this.service.updateTeam(current.id, { name: teamName, paid: payload.paid });
        if (current.team_participants?.[0]) {
          await this.service.updateParticipant(current.team_participants[0].id, {
            team_id: current.id, ...p1, gender: PARTICIPANT_GENDER.Male, registered: false,
          });
        }
        if (this.isDuo() && current.team_participants?.[1]) {
          await this.service.updateParticipant(current.team_participants[1].id, {
            team_id: current.id, ...p2, gender: PARTICIPANT_GENDER.Male, registered: false,
          });
        }
      } else {
        const team = await this.service.createTeam({
          tournament_id: t.id, name: teamName, captain_name: null, captain_contact: null,
          vice_captain_name: null, vice_captain_contact: null, fee: t.fee, paid: payload.paid, notes: null,
        });
        await this.service.createParticipant({ team_id: team.id, ...p1, gender: PARTICIPANT_GENDER.Male, registered: false });
        if (this.isDuo()) {
          await this.service.createParticipant({ team_id: team.id, ...p2, gender: PARTICIPANT_GENDER.Male, registered: false });
        }
      }
      this.closeModal();
      this.reloadRequired.emit();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Errore.";
      this.modalError.set(msg);
      this.snackbar.error(msg);
    } finally {
      this.saving.set(false);
    }
  }

  closeModal(): void {
    this.modalMode.set(null);
    this.editingTeam.set(null);
    this.editingParticipant.set(null);
    this.editingDirectTeam.set(null);
    this.modalError.set("");
  }

  private findTeam(teamId: string): TournamentTeamWithParticipants | undefined {
    return (this.tournament().tournament_teams ?? []).find((t) => t.id === teamId);
  }

  private canAddParticipant(t: TournamentWithTeams, team: TournamentTeamWithParticipants): boolean {
    const limit = TOURNAMENT_MIN_PARTICIPANTS_BY_CODE[t.code ?? ""] ?? null;
    return !limit || team.team_participants.length < limit;
  }

  private emptyTeamForm(): InsertTournamentTeam {
    return { tournament_id: "", name: "", captain_name: "", captain_contact: "", vice_captain_name: "", vice_captain_contact: "", fee: 0, paid: false, notes: "" };
  }

  private emptyParticipantForm(): InsertTeamParticipant {
    return { team_id: "", first_name: "", last_name: "", contact: "", gender: PARTICIPANT_GENDER.Male, registered: false };
  }

  private emptyDirectForm(): DirectForm {
    return { tournament_id: "", paid: false, person1: { first_name: "", last_name: "", contact: "" }, person2: { first_name: "", last_name: "", contact: "" } };
  }

  eur(value: number): string {
    return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(value);
  }

  protected readonly FILTER_ALL = FILTER_ALL;
}

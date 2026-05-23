import { Component, OnInit, computed, inject, signal } from "@angular/core";
import { Router } from "@angular/router";
import { AuthService } from "../../core/services/auth.service";
import { RegistrationsService } from "../../core/services/registrations.service";
import { SnackbarService } from "../../core/services/snackbar.service";
import { TournamentsService } from "../../core/services/tournaments.service";
import { InsertTournament, OperationalTournament } from "../../core/types/models";
import {
  TOURNAMENT_MATCH_STATUS,
  TOURNAMENT_PUBLIC_STATUS,
} from "../../core/types/constants";
import { EmptyStateComponent } from "../../shared/components/ui.component";
import { TournamentModalComponent } from "../registrations/components/tournament-modal.component";
import { TorneiCardComponent } from "./components/tornei-card.component";

@Component({
  selector: "lfg-tornei-list",
  standalone: true,
  imports: [
    EmptyStateComponent,
    TournamentModalComponent,
    TorneiCardComponent,
  ],
  template: `
    <!-- Hero header -->
    <header class="bg-strong text-on-strong -mx-4 -mt-4 mb-6 px-4 pb-6 pt-5 sm:-mx-6 sm:-mt-6 sm:px-6">
      <div class="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p class="text-xs font-bold uppercase tracking-[0.18em] opacity-60">Gestione competizioni</p>
          <h1 class="font-display text-3xl uppercase">Tornei</h1>
        </div>
      </div>

      <!-- KPI pill row -->
      <div class="mt-4 flex gap-4 overflow-x-auto no-scrollbar">
        <div class="flex items-center gap-1.5 whitespace-nowrap">
          <span class="text-accent font-black tabular-nums text-lg">{{ tournaments().length }}</span>
          <span class="text-xs font-semibold opacity-70">tornei</span>
        </div>
        <div class="flex items-center gap-1.5 whitespace-nowrap">
          <span class="text-accent font-black tabular-nums text-lg">{{ totalTeams() }}</span>
          <span class="text-xs font-semibold opacity-70">squadre/iscritti</span>
        </div>
        <div class="flex items-center gap-1.5 whitespace-nowrap">
          <span class="text-accent font-black tabular-nums text-lg">{{ publishedCount() }}</span>
          <span class="text-xs font-semibold opacity-70">pubblicati</span>
        </div>
        <div class="flex items-center gap-1.5 whitespace-nowrap">
          <span class="font-black tabular-nums text-lg" [class]="openMatchCount() > 0 ? 'text-warning' : 'text-accent'">{{ openMatchCount() }}</span>
          <span class="text-xs font-semibold opacity-70">risultati aperti</span>
        </div>
      </div>
    </header>

    @if (error()) {
      <p class="mb-4 form-error">
        {{ error() }}
      </p>
    }

    @if (loading() && !tournaments().length) {
      <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        @for (i of [1,2,3,4,5,6]; track i) {
          <div class="h-44 animate-pulse rounded-xl bg-surface-muted"></div>
        }
      </div>
    } @else if (!tournaments().length) {
      <lfg-empty-state
        title="Nessun torneo"
        text="Crea il primo torneo con il pulsante in alto."
        icon="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
      />
    } @else {
      <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        @for (tournament of tournaments(); track tournament.id; let i = $index) {
          <lfg-tornei-card
            [tournament]="tournament"
            [index]="i"
            (open)="navigate($event)"
          />
        }
      </div>
    }

    <!-- Modal nuovo torneo -->
    <lfg-tournament-modal
      [open]="() => modalOpen()"
      [tournament]="() => null"
      [loading]="saving"
      [error]="modalError"
      (close)="closeModal()"
      (save)="createTournament($event)"
    />
  `,
})
export class TorneiListComponent implements OnInit {
  readonly auth = inject(AuthService);
  private readonly tournamentsService = inject(TournamentsService);
  private readonly registrationsService = inject(RegistrationsService);
  private readonly snackbar = inject(SnackbarService);
  private readonly router = inject(Router);

  tournaments = signal<OperationalTournament[]>([]);
  loading = signal(false);
  error = signal("");
  modalOpen = signal(false);
  saving = signal(false);
  modalError = signal("");

  totalTeams = computed(() =>
    this.tournaments().reduce((sum, t) => sum + t.tournament_teams.length, 0),
  );

  publishedCount = computed(() =>
    this.tournaments().filter(
      (t) =>
        t.public_status === TOURNAMENT_PUBLIC_STATUS.Published ||
        t.public_status === TOURNAMENT_PUBLIC_STATUS.ResultsPublished,
    ).length,
  );

  openMatchCount = computed(() =>
    this.tournaments().reduce(
      (sum, t) =>
        sum +
        t.tournament_matches.filter(
          (m) =>
            m.status !== TOURNAMENT_MATCH_STATUS.Completed &&
            m.status !== TOURNAMENT_MATCH_STATUS.Cancelled,
        ).length,
      0,
    ),
  );

  ngOnInit(): void {
    void this.load();
  }

  async load(): Promise<void> {
    if (this.loading()) return;
    this.loading.set(true);
    this.error.set("");
    try {
      const data = await this.tournamentsService.listOperational();
      this.tournaments.set(data);
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : "Errore nel caricamento.");
    } finally {
      this.loading.set(false);
    }
  }

  navigate(id: string): void {
    void this.router.navigate(["/app/tornei", id]);
  }

  openNewModal(): void {
    this.modalOpen.set(true);
    this.modalError.set("");
  }

  closeModal(): void {
    this.modalOpen.set(false);
    this.modalError.set("");
  }

  async createTournament(payload: InsertTournament): Promise<void> {
    if (this.saving()) return;
    this.saving.set(true);
    this.modalError.set("");
    try {
      await this.registrationsService.createTournament(payload);
      this.snackbar.success("Torneo creato.");
      this.closeModal();
      await this.load();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Errore.";
      this.modalError.set(msg);
      this.snackbar.error(msg);
    } finally {
      this.saving.set(false);
    }
  }
}

import { Component, EventEmitter, Input, OnInit, Output, inject, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { AuthService } from "../../../core/services/auth.service";
import { SnackbarService } from "../../../core/services/snackbar.service";
import {
  GenerateGroupStageResult,
  ResetTournamentScheduleResult,
  TournamentsService,
} from "../../../core/services/tournaments.service";
import { OperationalTournament } from "../../../core/types/models";
import {
  ConfirmModalComponent,
  EmptyStateComponent,
} from "../../../shared/components/ui.component";

@Component({
  selector: "lfg-tornei-tab-gironi",
  standalone: true,
  imports: [FormsModule, EmptyStateComponent, ConfirmModalComponent],
  template: `
    <div class="space-y-4 animate-fade-in">
      <div class="rounded-xl border border-soft bg-surface p-4 shadow-sm">
        <div class="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p class="text-xs font-bold uppercase tracking-[0.18em] text-muted">Sorteggio gironi</p>
            <p class="mt-1 text-sm font-semibold text-muted">
              Genera gironi e calendario iniziale. L'operazione sostituisce gironi, partite e
              classifiche già presenti.
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
              [disabled]="!tournament().tournament_teams.length || generating()"
              (click)="pendingGenerate.set(true)"
            >
              {{ generating() ? "Generazione..." : "Genera" }}
            </button>
            @if (auth.isAdmin()) {
              <button
                type="button"
                class="state-danger rounded-lg border px-4 py-3 text-sm font-black uppercase disabled:opacity-60 lg:self-end"
                [disabled]="
                  generating() ||
                  (!tournament().tournament_groups.length &&
                    !tournament().tournament_matches.length &&
                    !tournament().tournament_standings.length)
                "
                (click)="pendingReset.set(true)"
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

      @if (!tournament().tournament_groups.length) {
        <lfg-empty-state
          title="Gironi non generati"
          text="Scegli il numero di gironi e conferma il sorteggio."
          icon="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
        />
      } @else {
        <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          @for (group of tournament().tournament_groups; track group.id) {
            <article class="rounded-xl border border-soft bg-surface p-4 shadow-sm">
              <h3 class="font-display text-xl uppercase">{{ group.name }}</h3>
              <div class="mt-3 grid gap-2">
                @for (item of group.tournament_group_teams ?? []; track item.id) {
                  <div class="flex items-center justify-between gap-3 rounded-lg bg-surface-muted px-3 py-2">
                    <span class="font-bold">
                      {{ item.tournament_teams?.name || "Squadra" }}
                    </span>
                    @if (item.seed) {
                      <span class="text-xs font-black text-muted">#{{ item.seed }}</span>
                    }
                  </div>
                }
              </div>
            </article>
          }
        </div>
      }
    </div>

    <lfg-confirm
      [open]="pendingGenerate()"
      confirmLabel="Genera"
      [message]="'Generare ' + groupCount + ' gironi per ' + tournament().name + '? Verranno sostituiti gironi, partite e classifiche esistenti.'"
      (confirm)="confirmGenerate()"
      (cancel)="pendingGenerate.set(false)"
    />

    <lfg-confirm
      [open]="pendingReset()"
      confirmLabel="Reset"
      [message]="'Resettare gironi, calendario e classifiche di ' + tournament().name + '? Le iscrizioni resteranno intatte.'"
      (confirm)="confirmReset()"
      (cancel)="pendingReset.set(false)"
    />
  `,
})
export class TorneiTabGironiComponent {
  @Input({ required: true }) tournament!: () => OperationalTournament;
  @Output() reloadRequired = new EventEmitter<void>();

  readonly auth = inject(AuthService);
  private readonly service = inject(TournamentsService);
  private readonly snackbar = inject(SnackbarService);

  generating = signal(false);
  pendingGenerate = signal(false);
  pendingReset = signal(false);
  lastGenerateResult = signal<GenerateGroupStageResult | null>(null);
  lastResetResult = signal<ResetTournamentScheduleResult | null>(null);
  groupCount = 2;

  async confirmGenerate(): Promise<void> {
    this.pendingGenerate.set(false);
    if (this.generating()) return;
    this.generating.set(true);
    try {
      const result = await this.service.generateGroupStage(this.tournament().id, this.groupCount);
      this.lastGenerateResult.set(result);
      this.lastResetResult.set(null);
      this.snackbar.success(this.generateResultLabel(result));
      this.reloadRequired.emit();
    } catch (err) {
      this.snackbar.error(err instanceof Error ? err.message : "Errore nella generazione.");
    } finally {
      this.generating.set(false);
    }
  }

  async confirmReset(): Promise<void> {
    this.pendingReset.set(false);
    if (this.generating() || !this.auth.isAdmin()) return;
    this.generating.set(true);
    try {
      const result = await this.service.resetTournamentSchedule(this.tournament().id);
      this.lastResetResult.set(result);
      this.lastGenerateResult.set(null);
      this.snackbar.success(this.resetResultLabel(result));
      this.reloadRequired.emit();
    } catch (err) {
      this.snackbar.error(err instanceof Error ? err.message : "Errore nel reset.");
    } finally {
      this.generating.set(false);
    }
  }

  generateResultLabel(result: GenerateGroupStageResult): string {
    return `${result.groups_created} gironi, ${result.teams_assigned} squadre assegnate, ${result.matches_created} partite create.`;
  }

  resetResultLabel(result: ResetTournamentScheduleResult): string {
    return `${result.groups_deleted} gironi, ${result.matches_deleted} partite e ${result.standings_deleted} righe classifica rimosse.`;
  }
}

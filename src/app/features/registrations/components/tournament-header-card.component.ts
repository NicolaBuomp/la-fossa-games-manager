import { Component, EventEmitter, Input, Output } from "@angular/core";
import { TournamentWithTeams } from "../../../core/types/models";

@Component({
  selector: "lfg-tournament-header-card",
  standalone: true,
  template: `
    <article class="rounded-lg border border-soft bg-surface p-4 shadow-sm">
      <div class="flex flex-wrap items-start justify-between gap-3">
        @if (tournament(); as currentTournament) {
          <div class="min-w-0 flex-1">
            <h2 class="truncate text-xl font-bold">
              {{ currentTournament.name }}
            </h2>
            <p class="mt-1 text-xs text-muted">
              {{ currentTournament.sport }} · Quota:
              {{ eur(currentTournament.fee || 0) }}
            </p>
            @if (currentTournament.notes) {
              <p class="mt-2 text-sm text-muted">
                {{ currentTournament.notes }}
              </p>
            }
          </div>
          <div class="flex gap-2">
            <button
              type="button"
              class="rounded-md bg-surface-muted px-3 py-1.5 text-xs font-bold uppercase transition hover:bg-surface-muted/80"
              (click)="editTournament.emit()"
            >
              Modifica
            </button>
            <button
              type="button"
              class="rounded-md bg-ink px-3 py-1.5 text-xs font-bold uppercase text-white transition hover:bg-ink/90"
              (click)="addTeamOrParticipant.emit()"
            >
              {{
                isTeamTournament() ? "Aggiungi squadra" : "Aggiungi iscritto"
              }}
            </button>
          </div>
        }
      </div>
    </article>
  `,
})
export class TournamentHeaderCardComponent {
  @Input({ required: true }) tournament!: () => TournamentWithTeams | undefined;
  @Input({ required: true }) isTeamTournament!: () => boolean;
  @Output() editTournament = new EventEmitter<void>();
  @Output() addTeamOrParticipant = new EventEmitter<void>();

  eur(value: number): string {
    return new Intl.NumberFormat("it-IT", {
      style: "currency",
      currency: "EUR",
    }).format(value);
  }
}

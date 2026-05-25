import { Component, EventEmitter, Input, Output } from "@angular/core";
import { TournamentWithTeams } from "../../../core/types/models";

@Component({
  selector: "lfg-tournament-header-card",
  standalone: true,
  host: { class: "mb-5 block" },
  template: `
    <article
      class="rounded-lg border border-soft bg-surface p-3 shadow-sm sm:p-4"
    >
      <div class="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
        @if (tournament(); as currentTournament) {
          <div class="min-w-0">
            <h2 class="break-words text-xl font-bold leading-tight">
              {{ currentTournament.name }}
            </h2>
            <p class="mt-1 text-xs leading-5 text-muted">
              Quota: {{ eur(currentTournament.fee || 0) }}
            </p>
            @if (currentTournament.notes) {
              <p class="mt-2 break-words text-sm leading-5 text-muted">
                {{ currentTournament.notes }}
              </p>
            }
          </div>
          <div class="grid grid-cols-2 gap-2 sm:flex">
            <button
              type="button"
              class="min-h-11 rounded-md bg-surface-muted px-3 py-2 text-xs font-bold uppercase transition hover:bg-surface-muted/80 sm:min-h-0 sm:py-1.5"
              (click)="editTournament.emit()"
            >
              Modifica
            </button>
            <button
              type="button"
              class="bg-strong text-on-strong min-h-11 rounded-md px-3 py-2 text-xs font-bold uppercase transition hover:opacity-90 sm:min-h-0 sm:py-1.5"
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

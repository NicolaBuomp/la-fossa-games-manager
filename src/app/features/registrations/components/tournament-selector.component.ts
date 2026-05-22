import { Component, EventEmitter, Input, Output } from "@angular/core";
import { TournamentWithTeams } from "../../../core/types/models";
import {
  TOURNAMENT_STATUS,
  TOURNAMENT_STATUSES,
} from "../../../core/types/constants";

@Component({
  selector: "lfg-tournament-selector",
  standalone: true,
  host: { class: "block" },
  template: `
    <div class="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
      @for (tournament of tournaments(); track tournament.id) {
        <button
          type="button"
          class="hover-accent shrink-0 rounded-xl border px-4 py-2 text-left transition"
          [class.border-accent]="selectedTournamentId() === tournament.id"
          [class.bg-accent]="selectedTournamentId() === tournament.id"
          [class.text-on-accent]="selectedTournamentId() === tournament.id"
          [class.border-soft]="selectedTournamentId() !== tournament.id"
          [class.bg-surface-muted]="selectedTournamentId() !== tournament.id"
          [class.text-primary]="selectedTournamentId() !== tournament.id"
          (click)="selectTournament.emit(tournament.id)"
        >
          <span class="flex items-center gap-2">
            <span class="text-sm font-black">{{ tournament.name }}</span>
            <span
              class="rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase"
              [class]="statusBadgeClass(tournament.status)"
            >{{ statusLabel(tournament.status) }}</span>
          </span>
          <span class="mt-0.5 block text-[10px] font-semibold opacity-70">
            {{ tournament.tournament_teams.length }} iscritti
          </span>
        </button>
      }
    </div>
  `,
})
export class TournamentSelectorComponent {
  @Input({ required: true }) tournaments!: () => TournamentWithTeams[];
  @Input({ required: true }) selectedTournamentId!: () => string | null;
  @Output() selectTournament = new EventEmitter<string>();

  statusLabel(status: string): string {
    return TOURNAMENT_STATUSES.find((item) => item.id === status)?.label ?? status;
  }

  statusBadgeClass(status: string): string {
    if (status === TOURNAMENT_STATUS.RegistrationsOpen) return "bg-green-100 text-green-800";
    if (status === TOURNAMENT_STATUS.InProgress) return "bg-blue-100 text-blue-800";
    if (status === TOURNAMENT_STATUS.Completed || status === TOURNAMENT_STATUS.Archived) return "bg-surface-muted text-muted";
    return "bg-amber-100 text-amber-800";
  }
}

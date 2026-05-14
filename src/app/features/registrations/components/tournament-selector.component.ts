import { Component, EventEmitter, Input, Output } from "@angular/core";
import { Tournament } from "../../../core/types/models";

@Component({
  selector: "lfg-tournament-selector",
  standalone: true,
  template: `
    <div class="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
      @for (tournament of tournaments(); track tournament.id) {
        <button
          type="button"
          class="shrink-0 rounded-full px-4 py-2 text-sm font-bold ring-1 ring-black/10 transition"
          [class.bg-ink]="selectedTournamentId() === tournament.id"
          [class.text-white]="selectedTournamentId() === tournament.id"
          [class.bg-surface]="selectedTournamentId() !== tournament.id"
          (click)="selectTournament.emit(tournament.id)"
        >
          {{ tournament.name }}
        </button>
      }
    </div>
  `,
})
export class TournamentSelectorComponent {
  @Input({ required: true }) tournaments!: () => Tournament[];
  @Input({ required: true }) selectedTournamentId!: () => string | null;
  @Output() selectTournament = new EventEmitter<string>();
}

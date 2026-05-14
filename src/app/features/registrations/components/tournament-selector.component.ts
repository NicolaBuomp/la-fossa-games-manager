import { Component, EventEmitter, Input, Output } from "@angular/core";
import { Tournament } from "../../../core/types/models";

@Component({
  selector: "lfg-tournament-selector",
  standalone: true,
  host: { class: "block" },
  template: `
    <div class="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
      @for (tournament of tournaments(); track tournament.id) {
        <button
          type="button"
          class="min-h-9 shrink-0 rounded-full border px-4 py-2 text-sm font-black transition hover:border-fossa hover:bg-fossa hover:text-ink"
          [class.border-fossa]="selectedTournamentId() === tournament.id"
          [class.bg-fossa]="selectedTournamentId() === tournament.id"
          [class.text-ink]="selectedTournamentId() === tournament.id"
          [class.border-soft]="selectedTournamentId() !== tournament.id"
          [class.bg-surface-muted]="selectedTournamentId() !== tournament.id"
          [class.text-primary]="selectedTournamentId() !== tournament.id"
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

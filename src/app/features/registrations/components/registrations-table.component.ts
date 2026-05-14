import { Component, EventEmitter, Input, Output } from "@angular/core";
import {
  TeamParticipant,
  TournamentTeamWithParticipants,
  TournamentWithTeams,
} from "../../../core/types/models";
import { StatusBadgeComponent } from "../../../shared/components/ui.component";

@Component({
  selector: "lfg-registrations-table",
  standalone: true,
  imports: [StatusBadgeComponent],
  template: `
    <div class="grid gap-3">
      @for (team of items(); track team.id) {
        <article
          class="rounded-lg border border-soft bg-surface p-3 shadow-sm sm:p-4"
        >
          <div class="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
            <div class="min-w-0">
              @if (isDirect()) {
                <h3 class="break-words text-base font-bold leading-snug">
                  {{ directLabel(team) }}
                </h3>
                @if (directContactLabel(team)) {
                  <p
                    class="mt-1 whitespace-pre-line break-words text-xs leading-5 text-muted"
                  >
                    {{ directContactLabel(team) }}
                  </p>
                }
              } @else {
                <h3 class="break-words text-base font-bold leading-snug">
                  {{ team.name }}
                </h3>
                <p class="mt-1 text-xs leading-5 text-muted">
                  @if (team.captain_name) {
                    Capitano: {{ team.captain_name }}
                  }
                  @if (team.vice_captain_name) {
                    · Vice: {{ team.vice_captain_name }}
                  }
                </p>
                <p class="mt-1 text-xs font-semibold">
                  {{ team.team_participants.length }} partecipante(i)
                </p>
              }
              @if (team.notes) {
                <p class="mt-2 break-words text-sm leading-5 text-muted">
                  {{ team.notes }}
                </p>
              }
            </div>

            <div class="grid gap-2 sm:min-w-72">
              <div class="flex justify-start sm:justify-end">
                <lfg-status-badge
                  [label]="team.paid ? 'Pagata' : 'Da pagare'"
                  [className]="team.paid ? 'state-success' : 'state-warning'"
                />
              </div>
              <div
                class="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-end"
              >
                <button
                  type="button"
                  class="min-h-10 rounded-md bg-surface-muted px-3 py-2 text-xs font-bold uppercase transition hover:bg-surface-muted/80 sm:min-h-0 sm:py-1.5"
                  (click)="togglePaid.emit(team)"
                >
                  {{ team.paid ? "Non pagata" : "Pagata" }}
                </button>
                <button
                  type="button"
                  class="min-h-10 rounded-md bg-surface-muted px-3 py-2 text-xs font-bold uppercase transition hover:bg-surface-muted/80 sm:min-h-0 sm:py-1.5"
                  (click)="
                    isDirect() ? editDirectEntry.emit(team) : editTeam.emit(team)
                  "
                >
                  Modifica
                </button>
                @if (auth.isAdmin()) {
                  <button
                    type="button"
                    class="state-danger col-span-2 min-h-10 rounded-md border px-3 py-2 text-xs font-bold uppercase transition hover:border-opacity-80 sm:col-span-1 sm:min-h-0 sm:py-1.5"
                    (click)="deleteTeam.emit(team.id)"
                  >
                    Elimina
                  </button>
                }
              </div>
            </div>
          </div>

          @if (!isDirect() && team.team_participants.length) {
            <div class="mt-4 grid gap-2 border-t border-soft pt-3">
              @for (p of team.team_participants; track p.id) {
                <div
                  class="grid gap-2 rounded-md bg-surface-muted p-3 text-xs sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:p-2"
                >
                  <span class="min-w-0 break-words font-medium">
                    {{ p.first_name }} {{ p.last_name }}
                  </span>
                  <div class="flex justify-end gap-2">
                    <button
                      type="button"
                      class="min-h-9 rounded-md bg-surface px-3 text-muted hover:text-ink sm:min-h-0 sm:bg-transparent sm:px-0"
                      (click)="editParticipant.emit(p)"
                    >
                      Modifica
                    </button>
                    @if (auth.isAdmin()) {
                      <button
                        type="button"
                        class="min-h-9 rounded-md bg-surface px-3 text-muted hover:text-red-500 sm:min-h-0 sm:bg-transparent sm:px-0"
                        (click)="deleteParticipant.emit(p.id)"
                      >
                        Elimina
                      </button>
                    }
                  </div>
                </div>
              }
            </div>
          }

          @if (!isDirect() && canAddParticipant(team)) {
            <div class="mt-3 border-t border-soft pt-3">
              <button
                type="button"
                class="min-h-10 w-full rounded-md bg-surface-muted px-3 py-2 text-xs font-bold uppercase transition hover:bg-surface-muted/80 sm:w-auto sm:py-1.5"
                (click)="addParticipant.emit(team.id)"
              >
                Aggiungi persona
              </button>
            </div>
          }
        </article>
      }
    </div>
  `,
})
export class RegistrationsTableComponent {
  @Input({ required: true }) items!: () => TournamentTeamWithParticipants[];
  @Input({ required: true }) tournament!: () => TournamentWithTeams | undefined;
  @Input({ required: true }) isDirect!: () => boolean;
  @Input({ required: true }) isDuo!: () => boolean;
  @Input() auth: any; // AuthService

  @Output() editTeam = new EventEmitter<TournamentTeamWithParticipants>();
  @Output() editDirectEntry = new EventEmitter<TournamentTeamWithParticipants>();
  @Output() togglePaid = new EventEmitter<TournamentTeamWithParticipants>();
  @Output() addParticipant = new EventEmitter<string>();
  @Output() deleteTeam = new EventEmitter<string>();
  @Output() editParticipant = new EventEmitter<TeamParticipant>();
  @Output() deleteParticipant = new EventEmitter<string>();

  directLabel(team: TournamentTeamWithParticipants): string {
    const people = team.team_participants
      .map((p) => `${p.first_name} ${p.last_name}`.trim())
      .filter(Boolean);
    return people.length ? people.join(this.isDuo() ? " / " : ", ") : team.name;
  }

  directContactLabel(team: TournamentTeamWithParticipants): string {
    return team.team_participants
      .map((p) => p.contact)
      .filter(Boolean)
      .join("\n");
  }

  canAddParticipant(team: TournamentTeamWithParticipants): boolean {
    const tournament = this.tournament();
    if (!tournament || tournament.sport === "calcio") return false;
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
}

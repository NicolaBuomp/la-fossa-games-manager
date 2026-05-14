import { Component, EventEmitter, Input, Output } from "@angular/core";
import {
  TeamParticipant,
  TournamentWithTeams,
  TournamentTeamWithParticipants,
} from "../../../core/types/models";
import { StatusBadgeComponent } from "../../../shared/components/ui.component";

@Component({
  selector: "lfg-registrations-table",
  standalone: true,
  imports: [StatusBadgeComponent],
  template: `
    <div class="grid gap-3">
      @for (team of items(); track team.id) {
        <article class="rounded-lg border border-soft bg-surface p-4 shadow-sm">
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div class="min-w-0 flex-1">
              @if (isDirect()) {
                <h3 class="truncate text-base font-bold">
                  {{ directLabel(team) }}
                </h3>
                @if (directContactLabel(team)) {
                  <p class="mt-1 text-xs text-muted">
                    {{ directContactLabel(team) }}
                  </p>
                }
              } @else {
                <h3 class="truncate text-base font-bold">{{ team.name }}</h3>
                <p class="mt-1 text-xs text-muted">
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
                <p class="mt-2 text-sm text-muted">{{ team.notes }}</p>
              }
            </div>
            <div class="flex flex-wrap items-center justify-end gap-2">
              <lfg-status-badge
                [label]="team.paid ? 'Pagata' : 'Da pagare'"
                [className]="team.paid ? 'state-success' : 'state-warning'"
              />
              <button
                type="button"
                class="rounded-md bg-surface-muted px-3 py-1.5 text-xs font-bold uppercase transition hover:bg-surface-muted/80"
                (click)="togglePaid.emit(team)"
              >
                {{ team.paid ? "Non pagata" : "Pagata" }}
              </button>
              <button
                type="button"
                class="rounded-md bg-surface-muted px-3 py-1.5 text-xs font-bold uppercase transition hover:bg-surface-muted/80"
                (click)="isDirect() ? editDirectEntry.emit(team) : editTeam.emit(team)"
              >
                Modifica
              </button>
              @if (auth.isAdmin()) {
                <button
                  type="button"
                  class="state-danger rounded-md border px-3 py-1.5 text-xs font-bold uppercase transition hover:border-opacity-80"
                  (click)="deleteTeam.emit(team.id)"
                >
                  Elimina
                </button>
              }
            </div>
          </div>
          @if (!isDirect() && team.team_participants.length) {
            <div class="mt-4 grid gap-2 border-t border-soft pt-3">
              @for (p of team.team_participants; track p.id) {
                <div
                  class="flex flex-wrap items-center justify-between gap-2 rounded-md bg-surface-muted p-2 text-xs"
                >
                  <span class="font-medium"
                    >{{ p.first_name }} {{ p.last_name }}</span
                  >
                  <div class="flex gap-2">
                    <button
                      type="button"
                      class="text-muted hover:text-ink"
                      (click)="editParticipant.emit(p)"
                    >
                      ✏️
                    </button>
                    @if (auth.isAdmin()) {
                      <button
                        type="button"
                        class="text-muted hover:text-red-500"
                        (click)="deleteParticipant.emit(p.id)"
                      >
                        ✕
                      </button>
                    }
                  </div>
                </div>
              }
            </div>
          }
          @if (!isDirect() && canAddParticipant(team)) {
            <div class="mt-3 flex justify-end border-t border-soft pt-3">
              <button
                type="button"
                class="rounded-md bg-surface-muted px-3 py-1.5 text-xs font-bold uppercase transition hover:bg-surface-muted/80"
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
      .join(" · ");
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

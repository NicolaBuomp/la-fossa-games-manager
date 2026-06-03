import { Component, EventEmitter, Input, Output } from "@angular/core";
import { TOURNAMENT_MIN_PARTICIPANTS_BY_CODE } from "../../../core/types/constants";
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
  host: { class: "block" },
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
                <h3
                  class="break-words text-base font-bold leading-snug cursor-pointer hover:text-accent transition-colors"
                >
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
                  {{ participantCount(team) }} partecipant{{
                    participantCount(team) !== 1 ? "i" : "e"
                  }}
                </p>
              }
              @if (team.notes) {
                <p class="mt-2 break-words text-sm leading-5 text-muted">
                  {{ team.notes }}
                </p>
              }
              <div class="mt-2 space-y-1 text-[11px] leading-4 text-muted">
                <p>{{ createdMeta(team) }}</p>
                <p>{{ updatedMeta(team) }}</p>
              </div>
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
                @if (firstWhatsappContact(team); as wa) {
                  <a
                    [href]="whatsappUrl(wa.phone)"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="col-span-2 flex min-h-11 items-center justify-center gap-1.5 rounded-md bg-[#25D366] px-3 py-2 text-xs font-bold uppercase text-white transition hover:bg-[#1ebe5d] sm:col-span-1 sm:min-h-0 sm:py-1.5"
                    [title]="'WhatsApp di ' + wa.label"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      class="h-3.5 w-3.5 shrink-0"
                    >
                      <path
                        d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"
                      />
                    </svg>
                    {{ wa.label }}
                  </a>
                }
                <button
                  type="button"
                  class="min-h-11 rounded-md bg-surface-muted px-3 py-2 text-xs font-bold uppercase transition hover:bg-surface-muted/80 sm:min-h-0 sm:py-1.5"
                  (click)="togglePaid.emit(team)"
                >
                  {{ team.paid ? "Non pagata" : "Pagata" }}
                </button>
                <button
                  type="button"
                  class="min-h-11 rounded-md bg-surface-muted px-3 py-2 text-xs font-bold uppercase transition hover:bg-surface-muted/80 sm:min-h-0 sm:py-1.5"
                  (click)="
                    isDirect()
                      ? editDirectEntry.emit(team)
                      : editTeam.emit(team)
                  "
                >
                  Modifica
                </button>
                @if (auth.isAdmin()) {
                  <button
                    type="button"
                    class="state-danger col-span-2 min-h-11 rounded-md border px-3 py-2 text-xs font-bold uppercase transition hover:border-opacity-80 sm:col-span-1 sm:min-h-0 sm:py-1.5"
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
                      class="min-h-11 rounded-md bg-surface px-3 text-muted hover:text-primary sm:min-h-0 sm:bg-transparent sm:px-0"
                      (click)="editParticipant.emit(p)"
                    >
                      Modifica
                    </button>
                    @if (auth.isAdmin()) {
                      <button
                        type="button"
                        class="min-h-11 rounded-md bg-surface px-3 text-muted hover:text-red-500 sm:min-h-0 sm:bg-transparent sm:px-0"
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
                class="min-h-11 w-full rounded-md bg-surface-muted px-3 py-2 text-xs font-bold uppercase transition hover:bg-surface-muted/80 sm:w-auto sm:py-1.5"
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
  @Output() editDirectEntry =
    new EventEmitter<TournamentTeamWithParticipants>();
  @Output() togglePaid = new EventEmitter<TournamentTeamWithParticipants>();
  @Output() addParticipant = new EventEmitter<string>();
  @Output() deleteTeam = new EventEmitter<string>();
  @Output() editParticipant = new EventEmitter<TeamParticipant>();
  @Output() deleteParticipant = new EventEmitter<string>();
  @Output() openTeamDetail = new EventEmitter<string>();

  firstWhatsappContact(
    team: TournamentTeamWithParticipants,
  ): { label: string; phone: string } | null {
    if (!this.isDirect()) {
      if (team.captain_contact?.trim()) {
        return {
          label: team.captain_name?.trim() || "Capitano",
          phone: team.captain_contact.trim(),
        };
      }
      if (team.vice_captain_contact?.trim()) {
        return {
          label: team.vice_captain_name?.trim() || "Vice",
          phone: team.vice_captain_contact.trim(),
        };
      }
    }
    const participant = team.team_participants.find((p) => p.contact?.trim());
    if (participant) {
      return {
        label: `${participant.first_name} ${participant.last_name}`.trim(),
        phone: participant.contact!.trim(),
      };
    }
    return null;
  }

  whatsappUrl(phone: string): string {
    const digits = phone.replace(/[^\d+]/g, "").replace(/^\+/, "");
    return `https://wa.me/${digits}`;
  }

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
    if (!tournament) return false;
    const limit =
      TOURNAMENT_MIN_PARTICIPANTS_BY_CODE[tournament.code ?? ""] ?? null;
    return !limit || team.team_participants.length < limit;
  }

  participantCount(team: TournamentTeamWithParticipants): number {
    if (team.team_participants.length > 0) return team.team_participants.length;
    let fallback = 0;
    if (team.captain_name?.trim()) fallback += 1;
    if (team.vice_captain_name?.trim()) fallback += 1;
    return fallback;
  }

  createdMeta(team: TournamentTeamWithParticipants): string {
    return `Inserita da ${team.created_by_name ?? "Utente non disponibile"} · ${this.formatDateTime(team.created_at)}`;
  }

  updatedMeta(team: TournamentTeamWithParticipants): string {
    return `Ultima modifica: ${team.updated_by_name ?? team.created_by_name ?? "Utente non disponibile"} · ${this.formatDateTime(team.updated_at)}`;
  }

  private formatDateTime(value: string): string {
    return new Intl.DateTimeFormat("it-IT", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(value));
  }
}

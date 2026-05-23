import { Component, EventEmitter, Input, Output, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { TeamParticipant, InsertTeamParticipant } from "../../../core/types/models";
import { PARTICIPANT_GENDER, PARTICIPANT_GENDER_OPTIONS } from "../../../core/types/constants";

@Component({
  selector: "lfg-team-participant-row",
  standalone: true,
  imports: [FormsModule],
  template: `
    <div
      class="overflow-hidden rounded-xl border border-soft bg-surface transition-all duration-200"
      [class.border-accent]="editing()"
    >
      @if (!editing()) {
        <!-- VIEW MODE -->
        <div class="flex items-center gap-3 px-4 py-3">
          <!-- Avatar -->
          <div
            class="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-sm font-black text-white"
            [style]="'background:' + avatarColor(participant.first_name + participant.last_name)"
          >
            {{ initials(participant) }}
          </div>

          <!-- Info -->
          <div class="min-w-0 flex-1">
            <p class="truncate text-sm font-bold">{{ participant.first_name }} {{ participant.last_name }}</p>
            <div class="mt-0.5 flex flex-wrap items-center gap-1.5">
              @if (participant.contact) {
                <span class="text-xs text-muted">{{ participant.contact }}</span>
              }
              <span
                class="rounded px-1.5 py-0.5 text-[10px] font-bold uppercase"
                [class]="participant.gender === 'donna' ? 'state-info' : 'state-neutral'"
              >
                {{ participant.gender === 'donna' ? '♀ Donna' : '♂ Uomo' }}
              </span>
              @if (participant.registered) {
                <span class="rounded bg-yellow-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-yellow-800">
                  FIPAV
                </span>
              }
            </div>
          </div>

          <!-- Actions (admin) -->
          @if (isAdmin) {
            <div class="flex flex-shrink-0 gap-1">
              <button
                type="button"
                class="rounded-lg p-2 text-muted transition hover:bg-surface-muted hover:text-primary"
                (click)="startEdit()"
                title="Modifica"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </button>
              <button
                type="button"
                class="rounded-lg p-2 text-muted transition hover:bg-red-50 hover:text-red-500"
                (click)="delete.emit(participant.id)"
                title="Elimina"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                </svg>
              </button>
            </div>
          }
        </div>
      } @else {
        <!-- EDIT MODE -->
        <div class="px-4 py-3">
          <p class="mb-3 text-xs font-black uppercase tracking-wide text-muted">Modifica partecipante</p>
          <div class="grid gap-3 sm:grid-cols-2">
            <label class="grid gap-1 text-xs font-bold uppercase text-muted">
              Nome <span class="text-red-400">*</span>
              <input
                type="text"
                [(ngModel)]="editForm.first_name"
                class="rounded-lg border border-soft bg-surface-muted px-3 py-2.5 text-sm font-normal"
              />
            </label>
            <label class="grid gap-1 text-xs font-bold uppercase text-muted">
              Cognome <span class="text-red-400">*</span>
              <input
                type="text"
                [(ngModel)]="editForm.last_name"
                class="rounded-lg border border-soft bg-surface-muted px-3 py-2.5 text-sm font-normal"
              />
            </label>
            <label class="grid gap-1 text-xs font-bold uppercase text-muted">
              Contatto
              <input
                type="tel"
                [(ngModel)]="editForm.contact"
                class="rounded-lg border border-soft bg-surface-muted px-3 py-2.5 text-sm font-normal"
              />
            </label>
            <label class="grid gap-1 text-xs font-bold uppercase text-muted">
              Genere
              <select
                [(ngModel)]="editForm.gender"
                class="rounded-lg border border-soft bg-surface-muted px-3 py-2.5 text-sm font-normal"
              >
                @for (opt of genderOptions; track opt.id) {
                  <option [value]="opt.id">{{ opt.label }}</option>
                }
              </select>
            </label>
            @if (isFipavSport) {
              <label class="col-span-full flex items-center gap-2 text-sm font-bold">
                <input type="checkbox" [(ngModel)]="editForm.registered" />
                Tesserato FIPAV
              </label>
            }
          </div>
          <div class="mt-3 flex gap-2">
            <button
              type="button"
              class="bg-accent text-on-accent rounded-lg px-4 py-2 text-xs font-black uppercase disabled:opacity-60"
              [disabled]="!editForm.first_name || !editForm.last_name"
              (click)="saveEdit()"
            >
              Salva
            </button>
            <button
              type="button"
              class="rounded-lg border border-soft bg-surface-muted px-4 py-2 text-xs font-bold uppercase"
              (click)="cancelEdit()"
            >
              Annulla
            </button>
          </div>
        </div>
      }
    </div>
  `,
})
export class TeamParticipantRowComponent {
  @Input({ required: true }) participant!: TeamParticipant;
  @Input() isAdmin = false;
  @Input() isFipavSport = false;
  @Output() save = new EventEmitter<InsertTeamParticipant>();
  @Output() delete = new EventEmitter<string>();

  readonly genderOptions = PARTICIPANT_GENDER_OPTIONS;
  editing = signal(false);
  editForm: InsertTeamParticipant = { team_id: "", first_name: "", last_name: "", contact: "", gender: PARTICIPANT_GENDER.Male, registered: false };

  startEdit(): void {
    this.editForm = {
      team_id: this.participant.team_id,
      first_name: this.participant.first_name,
      last_name: this.participant.last_name,
      contact: this.participant.contact ?? "",
      gender: this.participant.gender,
      registered: this.participant.registered,
    };
    this.editing.set(true);
  }

  saveEdit(): void {
    if (!this.editForm.first_name || !this.editForm.last_name) return;
    this.save.emit({ ...this.editForm });
    this.editing.set(false);
  }

  cancelEdit(): void {
    this.editing.set(false);
  }

  initials(p: TeamParticipant): string {
    return `${p.first_name[0] ?? ""}${p.last_name[0] ?? ""}`.toUpperCase();
  }

  avatarColor(seed: string): string {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = seed.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colors = [
      "#0369a1", "#0e7490", "#0f766e", "#047857", "#15803d",
      "#4f46e5", "#7c3aed", "#9333ea", "#c026d3", "#db2777",
      "#dc2626", "#d97706", "#b45309", "#92400e",
    ];
    return colors[Math.abs(hash) % colors.length];
  }
}

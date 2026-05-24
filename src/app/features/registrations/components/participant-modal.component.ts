import { Component, EventEmitter, Input, Output, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { InsertTeamParticipant } from "../../../core/types/models";
import { ModalComponent } from "../../../shared/components/ui.component";

@Component({
  selector: "lfg-participant-modal",
  standalone: true,
  imports: [FormsModule, ModalComponent],
  template: `
    <lfg-modal
      [open]="open()"
      [title]="editing ? 'Modifica partecipante' : 'Nuovo partecipante'"
      (close)="close.emit()"
    >
      <form class="grid gap-4" (ngSubmit)="submit()">
        <fieldset [disabled]="loading()" class="grid gap-4 disabled:opacity-70">
          <div class="grid gap-3 sm:grid-cols-2">
            <label class="grid gap-1 text-sm font-bold">
              Nome <span class="text-red-500">*</span>
              <input
                type="text"
                required
                name="first_name"
                [(ngModel)]="form.first_name"
                class="rounded-lg border border-soft bg-surface-muted px-3 py-3 font-normal disabled:cursor-not-allowed disabled:opacity-70"
              />
            </label>
            <label class="grid gap-1 text-sm font-bold">
              Cognome <span class="text-red-500">*</span>
              <input
                type="text"
                required
                name="last_name"
                [(ngModel)]="form.last_name"
                class="rounded-lg border border-soft bg-surface-muted px-3 py-3 font-normal disabled:cursor-not-allowed disabled:opacity-70"
              />
            </label>
          </div>

          <label class="grid gap-1 text-sm font-bold">
            Telefono
            <input
              type="text"
              name="contact"
              [(ngModel)]="form.contact"
              placeholder="Es. 3XXXXXXXXX"
              class="rounded-lg border border-soft bg-surface-muted px-3 py-3 font-normal disabled:cursor-not-allowed disabled:opacity-70"
            />
          </label>

          @if (isFipavSport()) {
            <label
              class="flex items-center gap-2 rounded-lg bg-surface-muted p-3 text-sm font-bold"
            >
              <input
                type="checkbox"
                name="registered"
                [(ngModel)]="form.registered"
                class="h-4 w-4 disabled:cursor-not-allowed disabled:opacity-70"
              />
              Tesserato FIPAV
            </label>
          }

          @if (error()) {
            <p class="form-error">{{ error() }}</p>
          }

          <button
            type="submit"
            class="bg-strong text-on-strong rounded-lg px-4 py-3 text-sm font-bold uppercase disabled:opacity-60"
          >
            {{ loading() ? "Salvataggio…" : "Salva partecipante" }}
          </button>
        </fieldset>
      </form>
    </lfg-modal>
  `,
})
export class ParticipantModalComponent {
  @Input({ required: true }) open!: () => boolean;
  @Input({ required: true }) isFipavSport!: () => boolean;
  @Input() formValue: InsertTeamParticipant | null = null;
  @Input() editing = false;
  @Input() loading = signal(false);
  @Input() error = signal("");
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<InsertTeamParticipant>();

  form: InsertTeamParticipant = this.emptyForm();

  ngOnChanges(): void {
    this.form = this.formValue ? { ...this.formValue } : this.emptyForm();
  }

  submit(): void {
    this.save.emit({ ...this.form });
  }

  private emptyForm(): InsertTeamParticipant {
    return {
      team_id: "",
      first_name: "",
      last_name: "",
      contact: "",
      registered: false,
    };
  }
}

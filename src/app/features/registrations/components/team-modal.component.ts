import { Component, EventEmitter, Input, Output, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { InsertTournamentTeam } from "../../../core/types/models";
import { ModalComponent } from "../../../shared/components/ui.component";

@Component({
  selector: "lfg-team-modal",
  standalone: true,
  imports: [FormsModule, ModalComponent],
  template: `
    <lfg-modal
      [open]="open()"
      [title]="editing ? 'Modifica squadra' : 'Nuova squadra'"
      (close)="close.emit()"
    >
      <form class="grid gap-4" (ngSubmit)="submit()">
        <fieldset [disabled]="loading()" class="grid gap-4 disabled:opacity-70">
          <label class="grid gap-1 text-sm font-bold">
            Nome squadra <span class="text-red-500">*</span>
            <input
              type="text"
              required
              name="name"
              [(ngModel)]="form.name"
              class="rounded-lg border border-soft bg-surface-muted px-3 py-3 font-normal disabled:cursor-not-allowed disabled:opacity-70"
            />
          </label>

          <label class="grid gap-1 text-sm font-bold">
            Capitano <span class="text-red-500">*</span>
            <input
              type="text"
              required
              name="captain_name"
              [(ngModel)]="form.captain_name"
              class="rounded-lg border border-soft bg-surface-muted px-3 py-3 font-normal disabled:cursor-not-allowed disabled:opacity-70"
            />
          </label>

          <label class="grid gap-1 text-sm font-bold">
            Vice capitano
            <input
              type="text"
              name="vice_captain_name"
              [(ngModel)]="form.vice_captain_name"
              class="rounded-lg border border-soft bg-surface-muted px-3 py-3 font-normal disabled:cursor-not-allowed disabled:opacity-70"
            />
          </label>

          <label
            class="flex items-center gap-3 rounded-lg bg-surface-muted p-3 text-sm font-bold"
          >
            <input
              type="checkbox"
              name="paid"
              [(ngModel)]="form.paid"
              class="h-5 w-5 disabled:cursor-not-allowed disabled:opacity-70"
            />
            Iscrizione pagata
          </label>

          <label class="grid gap-1 text-sm font-bold">
            Note
            <textarea
              name="notes"
              [(ngModel)]="form.notes"
              rows="2"
              class="rounded-lg border border-soft bg-surface-muted px-3 py-3 font-normal disabled:cursor-not-allowed disabled:opacity-70"
            ></textarea>
          </label>

          @if (error()) {
            <p
              class="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
            >
              {{ error() }}
            </p>
          }

          <button
            type="submit"
            class="bg-strong text-on-strong rounded-lg px-4 py-3 text-sm font-bold uppercase disabled:opacity-60"
          >
            {{ loading() ? "Salvataggio…" : "Salva squadra" }}
          </button>
        </fieldset>
      </form>
    </lfg-modal>
  `,
})
export class TeamModalComponent {
  @Input({ required: true }) open!: () => boolean;
  @Input() formValue: InsertTournamentTeam | null = null;
  @Input() editing = false;
  @Input() loading = signal(false);
  @Input() error = signal("");
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<InsertTournamentTeam>();

  form: InsertTournamentTeam = this.emptyForm();

  ngOnChanges(): void {
    this.form = this.formValue ? { ...this.formValue } : this.emptyForm();
  }

  submit(): void {
    this.save.emit({ ...this.form });
  }

  private emptyForm(): InsertTournamentTeam {
    return {
      tournament_id: "",
      name: "",
      captain_name: "",
      captain_contact: "",
      vice_captain_name: "",
      vice_captain_contact: "",
      fee: 0,
      paid: false,
      notes: "",
    };
  }
}

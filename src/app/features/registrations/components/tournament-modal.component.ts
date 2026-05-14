import { Component, EventEmitter, Input, Output, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { InsertTournament, Tournament } from "../../../core/types/models";
import { ModalComponent } from "../../../shared/components/ui.component";

@Component({
  selector: "lfg-tournament-modal",
  standalone: true,
  imports: [FormsModule, ModalComponent],
  template: `
    <lfg-modal
      [open]="open()"
      [title]="editing() ? 'Modifica torneo' : 'Nuovo torneo'"
      (close)="close.emit()"
    >
      <form class="grid gap-4" (ngSubmit)="submit()">
        <fieldset [disabled]="loading()" class="grid gap-4 disabled:opacity-70">
          <label class="grid gap-1 text-sm font-bold">
            Nome <span class="text-red-500">*</span>
            <input
              type="text"
              required
              name="name"
              [(ngModel)]="form.name"
              class="rounded-lg border border-soft bg-surface-muted px-3 py-3 font-normal disabled:cursor-not-allowed disabled:opacity-70"
            />
          </label>

          <label class="grid gap-1 text-sm font-bold">
            Sport <span class="text-red-500">*</span>
            <select
              required
              name="sport"
              [(ngModel)]="form.sport"
              class="rounded-lg border border-soft bg-surface-muted px-3 py-3 font-normal disabled:cursor-not-allowed disabled:opacity-70"
            >
              <option value="calcio">Calcio</option>
              <option value="pallavolo">Pallavolo</option>
              <option value="altro">Altro</option>
            </select>
          </label>

          <label class="grid gap-1 text-sm font-bold">
            Quota d'iscrizione (€)
            <input
              type="number"
              min="0"
              step="0.01"
              name="fee"
              [(ngModel)]="form.fee"
              class="rounded-lg border border-soft bg-surface-muted px-3 py-3 font-normal disabled:cursor-not-allowed disabled:opacity-70"
            />
          </label>

          <label class="grid gap-1 text-sm font-bold">
            Data evento
            <input
              type="date"
              name="date"
              [(ngModel)]="form.date"
              class="rounded-lg border border-soft bg-surface-muted px-3 py-3 font-normal disabled:cursor-not-allowed disabled:opacity-70"
            />
          </label>

          <label class="grid gap-1 text-sm font-bold">
            Note
            <textarea
              name="notes"
              [(ngModel)]="form.notes"
              rows="3"
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
            class="rounded-lg bg-ink px-4 py-3 text-sm font-bold uppercase text-white disabled:opacity-60"
          >
            {{ loading() ? "Salvataggio…" : "Salva torneo" }}
          </button>
        </fieldset>
      </form>
    </lfg-modal>
  `,
})
export class TournamentModalComponent {
  @Input({ required: true }) open!: () => boolean;
  @Input({ required: true }) tournament!: () => Tournament | null;
  @Input() loading = signal(false);
  @Input() error = signal("");
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<InsertTournament>();

  editing = signal(false);
  form: InsertTournament = this.emptyForm();

  ngOnInit(): void {
    this.updateForm();
  }

  ngOnChanges(): void {
    this.updateForm();
  }

  private updateForm(): void {
    const t = this.tournament();
    if (t) {
      this.editing.set(true);
      this.form = {
        name: t.name,
        sport: t.sport,
        fee: t.fee,
        date: t.date,
        code: t.code,
        notes: t.notes,
      };
    } else {
      this.editing.set(false);
      this.form = this.emptyForm();
    }
  }

  submit(): void {
    this.save.emit({ ...this.form });
  }

  private emptyForm(): InsertTournament {
    return {
      name: "",
      sport: "calcio",
      fee: 0,
      date: "",
      code: null,
      notes: "",
    };
  }
}

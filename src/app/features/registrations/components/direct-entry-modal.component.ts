import { Component, EventEmitter, Input, Output, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ModalComponent } from "../../../shared/components/ui.component";

export interface DirectPerson {
  first_name: string;
  last_name: string;
  contact: string;
}

export interface DirectEntryForm {
  tournament_id: string;
  paid: boolean;
  person1: DirectPerson;
  person2: DirectPerson;
}

@Component({
  selector: "lfg-direct-entry-modal",
  standalone: true,
  imports: [FormsModule, ModalComponent],
  template: `
    <lfg-modal [open]="open()" [title]="modalTitle()" (close)="close.emit()">
      <form class="grid gap-4" (ngSubmit)="submit()">
        <fieldset [disabled]="loading()" class="grid gap-4 disabled:opacity-70">
          @if (fee) {
            <label
              class="flex items-center gap-3 rounded-lg bg-surface-muted p-3 text-sm font-bold"
            >
              <input
                type="checkbox"
                name="paid"
                [(ngModel)]="form.paid"
                class="h-5 w-5 disabled:cursor-not-allowed disabled:opacity-70"
              />
              {{ isDuo() ? "Coppia pagata" : "Iscrizione pagata" }}
            </label>
          }

          <fieldset class="grid gap-3 rounded-lg border border-soft p-4">
            <legend
              class="px-1 text-xs font-black uppercase tracking-[0.16em] text-muted"
            >
              {{ isDuo() ? "Persona 1" : "Partecipante" }}
            </legend>
            <div class="grid gap-3 sm:grid-cols-2">
              <label class="grid gap-1 text-sm font-bold">
                Nome <span class="text-red-500">*</span>
                <input
                  type="text"
                  required
                  name="p1_first"
                  [(ngModel)]="form.person1.first_name"
                  class="rounded-lg border border-soft bg-surface-muted px-3 py-3 font-normal disabled:cursor-not-allowed disabled:opacity-70"
                />
              </label>
              <label class="grid gap-1 text-sm font-bold">
                Cognome <span class="text-red-500">*</span>
                <input
                  type="text"
                  required
                  name="p1_last"
                  [(ngModel)]="form.person1.last_name"
                  class="rounded-lg border border-soft bg-surface-muted px-3 py-3 font-normal disabled:cursor-not-allowed disabled:opacity-70"
                />
              </label>
            </div>
            <label class="grid gap-1 text-sm font-bold">
              Telefono <span class="text-red-500">*</span>
              <input
                type="tel"
                required
                name="p1_contact"
                [(ngModel)]="form.person1.contact"
                placeholder="Es. 3331234567"
                class="rounded-lg border border-soft bg-surface-muted px-3 py-3 font-normal disabled:cursor-not-allowed disabled:opacity-70"
              />
            </label>
          </fieldset>

          @if (isDuo()) {
            <fieldset class="grid gap-3 rounded-lg border border-soft p-4">
              <legend
                class="px-1 text-xs font-black uppercase tracking-[0.16em] text-muted"
              >
                Persona 2
              </legend>
              <div class="grid gap-3 sm:grid-cols-2">
                <label class="grid gap-1 text-sm font-bold">
                  Nome <span class="text-red-500">*</span>
                  <input
                    type="text"
                    required
                    name="p2_first"
                    [(ngModel)]="form.person2.first_name"
                    class="rounded-lg border border-soft bg-surface-muted px-3 py-3 font-normal disabled:cursor-not-allowed disabled:opacity-70"
                  />
                </label>
                <label class="grid gap-1 text-sm font-bold">
                  Cognome <span class="text-red-500">*</span>
                  <input
                    type="text"
                    required
                    name="p2_last"
                    [(ngModel)]="form.person2.last_name"
                    class="rounded-lg border border-soft bg-surface-muted px-3 py-3 font-normal disabled:cursor-not-allowed disabled:opacity-70"
                  />
                </label>
              </div>
              <label class="grid gap-1 text-sm font-bold">
                Telefono
                <input
                  type="tel"
                  name="p2_contact"
                  [(ngModel)]="form.person2.contact"
                  placeholder="Es. 3331234567"
                  class="rounded-lg border border-soft bg-surface-muted px-3 py-3 font-normal disabled:cursor-not-allowed disabled:opacity-70"
                />
              </label>
            </fieldset>
          }

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
            {{ loading() ? "Salvataggio…" : "Salva iscrizione" }}
          </button>
        </fieldset>
      </form>
    </lfg-modal>
  `,
})
export class DirectEntryModalComponent {
  @Input({ required: true }) open!: () => boolean;
  @Input({ required: true }) isDuo!: () => boolean;
  @Input() modalTitle: () => string = () => "Nuova iscrizione";
  @Input() formValue: DirectEntryForm | null = null;
  @Input() fee?: number;
  @Input() loading = signal(false);
  @Input() error = signal("");
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<DirectEntryForm>();

  form: DirectEntryForm = this.emptyForm();

  ngOnChanges(): void {
    this.form = this.formValue
      ? {
          ...this.formValue,
          person1: { ...this.formValue.person1 },
          person2: { ...this.formValue.person2 },
        }
      : this.emptyForm();
  }

  submit(): void {
    this.save.emit({ ...this.form });
  }

  private emptyForm(): DirectEntryForm {
    return {
      tournament_id: "",
      paid: false,
      person1: { first_name: "", last_name: "", contact: "" },
      person2: { first_name: "", last_name: "", contact: "" },
    };
  }
}

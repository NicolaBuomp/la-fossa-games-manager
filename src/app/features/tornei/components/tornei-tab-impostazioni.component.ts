import { Component, EventEmitter, Input, OnChanges, Output, inject, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { SnackbarService } from "../../../core/services/snackbar.service";
import { RegistrationsService } from "../../../core/services/registrations.service";
import { InsertTournament, Tournament } from "../../../core/types/models";

@Component({
  selector: "lfg-tornei-tab-impostazioni",
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="animate-fade-in">
      <form class="space-y-6 pb-20 sm:pb-0" (ngSubmit)="save()">
        <!-- INFORMAZIONI BASE -->
        <section>
          <p class="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-muted">
            Informazioni base
          </p>
          <div class="rounded-xl border border-soft bg-surface p-4 shadow-sm">
            <div class="grid gap-4 sm:grid-cols-2">
              <label class="col-span-full flex flex-col gap-1 text-sm font-bold">
                <span>Nome <span class="text-red-500">*</span></span>
                <input
                  type="text"
                  required
                  name="name"
                  [(ngModel)]="form.name"
                  [disabled]="saving()"
                  class="rounded-lg border border-soft bg-surface-muted px-3 py-3 font-normal disabled:opacity-60"
                />
              </label>
              <label class="flex flex-col gap-1 text-sm font-bold">
                <span>Quota d'iscrizione (€)</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  name="fee"
                  [(ngModel)]="form.fee"
                  [disabled]="saving()"
                  class="rounded-lg border border-soft bg-surface-muted px-3 py-3 font-normal disabled:opacity-60"
                />
              </label>
            </div>
          </div>
        </section>

        <!-- NOTE -->
        <section>
          <p class="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-muted">Note</p>
          <div class="rounded-xl border border-soft bg-surface p-4 shadow-sm">
            <label class="flex flex-col gap-1 text-sm font-bold">
              <span>Note interne</span>
              <textarea
                name="notes"
                [(ngModel)]="form.notes"
                rows="4"
                [disabled]="saving()"
                class="rounded-lg border border-soft bg-surface-muted px-3 py-3 font-normal disabled:opacity-60"
              ></textarea>
            </label>
          </div>
        </section>

        @if (error()) {
          <p class="form-error">
            {{ error() }}
          </p>
        }

        <!-- Desktop save button -->
        <div class="hidden sm:block">
          <button
            type="submit"
            class="bg-accent text-on-accent rounded-lg px-6 py-3 text-sm font-black uppercase disabled:opacity-60"
            [disabled]="saving() || !form.name"
          >
            {{ saving() ? "Salvataggio..." : "Salva modifiche" }}
          </button>
        </div>
      </form>
    </div>

    <!-- Mobile: sticky save bar -->
    <div class="fixed bottom-14 left-0 right-0 border-t border-soft bg-surface p-3 sm:hidden" style="z-index: 40;">
      <button
        type="button"
        class="bg-accent text-on-accent w-full rounded-lg py-3 text-sm font-black uppercase disabled:opacity-60"
        [disabled]="saving() || !form.name"
        (click)="save()"
      >
        {{ saving() ? "Salvataggio..." : "Salva modifiche" }}
      </button>
    </div>
  `,
})
export class TorneiTabImpostazioniComponent implements OnChanges {
  @Input({ required: true }) tournament!: () => Tournament;
  @Output() reloadRequired = new EventEmitter<void>();

  private readonly service = inject(RegistrationsService);
  private readonly snackbar = inject(SnackbarService);

  saving = signal(false);
  error = signal("");
  form: InsertTournament = this.emptyForm();

  ngOnChanges(): void {
    const t = this.tournament();
    if (t) {
      this.form = {
        name: t.name,
        fee: t.fee,
        code: t.code ?? null,
        notes: t.notes ?? "",
      };
    }
  }

  async save(): Promise<void> {
    if (this.saving() || !this.form.name) return;
    this.saving.set(true);
    this.error.set("");
    try {
      await this.service.updateTournament(this.tournament().id, this.form);
      this.snackbar.success("Torneo aggiornato.");
      this.reloadRequired.emit();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Errore nel salvataggio.";
      this.error.set(msg);
      this.snackbar.error(msg);
    } finally {
      this.saving.set(false);
    }
  }

  private emptyForm(): InsertTournament {
    return { name: "", fee: 0, code: null, notes: "" };
  }
}

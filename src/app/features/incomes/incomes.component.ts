import { Component, OnInit, computed, inject, signal } from "@angular/core";
import { AuthService } from "../../core/services/auth.service";
import { ExportService } from "../../core/services/export.service";
import { IncomesService } from "../../core/services/incomes.service";
import { ProfileService } from "../../core/services/profile.service";
import { SnackbarService } from "../../core/services/snackbar.service";
import { INCOME_CATEGORIES, PAYMENT_METHODS } from "../../core/types/constants";
import { Income, InsertIncome, Profile } from "../../core/types/models";
import {
  ConfirmModalComponent,
  EmptyStateComponent,
  KpiPanelComponent,
  SummaryCardComponent,
} from "../../shared/components/ui.component";
import {
  CrudFormField,
  CrudFormModalComponent,
} from "../../shared/components/crud-form-modal.component";

@Component({
  standalone: true,
  imports: [
    EmptyStateComponent,
    KpiPanelComponent,
    SummaryCardComponent,
    ConfirmModalComponent,
    CrudFormModalComponent,
  ],
  template: `
    <section class="space-y-5">
      <div class="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p
            class="text-xs font-bold uppercase tracking-[0.18em] text-neutral-500"
          >
            Modulo entrate
          </p>
          <h1 class="font-display text-3xl uppercase">Entrate</h1>
        </div>
        <div class="flex gap-2">
          <button
            class="rounded-lg bg-white px-4 py-2 text-sm font-bold ring-1 ring-black/10"
            (click)="export()"
          >
            CSV
          </button>
          <button
            class="rounded-lg bg-ink px-4 py-2 text-sm font-bold text-white"
            (click)="newItem()"
          >
            Nuova
          </button>
        </div>
      </div>

      <lfg-kpi-panel title="KPI entrate" storageKey="incomes">
        <section class="grid gap-3 sm:grid-cols-2">
          <lfg-summary-card
            label="Totale entrate"
            [value]="eur(total())"
            tone="income"
            [hint]="items().length + ' movimenti'"
          />
          <lfg-summary-card
            label="Media per entrata"
            [value]="eur(average())"
            tone="income"
            hint="Importo medio per movimento"
          />
        </section>
      </lfg-kpi-panel>
      @if (error()) {
        <p class="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {{ error() }}
        </p>
      }

      @if (!items().length) {
        <lfg-empty-state
          title="Ancora nessuna entrata"
          text="Registra incassi, quote, sponsor e altre fonti."
          actionLabel="Nuova entrata"
          (action)="newItem()"
        />
      } @else {
        <div class="grid gap-3">
          @for (item of items(); track item.id) {
            <article class="rounded-lg border border-black/10 bg-white p-4">
              <div class="flex flex-wrap justify-between gap-3">
                <div class="min-w-0">
                  <h2 class="truncate text-base font-bold">
                    {{ item.source }}
                  </h2>
                  <p class="mt-1 text-xs text-neutral-500">
                    {{ formatDate(item.date) }} · {{ item.category }}
                    @if (item.received_by) {
                      · da {{ item.received_by }}
                    }
                  </p>
                  <p class="mt-1 text-xs font-semibold text-neutral-500">
                    {{ insertMeta(item) }}
                  </p>
                  @if (item.notes) {
                    <p class="mt-2 text-sm text-neutral-600">
                      {{ item.notes }}
                    </p>
                  }
                </div>
                <p class="font-black text-emerald-600">
                  +{{ eur(item.amount) }}
                </p>
              </div>
              <div
                class="mt-4 flex justify-end gap-2 border-t border-black/5 pt-3"
              >
                <button
                  class="rounded-md bg-neutral-100 px-3 py-1.5 text-xs font-bold uppercase"
                  (click)="edit(item)"
                >
                  Modifica
                </button>
                @if (auth.isAdmin()) {
                  <button
                    class="rounded-md bg-red-50 px-3 py-1.5 text-xs font-bold uppercase text-red-700"
                    (click)="askRemove(item)"
                  >
                    Elimina
                  </button>
                }
              </div>
            </article>
          }
        </div>
      }
    </section>

    <lfg-crud-form-modal
      [open]="modalOpen()"
      [title]="editing() ? 'Modifica entrata' : 'Nuova entrata'"
      [fields]="formFields"
      [form]="form"
      [loading]="saving"
      [error]="error"
      (close)="modalOpen.set(false)"
      (formUpdated)="updateForm($event)"
      (save)="save()"
    />

    <lfg-confirm
      [open]="!!confirmPending()"
      [message]="confirmMessage()"
      (confirm)="doConfirm()"
      (cancel)="confirmPending.set(null)"
    />
  `,
})
export class IncomesComponent implements OnInit {
  items = signal<Income[]>([]);
  profilesList = signal<Profile[]>([]);
  userNames = signal<Record<string, string>>({});
  error = signal("");
  modalOpen = signal(false);
  editing = signal<Income | null>(null);
  saving = signal(false);
  confirmPending = signal<(() => Promise<void>) | null>(null);
  confirmMessage = signal("");
  private readonly snackbar = inject(SnackbarService);
  categories = INCOME_CATEGORIES;
  methods = PAYMENT_METHODS;
  form: InsertIncome = this.emptyForm();
  formFields = computed<CrudFormField[]>(() => [
    { name: "source", label: "Fonte", type: "text", required: true },
    {
      name: "amount",
      label: "Importo",
      type: "number",
      required: true,
      min: 0,
      step: 0.01,
    },
    { name: "date", label: "Data", type: "date", required: true },
    {
      name: "category",
      label: "Categoria",
      type: "select",
      options: this.categories.map((category) => ({
        label: category,
        value: category,
      })),
    },
    {
      name: "payment_method",
      label: "Metodo",
      type: "select",
      options: this.methods.map((method) => ({ label: method, value: method })),
    },
    {
      name: "received_by",
      label: "Incassato da",
      type: "select",
      options: [
        { label: "Non indicato", value: "" },
        ...this.profilesList().map((profile) => ({
          label: this.profileDisplayName(profile),
          value: this.profileDisplayName(profile),
        })),
      ],
    },
    { name: "notes", label: "Note", type: "textarea", rows: 3 },
  ]);

  constructor(
    readonly auth: AuthService,
    private readonly service: IncomesService,
    private readonly exporter: ExportService,
    private readonly profiles: ProfileService,
  ) {}

  ngOnInit(): void {
    void this.load();
  }

  async load(): Promise<void> {
    try {
      const [items, profiles] = await Promise.all([
        this.service.list(),
        this.profiles.list(),
      ]);
      this.items.set(items);
      this.profilesList.set(profiles);
      this.userNames.set(
        Object.fromEntries(
          profiles.map((profile) => [
            profile.id,
            this.profileDisplayName(profile),
          ]),
        ),
      );
    } catch (e) {
      this.setError(this.message(e));
    }
  }

  newItem(): void {
    this.error.set("");
    this.editing.set(null);
    this.form = this.emptyForm();
    this.modalOpen.set(true);
  }
  edit(item: Income): void {
    this.error.set("");
    this.editing.set(item);
    this.form = {
      date: item.date,
      source: item.source,
      category: item.category,
      amount: item.amount,
      received_by: item.received_by,
      payment_method: item.payment_method,
      notes: item.notes,
    };
    this.modalOpen.set(true);
  }

  async save(): Promise<void> {
    if (this.saving()) return;
    this.saving.set(true);
    this.error.set("");
    try {
      const payload = { ...this.form, amount: Number(this.form.amount || 0) };
      const current = this.editing();
      if (current) await this.service.update(current.id, payload);
      else await this.service.create(payload);
      this.modalOpen.set(false);
      await this.load();
    } catch (e) {
      this.setError(this.message(e));
    } finally {
      this.saving.set(false);
    }
  }

  updateForm(patch: Record<string, unknown>): void {
    this.form = { ...this.form, ...patch };
  }

  askRemove(item: Income): void {
    this.confirmMessage.set(`Eliminare l'entrata "${item.source}"?`);
    this.confirmPending.set(async () => {
      try {
        await this.service.remove(item.id);
        await this.load();
      } catch (e) {
        this.setError(this.message(e));
      }
    });
  }

  async doConfirm(): Promise<void> {
    const fn = this.confirmPending();
    this.confirmPending.set(null);
    if (fn) await fn();
  }

  export(): void {
    this.exporter.downloadCsv(
      "entrate-la-fossa-games.csv",
      this.items() as unknown as Record<string, unknown>[],
    );
  }
  total(): number {
    return this.items().reduce(
      (sum, item) => sum + Number(item.amount || 0),
      0,
    );
  }
  average(): number {
    return this.items().length ? this.total() / this.items().length : 0;
  }
  eur(value: number): string {
    return new Intl.NumberFormat("it-IT", {
      style: "currency",
      currency: "EUR",
    }).format(value);
  }
  formatDate(value: string): string {
    return new Intl.DateTimeFormat("it-IT").format(new Date(value));
  }
  formatDateTime(value: string): string {
    return new Intl.DateTimeFormat("it-IT", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(value));
  }
  insertMeta(item: Income): string {
    return `Inserito da ${this.userNames()[item.created_by ?? ""] ?? "Utente non disponibile"} · ${this.formatDateTime(item.created_at)}`;
  }
  profileDisplayName(profile: Profile): string {
    return profile.full_name?.trim() || profile.email?.trim() || profile.id;
  }
  emptyForm(): InsertIncome {
    return {
      date: new Date().toISOString().slice(0, 10),
      source: "",
      category: INCOME_CATEGORIES[0],
      amount: 0,
      received_by: "",
      payment_method: PAYMENT_METHODS[0],
      notes: "",
    };
  }
  private message(error: unknown): string {
    return error instanceof Error ? error.message : "Operazione non riuscita.";
  }

  private setError(message: string): void {
    this.error.set(message);
    this.snackbar.error(message);
  }
}

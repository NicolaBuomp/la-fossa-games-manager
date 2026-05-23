import { Component, OnInit, computed, inject, signal } from "@angular/core";
import { AuthService } from "../../core/services/auth.service";
import { ExpensesService } from "../../core/services/expenses.service";
import { ExportService } from "../../core/services/export.service";
import { ProfileService } from "../../core/services/profile.service";
import { SnackbarService } from "../../core/services/snackbar.service";
import {
  EXPENSE_CATEGORIES,
  EXPENSE_STATUS,
  EXPENSE_STATUSES,
  PAYMENT_METHODS,
} from "../../core/types/constants";
import {
  Expense,
  ExpenseStatus,
  InsertExpense,
  Profile,
} from "../../core/types/models";
import {
  CrudFormField,
  CrudFormModalComponent,
} from "../../shared/components/crud-form-modal.component";
import {
  ConfirmModalComponent,
  EmptyStateComponent,
  KpiPanelComponent,
  StatusBadgeComponent,
  SummaryCardComponent,
} from "../../shared/components/ui.component";

@Component({
  standalone: true,
  imports: [
    EmptyStateComponent,
    KpiPanelComponent,
    SummaryCardComponent,
    StatusBadgeComponent,
    ConfirmModalComponent,
    CrudFormModalComponent,
  ],
  template: `
    <section class="space-y-5">
      <div class="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p class="text-xs font-bold uppercase tracking-[0.18em] text-muted">
            Modulo spese
          </p>
          <h1 class="font-display text-3xl uppercase">Spese</h1>
        </div>
        <div class="flex gap-2">
          <button
            class="rounded-lg bg-surface px-4 py-2 text-sm font-bold ring-1 ring-black/15 transition hover:bg-surface-muted"
            (click)="export()"
          >
            CSV
          </button>
          <button
            class="bg-strong text-on-strong rounded-lg px-4 py-2 text-sm font-bold"
            (click)="newItem()"
          >
            Nuova
          </button>
        </div>
      </div>

      <lfg-kpi-panel title="KPI spese" storageKey="expenses">
        <section class="grid gap-3 sm:grid-cols-2">
          <lfg-summary-card
            label="Totale spese"
            [value]="eur(total())"
            tone="expense"
            [hint]="items().length + ' movimenti'"
          />
          <lfg-summary-card
            label="Media per spesa"
            [value]="eur(average())"
            tone="expense"
            hint="Importo medio per movimento"
          />
        </section>
      </lfg-kpi-panel>
      @if (error()) {
        <p class="state-danger rounded-lg border p-3 text-sm">
          {{ error() }}
        </p>
      }

      @if (!items().length) {
        <lfg-empty-state
          title="Ancora nessuna spesa"
          text="Registra costi, anticipi e pagamenti dell'organizzazione."
          actionLabel="Nuova spesa"
          icon="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z"
          (action)="newItem()"
        />
      } @else {
        <div class="grid gap-3">
          @for (item of items(); track item.id) {
            <article
              class="rounded-lg border border-soft bg-surface p-4 shadow-sm"
            >
              <div class="flex flex-wrap justify-between gap-3">
                <div class="min-w-0">
                  <h2 class="truncate text-base font-bold">
                    {{ item.description }}
                  </h2>
                  <p class="mt-1 text-xs text-muted">
                    {{ formatDate(item.date) }} · {{ item.category }}
                    @if (item.paid_by) {
                      · da {{ item.paid_by }}
                    }
                  </p>
                  <div class="mt-2">
                    <lfg-status-badge
                      [label]="statusLabel(item.status)"
                      [className]="statusClass(item.status)"
                    />
                  </div>
                  <p class="mt-1 text-xs font-semibold text-muted">
                    {{ insertMeta(item) }}
                  </p>
                  @if (item.notes) {
                    <p class="mt-2 text-sm text-muted">
                      {{ item.notes }}
                    </p>
                  }
                </div>
                <p class="text-negative font-black">-{{ eur(item.amount) }}</p>
              </div>
              <div
                class="mt-4 flex justify-end gap-2 border-t border-soft pt-3"
              >
                <button
                  class="rounded-md bg-surface-muted px-3 py-1.5 text-xs font-bold uppercase"
                  (click)="edit(item)"
                >
                  Modifica
                </button>
                @if (auth.isAdmin()) {
                  <button
                    class="state-danger rounded-md border px-3 py-1.5 text-xs font-bold uppercase"
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
      [title]="editing() ? 'Modifica spesa' : 'Nuova spesa'"
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
export class ExpensesComponent implements OnInit {
  items = signal<Expense[]>([]);
  profilesList = signal<Profile[]>([]);
  userNames = signal<Record<string, string>>({});
  error = signal("");
  modalOpen = signal(false);
  editing = signal<Expense | null>(null);
  saving = signal(false);
  confirmPending = signal<(() => Promise<void>) | null>(null);
  confirmMessage = signal("");
  private readonly snackbar = inject(SnackbarService);
  categories = EXPENSE_CATEGORIES;
  statuses = EXPENSE_STATUSES;
  methods = PAYMENT_METHODS;
  form: InsertExpense = this.emptyForm();
  formFields = computed<CrudFormField[]>(() => [
    { name: "description", label: "Descrizione", type: "text", required: true },
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
      name: "status",
      label: "Stato",
      type: "select",
      options: this.statuses.map((status) => ({
        label: status.label,
        value: status.id,
      })),
    },
    {
      name: "payment_method",
      label: "Metodo",
      type: "select",
      options: this.methods.map((method) => ({ label: method, value: method })),
    },
    {
      name: "paid_by",
      label: "Pagato da",
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
    private readonly service: ExpensesService,
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
  edit(item: Expense): void {
    this.error.set("");
    this.editing.set(item);
    this.form = {
      date: item.date,
      description: item.description,
      category: item.category,
      amount: item.amount,
      status: item.status,
      paid_by: item.paid_by,
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

  askRemove(item: Expense): void {
    this.confirmMessage.set(`Eliminare la spesa "${item.description}"?`);
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
      "spese-la-fossa-games.csv",
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
  statusLabel(status: ExpenseStatus): string {
    return this.statuses.find((item) => item.id === status)?.label ?? status;
  }
  statusClass(status: ExpenseStatus): string {
    return this.statuses.find((item) => item.id === status)?.className ?? "";
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
  insertMeta(item: Expense): string {
    return `Inserito da ${this.userNames()[item.created_by ?? ""] ?? "Utente non disponibile"} · ${this.formatDateTime(item.created_at)}`;
  }
  profileDisplayName(profile: Profile): string {
    return profile.full_name?.trim() || profile.email?.trim() || profile.id;
  }
  emptyForm(): InsertExpense {
    return {
      date: new Date().toISOString().slice(0, 10),
      description: "",
      category: EXPENSE_CATEGORIES[0],
      amount: 0,
      status: EXPENSE_STATUS.Paid,
      paid_by: "",
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

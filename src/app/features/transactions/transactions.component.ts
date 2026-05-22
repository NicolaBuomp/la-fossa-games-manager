import {
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from "@angular/core";
import { RouterLink } from "@angular/router";
import { AuthService } from "../../core/services/auth.service";
import { ExpensesService } from "../../core/services/expenses.service";
import { ExportService } from "../../core/services/export.service";
import { IncomesService } from "../../core/services/incomes.service";
import { ProfileService } from "../../core/services/profile.service";
import { SnackbarService } from "../../core/services/snackbar.service";
import { TransactionsService } from "../../core/services/transactions.service";
import {
  EXPENSE_CATEGORIES,
  EXPENSE_STATUSES,
  INCOME_CATEGORIES,
  PAYMENT_METHODS,
} from "../../core/types/constants";
import {
  Expense,
  ExpenseStatus,
  Income,
  InsertExpense,
  InsertIncome,
  Profile,
  Transaction,
} from "../../core/types/models";
import {
  CrudFormField,
  CrudFormModalComponent,
} from "../../shared/components/crud-form-modal.component";
import {
  FilterOption,
  StatusFilterPillsComponent,
} from "../../shared/components/status-filter-pills.component";
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
    RouterLink,
    EmptyStateComponent,
    KpiPanelComponent,
    SummaryCardComponent,
    StatusBadgeComponent,
    ConfirmModalComponent,
    CrudFormModalComponent,
    StatusFilterPillsComponent,
  ],
  template: `
    <section class="space-y-5">
      <div class="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p class="text-xs font-bold uppercase tracking-[0.18em] text-muted">
            Modulo finanziario
          </p>
          <h1 class="font-display text-3xl uppercase">Transazioni</h1>
        </div>
        <div class="flex gap-2">
          <button
            class="rounded-lg bg-surface px-4 py-2 text-sm font-bold ring-1 ring-black/15 transition hover:bg-surface-muted"
            (click)="export()"
          >
            CSV
          </button>
          <button
            class="rounded-lg bg-surface px-4 py-2 text-sm font-bold text-positive ring-1 ring-black/15 transition hover:bg-surface-muted"
            (click)="newIncome()"
          >
            + Entrata
          </button>
          <button
            class="rounded-lg bg-surface px-4 py-2 text-sm font-bold text-negative ring-1 ring-black/15 transition hover:bg-surface-muted"
            (click)="newExpense()"
          >
            − Spesa
          </button>
        </div>
      </div>

      <lfg-kpi-panel title="KPI transazioni" storageKey="transactions">
        <section class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <lfg-summary-card
            label="Entrate totali"
            [value]="eur(totalIncomes())"
            tone="income"
            [hint]="incomeCount() + ' movimenti'"
          />
          <lfg-summary-card
            label="Spese totali"
            [value]="eur(totalExpenses())"
            tone="expense"
            [hint]="expenseCount() + ' movimenti'"
          />
          <lfg-summary-card
            label="Saldo"
            [value]="eur(balance())"
            [tone]="balance() >= 0 ? 'income' : 'expense'"
            hint="Entrate − Spese"
          />
          <lfg-summary-card
            label="Da consegnare"
            [value]="eur(pendingDelivery())"
            tone="warning"
            [hint]="pendingDeliveryCount() + ' entrate'"
          />
        </section>
      </lfg-kpi-panel>

      @if (error()) {
        <p class="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {{ error() }}
        </p>
      }

      <div class="space-y-3">
        <lfg-status-filter-pills
          [options]="typeFilterOptions"
          (filterChange)="setTypeFilter($event)"
        />
        @if (typeFilter() !== 'expense') {
          <lfg-status-filter-pills
            [options]="deliveryFilterOptions"
            (filterChange)="setDeliveryFilter($event)"
          />
        }
      </div>

      @if (!filteredItems().length) {
        <div class="mt-6">
          <lfg-empty-state
            title="Nessuna transazione trovata"
            text="Registra entrate e spese usando i pulsanti in alto. I pagamenti iscrizioni e sponsor appaiono automaticamente."
            actionLabel="Nuova entrata"
            (action)="newIncome()"
          />
        </div>
      } @else {
        <div class="grid gap-3">
          @for (item of filteredItems(); track item.source_id) {
            <article class="rounded-lg border border-soft bg-surface p-4 shadow-sm">
              <div class="flex flex-wrap justify-between gap-3">
                <div class="min-w-0 flex-1">
                  <div class="flex flex-wrap items-center gap-2">
                    <span
                      class="shrink-0 text-xs font-black uppercase"
                      [class.text-positive]="item.type === 'income'"
                      [class.text-negative]="item.type === 'expense'"
                    >
                      {{ item.type === 'income' ? '↑ Entrata' : '↓ Spesa' }}
                    </span>
                    <!-- Badge fonte automatica -->
                    @if (item.source_table === 'tournament_teams') {
                      <span class="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-blue-700">
                        Iscrizione torneo
                      </span>
                    } @else if (item.source_table === 'sponsors') {
                      <span class="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-purple-700">
                        Sponsor
                      </span>
                    }
                    <h2 class="truncate text-base font-bold">
                      {{ item.description }}
                    </h2>
                  </div>
                  <p class="mt-1 text-xs text-muted">
                    {{ formatDate(item.date) }} · {{ item.category }}
                    @if (item.person) {
                      · {{ item.person }}
                    }
                    @if (item.payment_method) {
                      · {{ item.payment_method }}
                    }
                  </p>

                  @if (item.type === 'expense' && item.expense_status) {
                    <div class="mt-2">
                      <lfg-status-badge
                        [label]="expenseStatusLabel(item.expense_status)"
                        [className]="expenseStatusClass(item.expense_status)"
                      />
                    </div>
                  }

                  @if (item.type === 'income') {
                    <div class="mt-2">
                      @if (item.delivered_to_treasurer) {
                        <span class="inline-flex items-center gap-1 rounded-full border border-green-200 bg-green-50 px-2 py-0.5 text-xs font-semibold text-green-700">
                          ✓ Consegnato al tesoriere · {{ formatDate(item.delivered_at!) }}
                        </span>
                      } @else {
                        <span class="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">
                          Da consegnare al tesoriere
                        </span>
                      }
                    </div>
                  }

                  <p class="mt-1 text-xs font-semibold text-muted">
                    {{ insertMeta(item) }}
                  </p>
                </div>
                <p
                  class="shrink-0 text-lg font-black"
                  [class.text-positive]="item.type === 'income'"
                  [class.text-negative]="item.type === 'expense'"
                >
                  {{ item.type === 'income' ? '+' : '−' }}{{ eur(item.amount) }}
                </p>
              </div>

              <!-- Azioni: solo per righe modificabili (incomes/expenses manuali) -->
              @if (item.source_table === 'incomes' || item.source_table === 'expenses') {
                <div class="mt-4 flex justify-end gap-2 border-t border-soft pt-3">
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
              } @else {
                <!-- Per le righe automatiche: link alla pagina sorgente -->
                <div class="mt-4 flex justify-end gap-2 border-t border-soft pt-3">
                  @if (item.source_table === 'tournament_teams') {
                    <a
                      routerLink="/app/registrations"
                      class="rounded-md bg-surface-muted px-3 py-1.5 text-xs font-bold uppercase"
                    >
                      Vai a Iscritti →
                    </a>
                  } @else if (item.source_table === 'sponsors') {
                    <a
                      routerLink="/app/sponsors"
                      class="rounded-md bg-surface-muted px-3 py-1.5 text-xs font-bold uppercase"
                    >
                      Vai a Sponsor →
                    </a>
                  }
                </div>
              }
            </article>
          }
        </div>
      }
    </section>

    <lfg-crud-form-modal
      [open]="incomeModalOpen()"
      [title]="editingIncome() ? 'Modifica entrata' : 'Nuova entrata'"
      [fields]="incomeFormFields"
      [form]="incomeForm"
      [loading]="saving"
      [error]="error"
      (close)="incomeModalOpen.set(false)"
      (formUpdated)="updateIncomeForm($event)"
      (save)="saveIncome()"
    />

    <lfg-crud-form-modal
      [open]="expenseModalOpen()"
      [title]="editingExpense() ? 'Modifica spesa' : 'Nuova spesa'"
      [fields]="expenseFormFields"
      [form]="expenseForm"
      [loading]="saving"
      [error]="error"
      (close)="expenseModalOpen.set(false)"
      (formUpdated)="updateExpenseForm($event)"
      (save)="saveExpense()"
    />

    <lfg-confirm
      [open]="!!confirmPending()"
      [message]="confirmMessage()"
      (confirm)="doConfirm()"
      (cancel)="confirmPending.set(null)"
    />
  `,
})
export class TransactionsComponent implements OnInit {
  items = signal<Transaction[]>([]);
  profilesList = signal<Profile[]>([]);
  userNames = signal<Record<string, string>>({});
  error = signal("");
  saving = signal(false);
  confirmPending = signal<(() => Promise<void>) | null>(null);
  confirmMessage = signal("");

  incomeModalOpen = signal(false);
  editingIncome = signal<Income | null>(null);
  incomeForm: InsertIncome = this.emptyIncomeForm();

  expenseModalOpen = signal(false);
  editingExpense = signal<Expense | null>(null);
  expenseForm: InsertExpense = this.emptyExpenseForm();

  typeFilter = signal<"all" | "income" | "expense">("all");
  deliveryFilter = signal<"all" | "pending" | "delivered">("all");

  private readonly snackbar = inject(SnackbarService);

  get typeFilterOptions(): () => FilterOption[] {
    return () => [
      { label: "Tutte", value: "all", active: this.typeFilter() === "all" },
      { label: "Entrate", value: "income", active: this.typeFilter() === "income" },
      { label: "Spese", value: "expense", active: this.typeFilter() === "expense" },
    ];
  }

  get deliveryFilterOptions(): () => FilterOption[] {
    return () => [
      { label: "Tutti gli stati", value: "all", active: this.deliveryFilter() === "all" },
      { label: "Da consegnare", value: "pending", active: this.deliveryFilter() === "pending" },
      { label: "Consegnati", value: "delivered", active: this.deliveryFilter() === "delivered" },
    ];
  }

  readonly filteredItems = computed(() => {
    let result = this.items();
    const type = this.typeFilter();
    const delivery = this.deliveryFilter();

    if (type !== "all") {
      result = result.filter((i) => i.type === type);
    }
    if (delivery !== "all") {
      result = result.filter((i) => {
        if (i.type !== "income") return true;
        return delivery === "pending"
          ? !i.delivered_to_treasurer
          : i.delivered_to_treasurer;
      });
    }
    return result;
  });

  readonly totalIncomes = computed(() =>
    this.items()
      .filter((i) => i.type === "income")
      .reduce((s, i) => s + Number(i.amount || 0), 0),
  );
  readonly totalExpenses = computed(() =>
    this.items()
      .filter((i) => i.type === "expense")
      .reduce((s, i) => s + Number(i.amount || 0), 0),
  );
  readonly balance = computed(() => this.totalIncomes() - this.totalExpenses());
  readonly incomeCount = computed(() => this.items().filter((i) => i.type === "income").length);
  readonly expenseCount = computed(() => this.items().filter((i) => i.type === "expense").length);
  readonly pendingDelivery = computed(() =>
    this.items()
      .filter((i) => i.type === "income" && !i.delivered_to_treasurer)
      .reduce((s, i) => s + Number(i.amount || 0), 0),
  );
  readonly pendingDeliveryCount = computed(() =>
    this.items().filter((i) => i.type === "income" && !i.delivered_to_treasurer).length,
  );

  readonly incomeFormFields = computed<CrudFormField[]>(() => [
    { name: "source", label: "Fonte", type: "text", required: true },
    { name: "amount", label: "Importo", type: "number", required: true, min: 0, step: 0.01 },
    { name: "date", label: "Data", type: "date", required: true },
    {
      name: "category",
      label: "Categoria",
      type: "select",
      options: INCOME_CATEGORIES.map((c) => ({ label: c, value: c })),
    },
    {
      name: "payment_method",
      label: "Metodo",
      type: "select",
      options: PAYMENT_METHODS.map((m) => ({ label: m, value: m })),
    },
    {
      name: "received_by",
      label: "Incassato da",
      type: "select",
      options: [
        { label: "Non indicato", value: "" },
        ...this.profilesList().map((p) => ({
          label: this.profileDisplayName(p),
          value: this.profileDisplayName(p),
        })),
      ],
    },
    { name: "notes", label: "Note", type: "textarea", rows: 3 },
  ]);

  readonly expenseFormFields = computed<CrudFormField[]>(() => [
    { name: "description", label: "Descrizione", type: "text", required: true },
    { name: "amount", label: "Importo", type: "number", required: true, min: 0, step: 0.01 },
    { name: "date", label: "Data", type: "date", required: true },
    {
      name: "category",
      label: "Categoria",
      type: "select",
      options: EXPENSE_CATEGORIES.map((c) => ({ label: c, value: c })),
    },
    {
      name: "status",
      label: "Stato",
      type: "select",
      options: EXPENSE_STATUSES.map((s) => ({ label: s.label, value: s.id })),
    },
    {
      name: "payment_method",
      label: "Metodo",
      type: "select",
      options: PAYMENT_METHODS.map((m) => ({ label: m, value: m })),
    },
    {
      name: "paid_by",
      label: "Pagato da",
      type: "select",
      options: [
        { label: "Non indicato", value: "" },
        ...this.profilesList().map((p) => ({
          label: this.profileDisplayName(p),
          value: this.profileDisplayName(p),
        })),
      ],
    },
    { name: "notes", label: "Note", type: "textarea", rows: 3 },
  ]);

  constructor(
    readonly auth: AuthService,
    private readonly txService: TransactionsService,
    private readonly incomesService: IncomesService,
    private readonly expensesService: ExpensesService,
    private readonly exporter: ExportService,
    private readonly profiles: ProfileService,
  ) {}

  ngOnInit(): void {
    void this.load();
  }

  async load(): Promise<void> {
    try {
      const [transactions, profilesData] = await Promise.all([
        this.txService.list(),
        this.profiles.list(),
      ]);
      this.items.set(transactions);
      this.profilesList.set(profilesData);
      this.userNames.set(
        Object.fromEntries(
          profilesData.map((p) => [p.id, this.profileDisplayName(p)]),
        ),
      );
    } catch (e) {
      this.setError(this.message(e));
    }
  }

  setTypeFilter(value: string): void {
    this.typeFilter.set(value as "all" | "income" | "expense");
  }

  setDeliveryFilter(value: string): void {
    this.deliveryFilter.set(value as "all" | "pending" | "delivered");
  }

  newIncome(): void {
    this.error.set("");
    this.editingIncome.set(null);
    this.incomeForm = this.emptyIncomeForm();
    this.incomeModalOpen.set(true);
  }

  newExpense(): void {
    this.error.set("");
    this.editingExpense.set(null);
    this.expenseForm = this.emptyExpenseForm();
    this.expenseModalOpen.set(true);
  }

  edit(item: Transaction): void {
    this.error.set("");
    if (item.source_table === "incomes") {
      this.editingIncome.set({ id: item.source_id } as Income);
      this.incomeForm = {
        date: item.date,
        source: item.description,
        category: item.category,
        amount: item.amount,
        received_by: item.person ?? null,
        payment_method: item.payment_method,
        notes: null,
      };
      this.incomeModalOpen.set(true);
    } else if (item.source_table === "expenses") {
      this.editingExpense.set({ id: item.source_id } as Expense);
      this.expenseForm = {
        date: item.date,
        description: item.description,
        category: item.category,
        amount: item.amount,
        status: (item.expense_status as ExpenseStatus) ?? "pagata",
        paid_by: item.person ?? null,
        payment_method: item.payment_method,
        notes: null,
      };
      this.expenseModalOpen.set(true);
    }
  }

  async saveIncome(): Promise<void> {
    if (this.saving()) return;
    this.saving.set(true);
    this.error.set("");
    try {
      const payload = { ...this.incomeForm, amount: Number(this.incomeForm.amount || 0) };
      const current = this.editingIncome();
      if (current?.id) await this.incomesService.update(current.id, payload);
      else await this.incomesService.create(payload);
      this.incomeModalOpen.set(false);
      await this.load();
    } catch (e) {
      this.setError(this.message(e));
    } finally {
      this.saving.set(false);
    }
  }

  async saveExpense(): Promise<void> {
    if (this.saving()) return;
    this.saving.set(true);
    this.error.set("");
    try {
      const payload = { ...this.expenseForm, amount: Number(this.expenseForm.amount || 0) };
      const current = this.editingExpense();
      if (current?.id) await this.expensesService.update(current.id, payload);
      else await this.expensesService.create(payload);
      this.expenseModalOpen.set(false);
      await this.load();
    } catch (e) {
      this.setError(this.message(e));
    } finally {
      this.saving.set(false);
    }
  }

  updateIncomeForm(patch: Record<string, unknown>): void {
    this.incomeForm = { ...this.incomeForm, ...patch } as InsertIncome;
  }

  updateExpenseForm(patch: Record<string, unknown>): void {
    this.expenseForm = { ...this.expenseForm, ...patch } as InsertExpense;
  }

  askRemove(item: Transaction): void {
    this.confirmMessage.set(
      `Eliminare la ${item.type === "income" ? "entrata" : "spesa"} "${item.description}"?`,
    );
    this.confirmPending.set(async () => {
      try {
        if (item.source_table === "incomes") await this.incomesService.remove(item.source_id);
        else if (item.source_table === "expenses") await this.expensesService.remove(item.source_id);
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
      "transazioni-la-fossa-games.csv",
      this.filteredItems() as unknown as Record<string, unknown>[],
    );
  }

  expenseStatusLabel(status: string): string {
    return EXPENSE_STATUSES.find((s) => s.id === status)?.label ?? status;
  }

  expenseStatusClass(status: string): string {
    return EXPENSE_STATUSES.find((s) => s.id === status)?.className ?? "";
  }

  eur(value: number): string {
    return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(value);
  }

  formatDate(value: string): string {
    return new Intl.DateTimeFormat("it-IT").format(new Date(value));
  }

  formatDateTime(value: string): string {
    return new Intl.DateTimeFormat("it-IT", { dateStyle: "short", timeStyle: "short" }).format(
      new Date(value),
    );
  }

  insertMeta(item: Transaction): string {
    const name = this.userNames()[item.created_by ?? ""] ?? "Utente non disponibile";
    return `Inserito da ${name} · ${this.formatDateTime(item.created_at)}`;
  }

  profileDisplayName(profile: Profile): string {
    return profile.full_name?.trim() || profile.email?.trim() || profile.id;
  }

  emptyIncomeForm(): InsertIncome {
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

  emptyExpenseForm(): InsertExpense {
    return {
      date: new Date().toISOString().slice(0, 10),
      description: "",
      category: EXPENSE_CATEGORIES[0],
      amount: 0,
      status: "pagata",
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

import { Component, OnInit, computed, inject, signal } from "@angular/core";
import { RouterLink } from "@angular/router";
import { AuthService } from "../../core/services/auth.service";
import { ExpensesService } from "../../core/services/expenses.service";
import { ExportService } from "../../core/services/export.service";
import { IncomesService } from "../../core/services/incomes.service";
import { ProfileService } from "../../core/services/profile.service";
import { SnackbarService } from "../../core/services/snackbar.service";
import { TransactionsService } from "../../core/services/transactions.service";
import {
  DELIVERY_STATUS,
  DeliveryStatusFilter,
  EXPENSE_CATEGORIES,
  EXPENSE_STATUS,
  EXPENSE_STATUSES,
  FILTER_ALL,
  INCOME_CATEGORIES,
  PAGE_SIZE,
  PAYMENT_METHODS,
  TRANSACTION_SOURCE_TABLE,
  TRANSACTION_TYPE,
} from "../../core/types/constants";
import {
  Expense,
  ExpenseStatus,
  Income,
  InsertExpense,
  InsertIncome,
  Profile,
  Transaction,
  TransactionSummary,
  TransactionType,
} from "../../core/types/models";
import {
  CrudFormField,
  CrudFormModalComponent,
} from "../../shared/components/crud-form-modal.component";
import { PaginationComponent } from "../../shared/components/pagination.component";
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
    PaginationComponent,
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
            Entrata
          </button>
          <button
            class="rounded-lg bg-surface px-4 py-2 text-sm font-bold text-negative ring-1 ring-black/15 transition hover:bg-surface-muted"
            (click)="newExpense()"
          >
            Spesa
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
        <input
          type="search"
          placeholder="Cerca per descrizione…"
          class="w-full rounded-lg border border-soft bg-surface px-4 py-2.5 text-sm outline-none placeholder:text-muted"
          [value]="searchQuery()"
          (input)="onSearchInput($any($event.target).value)"
        />
        <lfg-status-filter-pills
          [options]="typeFilterOptions"
          (filterChange)="setTypeFilter($event)"
        />
        @if (typeFilter() !== transactionType.Expense) {
          <lfg-status-filter-pills
            [options]="deliveryFilterOptions"
            (filterChange)="setDeliveryFilter($event)"
          />
        }
      </div>

      @if (!items().length) {
        <div class="mt-6">
          <lfg-empty-state
            title="Nessuna transazione trovata"
            text="Registra entrate e spese usando i pulsanti in alto. I pagamenti iscrizioni e sponsor appaiono automaticamente."
            actionLabel="Nuova entrata"
            icon="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            (action)="newIncome()"
          />
        </div>
      } @else {
        <div class="grid gap-3">
          @for (item of items(); track item.source_id) {
            <article
              class="rounded-lg border border-soft bg-surface p-4 shadow-sm"
            >
              <!-- Riga superiore: tipo + importo sempre affiancati -->
              <div class="flex items-start justify-between gap-2">
                <div class="flex min-w-0 flex-wrap items-center gap-1.5">
                  <span
                    class="shrink-0 text-xs font-black uppercase"
                    [class.text-positive]="item.type === transactionType.Income"
                    [class.text-negative]="
                      item.type === transactionType.Expense
                    "
                  >
                    {{
                      item.type === transactionType.Income
                        ? "↑ Entrata"
                        : "↓ Spesa"
                    }}
                  </span>
                  @if (
                    item.source_table === transactionSourceTable.TournamentTeams
                  ) {
                    <span
                      class="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-blue-700"
                    >
                      Iscrizione torneo
                    </span>
                  } @else if (
                    item.source_table === transactionSourceTable.Sponsors
                  ) {
                    <span
                      class="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-purple-700"
                    >
                      Sponsor
                    </span>
                  }
                </div>
                <p
                  class="shrink-0 text-lg font-black"
                  [class.text-positive]="item.type === transactionType.Income"
                  [class.text-negative]="item.type === transactionType.Expense"
                >
                  {{ item.type === transactionType.Income ? "+" : "−"
                  }}{{ eur(item.amount) }}
                </p>
              </div>

              <!-- Descrizione sotto, a piena larghezza -->
              <h2 class="mt-1 text-base font-bold leading-snug">
                {{ item.description }}
              </h2>

              <!-- Metadati su più righe su mobile -->
              <p class="mt-1 text-xs text-muted">
                {{ formatDate(item.date) }}
                @if (item.person) {
                  · {{ item.person }}
                }
              </p>

              @if (
                item.type === transactionType.Expense && item.expense_status
              ) {
                <div class="mt-2">
                  <lfg-status-badge
                    [label]="expenseStatusLabel(item.expense_status)"
                    [className]="expenseStatusClass(item.expense_status)"
                  />
                </div>
              }

              @if (item.type === transactionType.Income) {
                <div class="mt-2 flex flex-wrap gap-1.5">
                  @if (item.delivered_to_treasurer) {
                    <span
                      class="inline-flex items-center gap-1 rounded-full border border-green-200 bg-green-50 px-2 py-0.5 text-xs font-semibold text-green-700"
                    >
                      ✓ Consegnato al tesoriere ·
                      {{ formatDate(item.delivered_at!) }}
                    </span>
                  } @else {
                    <span
                      class="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700"
                    >
                      Da consegnare al tesoriere
                    </span>
                  }
                  @if (item.da_fatturare) {
                    @if (item.fattura_emessa) {
                      <span
                        class="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700"
                      >
                        ✓ Fattura emessa
                      </span>
                    } @else {
                      <span
                        class="inline-flex items-center gap-1 rounded-full border border-orange-200 bg-orange-50 px-2 py-0.5 text-xs font-semibold text-orange-700"
                      >
                        Fattura da emettere
                      </span>
                    }
                  }
                </div>
              }

              <p class="mt-1 text-xs font-semibold text-muted">
                {{ insertMeta(item) }}
              </p>

              <!-- Azioni: solo per righe modificabili (incomes/expenses manuali) -->
              @if (
                item.source_table === transactionSourceTable.Incomes ||
                item.source_table === transactionSourceTable.Expenses
              ) {
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
              } @else {
                <!-- Per le righe automatiche: link alla pagina sorgente -->
                <div
                  class="mt-4 flex justify-end gap-2 border-t border-soft pt-3"
                >
                  @if (
                    item.source_table === transactionSourceTable.TournamentTeams
                  ) {
                    <a
                      routerLink="/app/registrations"
                      class="rounded-md bg-surface-muted px-3 py-1.5 text-xs font-bold uppercase"
                    >
                      Vai a Tornei
                    </a>
                  } @else if (
                    item.source_table === transactionSourceTable.Sponsors
                  ) {
                    <a
                      routerLink="/app/sponsors"
                      class="rounded-md bg-surface-muted px-3 py-1.5 text-xs font-bold uppercase"
                    >
                      Vai a Sponsor
                    </a>
                  }
                </div>
              }
            </article>
          }
        </div>
        <lfg-pagination
          [page]="page()"
          [pageSize]="pageSize"
          [total]="totalItems()"
          (pageChange)="onPageChange($event)"
        />
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
  totalItems = signal(0);
  page = signal(1);
  readonly pageSize = PAGE_SIZE;
  summary = signal<TransactionSummary | null>(null);
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

  typeFilter = signal<typeof FILTER_ALL | TransactionType>(FILTER_ALL);
  deliveryFilter = signal<DeliveryStatusFilter>(FILTER_ALL);
  searchQuery = signal("");

  private searchTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly snackbar = inject(SnackbarService);

  get typeFilterOptions(): () => FilterOption[] {
    return () => [
      {
        label: "Tutte",
        value: FILTER_ALL,
        active: this.typeFilter() === FILTER_ALL,
      },
      {
        label: "Entrate",
        value: TRANSACTION_TYPE.Income,
        active: this.typeFilter() === TRANSACTION_TYPE.Income,
      },
      {
        label: "Spese",
        value: TRANSACTION_TYPE.Expense,
        active: this.typeFilter() === TRANSACTION_TYPE.Expense,
      },
    ];
  }

  get deliveryFilterOptions(): () => FilterOption[] {
    return () => [
      {
        label: "Tutti gli stati",
        value: FILTER_ALL,
        active: this.deliveryFilter() === FILTER_ALL,
      },
      {
        label: "Da consegnare",
        value: DELIVERY_STATUS.Pending,
        active: this.deliveryFilter() === DELIVERY_STATUS.Pending,
      },
      {
        label: "Consegnati",
        value: DELIVERY_STATUS.Delivered,
        active: this.deliveryFilter() === DELIVERY_STATUS.Delivered,
      },
    ];
  }

  readonly totalIncomes = computed(() => this.summary()?.totalIncomes ?? 0);
  readonly totalExpenses = computed(() => this.summary()?.totalExpenses ?? 0);
  readonly balance = computed(() => this.totalIncomes() - this.totalExpenses());
  readonly incomeCount = computed(() => this.summary()?.incomeCount ?? 0);
  readonly expenseCount = computed(() => this.summary()?.expenseCount ?? 0);
  readonly pendingDelivery = computed(
    () => this.summary()?.pendingDelivery ?? 0,
  );
  readonly pendingDeliveryCount = computed(
    () => this.summary()?.pendingDeliveryCount ?? 0,
  );

  readonly incomeFormFields = computed<CrudFormField[]>(() => [
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
    {
      name: "da_fatturare",
      label: "Da fatturare",
      type: "checkbox",
      help: "Spunta se per questa entrata deve essere emessa una fattura",
    },
  ]);

  readonly expenseFormFields = computed<CrudFormField[]>(() => [
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
    void Promise.all([this.load(), this.loadSummary(), this.loadProfiles()]);
  }

  async load(): Promise<void> {
    try {
      const result = await this.txService.list({
        type: this.typeFilter(),
        deliveryStatus: this.deliveryFilter(),
        search: this.searchQuery(),
        page: this.page(),
        pageSize: this.pageSize,
      });
      this.items.set(result.data);
      this.totalItems.set(result.total);
    } catch (e) {
      this.setError(this.message(e));
    }
  }

  async loadSummary(): Promise<void> {
    try {
      this.summary.set(await this.txService.summary());
    } catch {
      // non-critical: KPIs degrade gracefully
    }
  }

  async loadProfiles(): Promise<void> {
    try {
      const profilesData = await this.profiles.list();
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

  onSearchInput(q: string): void {
    this.searchQuery.set(q);
    if (this.searchTimer !== null) clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => {
      this.searchTimer = null;
      this.page.set(1);
      void this.load();
    }, 300);
  }

  onPageChange(p: number): void {
    this.page.set(p);
    void this.load();
  }

  setTypeFilter(value: string): void {
    this.typeFilter.set(value as typeof FILTER_ALL | TransactionType);
    this.page.set(1);
    void this.load();
  }

  setDeliveryFilter(value: string): void {
    this.deliveryFilter.set(value as DeliveryStatusFilter);
    this.page.set(1);
    void this.load();
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
    if (item.source_table === TRANSACTION_SOURCE_TABLE.Incomes) {
      this.editingIncome.set({ id: item.source_id } as Income);
      this.incomeForm = {
        date: item.date,
        source: item.description,
        category: item.category,
        amount: item.amount,
        received_by: item.person ?? null,
        payment_method: item.payment_method,
        notes: null,
        da_fatturare: item.da_fatturare ?? false,
      };
      this.incomeModalOpen.set(true);
    } else if (item.source_table === TRANSACTION_SOURCE_TABLE.Expenses) {
      this.editingExpense.set({ id: item.source_id } as Expense);
      this.expenseForm = {
        date: item.date,
        description: item.description,
        category: item.category,
        amount: item.amount,
        status: (item.expense_status as ExpenseStatus) ?? EXPENSE_STATUS.Paid,
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
      const payload = {
        ...this.incomeForm,
        amount: Number(this.incomeForm.amount || 0),
      };
      const current = this.editingIncome();
      if (current?.id) await this.incomesService.update(current.id, payload);
      else await this.incomesService.create(payload);
      this.incomeModalOpen.set(false);
      await Promise.all([this.load(), this.loadSummary()]);
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
      const payload = {
        ...this.expenseForm,
        amount: Number(this.expenseForm.amount || 0),
      };
      const current = this.editingExpense();
      if (current?.id) await this.expensesService.update(current.id, payload);
      else await this.expensesService.create(payload);
      this.expenseModalOpen.set(false);
      await Promise.all([this.load(), this.loadSummary()]);
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
      `Eliminare la ${item.type === TRANSACTION_TYPE.Income ? "entrata" : "spesa"} "${item.description}"?`,
    );
    this.confirmPending.set(async () => {
      try {
        if (item.source_table === TRANSACTION_SOURCE_TABLE.Incomes)
          await this.incomesService.remove(item.source_id);
        else if (item.source_table === TRANSACTION_SOURCE_TABLE.Expenses)
          await this.expensesService.remove(item.source_id);
        await Promise.all([this.load(), this.loadSummary()]);
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

  async export(): Promise<void> {
    try {
      const { data } = await this.txService.list({
        type: this.typeFilter(),
        deliveryStatus: this.deliveryFilter(),
        search: this.searchQuery(),
        pageSize: 10_000,
      });
      this.exporter.downloadCsv(
        "transazioni-la-fossa-games.csv",
        data as unknown as Record<string, unknown>[],
      );
    } catch (e) {
      this.setError(this.message(e));
    }
  }

  expenseStatusLabel(status: string): string {
    return EXPENSE_STATUSES.find((s) => s.id === status)?.label ?? status;
  }

  expenseStatusClass(status: string): string {
    return EXPENSE_STATUSES.find((s) => s.id === status)?.className ?? "";
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

  insertMeta(item: Transaction): string {
    const name =
      this.userNames()[item.created_by ?? ""] ?? "Utente non disponibile";
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
      da_fatturare: false,
    };
  }

  emptyExpenseForm(): InsertExpense {
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

  protected readonly transactionType = TRANSACTION_TYPE;
  protected readonly transactionSourceTable = TRANSACTION_SOURCE_TABLE;
}

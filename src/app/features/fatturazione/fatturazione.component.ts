import { Component, OnInit, computed, inject, signal } from "@angular/core";
import { RouterLink } from "@angular/router";
import { ExportService } from "../../core/services/export.service";
import { SnackbarService } from "../../core/services/snackbar.service";
import { TransactionsService } from "../../core/services/transactions.service";
import {
  FILTER_ALL,
  TRANSACTION_SOURCE_TABLE,
  TRANSACTION_TYPE,
} from "../../core/types/constants";
import { Transaction } from "../../core/types/models";
import {
  FilterOption,
  StatusFilterPillsComponent,
} from "../../shared/components/status-filter-pills.component";
import {
  EmptyStateComponent,
  KpiPanelComponent,
  SummaryCardComponent,
} from "../../shared/components/ui.component";

const INVOICE_STATUS = {
  Pending: "pending",
  Emitted: "emitted",
} as const;

type InvoiceStatusFilter =
  | typeof FILTER_ALL
  | (typeof INVOICE_STATUS)[keyof typeof INVOICE_STATUS];

@Component({
  standalone: true,
  imports: [
    RouterLink,
    EmptyStateComponent,
    KpiPanelComponent,
    SummaryCardComponent,
    StatusFilterPillsComponent,
  ],
  template: `
    <section class="space-y-5">
      <div class="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p class="text-xs font-bold uppercase tracking-[0.18em] text-muted">
            Modulo finanziario
          </p>
          <h1 class="font-display text-3xl uppercase">Fatturazione</h1>
        </div>
        <button
          class="rounded-lg bg-surface px-4 py-2 text-sm font-bold ring-1 ring-black/15 transition hover:bg-surface-muted"
          (click)="export()"
        >
          CSV
        </button>
      </div>

      <lfg-kpi-panel title="KPI fatturazione" storageKey="fatturazione">
        <section class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <lfg-summary-card
            label="Da emettere"
            [value]="eur(pendingTotal())"
            tone="warning"
            [hint]="pendingItems().length + ' transazioni'"
          />
          <lfg-summary-card
            label="Fatture emesse"
            [value]="eur(emittedTotal())"
            tone="income"
            [hint]="emittedItems().length + ' transazioni'"
          />
          <lfg-summary-card
            label="Totale fatturabile"
            [value]="eur(invoiceTotal())"
            tone="income"
            [hint]="invoiceItems().length + ' transazioni'"
          />
          <lfg-summary-card
            label="Sponsor"
            [value]="eur(sponsorTotal())"
            tone="warning"
            [hint]="sponsorItems().length + ' movimenti'"
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
          placeholder="Cerca per descrizione..."
          class="w-full rounded-lg border border-soft bg-surface px-4 py-2.5 text-sm outline-none placeholder:text-muted"
          [value]="searchQuery()"
          (input)="searchQuery.set($any($event.target).value)"
        />
        <lfg-status-filter-pills
          [options]="statusFilterOptions"
          (filterChange)="setStatusFilter($event)"
        />
      </div>

      @if (loading()) {
        <div class="rounded-lg border border-soft bg-surface p-4 text-sm font-semibold text-muted">
          Caricamento fatture...
        </div>
      } @else if (!filteredItems().length) {
        <lfg-empty-state
          title="Nessuna transazione da fatturare"
          text="Le entrate manuali e gli sponsor compaiono qui quando sono marcati come da fatturare."
        />
      } @else {
        <div class="hidden overflow-hidden rounded-lg border border-soft bg-surface md:block">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-soft bg-surface-muted">
                <th class="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-muted">
                  Data
                </th>
                <th class="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-muted">
                  Descrizione
                </th>
                <th class="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-muted">
                  Fonte
                </th>
                <th class="px-4 py-3 text-right text-xs font-bold uppercase tracking-wide text-muted">
                  Importo
                </th>
                <th class="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-muted">
                  Stato
                </th>
                <th class="px-4 py-3 text-right text-xs font-bold uppercase tracking-wide text-muted">
                  Azioni
                </th>
              </tr>
            </thead>
            <tbody>
              @for (item of filteredItems(); track item.source_table + item.source_id) {
                <tr class="border-b border-soft last:border-0">
                  <td class="px-4 py-3 text-muted">{{ formatDate(item.date) }}</td>
                  <td class="px-4 py-3">
                    <p class="font-semibold">{{ item.description }}</p>
                    @if (item.person) {
                      <p class="mt-0.5 text-xs text-muted">{{ item.person }}</p>
                    }
                  </td>
                  <td class="px-4 py-3">
                    <span
                      class="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
                      [class.bg-purple-100]="item.source_table === transactionSourceTable.Sponsors"
                      [class.text-purple-700]="item.source_table === transactionSourceTable.Sponsors"
                      [class.bg-surface-muted]="item.source_table !== transactionSourceTable.Sponsors"
                      [class.text-muted]="item.source_table !== transactionSourceTable.Sponsors"
                    >
                      {{ sourceLabel(item) }}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-right font-black text-positive">
                    +{{ eur(item.amount) }}
                  </td>
                  <td class="px-4 py-3">
                    <span
                      class="inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold"
                      [class.border-emerald-200]="item.fattura_emessa"
                      [class.bg-emerald-50]="item.fattura_emessa"
                      [class.text-emerald-700]="item.fattura_emessa"
                      [class.border-orange-200]="!item.fattura_emessa"
                      [class.bg-orange-50]="!item.fattura_emessa"
                      [class.text-orange-700]="!item.fattura_emessa"
                    >
                      {{ item.fattura_emessa ? "Fattura emessa" : "Da emettere" }}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-right">
                    <button
                      class="rounded-md bg-surface-muted px-3 py-1.5 text-xs font-bold uppercase transition hover:bg-surface disabled:opacity-60"
                      [disabled]="updatingId() === itemKey(item)"
                      (click)="toggleInvoice(item)"
                    >
                      {{ item.fattura_emessa ? "Riapri" : "Segna emessa" }}
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <div class="grid gap-3 md:hidden">
          @for (item of filteredItems(); track item.source_table + item.source_id) {
            <article class="rounded-lg border border-soft bg-surface p-4 shadow-sm">
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0 flex-1">
                  <div class="flex flex-wrap items-center gap-1.5">
                    <span class="rounded-full bg-surface-muted px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-muted">
                      {{ sourceLabel(item) }}
                    </span>
                    <span
                      class="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
                      [class.bg-emerald-50]="item.fattura_emessa"
                      [class.text-emerald-700]="item.fattura_emessa"
                      [class.bg-orange-50]="!item.fattura_emessa"
                      [class.text-orange-700]="!item.fattura_emessa"
                    >
                      {{ item.fattura_emessa ? "Emessa" : "Da emettere" }}
                    </span>
                  </div>
                  <h2 class="mt-2 text-base font-bold leading-snug">
                    {{ item.description }}
                  </h2>
                  <p class="mt-1 text-xs text-muted">
                    {{ formatDate(item.date) }}
                    @if (item.person) {
                      - {{ item.person }}
                    }
                  </p>
                </div>
                <p class="shrink-0 text-lg font-black text-positive">
                  +{{ eur(item.amount) }}
                </p>
              </div>
              <div class="mt-4 flex justify-end border-t border-soft pt-3">
                <button
                  class="rounded-md bg-surface-muted px-3 py-1.5 text-xs font-bold uppercase transition hover:bg-surface disabled:opacity-60"
                  [disabled]="updatingId() === itemKey(item)"
                  (click)="toggleInvoice(item)"
                >
                  {{ item.fattura_emessa ? "Riapri" : "Segna emessa" }}
                </button>
              </div>
            </article>
          }
        </div>
      }

      <div class="flex justify-end">
        <a
          routerLink="/app/transactions"
          class="text-xs font-bold uppercase tracking-wide text-muted underline transition hover:text-primary"
        >
          Vai a tutte le transazioni
        </a>
      </div>
    </section>
  `,
})
export class FatturazioneComponent implements OnInit {
  allItems = signal<Transaction[]>([]);
  statusFilter = signal<InvoiceStatusFilter>(FILTER_ALL);
  searchQuery = signal("");
  loading = signal(false);
  error = signal("");
  updatingId = signal<string | null>(null);
  private readonly snackbar = inject(SnackbarService);

  readonly invoiceItems = computed(() =>
    this.allItems().filter(
      (item) =>
        item.type === TRANSACTION_TYPE.Income &&
        (item.da_fatturare === true || item.fattura_emessa === true),
    ),
  );
  readonly pendingItems = computed(() =>
    this.invoiceItems().filter((item) => !item.fattura_emessa),
  );
  readonly emittedItems = computed(() =>
    this.invoiceItems().filter((item) => item.fattura_emessa),
  );
  readonly sponsorItems = computed(() =>
    this.invoiceItems().filter(
      (item) => item.source_table === TRANSACTION_SOURCE_TABLE.Sponsors,
    ),
  );
  readonly pendingTotal = computed(() => this.sum(this.pendingItems()));
  readonly emittedTotal = computed(() => this.sum(this.emittedItems()));
  readonly invoiceTotal = computed(() => this.sum(this.invoiceItems()));
  readonly sponsorTotal = computed(() => this.sum(this.sponsorItems()));
  readonly filteredItems = computed(() => {
    const search = this.searchQuery().trim().toLowerCase();
    let items = this.invoiceItems();

    if (this.statusFilter() === INVOICE_STATUS.Pending) {
      items = items.filter((item) => !item.fattura_emessa);
    } else if (this.statusFilter() === INVOICE_STATUS.Emitted) {
      items = items.filter((item) => item.fattura_emessa);
    }

    if (search) {
      items = items.filter((item) =>
        [item.description, item.category, item.person, this.sourceLabel(item)]
          .filter(Boolean)
          .some((value) => value!.toLowerCase().includes(search)),
      );
    }

    return items;
  });

  get statusFilterOptions(): () => FilterOption[] {
    return () => [
      {
        label: "Tutte",
        value: FILTER_ALL,
        active: this.statusFilter() === FILTER_ALL,
      },
      {
        label: "Da emettere",
        value: INVOICE_STATUS.Pending,
        active: this.statusFilter() === INVOICE_STATUS.Pending,
      },
      {
        label: "Emesse",
        value: INVOICE_STATUS.Emitted,
        active: this.statusFilter() === INVOICE_STATUS.Emitted,
      },
    ];
  }

  constructor(
    private readonly txService: TransactionsService,
    private readonly exporter: ExportService,
  ) {}

  ngOnInit(): void {
    void this.load();
  }

  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set("");
    try {
      const { data } = await this.txService.list({
        type: TRANSACTION_TYPE.Income,
        pageSize: 10_000,
      });
      this.allItems.set(data);
    } catch (e) {
      this.setError(this.message(e));
    } finally {
      this.loading.set(false);
    }
  }

  setStatusFilter(value: string): void {
    this.statusFilter.set(value as InvoiceStatusFilter);
  }

  async toggleInvoice(item: Transaction): Promise<void> {
    const key = this.itemKey(item);
    if (this.updatingId()) return;

    this.updatingId.set(key);
    this.error.set("");
    try {
      await this.txService.updateInvoiceStatus(item, !item.fattura_emessa);
      this.snackbar.success(
        item.fattura_emessa
          ? "Fattura riportata da emettere."
          : "Fattura segnata come emessa.",
      );
      await this.load();
    } catch (e) {
      this.setError(this.message(e));
    } finally {
      this.updatingId.set(null);
    }
  }

  export(): void {
    this.exporter.downloadCsv(
      "fatturazione-la-fossa-games.csv",
      this.filteredItems() as unknown as Record<string, unknown>[],
    );
  }

  sourceLabel(item: Transaction): string {
    if (item.source_table === TRANSACTION_SOURCE_TABLE.Sponsors) return "Sponsor";
    if (item.source_table === TRANSACTION_SOURCE_TABLE.Incomes) return "Manuale";
    return item.category;
  }

  itemKey(item: Transaction): string {
    return `${item.source_table}:${item.source_id}`;
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

  private sum(items: Transaction[]): number {
    return items.reduce((total, item) => total + Number(item.amount || 0), 0);
  }

  private message(error: unknown): string {
    return error instanceof Error ? error.message : "Operazione non riuscita.";
  }

  private setError(message: string): void {
    this.error.set(message);
    this.snackbar.error(message);
  }

  protected readonly transactionSourceTable = TRANSACTION_SOURCE_TABLE;
}

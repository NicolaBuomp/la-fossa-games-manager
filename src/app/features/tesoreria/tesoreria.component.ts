import { NgTemplateOutlet } from "@angular/common";
import { Component, OnInit, computed, inject, signal } from "@angular/core";
import { AuthService } from "../../core/services/auth.service";
import { SnackbarService } from "../../core/services/snackbar.service";
import { TransactionsService } from "../../core/services/transactions.service";
import {
  DELIVERY_STATUS,
  DeliveryStatusFilter,
  FILTER_ALL,
  INCOME_CATEGORIES,
  TRANSACTION_SOURCE_TABLE,
  TRANSACTION_TYPE,
} from "../../core/types/constants";
import { DeliveryItem, Transaction } from "../../core/types/models";
import {
  FilterOption,
  StatusFilterPillsComponent,
} from "../../shared/components/status-filter-pills.component";
import {
  ConfirmModalComponent,
  EmptyStateComponent,
  KpiPanelComponent,
  SummaryCardComponent,
} from "../../shared/components/ui.component";

@Component({
  standalone: true,
  imports: [
    NgTemplateOutlet,
    ConfirmModalComponent,
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
            Modulo tesoriere
          </p>
          <h1 class="font-display text-3xl uppercase">Tesoriere</h1>
        </div>
        @if (selectedItems().length > 0) {
          <div class="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2">
            <span class="text-sm font-bold text-amber-800">
              {{ selectedItems().length }} sel. — {{ eur(selectedTotal()) }}
            </span>
            <button
              class="rounded-lg bg-amber-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-amber-700 disabled:opacity-60"
              [disabled]="delivering()"
              (click)="confirmDeliveryOpen.set(true)"
            >
              {{ delivering() ? 'Consegna in corso…' : 'Consegna al tesoriere →' }}
            </button>
          </div>
        }
      </div>

      <lfg-kpi-panel title="KPI tesoriere" storageKey="tesoreria">
        <section class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <lfg-summary-card
            label="Da consegnare"
            [value]="eur(pendingTotal())"
            tone="warning"
            [hint]="pendingItems().length + ' entrate'"
          />
          <lfg-summary-card
            label="Consegnato questo mese"
            [value]="eur(deliveredThisMonth())"
            tone="income"
            hint="Mese corrente"
          />
          <lfg-summary-card
            label="Totale consegnato"
            [value]="eur(deliveredTotal())"
            tone="income"
            [hint]="deliveredItems().length + ' entrate'"
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
          [options]="deliveryFilterOptions"
          (filterChange)="setDeliveryFilter($event)"
        />
        <lfg-status-filter-pills
          [options]="categoryFilterOptions"
          (filterChange)="setCategoryFilter($event)"
        />
      </div>

      @if (!filteredItems().length) {
        <div class="mt-6">
          <lfg-empty-state
            title="Nessuna entrata trovata"
            text="Tutte le entrate sono state consegnate al tesoriere."
          />
        </div>
      } @else {
        @if (deliveryFilter() === deliveryStatus.Pending && filteredItems().length > 0) {
          <div class="flex items-center gap-3">
            <button
              class="text-xs font-bold text-muted underline hover:text-primary"
              (click)="selectAll()"
            >
              Seleziona tutte ({{ filteredItems().length }})
            </button>
            @if (selectedItems().length > 0) {
              <button
                class="text-xs font-bold text-muted underline hover:text-primary"
                (click)="deselectAll()"
              >
                Deseleziona
              </button>
            }
          </div>
        }

        <!-- Desktop: tabella -->
        <div class="hidden overflow-hidden rounded-lg border border-soft bg-surface sm:block">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-soft bg-surface-muted">
                @if (deliveryFilter() === deliveryStatus.Pending) {
                  <th class="w-10 px-4 py-3">
                    <span class="sr-only">Seleziona</span>
                  </th>
                }
                <th class="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-muted">Data</th>
                <th class="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-muted">Descrizione</th>
                <th class="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-muted">Categoria</th>
                <th class="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-muted">Fonte</th>
                <th class="px-4 py-3 text-right text-xs font-bold uppercase tracking-wide text-muted">Importo</th>
                <th class="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-muted">Stato</th>
              </tr>
            </thead>
            <tbody>
              @for (item of filteredItems(); track item.source_id) {
                <tr
                  class="border-b border-soft transition last:border-0"
                  [class.bg-amber-50]="isSelected(item)"
                >
                  @if (deliveryFilter() === deliveryStatus.Pending) {
                    <td class="px-4 py-3">
                      <input
                        type="checkbox"
                        class="h-4 w-4 cursor-pointer rounded border-soft accent-amber-600"
                        [checked]="isSelected(item)"
                        (change)="toggleSelect(item)"
                      />
                    </td>
                  }
                  <td class="px-4 py-3 text-muted">{{ formatDate(item.date) }}</td>
                  <td class="px-4 py-3 font-semibold">{{ item.description }}</td>
                  <td class="px-4 py-3 text-muted">{{ item.category }}</td>
                  <td class="px-4 py-3">
                    <ng-container *ngTemplateOutlet="sourceBadge; context: { $implicit: item }" />
                  </td>
                  <td class="px-4 py-3 text-right font-black text-positive">+{{ eur(item.amount) }}</td>
                  <td class="px-4 py-3">
                    <ng-container *ngTemplateOutlet="deliveryBadge; context: { $implicit: item }" />
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <!-- Mobile: card list -->
        <div class="flex flex-col gap-3 sm:hidden">
          @for (item of filteredItems(); track item.source_id) {
            <div
              class="rounded-xl border border-soft bg-surface p-4 transition"
              [class.border-amber-300]="isSelected(item)"
              [class.bg-amber-50]="isSelected(item)"
            >
              <div class="flex items-start gap-3">
                @if (deliveryFilter() === deliveryStatus.Pending) {
                  <input
                    type="checkbox"
                    class="mt-1 h-5 w-5 flex-shrink-0 cursor-pointer rounded border-soft accent-amber-600"
                    [checked]="isSelected(item)"
                    (change)="toggleSelect(item)"
                  />
                }
                <div class="min-w-0 flex-1">
                  <div class="flex items-center justify-between gap-2">
                    <p class="truncate font-semibold">{{ item.description }}</p>
                    <span class="flex-shrink-0 text-lg font-black text-positive">+{{ eur(item.amount) }}</span>
                  </div>
                  <div class="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-muted">
                    <span>{{ formatDate(item.date) }}</span>
                    <span>·</span>
                    <span>{{ item.category }}</span>
                    <span>·</span>
                    <ng-container *ngTemplateOutlet="sourceBadge; context: { $implicit: item }" />
                  </div>
                  <div class="mt-2">
                    <ng-container *ngTemplateOutlet="deliveryBadge; context: { $implicit: item }" />
                  </div>
                </div>
              </div>
            </div>
          }
        </div>
      }
    </section>

    <!-- Template badge fonte -->
    <ng-template #sourceBadge let-item>
      @if (item.source_table === transactionSourceTable.TournamentTeams) {
        <span class="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-blue-700">Iscrizione</span>
      } @else if (item.source_table === transactionSourceTable.Sponsors) {
        <span class="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-purple-700">Sponsor</span>
      } @else {
        <span class="rounded-full bg-surface-muted px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-muted">Manuale</span>
      }
    </ng-template>

    <!-- Template badge stato consegna -->
    <ng-template #deliveryBadge let-item>
      @if (item.delivered_to_treasurer) {
        <span class="inline-flex items-center gap-1 rounded-full border border-green-200 bg-green-50 px-2 py-0.5 text-xs font-semibold text-green-700">
          ✓ {{ formatDate(item.delivered_at!) }}
        </span>
      } @else {
        <span class="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">
          Da consegnare
        </span>
      }
    </ng-template>

    <!-- Modale conferma consegna -->
    <lfg-confirm
      [open]="confirmDeliveryOpen()"
      [message]="'Consegnare ' + selectedItems().length + ' entrate al tesoriere per un totale di ' + eur(selectedTotal()) + '? Questa azione non è reversibile.'"
      confirmLabel="Consegna"
      (confirm)="onConfirmDelivery()"
      (cancel)="confirmDeliveryOpen.set(false)"
    />
  `,
})
export class TesoreriaComponent implements OnInit {
  allItems = signal<Transaction[]>([]);
  deliveryFilter = signal<DeliveryStatusFilter>(DELIVERY_STATUS.Pending);
  categoryFilter = signal<string>(FILTER_ALL);
  selectedItems = signal<DeliveryItem[]>([]);
  delivering = signal(false);
  error = signal("");
  confirmDeliveryOpen = signal(false);
  private readonly snackbar = inject(SnackbarService);

  readonly pendingItems = computed(() =>
    this.allItems().filter((i) => i.type === TRANSACTION_TYPE.Income && !i.delivered_to_treasurer),
  );
  readonly deliveredItems = computed(() =>
    this.allItems().filter((i) => i.type === TRANSACTION_TYPE.Income && i.delivered_to_treasurer),
  );
  readonly pendingTotal = computed(() =>
    this.pendingItems().reduce((s, i) => s + Number(i.amount || 0), 0),
  );
  readonly deliveredTotal = computed(() =>
    this.deliveredItems().reduce((s, i) => s + Number(i.amount || 0), 0),
  );
  readonly deliveredThisMonth = computed(() => {
    const now = new Date();
    return this.deliveredItems()
      .filter((i) => {
        if (!i.delivered_at) return false;
        const d = new Date(i.delivered_at);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      })
      .reduce((s, i) => s + Number(i.amount || 0), 0);
  });

  readonly filteredItems = computed(() => {
    let items = this.allItems().filter((i) => i.type === TRANSACTION_TYPE.Income);
    if (this.deliveryFilter() === DELIVERY_STATUS.Pending) {
      items = items.filter((i) => !i.delivered_to_treasurer);
    } else if (this.deliveryFilter() === DELIVERY_STATUS.Delivered) {
      items = items.filter((i) => i.delivered_to_treasurer);
    }
    if (this.categoryFilter() !== FILTER_ALL) {
      items = items.filter((i) => i.category === this.categoryFilter());
    }
    return items;
  });

  readonly selectedTotal = computed(() =>
    this.filteredItems()
      .filter((i) => this.isSelected(i))
      .reduce((s, i) => s + Number(i.amount || 0), 0),
  );

  get deliveryFilterOptions(): () => FilterOption[] {
    return () => [
      { label: "Da consegnare", value: DELIVERY_STATUS.Pending, active: this.deliveryFilter() === DELIVERY_STATUS.Pending },
      { label: "Consegnati", value: DELIVERY_STATUS.Delivered, active: this.deliveryFilter() === DELIVERY_STATUS.Delivered },
      { label: "Tutti", value: FILTER_ALL, active: this.deliveryFilter() === FILTER_ALL },
    ];
  }

  get categoryFilterOptions(): () => FilterOption[] {
    return () => [
      { label: "Tutte le categorie", value: FILTER_ALL, active: this.categoryFilter() === FILTER_ALL },
      ...INCOME_CATEGORIES.map((c) => ({
        label: c,
        value: c,
        active: this.categoryFilter() === c,
      })),
    ];
  }

  constructor(
    readonly auth: AuthService,
    private readonly txService: TransactionsService,
  ) {}

  ngOnInit(): void {
    void this.load();
  }

  async load(): Promise<void> {
    try {
      const items = await this.txService.list();
      this.allItems.set(items);
      this.selectedItems.set([]);
    } catch (e) {
      this.setError(this.message(e));
    }
  }

  setDeliveryFilter(value: string): void {
    this.deliveryFilter.set(value as DeliveryStatusFilter);
    this.selectedItems.set([]);
  }

  setCategoryFilter(value: string): void {
    this.categoryFilter.set(value);
  }

  isSelected(item: Transaction): boolean {
    return this.selectedItems().some(
      (s) => s.source_table === item.source_table && s.source_id === item.source_id,
    );
  }

  toggleSelect(item: Transaction): void {
    const current = this.selectedItems();
    if (this.isSelected(item)) {
      this.selectedItems.set(
        current.filter(
          (s) => !(s.source_table === item.source_table && s.source_id === item.source_id),
        ),
      );
    } else {
      this.selectedItems.set([
        ...current,
        { source_table: item.source_table, source_id: item.source_id },
      ]);
    }
  }

  selectAll(): void {
    this.selectedItems.set(
      this.filteredItems().map((i) => ({
        source_table: i.source_table,
        source_id: i.source_id,
      })),
    );
  }

  deselectAll(): void {
    this.selectedItems.set([]);
  }

  async onConfirmDelivery(): Promise<void> {
    this.confirmDeliveryOpen.set(false);
    const items = this.selectedItems();
    if (!items.length || this.delivering()) return;
    const userId = this.auth.profile()?.id;
    if (!userId) return;

    this.delivering.set(true);
    this.error.set("");
    try {
      await this.txService.markDelivered(items, userId);
      this.snackbar.success(`${items.length} entrate consegnate al tesoriere.`);
      await this.load();
    } catch (e) {
      this.setError(this.message(e));
    } finally {
      this.delivering.set(false);
    }
  }

  eur(value: number): string {
    return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(value);
  }

  formatDate(value: string): string {
    return new Intl.DateTimeFormat("it-IT").format(new Date(value));
  }

  private message(error: unknown): string {
    return error instanceof Error ? error.message : "Operazione non riuscita.";
  }

  private setError(message: string): void {
    this.error.set(message);
    this.snackbar.error(message);
  }

  protected readonly deliveryStatus = DELIVERY_STATUS;
  protected readonly transactionSourceTable = TRANSACTION_SOURCE_TABLE;
}

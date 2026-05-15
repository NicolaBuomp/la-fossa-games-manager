import { Component, OnInit, inject, signal } from "@angular/core";
import { RouterLink } from "@angular/router";
import { AuditLogService } from "../../core/services/audit-log.service";
import { ExpensesService } from "../../core/services/expenses.service";
import { IncomesService } from "../../core/services/incomes.service";
import { RegistrationsService } from "../../core/services/registrations.service";
import { RequestBadgesService } from "../../core/services/request-badges.service";
import { SnackbarService } from "../../core/services/snackbar.service";
import { SponsorsService } from "../../core/services/sponsors.service";
import {
  AuditLog,
  Expense,
  Income,
  Registration,
  Sponsor,
} from "../../core/types/models";
import { AuditActivityListComponent } from "../audit/components/audit-activity-list.component";
import { buildAuditActivities } from "../audit/components/audit-activity-builder";
import { AuditActivityItem } from "../audit/components/audit-activity.model";
import { AuditDetailModalComponent } from "../audit/components/audit-detail-modal.component";
import {
  KpiPanelComponent,
  SummaryCardComponent,
} from "../../shared/components/ui.component";

@Component({
  standalone: true,
  imports: [
    RouterLink,
    AuditActivityListComponent,
    AuditDetailModalComponent,
    KpiPanelComponent,
    SummaryCardComponent,
  ],
  template: `
    <section class="space-y-5">
      <div class="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p class="text-xs font-bold uppercase tracking-[0.18em] text-muted">
            Dashboard interna
          </p>
          <h1 class="font-display text-3xl uppercase sm:text-5xl">
            Riepilogo evento
          </h1>
        </div>
        <button
          [disabled]="loading()"
          class="rounded-lg bg-surface px-4 py-2 text-sm font-bold uppercase tracking-wide shadow-sm ring-1 ring-black/15 transition hover:bg-surface-muted disabled:opacity-60"
          (click)="load()"
        >
          {{ loading() ? "Aggiornamento…" : "Aggiorna" }}
        </button>
      </div>

      @if (hasPendingRequests()) {
        <section
          class="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-950 shadow-sm"
        >
          <div
            class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"
          >
            <div>
              <p
                class="text-xs font-black uppercase tracking-[0.18em] text-amber-700"
              >
                Richieste da gestire
              </p>
              <h2 class="mt-1 text-xl font-black leading-tight">
                Ci sono richieste arrivate dal sito non ancora gestite.
              </h2>
              <p class="mt-2 text-sm font-semibold leading-6 text-amber-900/75">
                Controlla le nuove richieste torneo e i lead sponsor prima di
                aggiornare il resto del gestionale.
              </p>
            </div>
            <div class="grid gap-2 sm:grid-cols-2 lg:min-w-[22rem]">
              @if (pendingTournamentRequests() > 0) {
                <a
                  routerLink="/app/participation-requests"
                  class="flex items-center justify-between gap-3 rounded-lg bg-surface px-4 py-3 text-sm font-black uppercase tracking-wide text-primary ring-1 ring-amber-200 transition hover:bg-ink hover:text-white"
                >
                  <span>Richieste torneo</span>
                  <span
                    class="grid min-h-7 min-w-7 place-items-center rounded-full bg-fossa px-2 text-xs text-ink"
                  >
                    {{ pendingTournamentRequests() }}
                  </span>
                </a>
              }
              @if (pendingSponsorRequests() > 0) {
                <a
                  routerLink="/app/sponsors"
                  class="flex items-center justify-between gap-3 rounded-lg bg-surface px-4 py-3 text-sm font-black uppercase tracking-wide text-primary ring-1 ring-amber-200 transition hover:bg-ink hover:text-white"
                >
                  <span>Richieste sponsor</span>
                  <span
                    class="grid min-h-7 min-w-7 place-items-center rounded-full bg-fossa px-2 text-xs text-ink"
                  >
                    {{ pendingSponsorRequests() }}
                  </span>
                </a>
              }
            </div>
          </div>
        </section>
      }

      <section class="rounded-lg bg-ink p-6 text-white">
        <p class="text-xs font-bold uppercase tracking-[0.2em] text-white/50">
          Saldo attuale
        </p>
        <p
          class="mt-3 text-4xl font-black"
          [class.text-emerald-300]="balance() >= 0"
          [class.text-red-300]="balance() < 0"
        >
          {{ eur(balance()) }}
        </p>
        <div
          class="mt-6 grid gap-3 border-t border-white/10 pt-5 sm:grid-cols-3"
        >
          <div>
            <p class="text-xs font-bold uppercase tracking-wide text-white/50">
              Entrate
            </p>
            <p class="mt-1 text-xl font-bold">{{ eur(totalIncome()) }}</p>
          </div>
          <div>
            <p class="text-xs font-bold uppercase tracking-wide text-white/50">
              Spese
            </p>
            <p class="mt-1 text-xl font-bold">{{ eur(totalExpenses()) }}</p>
          </div>
          <div>
            <p class="text-xs font-bold uppercase tracking-wide text-white/50">
              Saldo potenziale
            </p>
            <p class="mt-1 text-xl font-bold text-fossa">
              {{ eur(probableBalance()) }}
            </p>
            <p class="mt-0.5 text-[10px] text-white/40">
              incl. sponsor e quote non ancora pagati
            </p>
          </div>
        </div>
      </section>

      <lfg-kpi-panel title="KPI evento" storageKey="dashboard">
        <section class="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <lfg-summary-card
            label="Sponsor pagati"
            [value]="eur(sponsorPaid())"
            [hint]="sponsorPaidCount() + ' sponsor'"
            tone="income"
          />
          <lfg-summary-card
            label="Sponsor confermati"
            [value]="eur(sponsorConfirmed())"
            hint="Confermati, non ancora pagati"
            tone="warning"
          />
          <lfg-summary-card
            label="Iscrizioni pagate"
            [value]="eur(regPaidAmount())"
            [hint]="regPaidCount() + ' pagate'"
            tone="income"
          />
          <lfg-summary-card
            label="Da incassare"
            [value]="eur(regPendingAmount())"
            [hint]="regPendingCount() + ' aperte'"
            tone="warning"
          />
          <lfg-summary-card
            label="Tasso pagamento"
            [value]="regPaymentRate() + '%'"
            [hint]="regPaidCount() + '/' + regTotalCount() + ' iscrizioni'"
            [tone]="
              regPaymentRate() === 100
                ? 'income'
                : regTotalCount() === 0
                  ? 'default'
                  : 'warning'
            "
          />
        </section>
      </lfg-kpi-panel>

      @if (error()) {
        <p
          class="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          {{ error() }}
        </p>
      }

      <section class="rounded-lg border border-soft bg-surface p-4 shadow-sm">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p class="text-xs font-bold uppercase tracking-[0.18em] text-muted">
              Registro modifiche
            </p>
            <h2 class="font-display text-2xl uppercase">Ultime attività</h2>
          </div>
          <a
            routerLink="/app/audit"
            class="rounded-lg bg-surface-muted px-3 py-2 text-xs font-black uppercase tracking-wide transition hover:bg-fossa hover:text-ink"
          >
            Vedi tutto
          </a>
        </div>

        @if (!auditLogs().length) {
          <p class="mt-4 rounded-lg bg-surface-muted p-4 text-sm text-muted">
            Nessuna modifica registrata.
          </p>
        } @else {
          <lfg-audit-activity-list
            class="mt-4 block"
            [activities]="activityItems()"
            (select)="selectedActivity.set($event)"
          />
        }
      </section>
    </section>

    <lfg-audit-detail-modal
      [activity]="selectedActivity()"
      (close)="selectedActivity.set(null)"
    />
  `,
})
export class DashboardComponent implements OnInit {
  expenses = signal<Expense[]>([]);
  incomes = signal<Income[]>([]);
  sponsors = signal<Sponsor[]>([]);
  registrations = signal<Registration[]>([]);
  auditLogs = signal<AuditLog[]>([]);
  selectedActivity = signal<AuditActivityItem | null>(null);
  error = signal("");
  loading = signal(false);
  private readonly snackbar = inject(SnackbarService);

  constructor(
    private readonly expensesService: ExpensesService,
    private readonly incomesService: IncomesService,
    private readonly sponsorsService: SponsorsService,
    private readonly registrationsService: RegistrationsService,
    private readonly auditLogService: AuditLogService,
    private readonly badges: RequestBadgesService,
  ) {}

  ngOnInit(): void {
    void this.load();
  }

  async load(): Promise<void> {
    if (this.loading()) return;
    this.loading.set(true);
    this.error.set("");
    try {
      const [expenses, incomes, sponsors, registrations, auditLogs] =
        await Promise.all([
          this.expensesService.list(),
          this.incomesService.list(),
          this.sponsorsService.list(),
          this.registrationsService.list(),
          this.auditLogService.recent(),
        ]);
      this.expenses.set(expenses);
      this.incomes.set(incomes);
      this.sponsors.set(sponsors);
      this.registrations.set(registrations);
      this.auditLogs.set(auditLogs);
      await this.badges.refresh();
    } catch (error) {
      this.setError(
        error instanceof Error ? error.message : "Errore nel caricamento dati.",
      );
    } finally {
      this.loading.set(false);
    }
  }

  private setError(message: string): void {
    this.error.set(message);
    this.snackbar.error(message);
  }

  totalExpenses(): number {
    return this.expenses().reduce(
      (sum, item) => sum + Number(item.amount || 0),
      0,
    );
  }

  totalIncome(): number {
    return this.recordedIncome() + this.sponsorPaid() + this.regPaidAmount();
  }

  recordedIncome(): number {
    return this.incomes().reduce(
      (sum, item) => sum + Number(item.amount || 0),
      0,
    );
  }

  balance(): number {
    return this.totalIncome() - this.totalExpenses();
  }

  sponsorConfirmed(): number {
    return this.sponsors()
      .filter((item) => item.status === "confermato")
      .reduce((sum, item) => sum + Number(item.promised_amount ?? item.value ?? 0), 0);
  }

  sponsorNegotiating(): number {
    return this.sponsors()
      .filter((item) => item.status === "in_trattativa")
      .reduce((sum, item) => sum + Number(item.promised_amount ?? item.value ?? 0), 0);
  }

  probableBalance(): number {
    return (
      this.balance() +
      this.sponsorConfirmed() +
      this.sponsorNegotiating() +
      this.regPendingAmount()
    );
  }

  sponsorPaid(): number {
    return this.sponsors().reduce(
      (sum, item) => sum + Number(item.received_amount || 0),
      0,
    );
  }

  sponsorPaidCount(): number {
    return this.sponsors().filter((item) => item.status === "pagato").length;
  }

  regPaidCount(): number {
    return this.registrations().filter((item) => item.paid).length;
  }

  regPendingCount(): number {
    return this.registrations().filter((item) => !item.paid).length;
  }

  regPaidAmount(): number {
    return this.registrations()
      .filter((item) => item.paid)
      .reduce((sum, item) => sum + Number(item.fee || 0), 0);
  }

  regPendingAmount(): number {
    return this.registrations()
      .filter((item) => !item.paid)
      .reduce((sum, item) => sum + Number(item.fee || 0), 0);
  }

  regTotalCount(): number {
    return this.regPaidCount() + this.regPendingCount();
  }

  regPaymentRate(): number {
    const total = this.regTotalCount();
    return total === 0 ? 0 : Math.round((this.regPaidCount() / total) * 100);
  }

  pendingTournamentRequests(): number {
    return this.badges.tournamentRequests();
  }

  pendingSponsorRequests(): number {
    return this.badges.sponsorRequests();
  }

  hasPendingRequests(): boolean {
    return this.pendingTournamentRequests() + this.pendingSponsorRequests() > 0;
  }

  activityItems(): AuditActivityItem[] {
    return buildAuditActivities(this.auditLogs(), this.registrations());
  }

  eur(value: number): string {
    return new Intl.NumberFormat("it-IT", {
      style: "currency",
      currency: "EUR",
    }).format(value);
  }
}

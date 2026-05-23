import { Component, OnInit, inject, signal } from "@angular/core";
import { RouterLink } from "@angular/router";
import { AuditLogService } from "../../core/services/audit-log.service";
import { AuthService } from "../../core/services/auth.service";
import { ExpensesService } from "../../core/services/expenses.service";
import { RegistrationsService } from "../../core/services/registrations.service";
import { RequestBadgesService } from "../../core/services/request-badges.service";
import { SnackbarService } from "../../core/services/snackbar.service";
import { SponsorsService } from "../../core/services/sponsors.service";
import { SupabaseService } from "../../core/services/supabase.service";
import {
  AUDIT_ACTION,
  DEFAULT_TOURNAMENT_CODES,
  EXPENSE_STATUS,
  SPONSOR_STATUS,
  SUPABASE_RPC,
} from "../../core/types/constants";
import {
  AuditLog,
  Expense,
  Registration,
  Sponsor,
} from "../../core/types/models";
import {
  KpiPanelComponent,
  SummaryCardComponent,
} from "../../shared/components/ui.component";
import { buildAuditActivities } from "../audit/components/audit-activity-builder";
import { AuditActivityListComponent } from "../audit/components/audit-activity-list.component";
import { AuditActivityItem } from "../audit/components/audit-activity.model";
import { AuditDetailModalComponent } from "../audit/components/audit-detail-modal.component";

interface DashboardFinancials {
  total_expenses: number;
  total_incomes: number;
  sponsor_paid: number;
  sponsor_confirmed: number;
  sponsor_negotiating: number;
  sponsor_paid_count: number;
  reg_paid_amount: number;
  reg_pending_amount: number;
  reg_paid_count: number;
  reg_pending_count: number;
}

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
    @if (auth.isAdmin()) {
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

        @if (loading() && !financials()) {
          <!-- Skeleton primo caricamento -->
          <div class="h-40 animate-pulse rounded-lg bg-surface-muted"></div>
          <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            @for (i of [1,2,3,4,5]; track i) {
              <div class="h-24 animate-pulse rounded-lg bg-surface-muted"></div>
            }
          </div>
          <div class="h-48 animate-pulse rounded-lg bg-surface-muted"></div>
        }

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
                <p
                  class="mt-2 text-sm font-semibold leading-6 text-amber-900/75"
                >
                  Controlla le nuove richieste torneo e i lead sponsor prima di
                  aggiornare il resto del gestionale.
                </p>
              </div>
              <div class="grid gap-2 sm:grid-cols-2 lg:min-w-[22rem]">
                @if (pendingTournamentRequests() > 0) {
                  <a
                    routerLink="/app/participation-requests"
                    class="hover-bg-strong hover-text-on-strong flex items-center justify-between gap-3 rounded-lg bg-surface px-4 py-3 text-sm font-black uppercase tracking-wide text-primary ring-1 ring-amber-200 transition"
                  >
                    <span>Richieste torneo</span>
                    <span
                      class="bg-accent text-on-accent grid min-h-7 min-w-7 place-items-center rounded-full px-2 text-xs"
                    >
                      {{ pendingTournamentRequests() }}
                    </span>
                  </a>
                }
                @if (pendingSponsorRequests() > 0) {
                  <a
                    routerLink="/app/sponsors"
                    class="hover-bg-strong hover-text-on-strong flex items-center justify-between gap-3 rounded-lg bg-surface px-4 py-3 text-sm font-black uppercase tracking-wide text-primary ring-1 ring-amber-200 transition"
                  >
                    <span>Richieste sponsor</span>
                    <span
                      class="bg-accent text-on-accent grid min-h-7 min-w-7 place-items-center rounded-full px-2 text-xs"
                    >
                      {{ pendingSponsorRequests() }}
                    </span>
                  </a>
                }
              </div>
            </div>
          </section>
        }

        <section class="bg-strong text-on-strong relative overflow-hidden rounded-lg p-6">
          <!-- Decorazione accent top-left -->
          <div class="bg-accent absolute left-0 top-0 h-0.5 w-24 rounded-full opacity-90"></div>
          <!-- Dot pattern sfondo -->
          <div class="pointer-events-none absolute inset-0 opacity-[0.04]" style="background-image: radial-gradient(circle, #ffffff 1px, transparent 1px); background-size: 20px 20px;"></div>
          <p class="eyebrow relative text-white/50">
            Saldo attuale
          </p>
          <p
            class="relative mt-3 text-4xl font-black"
            [class.text-emerald-300]="balance() >= 0"
            [class.text-red-300]="balance() < 0"
          >
            {{ eur(balance()) }}
          </p>
          <div
            class="relative mt-6 grid gap-3 border-t border-white/10 pt-5 sm:grid-cols-3"
          >
            <div>
              <p
                class="text-xs font-bold uppercase tracking-wide text-white/50"
              >
                Entrate
              </p>
              <p class="mt-1 text-xl font-bold">{{ eur(totalIncome()) }}</p>
            </div>
            <div>
              <p
                class="text-xs font-bold uppercase tracking-wide text-white/50"
              >
                Spese
              </p>
              <p class="mt-1 text-xl font-bold">{{ eur(totalExpenses()) }}</p>
            </div>
            <div>
              <p
                class="text-xs font-bold uppercase tracking-wide text-white/50"
              >
                Saldo potenziale
              </p>
              <p class="text-accent mt-1 text-xl font-bold">
                {{ eur(probableBalance()) }}
              </p>
              <p class="mt-0.5 text-[10px] text-white/40">
                incl. sponsor e quote non ancora pagati
              </p>
            </div>
          </div>
        </section>

        <!-- Azioni rapide (solo mobile) -->
        <section class="grid grid-cols-2 gap-3 sm:hidden">
          <a
            routerLink="/app/registrations"
            class="hover-border-accent flex flex-col items-center justify-center gap-2 rounded-xl border border-soft bg-surface px-3 py-5 text-center shadow-sm transition"
          >
            <svg viewBox="0 0 24 24" class="h-6 w-6 text-muted" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/>
            </svg>
            <span class="text-xs font-bold uppercase tracking-wide">Iscrizioni</span>
          </a>
          <a
            routerLink="/app/sponsors"
            class="hover-border-accent flex flex-col items-center justify-center gap-2 rounded-xl border border-soft bg-surface px-3 py-5 text-center shadow-sm transition"
          >
            <svg viewBox="0 0 24 24" class="h-6 w-6 text-muted" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
            <span class="text-xs font-bold uppercase tracking-wide">Sponsor</span>
          </a>
          <a
            routerLink="/app/participation-requests"
            class="hover-border-accent relative flex flex-col items-center justify-center gap-2 rounded-xl border border-soft bg-surface px-3 py-5 text-center shadow-sm transition"
          >
            <svg viewBox="0 0 24 24" class="h-6 w-6 text-muted" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
            </svg>
            <span class="text-xs font-bold uppercase tracking-wide">Richieste</span>
            @if (hasPendingRequests()) {
              <span class="bg-accent text-on-accent absolute right-2 top-2 grid min-h-5 min-w-5 place-items-center rounded-full px-1 text-[10px] font-black leading-none">
                {{ pendingTournamentRequests() + pendingSponsorRequests() }}
              </span>
            }
          </a>
          <a
            routerLink="/app/transactions"
            class="hover-border-accent flex flex-col items-center justify-center gap-2 rounded-xl border border-soft bg-surface px-3 py-5 text-center shadow-sm transition"
          >
            <svg viewBox="0 0 24 24" class="h-6 w-6 text-muted" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <span class="text-xs font-bold uppercase tracking-wide">Transazioni</span>
          </a>
        </section>

        <lfg-kpi-panel title="KPI evento" storageKey="dashboard">
          <section class="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <a
              routerLink="/app/sponsors"
              class="block cursor-pointer rounded-lg transition hover:opacity-80 active:scale-[.98]"
            >
              <lfg-summary-card
                label="Sponsor pagati"
                [value]="eur(sponsorPaid())"
                [hint]="sponsorPaidCount() + ' sponsor'"
                tone="income"
              />
            </a>
            <a
              routerLink="/app/sponsors"
              class="block cursor-pointer rounded-lg transition hover:opacity-80 active:scale-[.98]"
            >
              <lfg-summary-card
                label="Sponsor confermati"
                [value]="eur(sponsorConfirmed())"
                hint="Confermati, non ancora pagati"
                tone="warning"
              />
            </a>
            <a
              routerLink="/app/registrations"
              class="block cursor-pointer rounded-lg transition hover:opacity-80 active:scale-[.98]"
            >
              <lfg-summary-card
                label="Iscrizioni pagate"
                [value]="eur(regPaidAmount())"
                [hint]="regPaidCount() + ' pagate'"
                tone="income"
              />
            </a>
            <a
              routerLink="/app/registrations"
              class="block cursor-pointer rounded-lg transition hover:opacity-80 active:scale-[.98]"
            >
              <lfg-summary-card
                label="Da incassare"
                [value]="eur(regPendingAmount())"
                [hint]="regPendingCount() + ' aperte'"
                tone="warning"
              />
            </a>
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
            class="form-error"
          >
            {{ error() }}
          </p>
        }

        <section class="rounded-lg border border-soft bg-surface p-4 shadow-sm">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p
                class="text-xs font-bold uppercase tracking-[0.18em] text-muted"
              >
                Registro modifiche
              </p>
              <h2 class="font-display text-2xl uppercase">Ultime attività</h2>
            </div>
            <a
              routerLink="/app/audit"
              class="hover-accent rounded-lg bg-surface-muted px-3 py-2 text-xs font-black uppercase tracking-wide transition"
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
    } @else {
      <section class="space-y-5">
        <div class="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p class="text-xs font-bold uppercase tracking-[0.18em] text-muted">
              Home staff
            </p>
            <h1 class="font-display text-3xl uppercase sm:text-5xl">
              Ciao {{ staffName() }}
            </h1>
            <p
              class="mt-2 max-w-2xl text-sm font-semibold leading-6 text-muted"
            >
              Qui trovi un resoconto rapido delle attività che hai registrato o
              aggiornato nel gestionale.
            </p>
          </div>
          <button
            [disabled]="loading()"
            class="rounded-lg bg-surface px-4 py-2 text-sm font-bold uppercase tracking-wide shadow-sm ring-1 ring-black/15 transition hover:bg-surface-muted disabled:opacity-60"
            (click)="load()"
          >
            {{ loading() ? "Aggiornamento…" : "Aggiorna" }}
          </button>
        </div>

        @if (loading() && !auditLogs().length) {
          <!-- Skeleton primo caricamento staff -->
          <div class="h-32 animate-pulse rounded-lg bg-surface-muted"></div>
          <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            @for (i of [1,2,3,4]; track i) {
              <div class="h-24 animate-pulse rounded-lg bg-surface-muted"></div>
            }
          </div>
        }

        @if (error()) {
          <p
            class="form-error"
          >
            {{ error() }}
          </p>
        }

        <section class="bg-strong text-on-strong relative overflow-hidden rounded-lg p-5">
          <div class="bg-accent absolute left-0 top-0 h-0.5 w-16 rounded-full opacity-90"></div>
          <div class="pointer-events-none absolute inset-0 opacity-[0.04]" style="background-image: radial-gradient(circle, #ffffff 1px, transparent 1px); background-size: 20px 20px;"></div>
          <p class="eyebrow relative text-white/50">
            Operatività personale
          </p>
          <p class="relative mt-3 text-3xl font-black">
            {{ totalStaffActions() }} attività tracciate
          </p>
          <div
            class="relative mt-5 grid gap-3 border-t border-white/10 pt-5 sm:grid-cols-3"
          >
            <div>
              <p
                class="text-xs font-bold uppercase tracking-wide text-white/50"
              >
                Inserimenti
              </p>
              <p class="mt-1 text-xl font-bold">{{ staffInsertCount() }}</p>
            </div>
            <div>
              <p
                class="text-xs font-bold uppercase tracking-wide text-white/50"
              >
                Aggiornamenti
              </p>
              <p class="mt-1 text-xl font-bold">{{ staffUpdateCount() }}</p>
            </div>
            <div>
              <p
                class="text-xs font-bold uppercase tracking-wide text-white/50"
              >
                Ultima attività
              </p>
              <p class="mt-1 text-xl font-bold">
                {{ lastStaffActivityLabel() }}
              </p>
            </div>
          </div>
        </section>

        <lfg-kpi-panel title="Il tuo lavoro" storageKey="staff-dashboard">
          <section class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <lfg-summary-card
              label="Iscrizioni seguite"
              [value]="ownRegistrations().length.toString()"
              [hint]="ownUnpaidRegistrations() + ' con pagamento aperto'"
              tone="default"
            />
            <lfg-summary-card
              label="Sponsor seguiti"
              [value]="ownSponsors().length.toString()"
              [hint]="ownConfirmedSponsors() + ' confermati o pagati'"
              tone="income"
            />
            <lfg-summary-card
              label="Spese inserite"
              [value]="ownExpenses().length.toString()"
              [hint]="ownExpensesToRefund() + ' da rimborsare'"
              tone="warning"
            />
            <lfg-summary-card
              label="Modifiche recenti"
              [value]="auditLogs().length.toString()"
              hint="dal registro attività"
              tone="default"
            />
          </section>
        </lfg-kpi-panel>

        <section class="grid gap-3 md:grid-cols-3">
          <a
            routerLink="/app/registrations"
            class="hover-border-accent rounded-lg border border-soft bg-surface p-4 shadow-sm transition"
          >
            <p class="text-xs font-bold uppercase tracking-[0.18em] text-muted">
              Iscritti
            </p>
            <p class="mt-2 text-lg font-black">Aggiorna squadre e pagamenti</p>
          </a>
          <a
            routerLink="/app/participation-requests"
            class="hover-border-accent rounded-lg border border-soft bg-surface p-4 shadow-sm transition"
          >
            <p class="text-xs font-bold uppercase tracking-[0.18em] text-muted">
              Richieste
            </p>
            <p class="mt-2 text-lg font-black">
              Gestisci le richieste dal sito
            </p>
          </a>
          <a
            routerLink="/app/sponsors"
            class="hover-border-accent rounded-lg border border-soft bg-surface p-4 shadow-sm transition"
          >
            <p class="text-xs font-bold uppercase tracking-[0.18em] text-muted">
              Sponsor
            </p>
            <p class="mt-2 text-lg font-black">
              Segui contatti e stato sponsor
            </p>
          </a>
        </section>

        <section class="rounded-lg border border-soft bg-surface p-4 shadow-sm">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p
                class="text-xs font-bold uppercase tracking-[0.18em] text-muted"
              >
                Il tuo registro
              </p>
              <h2 class="font-display text-2xl uppercase">Ultime attività</h2>
            </div>
          </div>

          @if (!auditLogs().length) {
            <p class="mt-4 rounded-lg bg-surface-muted p-4 text-sm text-muted">
              Non risultano ancora modifiche tracciate a tuo nome.
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
    }

    <lfg-audit-detail-modal
      [activity]="selectedActivity()"
      (close)="selectedActivity.set(null)"
    />
  `,
})
export class DashboardComponent implements OnInit {
  financials = signal<DashboardFinancials | null>(null);
  expenses = signal<Expense[]>([]);
  sponsors = signal<Sponsor[]>([]);
  registrations = signal<Registration[]>([]);
  auditLogs = signal<AuditLog[]>([]);
  selectedActivity = signal<AuditActivityItem | null>(null);
  error = signal("");
  loading = signal(false);
  private readonly snackbar = inject(SnackbarService);

  constructor(
    readonly auth: AuthService,
    private readonly expensesService: ExpensesService,
    private readonly sponsorsService: SponsorsService,
    private readonly registrationsService: RegistrationsService,
    private readonly auditLogService: AuditLogService,
    private readonly badges: RequestBadgesService,
    private readonly supabase: SupabaseService,
  ) {}

  ngOnInit(): void {
    void this.load();
  }

  async load(): Promise<void> {
    if (this.loading()) return;
    this.loading.set(true);
    this.error.set("");
    try {
      if (!this.auth.isAdmin()) {
        await this.loadStaffHome();
        return;
      }

      const [financialsResult, registrations, auditLogs] = await Promise.all([
        this.supabase.client.rpc(SUPABASE_RPC.GetDashboardFinancials, {
          tournament_codes: DEFAULT_TOURNAMENT_CODES,
        }),
        this.registrationsService.list(),
        this.auditLogService.recent(),
      ]);
      this.financials.set(
        (financialsResult.data as DashboardFinancials[] | null)?.[0] ?? null,
      );
      this.registrations.set(registrations);
      this.auditLogs.set(auditLogs);
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

  private async loadStaffHome(): Promise<void> {
    this.financials.set(null);
    this.badges.clear();
    const [expenses, sponsors, registrations] = await Promise.all([
      this.expensesService.list(),
      this.sponsorsService.list(),
      this.registrationsService.list(),
    ]);
    this.expenses.set(expenses);
    this.sponsors.set(sponsors);
    this.registrations.set(registrations);

    const currentUserId = this.currentUserId();
    if (!currentUserId) {
      this.auditLogs.set([]);
      return;
    }

    try {
      const page = await this.auditLogService.page({
        page: 1,
        pageSize: 30,
        changedBy: currentUserId,
      });
      this.auditLogs.set(page.rows);
    } catch {
      this.auditLogs.set([]);
    }
  }

  totalExpenses(): number {
    return Number(this.financials()?.total_expenses ?? 0);
  }

  totalIncome(): number {
    return (
      Number(this.financials()?.total_incomes ?? 0) +
      this.sponsorPaid() +
      this.regPaidAmount()
    );
  }

  recordedIncome(): number {
    return Number(this.financials()?.total_incomes ?? 0);
  }

  balance(): number {
    return this.totalIncome() - this.totalExpenses();
  }

  sponsorConfirmed(): number {
    return Number(this.financials()?.sponsor_confirmed ?? 0);
  }

  sponsorNegotiating(): number {
    return Number(this.financials()?.sponsor_negotiating ?? 0);
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
    return Number(this.financials()?.sponsor_paid ?? 0);
  }

  sponsorPaidCount(): number {
    return Number(this.financials()?.sponsor_paid_count ?? 0);
  }

  regPaidCount(): number {
    return Number(this.financials()?.reg_paid_count ?? 0);
  }

  regPendingCount(): number {
    return Number(this.financials()?.reg_pending_count ?? 0);
  }

  regPaidAmount(): number {
    return Number(this.financials()?.reg_paid_amount ?? 0);
  }

  regPendingAmount(): number {
    return Number(this.financials()?.reg_pending_amount ?? 0);
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

  staffName(): string {
    return (
      this.auth.profile()?.full_name ||
      this.auth.profile()?.username ||
      this.auth.user()?.email ||
      "staff"
    );
  }

  ownRegistrations(): Registration[] {
    const userId = this.currentUserId();
    if (!userId) return [];
    return this.registrations().filter((item) => this.touchedBy(item, userId));
  }

  ownUnpaidRegistrations(): number {
    return this.ownRegistrations().filter((item) => !item.paid).length;
  }

  ownSponsors(): Sponsor[] {
    const userId = this.currentUserId();
    if (!userId) return [];
    return this.sponsors().filter(
      (item) =>
        item.responsible_user_id === userId || item.created_by === userId,
    );
  }

  ownConfirmedSponsors(): number {
    return this.ownSponsors().filter(
      (item) =>
        item.status === SPONSOR_STATUS.Confirmed ||
        item.status === SPONSOR_STATUS.Paid,
    ).length;
  }

  ownExpenses(): Expense[] {
    const userId = this.currentUserId();
    if (!userId) return [];
    return this.expenses().filter((item) => this.touchedBy(item, userId));
  }

  ownExpensesToRefund(): number {
    return this.ownExpenses().filter(
      (item) => item.status === EXPENSE_STATUS.ToRefund,
    ).length;
  }

  staffInsertCount(): number {
    return this.auditLogs().filter(
      (item) => item.action === AUDIT_ACTION.Insert,
    ).length;
  }

  staffUpdateCount(): number {
    return this.auditLogs().filter(
      (item) => item.action === AUDIT_ACTION.Update,
    ).length;
  }

  totalStaffActions(): number {
    return this.auditLogs().length;
  }

  lastStaffActivityLabel(): string {
    const lastActivity = this.auditLogs()[0];
    if (!lastActivity) return "Nessuna";
    return new Intl.DateTimeFormat("it-IT", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(lastActivity.changed_at));
  }

  private currentUserId(): string | null {
    return this.auth.profile()?.id ?? this.auth.user()?.id ?? null;
  }

  private touchedBy(
    item: Pick<Registration | Sponsor | Expense, "created_by" | "updated_by">,
    userId: string,
  ): boolean {
    return item.created_by === userId || item.updated_by === userId;
  }

  eur(value: number): string {
    return new Intl.NumberFormat("it-IT", {
      style: "currency",
      currency: "EUR",
    }).format(value);
  }
}

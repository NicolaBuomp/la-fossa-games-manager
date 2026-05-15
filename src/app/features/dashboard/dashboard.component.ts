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
import {
  KpiPanelComponent,
  SummaryCardComponent,
} from "../../shared/components/ui.component";

@Component({
  standalone: true,
  imports: [RouterLink, KpiPanelComponent, SummaryCardComponent],
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
          <div class="mt-4 divide-y divide-black/5">
            @for (activity of activityItems(); track activity.id) {
              <div
                class="grid gap-2 py-3 sm:grid-cols-[1fr_auto] sm:items-center"
              >
                <div class="min-w-0">
                  <p class="text-sm font-bold">
                    {{ activity.title }}
                  </p>
                  <p class="mt-1 text-xs text-muted">
                    {{ activity.meta }}
                  </p>
                </div>
                <span [class]="activity.badgeClass">{{ activity.badge }}</span>
              </div>
            }
          </div>
        }
      </section>
    </section>
  `,
})
export class DashboardComponent implements OnInit {
  expenses = signal<Expense[]>([]);
  incomes = signal<Income[]>([]);
  sponsors = signal<Sponsor[]>([]);
  registrations = signal<Registration[]>([]);
  auditLogs = signal<AuditLog[]>([]);
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

  activityItems(): Array<{
    id: string;
    title: string;
    meta: string;
    badge: string;
    badgeClass: string;
  }> {
    const logs = this.auditLogs();
    const consumed = new Set<string>();
    const items: Array<{
      id: string;
      title: string;
      meta: string;
      badge: string;
      badgeClass: string;
    }> = [];

    for (const log of logs) {
      if (consumed.has(log.id)) continue;

      if (log.action === "insert" && log.table_name === "tournament_teams") {
        consumed.add(log.id);
        const relatedParticipants = logs.filter(
          (candidate) =>
            !consumed.has(candidate.id) &&
            candidate.action === "insert" &&
            candidate.table_name === "team_participants" &&
            candidate.new_data?.["team_id"] === log.record_id &&
            candidate.changed_by === log.changed_by &&
            this.secondsBetween(candidate.changed_at, log.changed_at) <= 10,
        );
        relatedParticipants.forEach((participant) =>
          consumed.add(participant.id),
        );
        items.push(this.teamInsertActivity(log, relatedParticipants));
        continue;
      }

      const group = logs.filter(
        (candidate) =>
          !consumed.has(candidate.id) &&
          candidate.id !== log.id &&
          candidate.action === log.action &&
          candidate.table_name === log.table_name &&
          candidate.changed_by === log.changed_by &&
          this.secondsBetween(candidate.changed_at, log.changed_at) <= 60,
      );

      if (group.length) {
        consumed.add(log.id);
        group.forEach((item) => consumed.add(item.id));
        items.push(this.groupedActivity([log, ...group]));
        continue;
      }

      consumed.add(log.id);
      items.push(this.singleActivity(log));
    }

    return items;
  }

  eur(value: number): string {
    return new Intl.NumberFormat("it-IT", {
      style: "currency",
      currency: "EUR",
    }).format(value);
  }

  formatDateTime(value: string): string {
    return new Intl.DateTimeFormat("it-IT", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(value));
  }

  actionLabel(action: AuditLog["action"]): string {
    if (action === "insert") return "Aggiunto";
    if (action === "update") return "Modificato";
    return "Eliminato";
  }

  auditBadgeClass(action: AuditLog["action"]): string {
    const base =
      "w-fit rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase";
    if (action === "insert") return `${base} state-success`;
    if (action === "update") return `${base} state-info`;
    return `${base} state-danger`;
  }

  private singleActivity(log: AuditLog): {
    id: string;
    title: string;
    meta: string;
    badge: string;
    badgeClass: string;
  } {
    return {
      id: log.id,
      title: `${this.actorLabel(log)} ha ${this.actionPhrase(log.action)} ${this.tableLabel(log.table_name)} "${this.recordLabel(log)}"`,
      meta: this.formatDateTime(log.changed_at),
      badge: this.actionLabel(log.action),
      badgeClass: this.auditBadgeClass(log.action),
    };
  }

  private groupedActivity(logs: AuditLog[]): {
    id: string;
    title: string;
    meta: string;
    badge: string;
    badgeClass: string;
  } {
    const [first] = logs;
    return {
      id: logs.map((log) => log.id).join("-"),
      title: `${this.actorLabel(first)} ha ${this.actionPhrase(first.action)} ${logs.length} ${this.tablePluralLabel(first.table_name)}`,
      meta: this.formatDateTime(first.changed_at),
      badge: this.actionLabel(first.action),
      badgeClass: this.auditBadgeClass(first.action),
    };
  }

  private teamInsertActivity(
    log: AuditLog,
    participants: AuditLog[],
  ): {
    id: string;
    title: string;
    meta: string;
    badge: string;
    badgeClass: string;
  } {
    const data = log.new_data ?? {};
    const teamName = this.textValue(data["name"], "squadra");
    const tournamentName =
      this.registrations().find((registration) => registration.id === log.record_id)
        ?.tournament ?? "torneo";
    const participant = participants[0]?.new_data ?? {};
    const captain =
      this.textValue(data["captain_name"], "") ||
      [participant["first_name"], participant["last_name"]]
        .filter(
          (value): value is string =>
            typeof value === "string" && !!value.trim(),
        )
        .join(" ");
    const captainText = captain ? ` e capitano ${captain}` : "";

    return {
      id: [log.id, ...participants.map((item) => item.id)].join("-"),
      title: `${this.actorLabel(log)} ha inserito la squadra "${teamName}" in ${tournamentName}${captainText}`,
      meta: this.formatDateTime(log.changed_at),
      badge: this.actionLabel(log.action),
      badgeClass: this.auditBadgeClass(log.action),
    };
  }

  private secondsBetween(a: string, b: string): number {
    return Math.abs(new Date(a).getTime() - new Date(b).getTime()) / 1000;
  }

  private actionPhrase(action: AuditLog["action"]): string {
    if (action === "insert") return "inserito";
    if (action === "update") return "modificato";
    return "eliminato";
  }

  tableLabel(tableName: string): string {
    return (
      {
        expenses: "spesa",
        incomes: "entrata",
        sponsors: "sponsor",
        registrations: "iscrizione",
        tournaments: "torneo",
        tournament_teams: "squadra",
        team_participants: "partecipante",
      }[tableName] ?? tableName
    );
  }

  tablePluralLabel(tableName: string): string {
    return (
      {
        expenses: "spese",
        incomes: "entrate",
        sponsors: "sponsor",
        registrations: "iscrizioni",
        tournaments: "tornei",
        tournament_teams: "squadre",
        team_participants: "partecipanti",
      }[tableName] ?? tableName
    );
  }

  actorLabel(log: AuditLog): string {
    return log.changed_by_name || "Utente non disponibile";
  }

  recordLabel(log: AuditLog): string {
    const data = log.new_data ?? log.old_data ?? {};
    const value =
      data["company_name"] ??
      data["description"] ??
      data["source"] ??
      data["name"] ??
      [data["first_name"], data["last_name"]].filter(Boolean).join(" ");
    return this.textValue(value, String(log.record_id).slice(0, 8));
  }

  private textValue(value: unknown, fallback: string): string {
    return typeof value === "string" && value.trim() ? value.trim() : fallback;
  }
}

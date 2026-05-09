import { Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SummaryCardComponent } from '../../shared/components/ui.component';
import { ExpensesService } from '../../core/services/expenses.service';
import { IncomesService } from '../../core/services/incomes.service';
import { SponsorsService } from '../../core/services/sponsors.service';
import { RegistrationsService } from '../../core/services/registrations.service';
import { AuditLogService } from '../../core/services/audit-log.service';
import { RequestBadgesService } from '../../core/services/request-badges.service';
import { AuditLog, Expense, Income, Registration, Sponsor } from '../../core/types/models';

@Component({
  standalone: true,
  imports: [RouterLink, SummaryCardComponent],
  template: `
    <div class="space-y-5">
      <div class="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p class="text-xs font-bold uppercase tracking-[0.18em] text-neutral-500">Dashboard interna</p>
          <h1 class="font-display text-3xl uppercase sm:text-5xl">Riepilogo evento</h1>
        </div>
        <button class="rounded-lg bg-white px-4 py-2 text-sm font-bold uppercase tracking-wide shadow-sm ring-1 ring-black/10" (click)="load()">Aggiorna</button>
      </div>

      @if (hasPendingRequests()) {
        <section class="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-950 shadow-sm">
          <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p class="text-xs font-black uppercase tracking-[0.18em] text-amber-700">Richieste da gestire</p>
              <h2 class="mt-1 text-xl font-black leading-tight">
                Ci sono richieste arrivate dal sito non ancora gestite.
              </h2>
              <p class="mt-2 text-sm font-semibold leading-6 text-amber-900/75">
                Controlla le nuove richieste torneo e i lead sponsor prima di aggiornare il resto del gestionale.
              </p>
            </div>
            <div class="grid gap-2 sm:grid-cols-2 lg:min-w-[22rem]">
              @if (pendingTournamentRequests() > 0) {
                <a
                  routerLink="/app/participation-requests"
                  class="flex items-center justify-between gap-3 rounded-lg bg-white px-4 py-3 text-sm font-black uppercase tracking-wide text-ink ring-1 ring-amber-200 transition hover:bg-ink hover:text-white"
                >
                  <span>Richieste torneo</span>
                  <span class="grid min-h-7 min-w-7 place-items-center rounded-full bg-fossa px-2 text-xs text-ink">
                    {{ pendingTournamentRequests() }}
                  </span>
                </a>
              }
              @if (pendingSponsorRequests() > 0) {
                <a
                  routerLink="/app/sponsors"
                  class="flex items-center justify-between gap-3 rounded-lg bg-white px-4 py-3 text-sm font-black uppercase tracking-wide text-ink ring-1 ring-amber-200 transition hover:bg-ink hover:text-white"
                >
                  <span>Richieste sponsor</span>
                  <span class="grid min-h-7 min-w-7 place-items-center rounded-full bg-fossa px-2 text-xs text-ink">
                    {{ pendingSponsorRequests() }}
                  </span>
                </a>
              }
            </div>
          </div>
        </section>
      }

      <section class="rounded-lg bg-ink p-6 text-white">
        <p class="text-xs font-bold uppercase tracking-[0.2em] text-white/50">Saldo attuale</p>
        <p class="mt-3 text-4xl font-black" [class.text-emerald-300]="balance() >= 0" [class.text-red-300]="balance() < 0">{{ eur(balance()) }}</p>
        <div class="mt-6 grid gap-3 border-t border-white/10 pt-5 sm:grid-cols-2">
          <div>
            <p class="text-xs font-bold uppercase tracking-wide text-white/50">Entrate</p>
            <p class="mt-1 text-xl font-bold">{{ eur(totalIncome()) }}</p>
          </div>
          <div>
            <p class="text-xs font-bold uppercase tracking-wide text-white/50">Spese</p>
            <p class="mt-1 text-xl font-bold">{{ eur(totalExpenses()) }}</p>
          </div>
        </div>
      </section>

      <section class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <lfg-summary-card label="Sponsor confermati/pagati" [value]="eur(sponsorConfirmed())" hint="Valore cash e in natura" tone="income" />
        <lfg-summary-card label="Iscrizioni pagate" [value]="eur(regPaidAmount())" [hint]="regPaidCount() + ' pagate'" tone="income" />
        <lfg-summary-card label="Da incassare" [value]="eur(regPendingAmount())" [hint]="regPendingCount() + ' aperte'" tone="warning" />
        <lfg-summary-card label="Record totali" [value]="String(totalRecords())" hint="Spese, entrate, sponsor, iscritti" />
      </section>

      @if (error()) {
        <p class="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{{ error() }}</p>
      }

      <section class="rounded-lg border border-black/10 bg-white p-4 shadow-sm">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p class="text-xs font-bold uppercase tracking-[0.18em] text-neutral-500">Registro modifiche</p>
            <h2 class="font-display text-2xl uppercase">Ultime attivita</h2>
          </div>
        </div>

        @if (!auditLogs().length) {
          <p class="mt-4 rounded-lg bg-neutral-50 p-4 text-sm text-neutral-500">Nessuna modifica registrata.</p>
        } @else {
          <div class="mt-4 divide-y divide-black/5">
            @for (log of auditLogs(); track log.id) {
              <div class="grid gap-2 py-3 sm:grid-cols-[1fr_auto] sm:items-center">
                <div class="min-w-0">
                  <p class="text-sm font-bold">
                    {{ actionLabel(log.action) }} {{ tableLabel(log.table_name) }}
                    <span class="font-normal text-neutral-500">· {{ recordLabel(log) }}</span>
                  </p>
                  <p class="mt-1 text-xs text-neutral-500">
                    {{ actorLabel(log) }} · {{ formatDateTime(log.changed_at) }}
                  </p>
                </div>
                <span class="w-fit rounded-full bg-neutral-100 px-2.5 py-1 text-[10px] font-bold uppercase text-neutral-600">{{ log.action }}</span>
              </div>
            }
          </div>
        }
      </section>
    </div>
  `
})
export class DashboardComponent implements OnInit {
  expenses = signal<Expense[]>([]);
  incomes = signal<Income[]>([]);
  sponsors = signal<Sponsor[]>([]);
  registrations = signal<Registration[]>([]);
  auditLogs = signal<AuditLog[]>([]);
  error = signal('');

  constructor(
    private readonly expensesService: ExpensesService,
    private readonly incomesService: IncomesService,
    private readonly sponsorsService: SponsorsService,
    private readonly registrationsService: RegistrationsService,
    private readonly auditLogService: AuditLogService,
    private readonly badges: RequestBadgesService
  ) {}

  ngOnInit(): void {
    void this.load();
  }

  async load(): Promise<void> {
    this.error.set('');
    try {
      const [expenses, incomes, sponsors, registrations, auditLogs] = await Promise.all([
        this.expensesService.list(),
        this.incomesService.list(),
        this.sponsorsService.list(),
        this.registrationsService.list(),
        this.auditLogService.recent()
      ]);
      this.expenses.set(expenses);
      this.incomes.set(incomes);
      this.sponsors.set(sponsors);
      this.registrations.set(registrations);
      this.auditLogs.set(auditLogs);
      await this.badges.refresh();
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Errore nel caricamento dati.');
    }
  }

  totalExpenses(): number {
    return this.expenses().reduce((sum, item) => sum + Number(item.amount || 0), 0);
  }

  totalIncome(): number {
    return this.recordedIncome() + this.sponsorConfirmed() + this.regPaidAmount();
  }

  recordedIncome(): number {
    return this.incomes().reduce((sum, item) => sum + Number(item.amount || 0), 0);
  }

  balance(): number {
    return this.totalIncome() - this.totalExpenses();
  }

  sponsorConfirmed(): number {
    return this.sponsors()
      .filter((item) => item.status === 'confermato' || item.status === 'pagato')
      .reduce((sum, item) => sum + Number(item.value || 0), 0);
  }

  regPaidCount(): number {
    return this.registrations().filter((item) => item.paid).length;
  }

  regPendingCount(): number {
    return this.registrations().filter((item) => !item.paid).length;
  }

  regPaidAmount(): number {
    return this.registrations().filter((item) => item.paid).reduce((sum, item) => sum + Number(item.fee || 0), 0);
  }

  regPendingAmount(): number {
    return this.registrations().filter((item) => !item.paid).reduce((sum, item) => sum + Number(item.fee || 0), 0);
  }

  totalRecords(): number {
    return this.expenses().length + this.incomes().length + this.sponsors().length + this.registrations().length;
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

  eur(value: number): string {
    return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(value);
  }

  formatDateTime(value: string): string {
    return new Intl.DateTimeFormat('it-IT', {
      dateStyle: 'short',
      timeStyle: 'short'
    }).format(new Date(value));
  }

  actionLabel(action: AuditLog['action']): string {
    if (action === 'insert') return 'Aggiunto';
    if (action === 'update') return 'Modificato';
    return 'Eliminato';
  }

  tableLabel(tableName: string): string {
    return (
      {
        expenses: 'spesa',
        incomes: 'entrata',
        sponsors: 'sponsor',
        registrations: 'iscrizione',
        tournaments: 'torneo',
        tournament_teams: 'squadra',
        team_participants: 'partecipante'
      }[tableName] ?? tableName
    );
  }

  actorLabel(log: AuditLog): string {
    return log.changed_by_name || 'Utente non disponibile';
  }

  recordLabel(log: AuditLog): string {
    const data = log.new_data ?? log.old_data ?? {};
    const value =
      data['company_name'] ??
      data['description'] ??
      data['source'] ??
      data['name'] ??
      [data['first_name'], data['last_name']].filter(Boolean).join(' ');
    return typeof value === 'string' && value.trim() ? value : String(log.record_id).slice(0, 8);
  }

  protected readonly String = String;
}

import { Component, OnInit, signal } from '@angular/core';
import { SummaryCardComponent } from '../../shared/components/ui.component';
import { ExpensesService } from '../../core/services/expenses.service';
import { IncomesService } from '../../core/services/incomes.service';
import { SponsorsService } from '../../core/services/sponsors.service';
import { RegistrationsService } from '../../core/services/registrations.service';
import { Expense, Income, Registration, Sponsor } from '../../core/types/models';

@Component({
  standalone: true,
  imports: [SummaryCardComponent],
  template: `
    <div class="space-y-5">
      <div class="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p class="text-xs font-bold uppercase tracking-[0.18em] text-neutral-500">Dashboard interna</p>
          <h1 class="font-display text-3xl uppercase sm:text-5xl">Riepilogo evento</h1>
        </div>
        <button class="rounded-lg bg-white px-4 py-2 text-sm font-bold uppercase tracking-wide shadow-sm ring-1 ring-black/10" (click)="load()">Aggiorna</button>
      </div>

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
    </div>
  `
})
export class DashboardComponent implements OnInit {
  expenses = signal<Expense[]>([]);
  incomes = signal<Income[]>([]);
  sponsors = signal<Sponsor[]>([]);
  registrations = signal<Registration[]>([]);
  error = signal('');

  constructor(
    private readonly expensesService: ExpensesService,
    private readonly incomesService: IncomesService,
    private readonly sponsorsService: SponsorsService,
    private readonly registrationsService: RegistrationsService
  ) {}

  ngOnInit(): void {
    void this.load();
  }

  async load(): Promise<void> {
    this.error.set('');
    try {
      const [expenses, incomes, sponsors, registrations] = await Promise.all([
        this.expensesService.list(),
        this.incomesService.list(),
        this.sponsorsService.list(),
        this.registrationsService.list()
      ]);
      this.expenses.set(expenses);
      this.incomes.set(incomes);
      this.sponsors.set(sponsors);
      this.registrations.set(registrations);
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Errore nel caricamento dati.');
    }
  }

  totalExpenses(): number {
    return this.expenses().reduce((sum, item) => sum + Number(item.amount || 0), 0);
  }

  totalIncome(): number {
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

  eur(value: number): string {
    return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(value);
  }

  protected readonly String = String;
}

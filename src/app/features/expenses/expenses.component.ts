import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { ExpensesService } from '../../core/services/expenses.service';
import { ExportService } from '../../core/services/export.service';
import { EXPENSE_CATEGORIES, PAYMENT_METHODS } from '../../core/types/constants';
import { Expense, InsertExpense } from '../../core/types/models';
import { EmptyStateComponent, ModalComponent, SummaryCardComponent } from '../../shared/components/ui.component';

@Component({
  standalone: true,
  imports: [FormsModule, EmptyStateComponent, ModalComponent, SummaryCardComponent],
  template: `
    <section class="space-y-4">
      <div class="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p class="text-xs font-bold uppercase tracking-[0.18em] text-neutral-500">Modulo spese</p>
          <h1 class="font-display text-3xl uppercase">Spese</h1>
        </div>
        <div class="flex gap-2">
          <button class="rounded-lg bg-white px-4 py-2 text-sm font-bold ring-1 ring-black/10" (click)="export()">CSV</button>
          <button class="rounded-lg bg-ink px-4 py-2 text-sm font-bold text-white" (click)="newItem()">Nuova</button>
        </div>
      </div>

      <lfg-summary-card label="Totale spese" [value]="eur(total())" tone="expense" [hint]="items().length + ' movimenti'" />
      @if (error()) { <p class="rounded-lg bg-red-50 p-3 text-sm text-red-700">{{ error() }}</p> }

      @if (!items().length) {
        <lfg-empty-state title="Ancora nessuna spesa" text="Registra costi, anticipi e pagamenti dell'organizzazione." />
      } @else {
        <div class="grid gap-3">
          @for (item of items(); track item.id) {
            <article class="rounded-lg border border-black/10 bg-white p-4">
              <div class="flex flex-wrap justify-between gap-3">
                <div class="min-w-0">
                  <h2 class="truncate text-base font-bold">{{ item.description }}</h2>
                  <p class="mt-1 text-xs text-neutral-500">{{ formatDate(item.date) }} · {{ item.category }} @if (item.paid_by) { · da {{ item.paid_by }} }</p>
                  @if (item.notes) { <p class="mt-2 text-sm text-neutral-600">{{ item.notes }}</p> }
                </div>
                <p class="font-black text-expense">-{{ eur(item.amount) }}</p>
              </div>
              <div class="mt-4 flex justify-end gap-2 border-t border-black/5 pt-3">
                <button class="rounded-md bg-neutral-100 px-3 py-1.5 text-xs font-bold uppercase" (click)="edit(item)">Modifica</button>
                @if (auth.isAdmin()) {
                  <button class="rounded-md bg-red-50 px-3 py-1.5 text-xs font-bold uppercase text-red-700" (click)="remove(item)">Elimina</button>
                }
              </div>
            </article>
          }
        </div>
      }
    </section>

    <lfg-modal [open]="modalOpen()" [title]="editing() ? 'Modifica spesa' : 'Nuova spesa'" (close)="modalOpen.set(false)">
      <form class="grid gap-4" (ngSubmit)="save()">
        <label class="grid gap-1 text-sm font-bold">Descrizione <input required name="description" [(ngModel)]="form.description" class="rounded-lg border border-black/10 bg-neutral-50 px-3 py-3 font-normal"></label>
        <div class="grid gap-3 sm:grid-cols-2">
          <label class="grid gap-1 text-sm font-bold">Importo <input required type="number" step="0.01" name="amount" [(ngModel)]="form.amount" class="rounded-lg border border-black/10 bg-neutral-50 px-3 py-3 font-normal"></label>
          <label class="grid gap-1 text-sm font-bold">Data <input required type="date" name="date" [(ngModel)]="form.date" class="rounded-lg border border-black/10 bg-neutral-50 px-3 py-3 font-normal"></label>
        </div>
        <div class="grid gap-3 sm:grid-cols-2">
          <label class="grid gap-1 text-sm font-bold">Categoria <select name="category" [(ngModel)]="form.category" class="rounded-lg border border-black/10 bg-neutral-50 px-3 py-3 font-normal">@for (c of categories; track c) { <option [value]="c">{{ c }}</option> }</select></label>
          <label class="grid gap-1 text-sm font-bold">Metodo <select name="payment_method" [(ngModel)]="form.payment_method" class="rounded-lg border border-black/10 bg-neutral-50 px-3 py-3 font-normal">@for (m of methods; track m) { <option [value]="m">{{ m }}</option> }</select></label>
        </div>
        <label class="grid gap-1 text-sm font-bold">Pagato da <input name="paid_by" [(ngModel)]="form.paid_by" class="rounded-lg border border-black/10 bg-neutral-50 px-3 py-3 font-normal"></label>
        <label class="grid gap-1 text-sm font-bold">Note <textarea name="notes" [(ngModel)]="form.notes" rows="3" class="rounded-lg border border-black/10 bg-neutral-50 px-3 py-3 font-normal"></textarea></label>
        <button class="rounded-lg bg-ink px-4 py-3 text-sm font-bold uppercase text-white">Salva</button>
      </form>
    </lfg-modal>
  `
})
export class ExpensesComponent implements OnInit {
  items = signal<Expense[]>([]);
  error = signal('');
  modalOpen = signal(false);
  editing = signal<Expense | null>(null);
  categories = EXPENSE_CATEGORIES;
  methods = PAYMENT_METHODS;
  form: InsertExpense = this.emptyForm();

  constructor(
    readonly auth: AuthService,
    private readonly service: ExpensesService,
    private readonly exporter: ExportService
  ) {}

  ngOnInit(): void { void this.load(); }

  async load(): Promise<void> {
    try { this.items.set(await this.service.list()); } catch (e) { this.error.set(this.message(e)); }
  }

  newItem(): void { this.editing.set(null); this.form = this.emptyForm(); this.modalOpen.set(true); }
  edit(item: Expense): void { this.editing.set(item); this.form = { date: item.date, description: item.description, category: item.category, amount: item.amount, paid_by: item.paid_by, payment_method: item.payment_method, notes: item.notes }; this.modalOpen.set(true); }

  async save(): Promise<void> {
    try {
      const payload = { ...this.form, amount: Number(this.form.amount || 0) };
      const current = this.editing();
      if (current) await this.service.update(current.id, payload);
      else await this.service.create(payload);
      this.modalOpen.set(false);
      await this.load();
    } catch (e) { this.error.set(this.message(e)); }
  }

  async remove(item: Expense): Promise<void> {
    if (!confirm(`Eliminare la spesa "${item.description}"?`)) return;
    try { await this.service.remove(item.id); await this.load(); } catch (e) { this.error.set(this.message(e)); }
  }

  export(): void { this.exporter.downloadCsv('spese-la-fossa-games.csv', this.items() as unknown as Record<string, unknown>[]); }
  total(): number { return this.items().reduce((sum, item) => sum + Number(item.amount || 0), 0); }
  eur(value: number): string { return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(value); }
  formatDate(value: string): string { return new Intl.DateTimeFormat('it-IT').format(new Date(value)); }
  emptyForm(): InsertExpense { return { date: new Date().toISOString().slice(0, 10), description: '', category: EXPENSE_CATEGORIES[0], amount: 0, paid_by: '', payment_method: PAYMENT_METHODS[0], notes: '' }; }
  private message(error: unknown): string { return error instanceof Error ? error.message : 'Operazione non riuscita.'; }
}

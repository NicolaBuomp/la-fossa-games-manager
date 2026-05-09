import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { ExportService } from '../../core/services/export.service';
import { IncomesService } from '../../core/services/incomes.service';
import { ProfileService } from '../../core/services/profile.service';
import { LoadingService } from '../../core/services/loading.service';
import { INCOME_CATEGORIES, PAYMENT_METHODS } from '../../core/types/constants';
import { Income, InsertIncome, Profile } from '../../core/types/models';
import { ConfirmModalComponent, EmptyStateComponent, ModalComponent, SummaryCardComponent } from '../../shared/components/ui.component';

@Component({
  standalone: true,
  imports: [FormsModule, EmptyStateComponent, ModalComponent, SummaryCardComponent, ConfirmModalComponent],
  template: `
    <section class="space-y-4">
      <div class="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p class="text-xs font-bold uppercase tracking-[0.18em] text-neutral-500">Modulo entrate</p>
          <h1 class="font-display text-3xl uppercase">Entrate</h1>
        </div>
        <div class="flex gap-2">
          <button class="rounded-lg bg-white px-4 py-2 text-sm font-bold ring-1 ring-black/10" (click)="export()">CSV</button>
          <button class="rounded-lg bg-ink px-4 py-2 text-sm font-bold text-white" (click)="newItem()">Nuova</button>
        </div>
      </div>

      <lfg-summary-card label="Totale entrate" [value]="eur(total())" tone="income" [hint]="items().length + ' movimenti'" />
      @if (error()) { <p class="rounded-lg bg-red-50 p-3 text-sm text-red-700">{{ error() }}</p> }

      @if (!items().length) {
        <lfg-empty-state title="Ancora nessuna entrata" text="Registra incassi, quote, sponsor e altre fonti." />
      } @else {
        <div class="grid gap-3">
          @for (item of items(); track item.id) {
            <article class="rounded-lg border border-black/10 bg-white p-4">
              <div class="flex flex-wrap justify-between gap-3">
                <div class="min-w-0">
                  <h2 class="truncate text-base font-bold">{{ item.source }}</h2>
                  <p class="mt-1 text-xs text-neutral-500">{{ formatDate(item.date) }} · {{ item.category }} @if (item.received_by) { · da {{ item.received_by }} }</p>
                  <p class="mt-1 text-xs font-semibold text-neutral-500">{{ insertMeta(item) }}</p>
                  @if (item.notes) { <p class="mt-2 text-sm text-neutral-600">{{ item.notes }}</p> }
                </div>
                <p class="font-black text-emerald-600">+{{ eur(item.amount) }}</p>
              </div>
              <div class="mt-4 flex justify-end gap-2 border-t border-black/5 pt-3">
                <button class="rounded-md bg-neutral-100 px-3 py-1.5 text-xs font-bold uppercase" (click)="edit(item)">Modifica</button>
                @if (auth.isAdmin()) {
                  <button class="rounded-md bg-red-50 px-3 py-1.5 text-xs font-bold uppercase text-red-700" (click)="askRemove(item)">Elimina</button>
                }
              </div>
            </article>
          }
        </div>
      }
    </section>

    <lfg-modal [open]="modalOpen()" [title]="editing() ? 'Modifica entrata' : 'Nuova entrata'" (close)="modalOpen.set(false)">
      <form class="grid gap-4" (ngSubmit)="save()">
        <label class="grid gap-1 text-sm font-bold">Fonte <input required name="source" [(ngModel)]="form.source" class="rounded-lg border border-black/10 bg-neutral-50 px-3 py-3 font-normal"></label>
        <div class="grid gap-3 sm:grid-cols-2">
          <label class="grid gap-1 text-sm font-bold">Importo <input required type="number" min="0" step="0.01" name="amount" [(ngModel)]="form.amount" class="rounded-lg border border-black/10 bg-neutral-50 px-3 py-3 font-normal"></label>
          <label class="grid gap-1 text-sm font-bold">Data <input required type="date" name="date" [(ngModel)]="form.date" class="rounded-lg border border-black/10 bg-neutral-50 px-3 py-3 font-normal"></label>
        </div>
        <div class="grid gap-3 sm:grid-cols-2">
          <label class="grid gap-1 text-sm font-bold">Categoria <select name="category" [(ngModel)]="form.category" class="rounded-lg border border-black/10 bg-neutral-50 px-3 py-3 font-normal">@for (c of categories; track c) { <option [value]="c">{{ c }}</option> }</select></label>
          <label class="grid gap-1 text-sm font-bold">Metodo <select name="payment_method" [(ngModel)]="form.payment_method" class="rounded-lg border border-black/10 bg-neutral-50 px-3 py-3 font-normal">@for (m of methods; track m) { <option [value]="m">{{ m }}</option> }</select></label>
        </div>
        <label class="grid gap-1 text-sm font-bold">Incassato da
          <select name="received_by" [(ngModel)]="form.received_by" class="rounded-lg border border-black/10 bg-neutral-50 px-3 py-3 font-normal">
            <option value="">Non indicato</option>
            @for (profile of profilesList(); track profile.id) {
              <option [value]="profileDisplayName(profile)">{{ profileDisplayName(profile) }}</option>
            }
          </select>
        </label>
        <label class="grid gap-1 text-sm font-bold">Note <textarea name="notes" [(ngModel)]="form.notes" rows="3" class="rounded-lg border border-black/10 bg-neutral-50 px-3 py-3 font-normal"></textarea></label>
        <button [disabled]="saving()" class="rounded-lg bg-ink px-4 py-3 text-sm font-bold uppercase text-white disabled:opacity-60">
          {{ saving() ? 'Salvataggio…' : 'Salva' }}
        </button>
      </form>
    </lfg-modal>

    <lfg-confirm
      [open]="!!confirmPending()"
      [message]="confirmMessage()"
      (confirm)="doConfirm()"
      (cancel)="confirmPending.set(null)"
    />
  `
})
export class IncomesComponent implements OnInit {
  items = signal<Income[]>([]);
  profilesList = signal<Profile[]>([]);
  userNames = signal<Record<string, string>>({});
  error = signal('');
  modalOpen = signal(false);
  editing = signal<Income | null>(null);
  saving = signal(false);
  confirmPending = signal<(() => Promise<void>) | null>(null);
  confirmMessage = signal('');
  categories = INCOME_CATEGORIES;
  methods = PAYMENT_METHODS;
  form: InsertIncome = this.emptyForm();

  constructor(
    readonly auth: AuthService,
    private readonly service: IncomesService,
    private readonly exporter: ExportService,
    private readonly profiles: ProfileService,
    private readonly globalLoading: LoadingService
  ) {}

  ngOnInit(): void { void this.load(); }

  async load(): Promise<void> {
    this.globalLoading.start();
    try {
      const [items, profiles] = await Promise.all([this.service.list(), this.profiles.list()]);
      this.items.set(items);
      this.profilesList.set(profiles);
      this.userNames.set(Object.fromEntries(profiles.map((profile) => [profile.id, this.profileDisplayName(profile)])));
    } catch (e) { this.error.set(this.message(e)); }
    finally { this.globalLoading.stop(); }
  }

  newItem(): void { this.error.set(''); this.editing.set(null); this.form = this.emptyForm(); this.modalOpen.set(true); }
  edit(item: Income): void { this.error.set(''); this.editing.set(item); this.form = { date: item.date, source: item.source, category: item.category, amount: item.amount, received_by: item.received_by, payment_method: item.payment_method, notes: item.notes }; this.modalOpen.set(true); }

  async save(): Promise<void> {
    if (this.saving()) return;
    this.saving.set(true);
    this.error.set('');
    try {
      const payload = { ...this.form, amount: Number(this.form.amount || 0) };
      const current = this.editing();
      if (current) await this.service.update(current.id, payload);
      else await this.service.create(payload);
      this.modalOpen.set(false);
      await this.load();
    } catch (e) { this.error.set(this.message(e)); }
    finally { this.saving.set(false); }
  }

  askRemove(item: Income): void {
    this.confirmMessage.set(`Eliminare l'entrata "${item.source}"?`);
    this.confirmPending.set(async () => {
      try { await this.service.remove(item.id); await this.load(); }
      catch (e) { this.error.set(this.message(e)); }
    });
  }

  async doConfirm(): Promise<void> {
    const fn = this.confirmPending();
    this.confirmPending.set(null);
    if (fn) await fn();
  }

  export(): void { this.exporter.downloadCsv('entrate-la-fossa-games.csv', this.items() as unknown as Record<string, unknown>[]); }
  total(): number { return this.items().reduce((sum, item) => sum + Number(item.amount || 0), 0); }
  eur(value: number): string { return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(value); }
  formatDate(value: string): string { return new Intl.DateTimeFormat('it-IT').format(new Date(value)); }
  formatDateTime(value: string): string { return new Intl.DateTimeFormat('it-IT', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value)); }
  insertMeta(item: Income): string { return `Inserito da ${this.userNames()[item.created_by ?? ''] ?? 'Utente non disponibile'} · ${this.formatDateTime(item.created_at)}`; }
  profileDisplayName(profile: Profile): string { return profile.full_name?.trim() || profile.email?.trim() || profile.id; }
  emptyForm(): InsertIncome { return { date: new Date().toISOString().slice(0, 10), source: '', category: INCOME_CATEGORIES[0], amount: 0, received_by: '', payment_method: PAYMENT_METHODS[0], notes: '' }; }
  private message(error: unknown): string { return error instanceof Error ? error.message : 'Operazione non riuscita.'; }
}

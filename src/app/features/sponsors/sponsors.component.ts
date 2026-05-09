import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { ExportService } from '../../core/services/export.service';
import { ProfileService } from '../../core/services/profile.service';
import { RequestBadgesService } from '../../core/services/request-badges.service';
import { SponsorsService } from '../../core/services/sponsors.service';
import { LoadingService } from '../../core/services/loading.service';
import { SPONSOR_STATUSES } from '../../core/types/constants';
import { InsertSponsor, Sponsor, SponsorStatus, SponsorType } from '../../core/types/models';
import { ConfirmModalComponent, EmptyStateComponent, ModalComponent, StatusBadgeComponent, SummaryCardComponent } from '../../shared/components/ui.component';

@Component({
  standalone: true,
  imports: [FormsModule, EmptyStateComponent, ModalComponent, StatusBadgeComponent, SummaryCardComponent, ConfirmModalComponent],
  template: `
    <section class="space-y-4">
      <div class="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p class="text-xs font-bold uppercase tracking-[0.18em] text-neutral-500">Modulo sponsor</p>
          <h1 class="font-display text-3xl uppercase">Sponsor</h1>
        </div>
        <div class="flex gap-2">
          <button class="rounded-lg bg-white px-4 py-2 text-sm font-bold ring-1 ring-black/10" (click)="export()">CSV</button>
          <button class="rounded-lg bg-ink px-4 py-2 text-sm font-bold text-white" (click)="newItem()">Nuovo</button>
        </div>
      </div>
      <lfg-summary-card label="Confermato/pagato" [value]="eur(confirmedTotal())" tone="income" [hint]="items().length + ' sponsor'" />
      @if (error()) { <p class="rounded-lg bg-red-50 p-3 text-sm text-red-700">{{ error() }}</p> }
      @if (!items().length) {
        <lfg-empty-state title="Nessuno sponsor" text="Aggiungi aziende, contatti, valore e stato della trattativa." />
      } @else {
        <div class="grid gap-3 xl:grid-cols-2">
          @for (item of items(); track item.id) {
            <article class="rounded-lg border border-black/10 bg-white p-4">
              <div class="flex flex-wrap justify-between gap-3">
                <div class="min-w-0">
                  <h2 class="truncate text-base font-bold">{{ item.company_name }}</h2>
                  <p class="mt-1 text-xs text-neutral-500">{{ item.contact_name || 'Referente non indicato' }} @if (item.contact_info) { · {{ item.contact_info }} }</p>
                  <p class="mt-1 text-xs font-semibold text-neutral-500">{{ insertMeta(item) }}</p>
                </div>
                <p class="font-black">{{ eur(item.value) }}</p>
              </div>
              <div class="mt-3 flex flex-wrap gap-2">
                <lfg-status-badge [label]="statusLabel(item.status)" [className]="statusClass(item.status)" />
                <span class="rounded-full bg-neutral-100 px-2.5 py-1 text-[10px] font-bold uppercase">{{ item.type === 'cash' ? 'Cash' : 'In natura' }}</span>
              </div>
              @if (item.deliverables) { <p class="mt-3 text-sm text-neutral-700"><b>Deliverables:</b> {{ item.deliverables }}</p> }
              @if (item.notes) { <p class="mt-2 text-sm text-neutral-600">{{ item.notes }}</p> }
              <div class="mt-4 flex flex-wrap justify-between gap-2 border-t border-black/5 pt-3">
                <div class="flex flex-wrap gap-2">
                  @for (status of statuses; track status.id) {
                    <button class="rounded-md bg-neutral-100 px-2.5 py-1.5 text-[10px] font-bold uppercase" (click)="setStatus(item, status.id)">{{ status.label }}</button>
                  }
                </div>
                <div class="flex gap-2">
                  <button class="rounded-md bg-neutral-100 px-3 py-1.5 text-xs font-bold uppercase" (click)="edit(item)">Modifica</button>
                  @if (auth.isAdmin()) {
                    <button class="rounded-md bg-red-50 px-3 py-1.5 text-xs font-bold uppercase text-red-700" (click)="askRemove(item)">Elimina</button>
                  }
                </div>
              </div>
            </article>
          }
        </div>
      }
    </section>

    <lfg-modal [open]="modalOpen()" [title]="editing() ? 'Modifica sponsor' : 'Nuovo sponsor'" (close)="modalOpen.set(false)">
      <form class="grid gap-4" (ngSubmit)="save()">
        <label class="grid gap-1 text-sm font-bold">Nome azienda <input required name="company_name" [(ngModel)]="form.company_name" class="rounded-lg border border-black/10 bg-neutral-50 px-3 py-3 font-normal"></label>
        <div class="grid gap-3 sm:grid-cols-2">
          <label class="grid gap-1 text-sm font-bold">Referente <input name="contact_name" [(ngModel)]="form.contact_name" class="rounded-lg border border-black/10 bg-neutral-50 px-3 py-3 font-normal"></label>
          <label class="grid gap-1 text-sm font-bold">Contatto <input name="contact_info" [(ngModel)]="form.contact_info" class="rounded-lg border border-black/10 bg-neutral-50 px-3 py-3 font-normal"></label>
        </div>
        <div class="grid gap-3 sm:grid-cols-3">
          <label class="grid gap-1 text-sm font-bold">Valore <input type="number" min="0" step="0.01" name="value" [(ngModel)]="form.value" class="rounded-lg border border-black/10 bg-neutral-50 px-3 py-3 font-normal"></label>
          <label class="grid gap-1 text-sm font-bold">Tipo <select name="type" [(ngModel)]="form.type" class="rounded-lg border border-black/10 bg-neutral-50 px-3 py-3 font-normal"><option value="cash">Cash</option><option value="in_natura">In natura</option></select></label>
          <label class="grid gap-1 text-sm font-bold">Stato <select name="status" [(ngModel)]="form.status" class="rounded-lg border border-black/10 bg-neutral-50 px-3 py-3 font-normal">@for (s of statuses; track s.id) { <option [value]="s.id">{{ s.label }}</option> }</select></label>
        </div>
        <label class="grid gap-1 text-sm font-bold">Deliverables <input name="deliverables" [(ngModel)]="form.deliverables" class="rounded-lg border border-black/10 bg-neutral-50 px-3 py-3 font-normal"></label>
        <label class="grid gap-1 text-sm font-bold">Note <textarea rows="3" name="notes" [(ngModel)]="form.notes" class="rounded-lg border border-black/10 bg-neutral-50 px-3 py-3 font-normal"></textarea></label>
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
export class SponsorsComponent implements OnInit {
  items = signal<Sponsor[]>([]);
  userNames = signal<Record<string, string>>({});
  error = signal('');
  modalOpen = signal(false);
  editing = signal<Sponsor | null>(null);
  saving = signal(false);
  confirmPending = signal<(() => Promise<void>) | null>(null);
  confirmMessage = signal('');
  statuses = SPONSOR_STATUSES;
  form: InsertSponsor = this.emptyForm();

  constructor(
    readonly auth: AuthService,
    private readonly service: SponsorsService,
    private readonly exporter: ExportService,
    private readonly profiles: ProfileService,
    private readonly badges: RequestBadgesService,
    private readonly globalLoading: LoadingService
  ) {}

  ngOnInit(): void { void this.load(); }

  async load(): Promise<void> {
    this.globalLoading.start();
    try {
      const items = await this.service.list();
      this.items.set(items);
      this.userNames.set(await this.profiles.displayNames(items.map((item) => item.created_by)));
      await this.badges.refresh();
    } catch (e) { this.error.set(this.message(e)); }
    finally { this.globalLoading.stop(); }
  }

  newItem(): void { this.error.set(''); this.editing.set(null); this.form = this.emptyForm(); this.modalOpen.set(true); }
  edit(item: Sponsor): void { this.error.set(''); this.editing.set(item); this.form = { company_name: item.company_name, contact_name: item.contact_name, contact_info: item.contact_info, value: item.value, type: item.type, status: item.status, deliverables: item.deliverables, notes: item.notes }; this.modalOpen.set(true); }

  async save(): Promise<void> {
    if (this.saving()) return;
    this.saving.set(true);
    this.error.set('');
    try {
      const payload = { ...this.form, value: Number(this.form.value || 0) };
      const current = this.editing();
      if (current) await this.service.update(current.id, payload);
      else await this.service.create(payload);
      this.modalOpen.set(false);
      await this.load();
    } catch (e) { this.error.set(this.message(e)); }
    finally { this.saving.set(false); }
  }

  async setStatus(item: Sponsor, status: SponsorStatus): Promise<void> {
    try { await this.service.update(item.id, { status }); await this.load(); }
    catch (e) { this.error.set(this.message(e)); }
  }

  askRemove(item: Sponsor): void {
    this.confirmMessage.set(`Eliminare lo sponsor "${item.company_name}"?`);
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

  export(): void { this.exporter.downloadCsv('sponsor-la-fossa-games.csv', this.items() as unknown as Record<string, unknown>[]); }
  confirmedTotal(): number { return this.items().filter((i) => i.status === 'confermato' || i.status === 'pagato').reduce((s, i) => s + Number(i.value || 0), 0); }
  statusLabel(status: SponsorStatus): string { return this.statuses.find((item) => item.id === status)?.label ?? status; }
  statusClass(status: SponsorStatus): string { return this.statuses.find((item) => item.id === status)?.className ?? ''; }
  eur(value: number): string { return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(value); }
  formatDateTime(value: string): string { return new Intl.DateTimeFormat('it-IT', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value)); }
  insertMeta(item: Sponsor): string { return `Inserito da ${this.userNames()[item.created_by ?? ''] ?? 'Utente non disponibile'} · ${this.formatDateTime(item.created_at)}`; }
  emptyForm(): InsertSponsor { return { company_name: '', contact_name: '', contact_info: '', type: 'cash' as SponsorType, value: 0, status: 'contattato', deliverables: '', notes: '' }; }
  private message(error: unknown): string { return error instanceof Error ? error.message : 'Operazione non riuscita.'; }
}

import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { ExportService } from '../../core/services/export.service';
import { RegistrationsService } from '../../core/services/registrations.service';
import { InsertRegistration, Registration } from '../../core/types/models';
import { EmptyStateComponent, ModalComponent, StatusBadgeComponent, SummaryCardComponent } from '../../shared/components/ui.component';

@Component({
  standalone: true,
  imports: [FormsModule, EmptyStateComponent, ModalComponent, StatusBadgeComponent, SummaryCardComponent],
  template: `
    <section class="space-y-4">
      <div class="flex flex-wrap items-end justify-between gap-3">
        <div><p class="text-xs font-bold uppercase tracking-[0.18em] text-neutral-500">Modulo iscrizioni</p><h1 class="font-display text-3xl uppercase">Iscrizioni</h1></div>
        <div class="flex gap-2"><button class="rounded-lg bg-white px-4 py-2 text-sm font-bold ring-1 ring-black/10" (click)="export()">CSV</button><button class="rounded-lg bg-ink px-4 py-2 text-sm font-bold text-white" (click)="newItem()">Nuova</button></div>
      </div>
      <div class="grid gap-3 sm:grid-cols-2"><lfg-summary-card label="Pagate" [value]="eur(paidAmount())" [hint]="paidCount() + ' iscrizioni'" tone="income" /><lfg-summary-card label="Da incassare" [value]="eur(pendingAmount())" [hint]="pendingCount() + ' iscrizioni'" tone="warning" /></div>
      @if (error()) { <p class="rounded-lg bg-red-50 p-3 text-sm text-red-700">{{ error() }}</p> }
      @if (!items().length) { <lfg-empty-state title="Nessuna iscrizione" text="Registra partecipanti o squadre, torneo e quota." /> }
      @else {
        <div class="grid gap-3 xl:grid-cols-2">
          @for (item of items(); track item.id) {
            <article class="rounded-lg border border-black/10 bg-white p-4">
              <div class="flex flex-wrap justify-between gap-3"><div class="min-w-0"><h2 class="truncate text-base font-bold">{{ item.name }}</h2><p class="mt-1 text-xs text-neutral-500">{{ item.tournament }} · {{ formatDate(item.registration_date) }} @if (item.contact) { · {{ item.contact }} }</p></div><div class="text-right"><p class="font-black">{{ eur(item.fee) }}</p><lfg-status-badge [label]="item.paid ? 'Pagato' : 'Da pagare'" [className]="item.paid ? 'border-emerald-200 bg-emerald-100 text-emerald-800' : 'border-amber-200 bg-amber-100 text-amber-800'" /></div></div>
              @if (item.notes) { <p class="mt-3 text-sm text-neutral-600">{{ item.notes }}</p> }
              <div class="mt-4 flex flex-wrap justify-end gap-2 border-t border-black/5 pt-3"><button class="rounded-md bg-neutral-100 px-3 py-1.5 text-xs font-bold uppercase" (click)="togglePaid(item)">{{ item.paid ? 'Segna non pagata' : 'Segna pagata' }}</button><button class="rounded-md bg-neutral-100 px-3 py-1.5 text-xs font-bold uppercase" (click)="edit(item)">Modifica</button>@if (auth.isAdmin()) { <button class="rounded-md bg-red-50 px-3 py-1.5 text-xs font-bold uppercase text-red-700" (click)="remove(item)">Elimina</button> }</div>
            </article>
          }
        </div>
      }
    </section>
    <lfg-modal [open]="modalOpen()" [title]="editing() ? 'Modifica iscrizione' : 'Nuova iscrizione'" (close)="modalOpen.set(false)">
      <form class="grid gap-4" (ngSubmit)="save()">
        <label class="grid gap-1 text-sm font-bold">Nome <input required name="name" [(ngModel)]="form.name" class="rounded-lg border border-black/10 bg-neutral-50 px-3 py-3 font-normal"></label>
        <div class="grid gap-3 sm:grid-cols-2"><label class="grid gap-1 text-sm font-bold">Torneo <input required name="tournament" [(ngModel)]="form.tournament" class="rounded-lg border border-black/10 bg-neutral-50 px-3 py-3 font-normal"></label><label class="grid gap-1 text-sm font-bold">Contatto <input name="contact" [(ngModel)]="form.contact" class="rounded-lg border border-black/10 bg-neutral-50 px-3 py-3 font-normal"></label></div>
        <div class="grid gap-3 sm:grid-cols-2"><label class="grid gap-1 text-sm font-bold">Quota <input type="number" step="0.01" name="fee" [(ngModel)]="form.fee" class="rounded-lg border border-black/10 bg-neutral-50 px-3 py-3 font-normal"></label><label class="grid gap-1 text-sm font-bold">Data iscrizione <input type="date" name="registration_date" [(ngModel)]="form.registration_date" class="rounded-lg border border-black/10 bg-neutral-50 px-3 py-3 font-normal"></label></div>
        <label class="flex items-center gap-3 rounded-lg bg-neutral-50 p-3 text-sm font-bold"><input type="checkbox" name="paid" [(ngModel)]="form.paid" class="h-5 w-5 accent-emerald-600"> Quota pagata</label>
        <label class="grid gap-1 text-sm font-bold">Note <textarea rows="3" name="notes" [(ngModel)]="form.notes" class="rounded-lg border border-black/10 bg-neutral-50 px-3 py-3 font-normal"></textarea></label>
        <button class="rounded-lg bg-ink px-4 py-3 text-sm font-bold uppercase text-white">Salva</button>
      </form>
    </lfg-modal>
  `
})
export class RegistrationsComponent implements OnInit {
  items = signal<Registration[]>([]);
  error = signal('');
  modalOpen = signal(false);
  editing = signal<Registration | null>(null);
  form: InsertRegistration = this.emptyForm();
  constructor(readonly auth: AuthService, private readonly service: RegistrationsService, private readonly exporter: ExportService) {}
  ngOnInit(): void { void this.load(); }
  async load(): Promise<void> { try { this.items.set(await this.service.list()); } catch (e) { this.error.set(this.message(e)); } }
  newItem(): void { this.editing.set(null); this.form = this.emptyForm(); this.modalOpen.set(true); }
  edit(item: Registration): void { this.editing.set(item); this.form = { name: item.name, tournament: item.tournament, contact: item.contact, fee: item.fee, paid: item.paid, registration_date: item.registration_date, notes: item.notes }; this.modalOpen.set(true); }
  async save(): Promise<void> { try { const payload = { ...this.form, fee: Number(this.form.fee || 0) }; const current = this.editing(); if (current) await this.service.update(current.id, payload); else await this.service.create(payload); this.modalOpen.set(false); await this.load(); } catch (e) { this.error.set(this.message(e)); } }
  async togglePaid(item: Registration): Promise<void> { try { await this.service.update(item.id, { paid: !item.paid }); await this.load(); } catch (e) { this.error.set(this.message(e)); } }
  async remove(item: Registration): Promise<void> { if (!confirm(`Eliminare l'iscrizione di "${item.name}"?`)) return; try { await this.service.remove(item.id); await this.load(); } catch (e) { this.error.set(this.message(e)); } }
  export(): void { this.exporter.downloadCsv('iscrizioni-la-fossa-games.csv', this.items() as unknown as Record<string, unknown>[]); }
  paidCount(): number { return this.items().filter((i) => i.paid).length; }
  pendingCount(): number { return this.items().filter((i) => !i.paid).length; }
  paidAmount(): number { return this.items().filter((i) => i.paid).reduce((s, i) => s + Number(i.fee || 0), 0); }
  pendingAmount(): number { return this.items().filter((i) => !i.paid).reduce((s, i) => s + Number(i.fee || 0), 0); }
  eur(value: number): string { return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(value); }
  formatDate(value: string): string { return new Intl.DateTimeFormat('it-IT').format(new Date(value)); }
  emptyForm(): InsertRegistration { return { name: '', tournament: '', contact: '', fee: 0, paid: false, registration_date: new Date().toISOString().slice(0, 10), notes: '' }; }
  private message(error: unknown): string { return error instanceof Error ? error.message : 'Operazione non riuscita.'; }
}

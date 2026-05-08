import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'lfg-summary-card',
  standalone: true,
  template: `
    <article class="rounded-lg border border-black/10 bg-white p-4 shadow-sm">
      <p class="text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-500">{{ label }}</p>
      <p class="mt-2 text-2xl font-black" [class]="toneClass">{{ value }}</p>
      @if (hint) {
        <p class="mt-1 text-xs text-neutral-500">{{ hint }}</p>
      }
    </article>
  `
})
export class SummaryCardComponent {
  @Input({ required: true }) label = '';
  @Input({ required: true }) value = '';
  @Input() hint = '';
  @Input() tone: 'default' | 'income' | 'expense' | 'warning' = 'default';

  get toneClass(): string {
    return {
      default: 'text-ink',
      income: 'text-emerald-600',
      expense: 'text-expense',
      warning: 'text-amber-700'
    }[this.tone];
  }
}

@Component({
  selector: 'lfg-empty-state',
  standalone: true,
  template: `
    <div class="rounded-lg border border-dashed border-black/15 bg-white/60 px-6 py-12 text-center">
      <p class="text-sm font-semibold text-neutral-600">{{ title }}</p>
      <p class="mt-1 text-xs text-neutral-500">{{ text }}</p>
    </div>
  `
})
export class EmptyStateComponent {
  @Input() title = 'Nessun dato';
  @Input() text = 'Aggiungi il primo record per iniziare.';
}

@Component({
  selector: 'lfg-modal',
  standalone: true,
  template: `
    @if (open) {
      <div class="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-0 animate-fade-in sm:items-center sm:p-4" (click)="close.emit()">
        <section class="max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-white shadow-2xl animate-slide-up sm:max-w-2xl sm:rounded-2xl" (click)="$event.stopPropagation()">
          <header class="sticky top-0 z-10 flex items-center justify-between border-b border-black/10 bg-white px-5 py-4">
            <h2 class="font-display text-lg uppercase">{{ title }}</h2>
            <button class="rounded-full bg-neutral-100 px-3 py-1 text-sm font-bold" (click)="close.emit()">Chiudi</button>
          </header>
          <div class="p-5">
            <ng-content />
          </div>
        </section>
      </div>
    }
  `
})
export class ModalComponent {
  @Input() open = false;
  @Input() title = '';
  @Output() close = new EventEmitter<void>();
}

@Component({
  selector: 'lfg-status-badge',
  standalone: true,
  template: '<span class="inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide" [class]="className">{{ label }}</span>'
})
export class StatusBadgeComponent {
  @Input({ required: true }) label = '';
  @Input() className = 'border-neutral-300 bg-neutral-100 text-neutral-700';
}

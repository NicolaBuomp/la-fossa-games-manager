import {
  Component,
  EventEmitter,
  HostListener,
  Input,
  OnInit,
  Output,
  SimpleChanges,
  signal,
} from "@angular/core";

let globalScrollLockCount = 0;
let previousHtmlOverflow = "";
let previousHtmlOverscrollBehavior = "";
let previousBodyOverflow = "";
let previousBodyOverscrollBehavior = "";
let previousBodyPaddingRight = "";

function lockGlobalScroll(): void {
  if (typeof document === "undefined" || typeof window === "undefined") {
    return;
  }

  globalScrollLockCount += 1;
  if (globalScrollLockCount > 1) {
    return;
  }

  const htmlStyle = document.documentElement.style;
  const bodyStyle = document.body.style;
  previousHtmlOverflow = htmlStyle.overflow;
  previousHtmlOverscrollBehavior = htmlStyle.overscrollBehavior;
  previousBodyOverflow = bodyStyle.overflow;
  previousBodyOverscrollBehavior = bodyStyle.overscrollBehavior;
  previousBodyPaddingRight = bodyStyle.paddingRight;

  const scrollbarWidth =
    window.innerWidth - document.documentElement.clientWidth;

  htmlStyle.overflow = "hidden";
  htmlStyle.overscrollBehavior = "none";
  bodyStyle.overflow = "hidden";
  bodyStyle.overscrollBehavior = "none";
  if (scrollbarWidth > 0) {
    bodyStyle.paddingRight = `${scrollbarWidth}px`;
  }
}

function unlockGlobalScroll(): void {
  if (typeof document === "undefined") {
    return;
  }

  if (globalScrollLockCount === 0) {
    return;
  }

  globalScrollLockCount -= 1;
  if (globalScrollLockCount > 0) {
    return;
  }

  const htmlStyle = document.documentElement.style;
  const bodyStyle = document.body.style;
  htmlStyle.overflow = previousHtmlOverflow;
  htmlStyle.overscrollBehavior = previousHtmlOverscrollBehavior;
  bodyStyle.overflow = previousBodyOverflow;
  bodyStyle.overscrollBehavior = previousBodyOverscrollBehavior;
  bodyStyle.paddingRight = previousBodyPaddingRight;
}

@Component({
  selector: "lfg-summary-card",
  standalone: true,
  template: `
    <article class="rounded-lg border border-soft bg-surface p-4 shadow-sm">
      <p class="text-[10px] font-bold uppercase tracking-[0.18em] text-muted">
        {{ label }}
      </p>
      <p class="mt-2 text-2xl font-black" [class]="toneClass">{{ value }}</p>
      @if (hint) {
        <p class="mt-1 text-xs text-muted">{{ hint }}</p>
      }
    </article>
  `,
})
export class SummaryCardComponent {
  @Input({ required: true }) label = "";
  @Input({ required: true }) value = "";
  @Input() hint = "";
  @Input() tone: "default" | "income" | "expense" | "warning" = "default";

  get toneClass(): string {
    return {
      default: "text-primary",
      income: "text-emerald-600",
      expense: "text-expense",
      warning: "text-amber-700",
    }[this.tone];
  }
}

@Component({
  selector: "lfg-kpi-panel",
  standalone: true,
  template: `
    <section class="rounded-lg border border-soft bg-surface">
      <button
        type="button"
        class="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
        [attr.aria-expanded]="!collapsed()"
        (click)="toggle()"
      >
        <span>
          <span
            class="block text-xs font-bold uppercase tracking-[0.18em] text-muted"
            >{{ eyebrow }}</span
          >
          <span
            class="mt-0.5 block text-sm font-black uppercase text-primary"
            >{{ title }}</span
          >
        </span>
        <span
          class="rounded-full bg-surface-muted px-3 py-1 text-xs font-black uppercase ring-1 ring-black/15 transition"
        >
          {{ collapsed() ? "Apri" : "Chiudi" }}
        </span>
      </button>
      @if (!collapsed()) {
        <div class="border-t border-soft p-3">
          <ng-content />
        </div>
      }
    </section>
  `,
})
export class KpiPanelComponent implements OnInit {
  @Input() title = "KPI";
  @Input() eyebrow = "Riepilogo";
  @Input() storageKey = "";
  collapsed = signal(false);

  ngOnInit(): void {
    if (this.storageKey) {
      const stored = localStorage.getItem(`lfg-kpi-${this.storageKey}`);
      if (stored !== null) this.collapsed.set(stored === "1");
    }
  }

  toggle(): void {
    const next = !this.collapsed();
    this.collapsed.set(next);
    if (this.storageKey) {
      localStorage.setItem(`lfg-kpi-${this.storageKey}`, next ? "1" : "0");
    }
  }
}

@Component({
  selector: "lfg-empty-state",
  standalone: true,
  template: `
    <div
      class="rounded-lg border border-dashed border-soft bg-surface px-6 py-12 text-center"
    >
      <p class="text-sm font-semibold text-primary">{{ title }}</p>
      <p class="mt-1 text-xs text-muted">{{ text }}</p>
      @if (actionLabel) {
        <button
          type="button"
          class="mt-4 rounded-lg bg-ink px-4 py-2 text-sm font-bold uppercase text-white transition hover:opacity-80"
          (click)="action.emit()"
        >
          {{ actionLabel }}
        </button>
      }
    </div>
  `,
})
export class EmptyStateComponent {
  @Input() title = "Nessun dato";
  @Input() text = "Aggiungi il primo record per iniziare.";
  @Input() actionLabel = "";
  @Output() action = new EventEmitter<void>();
}

@Component({
  selector: "lfg-modal",
  standalone: true,
  template: `
    @if (open) {
      <div
        class="fixed inset-0 z-50 flex items-end justify-center bg-black/55 p-0 animate-fade-in sm:items-center sm:p-4"
        (click)="close.emit()"
      >
        <section
          role="dialog"
          aria-modal="true"
          [attr.aria-label]="title"
          class="max-h-[92dvh] w-full overflow-y-auto rounded-t-2xl bg-surface text-primary shadow-2xl animate-slide-up sm:max-w-2xl sm:rounded-2xl"
          (click)="$event.stopPropagation()"
        >
          <header
            class="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-soft bg-surface px-5 py-4"
          >
            <h2 class="min-w-0 font-display text-lg uppercase leading-none">
              {{ title }}
            </h2>
            <button
              class="shrink-0 rounded-full bg-surface-muted px-3 py-2 text-sm font-bold"
              (click)="close.emit()"
            >
              Chiudi
            </button>
          </header>
          <div class="p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
            <ng-content />
          </div>
        </section>
      </div>
    }
  `,
})
export class ModalComponent {
  @Input() open = false;
  @Input() title = "";
  @Output() close = new EventEmitter<void>();

  ngOnChanges(changes: SimpleChanges): void {
    if ("open" in changes) {
      this.syncScrollLock();
    }
  }

  ngOnDestroy(): void {
    if (this.open) {
      unlockGlobalScroll();
    }
  }

  @HostListener("document:keydown.escape")
  onEscape(): void {
    if (this.open) {
      this.close.emit();
    }
  }

  private syncScrollLock(): void {
    if (this.open) {
      lockGlobalScroll();
      return;
    }

    unlockGlobalScroll();
  }
}

@Component({
  selector: "lfg-status-badge",
  standalone: true,
  template:
    '<span class="inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide" [class]="className">{{ label }}</span>',
})
export class StatusBadgeComponent {
  @Input({ required: true }) label = "";
  @Input() className = "state-neutral";
}

@Component({
  selector: "lfg-confirm",
  standalone: true,
  template: `
    @if (open) {
      <div
        class="fixed inset-0 z-[60] flex items-center justify-center bg-black/55 p-4"
        (click)="cancel.emit()"
      >
        <section
          role="alertdialog"
          aria-modal="true"
          class="w-full max-w-sm rounded-2xl bg-surface p-6 text-primary shadow-2xl"
          (click)="$event.stopPropagation()"
        >
          <h3 class="font-display text-xl uppercase leading-tight">Conferma</h3>
          <p class="mt-3 text-sm leading-6 text-muted">{{ message }}</p>
          <div class="mt-6 flex justify-end gap-3">
            <button
              type="button"
              class="rounded-lg bg-surface-muted px-4 py-2.5 text-sm font-bold uppercase transition hover:opacity-90"
              (click)="cancel.emit()"
            >
              Annulla
            </button>
            <button
              type="button"
              class="state-danger rounded-lg border px-4 py-2.5 text-sm font-bold uppercase transition hover:opacity-90"
              (click)="confirm.emit()"
            >
              {{ confirmLabel }}
            </button>
          </div>
        </section>
      </div>
    }
  `,
})
export class ConfirmModalComponent {
  @Input() open = false;
  @Input() message = "";
  @Input() confirmLabel = "Elimina";
  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  ngOnChanges(changes: SimpleChanges): void {
    if ("open" in changes) {
      this.syncScrollLock();
    }
  }

  ngOnDestroy(): void {
    if (this.open) {
      unlockGlobalScroll();
    }
  }

  @HostListener("document:keydown.escape")
  onEscape(): void {
    if (this.open) this.cancel.emit();
  }

  private syncScrollLock(): void {
    if (this.open) {
      lockGlobalScroll();
      return;
    }

    unlockGlobalScroll();
  }
}

import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
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
          class="rounded-full border border-soft bg-surface-muted px-3 py-1 text-xs font-black uppercase text-primary transition"
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
  styles: [
    `
      .lfg-modal-shell {
        width: 100vw;
        height: 100dvh;
        max-width: none;
        max-height: none;
        margin: 0;
        padding: 0;
        border: 0;
        background: transparent;
        color: inherit;
      }

      .lfg-modal-shell::backdrop {
        background: rgba(0, 0, 0, 0.55);
        animation: fade-in 0.18s ease-out;
      }
    `,
  ],
  template: `
    <dialog
      #dialog
      class="lfg-modal-shell"
      [attr.aria-label]="title"
      (cancel)="onCancel($event)"
      (click)="onBackdropClick($event)"
    >
      <div
        class="flex min-h-full items-end justify-center p-0 sm:items-center sm:p-4"
      >
        <section
          class="max-h-[92dvh] w-full overflow-y-auto rounded-t-2xl bg-surface text-primary shadow-2xl animate-slide-up sm:max-w-2xl sm:rounded-2xl"
          (click)="$event.stopPropagation()"
        >
          <header
            class="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-soft bg-surface px-5 py-4"
          >
            <h2
              class="min-w-0 truncate font-display text-lg uppercase leading-none text-primary sm:text-xl"
            >
              {{ title }}
            </h2>
            <button
              type="button"
              aria-label="Chiudi finestra"
              class="shrink-0 rounded-md border border-soft bg-surface-muted px-3 py-2 text-xs font-black uppercase tracking-[0.12em] text-primary transition hover:border-fossa hover:text-ink focus-visible:ring-fossa/30"
              (click)="requestClose()"
            >
              Chiudi
            </button>
          </header>
          <div class="p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
            <ng-content />
          </div>
        </section>
      </div>
    </dialog>
  `,
})
export class ModalComponent implements AfterViewInit {
  @ViewChild("dialog") private dialog?: ElementRef<HTMLDialogElement>;
  @Input() open = false;
  @Input() title = "";
  @Output() close = new EventEmitter<void>();
  private viewReady = false;
  private scrollLocked = false;

  ngOnChanges(changes: SimpleChanges): void {
    if ("open" in changes) {
      this.syncDialogState();
    }
  }

  ngOnDestroy(): void {
    if (this.scrollLocked) {
      unlockGlobalScroll();
      this.scrollLocked = false;
    }
  }

  ngAfterViewInit(): void {
    this.viewReady = true;
    this.syncDialogState();
  }

  onCancel(event: Event): void {
    event.preventDefault();
    this.requestClose();
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === this.dialog?.nativeElement) {
      this.requestClose();
    }
  }

  requestClose(): void {
    if (this.open) {
      this.close.emit();
    }
  }

  private syncDialogState(): void {
    if (!this.viewReady) {
      return;
    }

    const dialog = this.dialog?.nativeElement;
    if (!dialog) {
      return;
    }

    if (this.open) {
      if (!dialog.open) {
        dialog.showModal();
      }
      if (!this.scrollLocked) {
        lockGlobalScroll();
        this.scrollLocked = true;
      }
      return;
    }

    if (dialog.open) {
      dialog.close();
    }
    if (this.scrollLocked) {
      unlockGlobalScroll();
      this.scrollLocked = false;
    }
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
  styles: [
    `
      .lfg-confirm-shell {
        width: 100vw;
        height: 100dvh;
        max-width: none;
        max-height: none;
        margin: 0;
        padding: 0;
        border: 0;
        background: transparent;
        color: inherit;
      }

      .lfg-confirm-shell::backdrop {
        background: rgba(0, 0, 0, 0.55);
      }
    `,
  ],
  template: `
    <dialog
      #dialog
      class="lfg-confirm-shell"
      role="alertdialog"
      (cancel)="onCancel($event)"
      (click)="onBackdropClick($event)"
    >
      <div
        class="flex min-h-full items-center justify-center p-4"
      >
        <section
          class="w-full max-w-sm rounded-2xl bg-surface p-6 text-primary shadow-2xl"
          (click)="$event.stopPropagation()"
        >
          <h3 class="font-display text-xl uppercase leading-tight text-primary">
            Conferma
          </h3>
          <p class="mt-3 text-sm font-semibold leading-6 text-muted">
            {{ message }}
          </p>
          <div class="mt-6 flex justify-end gap-3">
            <button
              type="button"
              class="rounded-md border border-soft bg-surface-muted px-4 py-2.5 text-sm font-black uppercase text-primary transition hover:border-fossa"
              (click)="requestCancel()"
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
    </dialog>
  `,
})
export class ConfirmModalComponent implements AfterViewInit {
  @ViewChild("dialog") private dialog?: ElementRef<HTMLDialogElement>;
  @Input() open = false;
  @Input() message = "";
  @Input() confirmLabel = "Elimina";
  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();
  private viewReady = false;
  private scrollLocked = false;

  ngOnChanges(changes: SimpleChanges): void {
    if ("open" in changes) {
      this.syncDialogState();
    }
  }

  ngOnDestroy(): void {
    if (this.scrollLocked) {
      unlockGlobalScroll();
      this.scrollLocked = false;
    }
  }

  ngAfterViewInit(): void {
    this.viewReady = true;
    this.syncDialogState();
  }

  onCancel(event: Event): void {
    event.preventDefault();
    this.requestCancel();
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === this.dialog?.nativeElement) {
      this.requestCancel();
    }
  }

  requestCancel(): void {
    if (this.open) {
      this.cancel.emit();
    }
  }

  private syncDialogState(): void {
    if (!this.viewReady) {
      return;
    }

    const dialog = this.dialog?.nativeElement;
    if (!dialog) {
      return;
    }

    if (this.open) {
      if (!dialog.open) {
        dialog.showModal();
      }
      if (!this.scrollLocked) {
        lockGlobalScroll();
        this.scrollLocked = true;
      }
      return;
    }

    if (dialog.open) {
      dialog.close();
    }
    if (this.scrollLocked) {
      unlockGlobalScroll();
      this.scrollLocked = false;
    }
  }
}

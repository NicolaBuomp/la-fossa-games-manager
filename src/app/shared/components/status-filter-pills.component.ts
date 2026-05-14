import { Component, EventEmitter, Input, Output } from "@angular/core";

export interface FilterOption {
  label: string;
  value: string;
  active: boolean;
}

@Component({
  selector: "lfg-status-filter-pills",
  standalone: true,
  host: { class: "block" },
  template: `
    <div class="flex flex-wrap gap-2">
      @for (option of options(); track option.value) {
        <button
          type="button"
          (click)="selectFilter(option.value)"
          [class.border-fossa]="option.active"
          [class.bg-fossa]="option.active"
          [class.text-ink]="option.active"
          [class.border-soft]="!option.active"
          [class.bg-surface-muted]="!option.active"
          [class.text-primary]="!option.active"
          class="min-h-9 rounded-full border px-4 py-2 text-xs font-black uppercase transition hover:border-fossa hover:bg-fossa hover:text-ink"
        >
          {{ option.label }}
        </button>
      }
    </div>
  `,
})
export class StatusFilterPillsComponent {
  @Input({ required: true }) options!: () => FilterOption[];
  @Output() filterChange = new EventEmitter<string>();

  selectFilter(value: string): void {
    this.filterChange.emit(value);
  }
}

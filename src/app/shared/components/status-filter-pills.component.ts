import { Component, EventEmitter, Input, Output } from "@angular/core";

export interface FilterOption {
  label: string;
  value: string;
  active: boolean;
}

@Component({
  selector: "lfg-status-filter-pills",
  standalone: true,
  template: `
    <div class="flex flex-wrap gap-2">
      @for (option of options(); track option.value) {
        <button
          (click)="selectFilter(option.value)"
          [class.ring-2]="option.active"
          [class.ring-fossa/40]="option.active"
          [class.bg-ink]="option.active"
          [class.text-white]="option.active"
          [class.bg-surface]="!option.active"
          [class.text-ink]="!option.active"
          class="rounded-full px-4 py-2 text-xs font-bold uppercase transition hover:ring-2 hover:ring-fossa/40"
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

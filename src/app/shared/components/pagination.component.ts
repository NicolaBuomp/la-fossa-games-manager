import { Component, computed, input, output } from "@angular/core";

@Component({
  selector: "lfg-pagination",
  standalone: true,
  template: `
    @if (totalPages() > 1) {
      <div class="flex items-center justify-between text-sm text-muted">
        <span>{{ from() }}–{{ to() }} di {{ total() }}</span>
        <div class="flex items-center gap-1">
          <button
            class="rounded-md border border-soft px-3 py-1.5 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-40"
            [disabled]="page() <= 1"
            (click)="pageChange.emit(page() - 1)"
          >
            ← Prec
          </button>
          <span class="px-2 text-xs">{{ page() }} / {{ totalPages() }}</span>
          <button
            class="rounded-md border border-soft px-3 py-1.5 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-40"
            [disabled]="page() >= totalPages()"
            (click)="pageChange.emit(page() + 1)"
          >
            Succ 
          </button>
        </div>
      </div>
    }
  `,
})
export class PaginationComponent {
  page = input.required<number>();
  pageSize = input.required<number>();
  total = input.required<number>();
  pageChange = output<number>();

  totalPages = computed(() => Math.ceil(this.total() / this.pageSize()));
  from = computed(() => Math.min((this.page() - 1) * this.pageSize() + 1, this.total()));
  to = computed(() => Math.min(this.page() * this.pageSize(), this.total()));
}

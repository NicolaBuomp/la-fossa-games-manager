import { Component, EventEmitter, Input, Output } from "@angular/core";
import { AuditActivityItem } from "./audit-activity.model";
import { tableLabel } from "./audit-formatters";

@Component({
  selector: "lfg-audit-activity-list",
  standalone: true,
  template: `
    <div class="divide-y divide-black/5">
      @for (activity of activities; track activity.id) {
        <button
          type="button"
          class="grid w-full grid-cols-[auto_1fr_auto] items-center gap-x-3 py-3 text-left transition hover:bg-surface-muted"
          (click)="select.emit(activity)"
        >
          <span [class]="activity.badgeClass" class="shrink-0">{{ activity.badge }}</span>
          <div class="min-w-0">
            <p class="truncate text-sm font-bold leading-snug">{{ activity.title }}</p>
            <p class="mt-0.5 text-xs text-muted">{{ entityLabel(activity) }}</p>
          </div>
          <p class="shrink-0 text-xs text-muted">{{ activity.meta }}</p>
        </button>
      }
    </div>
  `,
})
export class AuditActivityListComponent {
  @Input() activities: AuditActivityItem[] = [];
  @Output() select = new EventEmitter<AuditActivityItem>();

  protected entityLabel(activity: AuditActivityItem): string {
    const raw = tableLabel(activity.logs[0].table_name);
    return raw.charAt(0).toUpperCase() + raw.slice(1);
  }
}

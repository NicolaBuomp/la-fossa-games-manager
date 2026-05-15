import { Component, EventEmitter, Input, Output } from "@angular/core";
import { AuditActivityItem } from "./audit-activity.model";

@Component({
  selector: "lfg-audit-activity-list",
  standalone: true,
  template: `
    <div class="divide-y divide-black/5">
      @for (activity of activities; track activity.id) {
        <button
          type="button"
          class="grid w-full gap-2 py-3 text-left transition hover:bg-surface-muted sm:grid-cols-[1fr_auto] sm:items-center"
          (click)="select.emit(activity)"
        >
          <div class="min-w-0">
            <p class="text-sm font-bold">{{ activity.title }}</p>
            <p class="mt-1 text-xs text-muted">{{ activity.meta }}</p>
          </div>
          <span [class]="activity.badgeClass">{{ activity.badge }}</span>
        </button>
      }
    </div>
  `,
})
export class AuditActivityListComponent {
  @Input() activities: AuditActivityItem[] = [];
  @Output() select = new EventEmitter<AuditActivityItem>();
}

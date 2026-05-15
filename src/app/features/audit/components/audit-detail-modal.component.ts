import { Component, EventEmitter, Input, Output } from "@angular/core";
import { ModalComponent } from "../../../shared/components/ui.component";
import { AuditActivityItem } from "./audit-activity.model";
import {
  actionLabel,
  actorLabel,
  auditBadgeClass,
  changedFields,
  formatDateTime,
  formatJson,
  tableLabel,
} from "./audit-formatters";

@Component({
  selector: "lfg-audit-detail-modal",
  standalone: true,
  imports: [ModalComponent],
  template: `
    <lfg-modal
      [open]="!!activity"
      title="Dettaglio audit"
      (close)="close.emit()"
    >
      @if (activity; as current) {
        <section class="space-y-4">
          <div>
            <p class="text-xs font-bold uppercase tracking-[0.18em] text-muted">
              Dettaglio audit
            </p>
            <h2 class="mt-1 text-xl font-black leading-tight">
              {{ current.title }}
            </h2>
            <p class="mt-1 text-sm text-muted">{{ current.meta }}</p>
          </div>

          <div class="rounded-lg border border-soft bg-surface-muted p-3">
            <p class="text-xs font-bold uppercase tracking-[0.18em] text-muted">
              Log inclusi
            </p>
            <p class="mt-1 text-sm font-black">{{ current.logs.length }}</p>
          </div>

          <div class="space-y-3">
            @for (log of current.logs; track log.id) {
              <article class="rounded-lg border border-soft bg-surface p-3">
                <div class="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p class="text-sm font-bold">
                      {{ actionLabel(log.action) }} {{ tableLabel(log.table_name) }}
                    </p>
                    <p class="mt-1 break-all text-xs text-muted">
                      Record: {{ log.record_id }}
                    </p>
                    <p class="mt-1 text-xs text-muted">
                      Utente: {{ actorLabel(log) }} · {{ formatDateTime(log.changed_at) }}
                    </p>
                  </div>
                  <span [class]="auditBadgeClass(log.action)">
                    {{ actionLabel(log.action) }}
                  </span>
                </div>

                @if (changedFields(log).length) {
                  <p class="mt-3 text-xs text-muted">
                    Campi modificati: {{ changedFields(log).join(", ") }}
                  </p>
                }

                <div class="mt-3 grid gap-3 lg:grid-cols-2">
                  @if (log.old_data) {
                    <div>
                      <p class="text-[10px] font-bold uppercase tracking-wide text-muted">
                        Prima
                      </p>
                      <pre class="mt-1 max-h-56 overflow-auto rounded-md bg-surface-muted p-3 text-xs leading-5">{{ formatJson(log.old_data) }}</pre>
                    </div>
                  }
                  @if (log.new_data) {
                    <div>
                      <p class="text-[10px] font-bold uppercase tracking-wide text-muted">
                        Dopo
                      </p>
                      <pre class="mt-1 max-h-56 overflow-auto rounded-md bg-surface-muted p-3 text-xs leading-5">{{ formatJson(log.new_data) }}</pre>
                    </div>
                  }
                </div>
              </article>
            }
          </div>
        </section>
      }
    </lfg-modal>
  `,
})
export class AuditDetailModalComponent {
  @Input() activity: AuditActivityItem | null = null;
  @Output() close = new EventEmitter<void>();

  protected readonly actionLabel = actionLabel;
  protected readonly actorLabel = actorLabel;
  protected readonly auditBadgeClass = auditBadgeClass;
  protected readonly changedFields = changedFields;
  protected readonly formatDateTime = formatDateTime;
  protected readonly formatJson = formatJson;
  protected readonly tableLabel = tableLabel;
}

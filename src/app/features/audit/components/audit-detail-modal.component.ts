import { Component, EventEmitter, Input, Output, inject } from "@angular/core";
import { ModalComponent } from "../../../shared/components/ui.component";
import { AuthService } from "../../../core/services/auth.service";
import { AuditLog } from "../../../core/types/models";
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

          <div class="space-y-3">
            @for (log of current.logs; track log.id) {
              <article class="rounded-lg border border-soft bg-surface p-3">
                <div class="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p class="text-sm font-bold">
                      {{ actionLabel(log.action) }} {{ tableLabel(log.table_name) }}
                    </p>
                    <p class="mt-1 text-xs text-muted">
                      {{ actorLabel(log) }} · {{ formatDateTime(log.changed_at) }}
                    </p>
                  </div>
                  <span [class]="auditBadgeClass(log.action)">
                    {{ actionLabel(log.action) }}
                  </span>
                </div>

                <!-- UPDATE: tabella diff per campo -->
                @if (log.action === 'update' && diffRows(log).length) {
                  <div class="mt-3 overflow-hidden rounded-lg border border-soft">
                    <table class="w-full text-xs">
                      <thead class="bg-surface-muted">
                        <tr>
                          <th class="px-3 py-2 text-left font-bold uppercase tracking-wide text-muted">Campo</th>
                          <th class="px-3 py-2 text-left font-bold uppercase tracking-wide text-muted">Prima</th>
                          <th class="px-3 py-2 text-left font-bold uppercase tracking-wide text-muted">Dopo</th>
                        </tr>
                      </thead>
                      <tbody class="divide-y divide-soft">
                        @for (row of diffRows(log); track row.field) {
                          <tr>
                            <td class="px-3 py-2 font-mono text-muted">{{ row.field }}</td>
                            <td class="px-3 py-2 text-muted line-through">{{ row.oldVal }}</td>
                            <td class="px-3 py-2 font-semibold">{{ row.newVal }}</td>
                          </tr>
                        }
                      </tbody>
                    </table>
                  </div>
                }

                <!-- INSERT: lista chiave-valore new_data -->
                @if (log.action === 'insert' && log.new_data) {
                  <div class="mt-3 divide-y divide-soft overflow-hidden rounded-lg border border-soft">
                    @for (row of kvRows(log.new_data); track row.field) {
                      <div class="flex gap-3 px-3 py-1.5 text-xs">
                        <span class="w-36 shrink-0 font-mono text-muted">{{ row.field }}</span>
                        <span class="min-w-0 break-all">{{ row.val }}</span>
                      </div>
                    }
                  </div>
                }

                <!-- DELETE: lista chiave-valore old_data -->
                @if (log.action === 'delete' && log.old_data) {
                  <div class="mt-3 divide-y divide-soft overflow-hidden rounded-lg border border-soft opacity-70">
                    @for (row of kvRows(log.old_data); track row.field) {
                      <div class="flex gap-3 px-3 py-1.5 text-xs">
                        <span class="w-36 shrink-0 font-mono text-muted">{{ row.field }}</span>
                        <span class="min-w-0 break-all line-through">{{ row.val }}</span>
                      </div>
                    }
                  </div>
                }

                <!-- Sezione tecnica: solo admin -->
                @if (isAdmin()) {
                  <details class="mt-3">
                    <summary class="cursor-pointer text-xs font-bold uppercase tracking-wide text-muted hover:text-ink">
                      Dettagli tecnici
                    </summary>
                    <div class="mt-2 space-y-1 rounded-md bg-surface-muted p-3 text-xs">
                      <p class="break-all">
                        <span class="font-mono text-muted">record_id&nbsp;&nbsp;&nbsp;</span>{{ log.record_id }}
                      </p>
                      @if (log.operation_id) {
                        <p class="break-all">
                          <span class="font-mono text-muted">operation_id&nbsp;</span>{{ log.operation_id }}
                        </p>
                      }
                      @if (log.changed_by) {
                        <p class="break-all">
                          <span class="font-mono text-muted">changed_by&nbsp;&nbsp;</span>{{ log.changed_by }}
                        </p>
                      }
                      @if (log.old_data) {
                        <details class="mt-2">
                          <summary class="cursor-pointer text-muted">JSON prima</summary>
                          <pre class="mt-1 max-h-40 overflow-auto rounded bg-surface p-2 text-[10px] leading-4">{{ formatJson(log.old_data) }}</pre>
                        </details>
                      }
                      @if (log.new_data) {
                        <details class="mt-2">
                          <summary class="cursor-pointer text-muted">JSON dopo</summary>
                          <pre class="mt-1 max-h-40 overflow-auto rounded bg-surface p-2 text-[10px] leading-4">{{ formatJson(log.new_data) }}</pre>
                        </details>
                      }
                    </div>
                  </details>
                }
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

  private readonly auth = inject(AuthService);
  protected readonly isAdmin = this.auth.isAdmin;

  protected readonly actionLabel = actionLabel;
  protected readonly actorLabel = actorLabel;
  protected readonly auditBadgeClass = auditBadgeClass;
  protected readonly changedFields = changedFields;
  protected readonly formatDateTime = formatDateTime;
  protected readonly formatJson = formatJson;
  protected readonly tableLabel = tableLabel;

  protected diffRows(log: AuditLog): { field: string; oldVal: string; newVal: string }[] {
    return changedFields(log).map((field) => ({
      field,
      oldVal: this.formatValue(log.old_data?.[field]),
      newVal: this.formatValue(log.new_data?.[field]),
    }));
  }

  protected kvRows(data: Record<string, unknown>): { field: string; val: string }[] {
    return Object.entries(data).map(([field, val]) => ({
      field,
      val: this.formatValue(val),
    }));
  }

  private formatValue(val: unknown): string {
    if (val === null || val === undefined) return "—";
    if (typeof val === "boolean") return val ? "Sì" : "No";
    if (typeof val === "string") return val;
    return JSON.stringify(val);
  }
}

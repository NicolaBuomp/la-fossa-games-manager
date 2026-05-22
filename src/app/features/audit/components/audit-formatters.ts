import { AuditLog } from "../../../core/types/models";
import {
  AUDIT_ACTION,
  AUDIT_ACTIONS,
  AUDIT_TABLE_LABELS,
  AUDIT_TABLE_PLURAL_LABELS,
} from "../../../core/types/constants";

const AUDIT_BADGE_BASE =
  "w-fit rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase";

function actionMeta(action: AuditLog["action"]): (typeof AUDIT_ACTIONS)[number] {
  return AUDIT_ACTIONS.find((item) => item.id === action) ?? AUDIT_ACTIONS[2];
}

export function actionLabel(action: AuditLog["action"]): string {
  return actionMeta(action).label;
}

export function actionPhrase(action: AuditLog["action"]): string {
  return actionMeta(action).phrase;
}

export function auditBadgeClass(action: AuditLog["action"]): string {
  return `${AUDIT_BADGE_BASE} ${actionMeta(action).className}`;
}

export function tableLabel(tableName: string): string {
  return AUDIT_TABLE_LABELS[tableName] ?? tableName;
}

export function tablePluralLabel(tableName: string): string {
  return AUDIT_TABLE_PLURAL_LABELS[tableName] ?? tableName;
}

export function actorLabel(log: AuditLog): string {
  return log.changed_by_name || "Utente non disponibile";
}

export function recordLabel(log: AuditLog): string {
  const data = log.new_data ?? log.old_data ?? {};
  const value =
    data["company_name"] ??
    data["description"] ??
    data["source"] ??
    data["name"] ??
    [data["first_name"], data["last_name"]].filter(Boolean).join(" ");
  return typeof value === "string" && value.trim()
    ? value.trim()
    : String(log.record_id).slice(0, 8);
}

export function changedFields(log: AuditLog): string[] {
  if (log.action !== AUDIT_ACTION.Update || !log.old_data || !log.new_data) return [];
  const oldData = log.old_data;
  const newData = log.new_data;
  return Object.keys(newData).filter(
    (key) => JSON.stringify(oldData[key]) !== JSON.stringify(newData[key]),
  );
}

export function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("it-IT", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export function formatJson(value: Record<string, unknown>): string {
  return JSON.stringify(value, null, 2);
}

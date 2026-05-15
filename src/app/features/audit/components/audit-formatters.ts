import { AuditLog } from "../../../core/types/models";

export function actionLabel(action: AuditLog["action"]): string {
  if (action === "insert") return "Aggiunto";
  if (action === "update") return "Modificato";
  return "Eliminato";
}

export function actionPhrase(action: AuditLog["action"]): string {
  if (action === "insert") return "inserito";
  if (action === "update") return "modificato";
  return "eliminato";
}

export function auditBadgeClass(action: AuditLog["action"]): string {
  const base =
    "w-fit rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase";
  if (action === "insert") return `${base} state-success`;
  if (action === "update") return `${base} state-info`;
  return `${base} state-danger`;
}

export function tableLabel(tableName: string): string {
  return (
    {
      expenses: "spesa",
      incomes: "entrata",
      sponsors: "sponsor",
      registrations: "iscrizione",
      tournaments: "torneo",
      tournament_teams: "squadra",
      team_participants: "partecipante",
    }[tableName] ?? tableName
  );
}

export function tablePluralLabel(tableName: string): string {
  return (
    {
      expenses: "spese",
      incomes: "entrate",
      sponsors: "sponsor",
      registrations: "iscrizioni",
      tournaments: "tornei",
      tournament_teams: "squadre",
      team_participants: "partecipanti",
    }[tableName] ?? tableName
  );
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
  if (log.action !== "update" || !log.old_data || !log.new_data) return [];
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

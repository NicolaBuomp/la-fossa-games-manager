import { AuditLog, Registration } from "../../../core/types/models";
import { AUDIT_ACTION, SUPABASE_TABLE } from "../../../core/types/constants";
import { AuditActivityItem } from "./audit-activity.model";
import {
  actionLabel,
  actionPhrase,
  auditBadgeClass,
  recordLabel,
  tableLabel,
  tablePluralLabel,
} from "./audit-formatters";

export function buildAuditActivities(
  logs: AuditLog[],
  registrations: Registration[] = [],
): AuditActivityItem[] {
  const consumed = new Set<string>();
  const items: AuditActivityItem[] = [];

  for (const log of logs) {
    if (consumed.has(log.id)) continue;

    if (log.operation_id) {
      const operationLogs = logs.filter(
        (candidate) =>
          !consumed.has(candidate.id) &&
          candidate.operation_id === log.operation_id,
      );
      if (operationLogs.length > 1) {
        operationLogs.forEach((item) => consumed.add(item.id));
        items.push(operationActivity(operationLogs, registrations));
        continue;
      }
    }

    if (log.action === AUDIT_ACTION.Insert && log.table_name === SUPABASE_TABLE.TournamentTeams) {
      consumed.add(log.id);
      const relatedParticipants = logs.filter(
        (candidate) =>
          !consumed.has(candidate.id) &&
          candidate.action === AUDIT_ACTION.Insert &&
          candidate.table_name === SUPABASE_TABLE.TeamParticipants &&
          candidate.new_data?.["team_id"] === log.record_id &&
          candidate.changed_by === log.changed_by &&
          secondsBetween(candidate.changed_at, log.changed_at) <= 10,
      );
      relatedParticipants.forEach((participant) => consumed.add(participant.id));
      items.push(teamInsertActivity(log, relatedParticipants, registrations));
      continue;
    }

    const group = logs.filter(
      (candidate) =>
        !consumed.has(candidate.id) &&
        candidate.id !== log.id &&
        candidate.action === log.action &&
        candidate.table_name === log.table_name &&
        candidate.changed_by === log.changed_by &&
        secondsBetween(candidate.changed_at, log.changed_at) <= 60,
    );

    if (group.length) {
      consumed.add(log.id);
      group.forEach((item) => consumed.add(item.id));
      items.push(groupedActivity([log, ...group], registrations));
      continue;
    }

    consumed.add(log.id);
    items.push(singleActivity(log));
  }

  return items;
}

function singleActivity(log: AuditLog): AuditActivityItem {
  return {
    id: log.id,
    title:
      log.summary ||
      `${actorLabel(log)} ha ${actionPhrase(log.action)} ${tableLabel(log.table_name)} "${recordLabel(log)}"`,
    meta: formatDateTime(log.changed_at),
    badge: actionLabel(log.action),
    badgeClass: auditBadgeClass(log.action),
    logs: [log],
  };
}

function operationActivity(
  logs: AuditLog[],
  registrations: Registration[],
): AuditActivityItem {
  const [first] = logs;
  const teamLog = logs.find((log) => log.table_name === SUPABASE_TABLE.TournamentTeams);
  if (teamLog) {
    return teamInsertActivity(
      teamLog,
      logs.filter((log) => log.table_name === SUPABASE_TABLE.TeamParticipants),
      registrations,
    );
  }

  const participantLogs = logs.filter(
    (log) => log.table_name === SUPABASE_TABLE.TeamParticipants,
  );
  if (participantLogs.length === logs.length) {
    return participantsInsertActivity(participantLogs, registrations);
  }

  return {
    id: logs.map((log) => log.id).join("-"),
    title:
      first.summary ||
      `${actorLabel(first)} ha eseguito ${logs.length} modifiche operative`,
    meta: formatDateTime(first.changed_at),
    badge: actionLabel(first.action),
    badgeClass: auditBadgeClass(first.action),
    logs,
  };
}

function groupedActivity(
  logs: AuditLog[],
  registrations: Registration[],
): AuditActivityItem {
  const [first] = logs;
  if (first.action === AUDIT_ACTION.Insert && first.table_name === SUPABASE_TABLE.TeamParticipants) {
    return participantsInsertActivity(logs, registrations);
  }

  return {
    id: logs.map((log) => log.id).join("-"),
    title: `${actorLabel(first)} ha ${actionPhrase(first.action)} ${logs.length} ${tablePluralLabel(first.table_name)}`,
    meta: formatDateTime(first.changed_at),
    badge: actionLabel(first.action),
    badgeClass: auditBadgeClass(first.action),
    logs,
  };
}

function teamInsertActivity(
  log: AuditLog,
  participants: AuditLog[],
  registrations: Registration[],
): AuditActivityItem {
  const data = log.new_data ?? {};
  const teamName = textValue(data["name"], "squadra");
  const tournamentName =
    textValue(log.context?.["tournament_name"], "") ||
    (registrations.find((registration) => registration.id === log.record_id)
      ?.tournament ?? "torneo");
  const participant = participants[0]?.new_data ?? {};
  const captain =
    textValue(data["captain_name"], "") ||
    [participant["first_name"], participant["last_name"]]
      .filter(
        (value): value is string => typeof value === "string" && !!value.trim(),
      )
      .join(" ");
  const captainText = captain ? ` e capitano ${captain}` : "";

  return {
    id: [log.id, ...participants.map((item) => item.id)].join("-"),
    title: `${actorLabel(log)} ha inserito la squadra "${teamName}" in ${tournamentName}${captainText}`,
    meta: formatDateTime(log.changed_at),
    badge: actionLabel(log.action),
    badgeClass: auditBadgeClass(log.action),
    logs: [log, ...participants],
  };
}

function participantsInsertActivity(
  logs: AuditLog[],
  registrations: Registration[],
): AuditActivityItem {
  const [first] = logs;
  const teamId = textValue(first.new_data?.["team_id"], "");
  const contextTeamName = textValue(first.context?.["team_name"], "");
  const contextTournamentName = textValue(first.context?.["tournament_name"], "");
  const team = registrations.find((registration) => registration.id === teamId);
  const destination = contextTeamName
    ? ` nella squadra "${contextTeamName}"${contextTournamentName ? ` in ${contextTournamentName}` : ""}`
    : team
    ? ` nella squadra "${team.name}" in ${team.tournament}`
    : " in una squadra";

  return {
    id: logs.map((log) => log.id).join("-"),
    title: `${actorLabel(first)} ha inserito ${logs.length} partecipanti${destination}`,
    meta: formatDateTime(first.changed_at),
    badge: actionLabel(first.action),
    badgeClass: auditBadgeClass(first.action),
    logs,
  };
}

function actorLabel(log: AuditLog): string {
  return log.changed_by_name || "Utente non disponibile";
}

function secondsBetween(a: string, b: string): number {
  return Math.abs(new Date(a).getTime() - new Date(b).getTime()) / 1000;
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("it-IT", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function textValue(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

import { Injectable } from "@angular/core";
import { RealtimeChannel } from "@supabase/supabase-js";
import {
  SUPABASE_RPC,
  SUPABASE_TABLE,
  TOURNAMENT_MATCH_STATUS,
  TOURNAMENT_MATCH_STATUSES,
  TOURNAMENT_PUBLIC_STATUS,
  TOURNAMENT_PUBLIC_STATUSES,
  TOURNAMENT_STATUS,
  TOURNAMENT_STATUSES,
} from "../types/constants";
import {
  OperationalTournament,
  TournamentGroup,
  TournamentGroupTeam,
  TournamentMatch,
  TournamentMatchStatus,
  TournamentPublicStatus,
  TournamentStanding,
  TournamentStatus,
  TournamentTeamWithParticipants,
  UpdateTournamentPublication,
} from "../types/models";
import { ProfileService } from "./profile.service";
import { SupabaseService } from "./supabase.service";

export interface GenerateGroupStageResult {
  groups_created: number;
  teams_assigned: number;
  matches_created: number;
  seeded_used: number;
  note: string;
}

export interface ResetTournamentScheduleResult {
  groups_deleted: number;
  matches_deleted: number;
  standings_deleted: number;
  group_teams_deleted: number;
}

export interface SaveMatchResultInput {
  matchId: string;
  groupId: string | null;
  homeScore: number;
  awayScore: number;
  status: TournamentMatchStatus;
  startsAt?: string | null;
  fieldLabel?: string | null;
}

export interface PublicTournamentMatch {
  id: string;
  tournament_id: string;
  tournament_name: string;
  group_name: string | null;
  round_label: string | null;
  home_team_name: string;
  away_team_name: string;
  home_score: number;
  away_score: number;
  status: TournamentMatchStatus;
  starts_at: string | null;
  ends_at: string | null;
  field_label: string | null;
}

export interface PublicTournamentStanding {
  id: string;
  tournament_id: string;
  tournament_name: string;
  group_name: string;
  team_name: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goals_for: number;
  goals_against: number;
  goal_diff: number;
  points: number;
  rank: number;
}

const TOURNAMENT_SELECT = `
  *,
  tournament_teams(*, team_participants(*)),
  tournament_groups(*, tournament_group_teams(*, tournament_teams(id, name))),
  tournament_matches(
    *,
    home_team:tournament_teams!tournament_matches_home_team_id_fkey(id, name),
    away_team:tournament_teams!tournament_matches_away_team_id_fkey(id, name),
    tournament_groups(name)
  ),
  tournament_standings(
    *,
    tournament_teams(id, name),
    tournament_groups(name)
  )
`;

@Injectable({ providedIn: "root" })
export class TournamentsService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly profiles: ProfileService,
  ) {}

  async listOperational(): Promise<OperationalTournament[]> {
    const { data, error } = await this.supabase.client
      .from(SUPABASE_TABLE.Tournaments)
      .select(TOURNAMENT_SELECT)
      .order("name", { ascending: true });
    if (error) throw error;
    const tournaments = (data ?? []) as OperationalTournament[];
    const userNames = await this.loadTournamentTeamUserNames(tournaments);
    return tournaments.map((tournament) =>
      this.normalizeTournament(tournament, userNames),
    );
  }

  async getOperational(id: string): Promise<OperationalTournament | null> {
    const { data, error } = await this.supabase.client
      .from(SUPABASE_TABLE.Tournaments)
      .select(TOURNAMENT_SELECT)
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;

    const tournament = data as OperationalTournament;
    const userNames = await this.loadTournamentTeamUserNames([tournament]);
    return this.normalizeTournament(tournament, userNames);
  }

  async generateGroupStage(
    tournamentId: string,
    groupCount: number,
    seededTeamIds: string[] = [],
  ): Promise<GenerateGroupStageResult> {
    const { data, error } = await this.supabase.client.rpc(
      SUPABASE_RPC.GenerateGroupStage,
      {
        p_tournament_id: tournamentId,
        p_group_count: Math.max(1, Math.floor(groupCount || 1)),
        p_seeded_team_ids: seededTeamIds,
      },
    );
    if (error) throw error;
    return this.normalizeGenerateResult((data ?? [])[0]);
  }

  async resetTournamentSchedule(
    tournamentId: string,
  ): Promise<ResetTournamentScheduleResult> {
    const { data, error } = await this.supabase.client.rpc(
      SUPABASE_RPC.ResetTournamentSchedule,
      { p_tournament_id: tournamentId },
    );
    if (error) throw error;
    return this.normalizeResetResult((data ?? [])[0]);
  }

  async saveMatchResult(input: SaveMatchResultInput): Promise<TournamentMatch> {
    if (input.homeScore < 0 || input.awayScore < 0) {
      throw new Error("I punteggi non possono essere negativi.");
    }

    const { data, error } = await this.supabase.client
      .from(SUPABASE_TABLE.TournamentMatches)
      .update({
        home_score: Math.floor(input.homeScore),
        away_score: Math.floor(input.awayScore),
        status: input.status,
        starts_at: input.startsAt ?? null,
        field_label: input.fieldLabel?.trim() || null,
      })
      .eq("id", input.matchId)
      .select()
      .single();
    if (error) throw error;

    if (input.groupId) {
      const { error: recalcError } = await this.supabase.client.rpc(
        SUPABASE_RPC.RecalculateGroupStandings,
        { p_group_id: input.groupId },
      );
      if (recalcError) throw recalcError;
    }

    return this.normalizeMatch(data as TournamentMatch);
  }

  async updatePublication(
    tournamentId: string,
    payload: UpdateTournamentPublication,
  ): Promise<void> {
    const { error } = await this.supabase.client
      .from(SUPABASE_TABLE.Tournaments)
      .update(payload)
      .eq("id", tournamentId);
    if (error) throw error;
  }

  async listPublicMatches(
    tournamentId?: string,
  ): Promise<PublicTournamentMatch[]> {
    let query = this.supabase.client
      .from(SUPABASE_TABLE.PublicTournamentMatches)
      .select("*")
      .order("starts_at", { ascending: true });
    if (tournamentId) {
      query = query.eq("tournament_id", tournamentId);
    }
    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []).map((match) => ({
      ...match,
      home_score: Number(match.home_score || 0),
      away_score: Number(match.away_score || 0),
    })) as PublicTournamentMatch[];
  }

  async listPublicStandings(
    tournamentId?: string,
  ): Promise<PublicTournamentStanding[]> {
    let query = this.supabase.client
      .from(SUPABASE_TABLE.PublicTournamentStandings)
      .select("*")
      .order("rank", { ascending: true });
    if (tournamentId) {
      query = query.eq("tournament_id", tournamentId);
    }
    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []).map((standing) => ({
      ...standing,
      played: Number(standing.played || 0),
      wins: Number(standing.wins || 0),
      draws: Number(standing.draws || 0),
      losses: Number(standing.losses || 0),
      goals_for: Number(standing.goals_for || 0),
      goals_against: Number(standing.goals_against || 0),
      goal_diff: Number(standing.goal_diff || 0),
      points: Number(standing.points || 0),
      rank: Number(standing.rank || 0),
    })) as PublicTournamentStanding[];
  }

  subscribeToPublicMatchChanges(
    onChange: () => void,
    tournamentId?: string,
  ): RealtimeChannel {
    const channel = this.supabase.client.channel(
      tournamentId
        ? `public-tournament-matches:${tournamentId}`
        : "public-tournament-matches",
    );
    channel
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: SUPABASE_TABLE.TournamentMatches,
          ...(tournamentId
            ? { filter: `tournament_id=eq.${tournamentId}` }
            : {}),
        },
        onChange,
      )
      .subscribe();
    return channel;
  }

  async unsubscribe(channel: RealtimeChannel): Promise<void> {
    await this.supabase.client.removeChannel(channel);
  }

  private normalizeTournament(
    tournament: OperationalTournament,
    userNames: Record<string, string> = {},
  ): OperationalTournament {
    return {
      ...tournament,
      fee: Number(tournament.fee || 0),
      status: this.normalizeTournamentStatus(tournament.status),
      public_status: this.normalizePublicStatus(tournament.public_status),
      published_at: tournament.published_at ?? null,
      tournament_teams: [...(tournament.tournament_teams ?? [])]
        .map((team) => this.normalizeTeam(team, userNames))
        .sort((a, b) => a.name.localeCompare(b.name, "it")),
      tournament_groups: [...(tournament.tournament_groups ?? [])]
        .map((group) => this.normalizeGroup(group))
        .sort((a, b) => (a.seed_index ?? 0) - (b.seed_index ?? 0)),
      tournament_matches: [...(tournament.tournament_matches ?? [])]
        .map((match) => this.normalizeMatch(match))
        .sort((a, b) =>
          `${a.starts_at ?? ""}${a.created_at}`.localeCompare(
            `${b.starts_at ?? ""}${b.created_at}`,
          ),
        ),
      tournament_standings: [...(tournament.tournament_standings ?? [])]
        .map((standing) => this.normalizeStanding(standing))
        .sort((a, b) => a.rank - b.rank),
    };
  }

  private normalizeTeam(
    team: TournamentTeamWithParticipants,
    userNames: Record<string, string> = {},
  ): TournamentTeamWithParticipants {
    return {
      ...team,
      fee: Number(team.fee || 0),
      captain_name: team.captain_name ?? null,
      captain_contact: team.captain_contact ?? null,
      vice_captain_name: team.vice_captain_name ?? null,
      vice_captain_contact: team.vice_captain_contact ?? null,
      created_by_name: team.created_by
        ? (userNames[team.created_by] ?? null)
        : null,
      updated_by_name: team.updated_by
        ? (userNames[team.updated_by] ?? null)
        : null,
      team_participants: [...(team.team_participants ?? [])],
    };
  }

  private async loadTournamentTeamUserNames(
    tournaments: OperationalTournament[],
  ): Promise<Record<string, string>> {
    const ids = tournaments.flatMap((tournament) =>
      (tournament.tournament_teams ?? []).flatMap((team) => [
        team.created_by,
        team.updated_by,
      ]),
    );
    return this.profiles.displayNames(ids);
  }

  private normalizeGroup(group: TournamentGroup): TournamentGroup {
    return {
      ...group,
      seed_index: group.seed_index ?? null,
      tournament_group_teams: [...(group.tournament_group_teams ?? [])]
        .map((item) => this.normalizeGroupTeam(item))
        .sort((a, b) => (a.seed ?? 999) - (b.seed ?? 999)),
    };
  }

  private normalizeGroupTeam(item: TournamentGroupTeam): TournamentGroupTeam {
    return {
      ...item,
      seed: item.seed ?? null,
      tournament_teams: item.tournament_teams ?? null,
    };
  }

  private normalizeMatch(match: TournamentMatch): TournamentMatch {
    return {
      ...match,
      home_score: Number(match.home_score || 0),
      away_score: Number(match.away_score || 0),
      status: this.normalizeMatchStatus(match.status),
      starts_at: match.starts_at ?? null,
      ends_at: match.ends_at ?? null,
      field_label: match.field_label ?? null,
      home_team: match.home_team ?? null,
      away_team: match.away_team ?? null,
      tournament_groups: match.tournament_groups ?? null,
    };
  }

  private normalizeStanding(standing: TournamentStanding): TournamentStanding {
    return {
      ...standing,
      played: Number(standing.played || 0),
      wins: Number(standing.wins || 0),
      draws: Number(standing.draws || 0),
      losses: Number(standing.losses || 0),
      goals_for: Number(standing.goals_for || 0),
      goals_against: Number(standing.goals_against || 0),
      goal_diff: Number(standing.goal_diff || 0),
      points: Number(standing.points || 0),
      rank: Number(standing.rank || 0),
      tournament_teams: standing.tournament_teams ?? null,
      tournament_groups: standing.tournament_groups ?? null,
    };
  }

  private normalizeGenerateResult(value: unknown): GenerateGroupStageResult {
    const row = (value ?? {}) as Partial<GenerateGroupStageResult>;
    return {
      groups_created: Number(row.groups_created || 0),
      teams_assigned: Number(row.teams_assigned || 0),
      matches_created: Number(row.matches_created || 0),
      seeded_used: Number(row.seeded_used || 0),
      note: row.note || "ok",
    };
  }

  private normalizeResetResult(value: unknown): ResetTournamentScheduleResult {
    const row = (value ?? {}) as Partial<ResetTournamentScheduleResult>;
    return {
      groups_deleted: Number(row.groups_deleted || 0),
      matches_deleted: Number(row.matches_deleted || 0),
      standings_deleted: Number(row.standings_deleted || 0),
      group_teams_deleted: Number(row.group_teams_deleted || 0),
    };
  }

  private normalizeTournamentStatus(value: unknown): TournamentStatus {
    const allowed = TOURNAMENT_STATUSES.map((status) => status.id);
    return allowed.includes(value as TournamentStatus)
      ? (value as TournamentStatus)
      : TOURNAMENT_STATUS.RegistrationsOpen;
  }

  private normalizePublicStatus(value: unknown): TournamentPublicStatus {
    const allowed = TOURNAMENT_PUBLIC_STATUSES.map((status) => status.id);
    return allowed.includes(value as TournamentPublicStatus)
      ? (value as TournamentPublicStatus)
      : TOURNAMENT_PUBLIC_STATUS.Hidden;
  }

  private normalizeMatchStatus(value: unknown): TournamentMatchStatus {
    const allowed = TOURNAMENT_MATCH_STATUSES.map((status) => status.id);
    return allowed.includes(value as TournamentMatchStatus)
      ? (value as TournamentMatchStatus)
      : TOURNAMENT_MATCH_STATUS.Scheduled;
  }
}

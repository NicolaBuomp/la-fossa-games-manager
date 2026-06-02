import { Injectable } from "@angular/core";
import {
  InsertTeamParticipant,
  InsertTournament,
  InsertTournamentTeam,
  Registration,
  TeamParticipant,
  Tournament,
  TournamentTeam,
  TournamentTeamWithParticipants,
  TournamentWithTeams,
} from "../types/models";
import {
  DEFAULT_TOURNAMENTS,
  DEFAULT_TOURNAMENT_CODES,
  SUPABASE_TABLE,
  TOURNAMENT_PUBLIC_STATUS,
  TOURNAMENT_STATUS,
} from "../types/constants";
import { ProfileService } from "./profile.service";
import { SupabaseService } from "./supabase.service";

export { DEFAULT_TOURNAMENT_CODES };

@Injectable({ providedIn: "root" })
export class RegistrationsService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly profiles: ProfileService,
  ) {}

  async list(): Promise<Registration[]> {
    const tournaments = await this.listTournaments();
    const registrations = tournaments.flatMap((tournament) =>
      tournament.tournament_teams.map((team) => ({
        id: team.id,
        name: team.name,
        tournament: tournament.name,
        contact: null,
        fee: Number(tournament.fee || 0),
        paid: team.paid,
        registration_date: team.created_at.slice(0, 10),
        notes: team.notes,
        created_by: team.created_by,
        updated_by: team.updated_by,
        created_at: team.created_at,
        updated_at: team.updated_at,
      })),
    );
    return registrations.sort((a, b) =>
      b.created_at.localeCompare(a.created_at),
    );
  }

  async listTournaments(): Promise<TournamentWithTeams[]> {
    await this.ensureDefaultTournaments();
    const { data, error } = await this.supabase.client
      .from(SUPABASE_TABLE.Tournaments)
      .select("*, tournament_teams(*, team_participants(*))")
      .in(
        "code",
        DEFAULT_TOURNAMENTS.map((tournament) => tournament.code),
      );
    if (error) throw error;

    const byCode = new Map(
      ((data ?? []) as TournamentWithTeams[]).map((tournament) => [
        tournament.code,
        tournament,
      ]),
    );
    const tournaments = DEFAULT_TOURNAMENTS.map((definition) =>
      byCode.get(definition.code),
    ).filter((tournament): tournament is TournamentWithTeams =>
      Boolean(tournament),
    );
    const userNames = await this.loadTeamUserNames(tournaments);
    return tournaments.map((tournament) =>
      this.normalizeTournament(tournament, userNames),
    );
  }

  async createTournament(payload: InsertTournament): Promise<Tournament> {
    const { data, error } = await this.supabase.client
      .from(SUPABASE_TABLE.Tournaments)
      .insert(payload)
      .select()
      .single();
    if (error) throw error;
    return data as Tournament;
  }

  private async ensureDefaultTournaments(): Promise<void> {
    const { error } = await this.supabase.client.from("tournaments").upsert(
      DEFAULT_TOURNAMENTS.map((tournament) => ({
        code: tournament.code,
        name: tournament.name,
        fee: tournament.fee ?? 0,
        status: TOURNAMENT_STATUS.RegistrationsOpen,
        public_status: TOURNAMENT_PUBLIC_STATUS.RegistrationsOpen,
      })),
      { onConflict: "code", ignoreDuplicates: true },
    );
    if (error) throw error;
  }

  private normalizeTeam(
    team: TournamentTeamWithParticipants,
    userNames: Record<string, string> = {},
  ): TournamentTeamWithParticipants {
    return {
      ...team,
      captain_name: team.captain_name ?? null,
      captain_contact: team.captain_contact ?? null,
      vice_captain_name: team.vice_captain_name ?? null,
      vice_captain_contact: team.vice_captain_contact ?? null,
      created_by_name: this.resolveUserName(team.created_by, userNames),
      updated_by_name: this.resolveUserName(team.updated_by, userNames),
      fee: Number(team.fee || 0),
      team_participants: [...(team.team_participants ?? [])]
        .map((participant) => ({
          ...participant,
          registered: Boolean(participant.registered),
        }))
        .sort((a, b) =>
          `${a.last_name} ${a.first_name}`.localeCompare(
            `${b.last_name} ${b.first_name}`,
            "it",
          ),
        ),
    };
  }

  private normalizeTournament(
    tournament: TournamentWithTeams,
    userNames: Record<string, string> = {},
  ): TournamentWithTeams {
    return {
      ...tournament,
      fee: Number(tournament.fee || 0),
      status: tournament.status ?? TOURNAMENT_STATUS.RegistrationsOpen,
      public_status: tournament.public_status ?? TOURNAMENT_PUBLIC_STATUS.RegistrationsOpen,
      published_at: tournament.published_at ?? null,
      tournament_teams: [...(tournament.tournament_teams ?? [])]
        .sort((a, b) => a.name.localeCompare(b.name, "it"))
        .map((team) => this.normalizeTeam(team, userNames)),
    };
  }

  private async loadTeamUserNames(
    tournaments: TournamentWithTeams[],
  ): Promise<Record<string, string>> {
    const ids = tournaments.flatMap((tournament) =>
      (tournament.tournament_teams ?? []).flatMap((team) => [
        team.created_by,
        team.updated_by,
      ]),
    );
    return this.profiles.displayNames(ids);
  }

  private resolveUserName(
    userId: string | null,
    userNames: Record<string, string>,
  ): string | null {
    if (!userId) return null;
    return userNames[userId] ?? userId;
  }

  async getTournamentWithTeams(id: string): Promise<TournamentWithTeams | null> {
    const { data, error } = await this.supabase.client
      .from(SUPABASE_TABLE.Tournaments)
      .select("*, tournament_teams(*, team_participants(*))")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    const tournament = data as TournamentWithTeams;
    const userNames = await this.loadTeamUserNames([tournament]);
    return this.normalizeTournament(tournament, userNames);
  }

  async getTeamWithParticipants(teamId: string): Promise<TournamentTeamWithParticipants | null> {
    const { data, error } = await this.supabase.client
      .from(SUPABASE_TABLE.TournamentTeams)
      .select("*, team_participants(*)")
      .eq("id", teamId)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    const team = data as TournamentTeamWithParticipants;
    const userNames = await this.profiles.displayNames([
      team.created_by,
      team.updated_by,
    ]);
    return this.normalizeTeam(team, userNames);
  }

  async updateTournament(
    id: string,
    payload: Partial<InsertTournament>,
  ): Promise<Tournament> {
    const { data, error } = await this.supabase.client
      .from(SUPABASE_TABLE.Tournaments)
      .update(payload)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data as Tournament;
  }

  async removeTournament(id: string): Promise<void> {
    const { error } = await this.supabase.client
      .from(SUPABASE_TABLE.Tournaments)
      .delete()
      .eq("id", id);
    if (error) throw error;
  }

  async createTeam(payload: InsertTournamentTeam): Promise<TournamentTeam> {
    const { data, error } = await this.supabase.client
      .from(SUPABASE_TABLE.TournamentTeams)
      .insert(payload)
      .select()
      .single();
    if (error) throw error;
    return data as TournamentTeam;
  }

  async updateTeam(
    id: string,
    payload: Partial<InsertTournamentTeam>,
  ): Promise<TournamentTeam> {
    const { data, error } = await this.supabase.client
      .from(SUPABASE_TABLE.TournamentTeams)
      .update(payload)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data as TournamentTeam;
  }

  async removeTeam(id: string): Promise<void> {
    const { error } = await this.supabase.client
      .from(SUPABASE_TABLE.TournamentTeams)
      .delete()
      .eq("id", id);
    if (error) throw error;
  }

  async createParticipant(
    payload: InsertTeamParticipant,
  ): Promise<TeamParticipant> {
    const { data, error } = await this.supabase.client
      .from(SUPABASE_TABLE.TeamParticipants)
      .insert(payload)
      .select()
      .single();
    if (error) throw error;
    return data as TeamParticipant;
  }

  async updateParticipant(
    id: string,
    payload: Partial<InsertTeamParticipant>,
  ): Promise<TeamParticipant> {
    const { data, error } = await this.supabase.client
      .from(SUPABASE_TABLE.TeamParticipants)
      .update(payload)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data as TeamParticipant;
  }

  async removeParticipant(id: string): Promise<void> {
    const { error } = await this.supabase.client
      .from(SUPABASE_TABLE.TeamParticipants)
      .delete()
      .eq("id", id);
    if (error) throw error;
  }
}

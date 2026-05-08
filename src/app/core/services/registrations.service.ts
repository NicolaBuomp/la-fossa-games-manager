import { Injectable } from '@angular/core';
import { CrudService } from './crud.service';
import { SupabaseService } from './supabase.service';
import {
  InsertRegistration,
  InsertTeamParticipant,
  InsertTournament,
  InsertTournamentTeam,
  Registration,
  TeamParticipant,
  Tournament,
  TournamentSport,
  TournamentTeam,
  TournamentWithTeams
} from '../types/models';

const DEFAULT_TOURNAMENTS: { code: string; name: string; sport: TournamentSport }[] = [
  { code: 'calcio-a-5', name: 'Calcio a 5', sport: 'calcio' },
  { code: 'calcio-a-5-under-14', name: 'Calcio a 5 Under 14', sport: 'calcio' },
  { code: 'pallavolo', name: 'Pallavolo', sport: 'pallavolo' },
  { code: 'briscola', name: 'Briscola', sport: 'altro' },
  { code: 'fifa', name: 'Fifa', sport: 'altro' },
  { code: 'ping-pong', name: 'Ping Pong', sport: 'altro' },
  { code: 'calcio-balilla', name: 'Calcio Balilla', sport: 'altro' }
];

@Injectable({ providedIn: 'root' })
export class RegistrationsService extends CrudService<Registration, InsertRegistration> {
  constructor(supabase: SupabaseService) {
    super(supabase, 'registrations', 'registration_date');
  }

  override async list(): Promise<Registration[]> {
    const tournaments = await this.listTournaments();
    return tournaments.flatMap((tournament) =>
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
        updated_at: team.updated_at
      }))
    );
  }

  async listTournaments(): Promise<TournamentWithTeams[]> {
    await this.ensureDefaultTournaments();
    const { data, error } = await this.supabase.client
      .from('tournaments')
      .select('*, tournament_teams(*, team_participants(*))')
      .in('code', DEFAULT_TOURNAMENTS.map((tournament) => tournament.code));
    if (error) throw error;

    const byCode = new Map(((data ?? []) as TournamentWithTeams[]).map((tournament) => [tournament.code, tournament]));
    return DEFAULT_TOURNAMENTS.map((definition) => byCode.get(definition.code))
      .filter((tournament): tournament is TournamentWithTeams => Boolean(tournament))
      .map((tournament) => this.normalizeTournament(tournament));
  }

  async createTournament(payload: InsertTournament): Promise<Tournament> {
    const { data, error } = await this.supabase.client.from('tournaments').insert(payload).select().single();
    if (error) throw error;
    return data as Tournament;
  }

  private async ensureDefaultTournaments(): Promise<void> {
    const { error } = await this.supabase.client.from('tournaments').upsert(
      DEFAULT_TOURNAMENTS.map((tournament) => ({
        code: tournament.code,
        name: tournament.name,
        sport: tournament.sport
      })),
      { onConflict: 'code', ignoreDuplicates: true }
    );
    if (error) throw error;
  }

  private normalizeTournament(tournament: TournamentWithTeams): TournamentWithTeams {
    return {
      ...tournament,
      sport: tournament.sport ?? 'altro',
      fee: Number(tournament.fee || 0),
      tournament_teams: [...(tournament.tournament_teams ?? [])]
        .sort((a, b) => a.name.localeCompare(b.name, 'it'))
        .map((team) => ({
          ...team,
          captain_name: team.captain_name ?? null,
          captain_contact: team.captain_contact ?? null,
          vice_captain_name: team.vice_captain_name ?? null,
          vice_captain_contact: team.vice_captain_contact ?? null,
          fee: Number(team.fee || 0),
          team_participants: [...(team.team_participants ?? [])]
            .map((participant) => ({
              ...participant,
              gender: participant.gender ?? 'uomo',
              registered: Boolean(participant.registered)
            }))
            .sort((a, b) => `${a.last_name} ${a.first_name}`.localeCompare(`${b.last_name} ${b.first_name}`, 'it'))
        }))
    };
  }

  async updateTournament(id: string, payload: Partial<InsertTournament>): Promise<Tournament> {
    const { data, error } = await this.supabase.client.from('tournaments').update(payload).eq('id', id).select().single();
    if (error) throw error;
    return data as Tournament;
  }

  async removeTournament(id: string): Promise<void> {
    const { error } = await this.supabase.client.from('tournaments').delete().eq('id', id);
    if (error) throw error;
  }

  async createTeam(payload: InsertTournamentTeam): Promise<TournamentTeam> {
    const { data, error } = await this.supabase.client.from('tournament_teams').insert(payload).select().single();
    if (error) throw error;
    return data as TournamentTeam;
  }

  async updateTeam(id: string, payload: Partial<InsertTournamentTeam>): Promise<TournamentTeam> {
    const { data, error } = await this.supabase.client.from('tournament_teams').update(payload).eq('id', id).select().single();
    if (error) throw error;
    return data as TournamentTeam;
  }

  async removeTeam(id: string): Promise<void> {
    const { error } = await this.supabase.client.from('tournament_teams').delete().eq('id', id);
    if (error) throw error;
  }

  async createParticipant(payload: InsertTeamParticipant): Promise<TeamParticipant> {
    const { data, error } = await this.supabase.client.from('team_participants').insert(payload).select().single();
    if (error) throw error;
    return data as TeamParticipant;
  }

  async updateParticipant(id: string, payload: Partial<InsertTeamParticipant>): Promise<TeamParticipant> {
    const { data, error } = await this.supabase.client.from('team_participants').update(payload).eq('id', id).select().single();
    if (error) throw error;
    return data as TeamParticipant;
  }

  async removeParticipant(id: string): Promise<void> {
    const { error } = await this.supabase.client.from('team_participants').delete().eq('id', id);
    if (error) throw error;
  }
}

import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { InsertParticipationRequest, InsertSponsor, PublicTournament } from '../types/models';
import { SUPABASE_TABLE, TOURNAMENT_PUBLIC_STATUS } from '../types/constants';

@Injectable({ providedIn: 'root' })
export class PublicParticipationService {
  constructor(private readonly supabase: SupabaseService) {}

  async listAvailableTournaments(): Promise<PublicTournament[]> {
    const { data, error } = await this.supabase.client
      .from(SUPABASE_TABLE.Tournaments)
      .select('id, name, code, fee, public_status')
      .neq('public_status', TOURNAMENT_PUBLIC_STATUS.Hidden)
      .order('name', { ascending: true });

    if (error) throw error;
    return (data ?? []).map((tournament) => ({
      id: tournament.id,
      name: tournament.name,
      code: tournament.code,
      fee: Number(tournament.fee || 0),
      public_status: tournament.public_status,
    })) as PublicTournament[];
  }

  async createRequest(payload: InsertParticipationRequest): Promise<void> {
    const { error } = await this.supabase.client.from(SUPABASE_TABLE.ParticipationRequests).insert(payload);
    if (error) throw error;
  }

  async createSponsorLead(payload: InsertSponsor): Promise<void> {
    const { error } = await this.supabase.client.from(SUPABASE_TABLE.Sponsors).insert(payload);
    if (error) throw error;
  }
}

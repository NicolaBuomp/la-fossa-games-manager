import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { InsertParticipationRequest, PublicTournament } from '../types/models';

@Injectable({ providedIn: 'root' })
export class PublicParticipationService {
  constructor(private readonly supabase: SupabaseService) {}

  async listAvailableTournaments(): Promise<PublicTournament[]> {
    const { data, error } = await this.supabase.client
      .from('tournaments')
      .select('id, name, sport, fee, date')
      .order('name', { ascending: true });

    if (error) throw error;
    return (data ?? []).map((tournament) => ({
      ...tournament,
      fee: Number(tournament.fee || 0)
    })) as PublicTournament[];
  }

  async createRequest(payload: InsertParticipationRequest): Promise<void> {
    const { error } = await this.supabase.client.from('participation_requests').insert(payload);
    if (error) throw error;
  }
}

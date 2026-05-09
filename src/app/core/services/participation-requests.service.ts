import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { ParticipationRequest, ParticipationRequestWithTournament } from '../types/models';

type RequestStatus = ParticipationRequest['status'];

@Injectable({ providedIn: 'root' })
export class ParticipationRequestsService {
  constructor(private readonly supabase: SupabaseService) {}

  async list(): Promise<ParticipationRequestWithTournament[]> {
    const { data, error } = await this.supabase.client
      .from('participation_requests')
      .select('*, tournaments(name), participation_request_notes(*, profiles(full_name, email))')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return ((data ?? []) as ParticipationRequestWithTournament[]).map((request) => ({
      ...request,
      participation_request_notes: [...(request.participation_request_notes ?? [])].sort((a, b) => b.created_at.localeCompare(a.created_at))
    }));
  }

  async pendingCount(): Promise<number> {
    const { count, error } = await this.supabase.client
      .from('participation_requests')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'nuova');
    if (error) throw error;
    return count ?? 0;
  }

  async updateStatus(id: string, status: RequestStatus): Promise<void> {
    const { error } = await this.supabase.client.from('participation_requests').update({ status }).eq('id', id);
    if (error) throw error;
  }

  async addNote(requestId: string, note: string): Promise<void> {
    const {
      data: { user },
      error: userError
    } = await this.supabase.client.auth.getUser();
    if (userError) throw userError;

    const { error } = await this.supabase.client
      .from('participation_request_notes')
      .insert({ request_id: requestId, note, created_by: user?.id ?? null });
    if (error) throw error;
  }

  async remove(id: string): Promise<void> {
    const { error } = await this.supabase.client.from('participation_requests').delete().eq('id', id);
    if (error) throw error;
  }
}

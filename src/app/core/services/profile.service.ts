import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Profile, UserRole } from '../types/models';

@Injectable({ providedIn: 'root' })
export class ProfileService {
  constructor(private readonly supabase: SupabaseService) {}

  async list(): Promise<Profile[]> {
    const { data, error } = await this.supabase.client
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as Profile[];
  }

  async updateRole(id: string, role: UserRole): Promise<void> {
    const { error } = await this.supabase.client.from('profiles').update({ role }).eq('id', id);
    if (error) throw error;
  }

  async setActive(id: string, active: boolean): Promise<void> {
    const { error } = await this.supabase.client.from('profiles').update({ active }).eq('id', id);
    if (error) throw error;
  }
}

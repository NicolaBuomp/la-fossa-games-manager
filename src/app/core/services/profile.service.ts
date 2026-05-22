import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { CreateUserInput, CreateUserResult, Profile, ResetPasswordResult, UserRole } from '../types/models';

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

  async createUser(input: CreateUserInput): Promise<CreateUserResult> {
    const { data, error } = await this.supabase.client.functions.invoke<CreateUserResult>('admin-create-user', {
      body: input
    });
    if (error) throw error;
    if (!data) throw new Error('Creazione utente non riuscita.');
    return data;
  }

  async resetPassword(id: string): Promise<ResetPasswordResult> {
    const { data, error } = await this.supabase.client.functions.invoke<ResetPasswordResult>('admin-reset-password', {
      body: { id }
    });
    if (error) throw error;
    if (!data) throw new Error('Reset password non riuscito.');
    return data;
  }

  async updateRoles(id: string, roles: UserRole[]): Promise<void> {
    const { error } = await this.supabase.client.rpc('update_user_roles', {
      target_user_id: id,
      new_roles: roles,
    });
    if (error) throw error;
  }

  async setActive(id: string, active: boolean): Promise<void> {
    const { error } = await this.supabase.client.from('profiles').update({ active }).eq('id', id);
    if (error) throw error;
  }

  async updateOwnFullName(fullName: string): Promise<void> {
    const { error } = await this.supabase.client.rpc('update_own_profile_name', { profile_full_name: fullName });
    if (error) throw error;
  }

  async displayNames(ids: Array<string | null | undefined>): Promise<Record<string, string>> {
    const userIds = [...new Set(ids.filter((id): id is string => Boolean(id)))];
    if (!userIds.length) return {};

    const { data, error } = await this.supabase.client.rpc('user_display_names', { user_ids: userIds });
    if (error) throw error;
    return Object.fromEntries(((data ?? []) as { id: string; display_name: string }[]).map((item) => [item.id, item.display_name]));
  }
}

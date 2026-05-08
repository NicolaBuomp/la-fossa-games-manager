import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { AuditLog } from '../types/models';

@Injectable({ providedIn: 'root' })
export class AuditLogService {
  constructor(private readonly supabase: SupabaseService) {}

  async recent(limit = 12): Promise<AuditLog[]> {
    const { data, error } = await this.supabase.client
      .from('audit_logs')
      .select('*')
      .order('changed_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data ?? []) as AuditLog[];
  }
}

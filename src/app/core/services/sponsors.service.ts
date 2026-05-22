import { Injectable } from '@angular/core';
import { CrudService } from './crud.service';
import { SupabaseService } from './supabase.service';
import { InsertSponsor, Sponsor } from '../types/models';
import {
  PUBLIC_SPONSOR_LEAD_DELIVERABLES,
  SPONSOR_STATUS,
  SPONSOR_TYPE,
  SUPABASE_TABLE,
} from '../types/constants';

@Injectable({ providedIn: 'root' })
export class SponsorsService extends CrudService<Sponsor, InsertSponsor> {
  constructor(supabase: SupabaseService) {
    super(supabase, SUPABASE_TABLE.Sponsors, 'created_at');
  }

  async pendingLeadCount(): Promise<number> {
    const { count, error } = await this.supabase.client
      .from(SUPABASE_TABLE.Sponsors)
      .select('id', { count: 'exact', head: true })
      .eq('status', SPONSOR_STATUS.Contacted)
      .eq('type', SPONSOR_TYPE.Cash)
      .eq('value', 0)
      .eq('deliverables', PUBLIC_SPONSOR_LEAD_DELIVERABLES);
    if (error) throw error;
    return count ?? 0;
  }
}

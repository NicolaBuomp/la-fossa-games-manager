import { Injectable } from '@angular/core';
import { CrudService } from './crud.service';
import { SupabaseService } from './supabase.service';
import { InsertSponsor, PagedResult, Sponsor, SponsorsSummary, SponsorStatus } from '../types/models';
import {
  FILTER_ALL,
  PAGE_SIZE,
  PUBLIC_SPONSOR_LEAD_DELIVERABLES,
  SPONSOR_STATUS,
  SUPABASE_RPC,
  SUPABASE_TABLE,
} from '../types/constants';

export interface SponsorListParams {
  search?: string;
  status?: SponsorStatus | typeof FILTER_ALL;
  page?: number;
  pageSize?: number;
  userId?: string;
}

@Injectable({ providedIn: 'root' })
export class SponsorsService extends CrudService<Sponsor, InsertSponsor> {
  constructor(supabase: SupabaseService) {
    super(supabase, SUPABASE_TABLE.Sponsors, 'created_at');
  }

  async listPaged(params: SponsorListParams = {}): Promise<PagedResult<Sponsor>> {
    const { page = 1, pageSize = PAGE_SIZE, search, status, userId } = params;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = this.supabase.client
      .from(SUPABASE_TABLE.Sponsors)
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (userId) {
      query = query.or(`responsible_user_id.eq.${userId},created_by.eq.${userId}`);
    }
    if (status && status !== FILTER_ALL) {
      query = query.eq('status', status);
    }
    if (search) {
      query = query.or(`company_name.ilike.%${search}%,contact_name.ilike.%${search}%`);
    }

    query = query.range(from, to);

    const { data, error, count } = await query;
    if (error) throw error;
    return { data: (data ?? []) as Sponsor[], total: count ?? 0 };
  }

  async summary(userId?: string): Promise<SponsorsSummary> {
    const { data, error } = await this.supabase.client.rpc(SUPABASE_RPC.GetSponsorsSummary, {
      p_user_id: userId ?? null,
    });
    if (error) throw error;
    const r = data as Record<string, unknown> | null;
    return {
      contactedCount:     Number(r?.['contactedCount'] ?? 0),
      negotiatingCount:   Number(r?.['negotiatingCount'] ?? 0),
      confirmedPaidCount: Number(r?.['confirmedPaidCount'] ?? 0),
      promisedTotal:      Number(r?.['promisedTotal'] ?? 0),
      receivedTotal:      Number(r?.['receivedTotal'] ?? 0),
    };
  }

  async pendingLeadCount(): Promise<number> {
    const { count, error } = await this.supabase.client
      .from(SUPABASE_TABLE.Sponsors)
      .select('id', { count: 'exact', head: true })
      .eq('status', SPONSOR_STATUS.Contacted)
      .eq('deliverables', PUBLIC_SPONSOR_LEAD_DELIVERABLES);
    if (error) throw error;
    return count ?? 0;
  }
}

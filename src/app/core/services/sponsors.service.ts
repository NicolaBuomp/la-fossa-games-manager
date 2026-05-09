import { Injectable } from '@angular/core';
import { CrudService } from './crud.service';
import { SupabaseService } from './supabase.service';
import { InsertSponsor, Sponsor } from '../types/models';

@Injectable({ providedIn: 'root' })
export class SponsorsService extends CrudService<Sponsor, InsertSponsor> {
  constructor(supabase: SupabaseService) {
    super(supabase, 'sponsors', 'created_at');
  }

  async pendingLeadCount(): Promise<number> {
    const { count, error } = await this.supabase.client
      .from('sponsors')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'contattato')
      .eq('type', 'cash')
      .eq('value', 0)
      .eq('deliverables', 'Richiesta informazioni sponsor dal sito pubblico');
    if (error) throw error;
    return count ?? 0;
  }
}

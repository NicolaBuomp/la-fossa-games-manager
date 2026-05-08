import { Injectable } from '@angular/core';
import { CrudService } from './crud.service';
import { SupabaseService } from './supabase.service';
import { InsertSponsor, Sponsor } from '../types/models';

@Injectable({ providedIn: 'root' })
export class SponsorsService extends CrudService<Sponsor, InsertSponsor> {
  constructor(supabase: SupabaseService) {
    super(supabase, 'sponsors', 'created_at');
  }
}

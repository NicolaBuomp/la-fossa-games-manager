import { Injectable } from '@angular/core';
import { CrudService } from './crud.service';
import { SupabaseService } from './supabase.service';
import { Income, InsertIncome } from '../types/models';

@Injectable({ providedIn: 'root' })
export class IncomesService extends CrudService<Income, InsertIncome> {
  constructor(supabase: SupabaseService) {
    super(supabase, 'incomes', 'date');
  }
}

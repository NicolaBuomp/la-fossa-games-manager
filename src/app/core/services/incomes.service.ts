import { Injectable } from '@angular/core';
import { CrudService } from './crud.service';
import { SupabaseService } from './supabase.service';
import { Income, InsertIncome } from '../types/models';
import { SUPABASE_TABLE } from '../types/constants';

@Injectable({ providedIn: 'root' })
export class IncomesService extends CrudService<Income, InsertIncome> {
  constructor(private readonly sb: SupabaseService) {
    super(sb, SUPABASE_TABLE.Incomes, 'date');
  }

  async updateFatturazione(
    id: string,
    patch: Partial<Pick<Income, 'da_fatturare' | 'fattura_emessa'>>,
  ): Promise<void> {
    const { error } = await this.sb.client
      .from(SUPABASE_TABLE.Incomes)
      .update(patch)
      .eq('id', id);
    if (error) throw error;
  }
}

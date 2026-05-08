import { Injectable } from '@angular/core';
import { CrudService } from './crud.service';
import { SupabaseService } from './supabase.service';
import { Expense, InsertExpense } from '../types/models';

@Injectable({ providedIn: 'root' })
export class ExpensesService extends CrudService<Expense, InsertExpense> {
  constructor(supabase: SupabaseService) {
    super(supabase, 'expenses', 'date');
  }
}

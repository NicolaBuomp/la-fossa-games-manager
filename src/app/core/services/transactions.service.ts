import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { DeliveryItem, Transaction } from '../types/models';

export interface TransactionFilters {
  type?: 'income' | 'expense' | 'all';
  category?: string;
  deliveryStatus?: 'pending' | 'delivered' | 'all';
  dateFrom?: string;
  dateTo?: string;
}

@Injectable({ providedIn: 'root' })
export class TransactionsService {
  constructor(private readonly supabase: SupabaseService) {}

  async list(filters: TransactionFilters = {}): Promise<Transaction[]> {
    let query = this.supabase.client
      .from('transactions_view')
      .select('*')
      .order('date', { ascending: false })
      .order('created_at', { ascending: false });

    if (filters.type && filters.type !== 'all') {
      query = query.eq('type', filters.type);
    }
    if (filters.category) {
      query = query.eq('category', filters.category);
    }
    if (filters.deliveryStatus === 'pending') {
      query = query.eq('delivered_to_treasurer', false).eq('type', 'income');
    } else if (filters.deliveryStatus === 'delivered') {
      query = query.eq('delivered_to_treasurer', true).eq('type', 'income');
    }
    if (filters.dateFrom) {
      query = query.gte('date', filters.dateFrom);
    }
    if (filters.dateTo) {
      query = query.lte('date', filters.dateTo);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as Transaction[];
  }

  async markDelivered(items: DeliveryItem[], deliveredBy: string): Promise<void> {
    const { error } = await this.supabase.client.rpc('mark_transaction_delivered', {
      p_items: items,
      p_delivered_by: deliveredBy,
    });
    if (error) throw error;
  }
}

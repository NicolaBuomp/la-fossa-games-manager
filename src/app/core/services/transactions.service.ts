import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { DeliveryItem, Transaction, TransactionType } from '../types/models';
import {
  DELIVERY_STATUS,
  DeliveryStatusFilter,
  FILTER_ALL,
  SUPABASE_RPC,
  SUPABASE_TABLE,
  TRANSACTION_TYPE,
} from '../types/constants';

export interface TransactionFilters {
  type?: TransactionType | typeof FILTER_ALL;
  category?: string;
  deliveryStatus?: DeliveryStatusFilter;
  dateFrom?: string;
  dateTo?: string;
}

@Injectable({ providedIn: 'root' })
export class TransactionsService {
  constructor(private readonly supabase: SupabaseService) {}

  async list(filters: TransactionFilters = {}): Promise<Transaction[]> {
    let query = this.supabase.client
      .from(SUPABASE_TABLE.TransactionsView)
      .select('*')
      .order('date', { ascending: false })
      .order('created_at', { ascending: false });

    if (filters.type && filters.type !== FILTER_ALL) {
      query = query.eq('type', filters.type);
    }
    if (filters.category) {
      query = query.eq('category', filters.category);
    }
    if (filters.deliveryStatus === DELIVERY_STATUS.Pending) {
      query = query.eq('delivered_to_treasurer', false).eq('type', TRANSACTION_TYPE.Income);
    } else if (filters.deliveryStatus === DELIVERY_STATUS.Delivered) {
      query = query.eq('delivered_to_treasurer', true).eq('type', TRANSACTION_TYPE.Income);
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
    const { error } = await this.supabase.client.rpc(SUPABASE_RPC.MarkTransactionDelivered, {
      p_items: items,
      p_delivered_by: deliveredBy,
    });
    if (error) throw error;
  }
}

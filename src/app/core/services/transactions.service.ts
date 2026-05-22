import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { DeliveryItem, PagedResult, Transaction, TransactionSummary, TransactionType } from '../types/models';
import {
  DELIVERY_STATUS,
  DeliveryStatusFilter,
  FILTER_ALL,
  PAGE_SIZE,
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
  search?: string;
  page?: number;
  pageSize?: number;
}

@Injectable({ providedIn: 'root' })
export class TransactionsService {
  constructor(private readonly supabase: SupabaseService) {}

  async list(filters: TransactionFilters = {}): Promise<PagedResult<Transaction>> {
    const { page = 1, pageSize = PAGE_SIZE } = filters;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = this.supabase.client
      .from(SUPABASE_TABLE.TransactionsView)
      .select('*', { count: 'exact' })
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
    if (filters.search) {
      query = query.ilike('description', `%${filters.search}%`);
    }

    query = query.range(from, to);

    const { data, error, count } = await query;
    if (error) throw error;
    return { data: (data ?? []) as Transaction[], total: count ?? 0 };
  }

  async summary(): Promise<TransactionSummary> {
    const { data, error } = await this.supabase.client
      .from(SUPABASE_TABLE.TransactionsView)
      .select('amount, type, delivered_to_treasurer');
    if (error) throw error;
    const rows = (data ?? []) as Pick<Transaction, 'amount' | 'type' | 'delivered_to_treasurer'>[];
    const incomes = rows.filter((r) => r.type === TRANSACTION_TYPE.Income);
    const expenses = rows.filter((r) => r.type === TRANSACTION_TYPE.Expense);
    const pendingIncomes = incomes.filter((r) => !r.delivered_to_treasurer);
    return {
      totalIncomes: incomes.reduce((s, r) => s + Number(r.amount || 0), 0),
      totalExpenses: expenses.reduce((s, r) => s + Number(r.amount || 0), 0),
      incomeCount: incomes.length,
      expenseCount: expenses.length,
      pendingDelivery: pendingIncomes.reduce((s, r) => s + Number(r.amount || 0), 0),
      pendingDeliveryCount: pendingIncomes.length,
    };
  }

  async markDelivered(items: DeliveryItem[], deliveredBy: string): Promise<void> {
    const { error } = await this.supabase.client.rpc(SUPABASE_RPC.MarkTransactionDelivered, {
      p_items: items,
      p_delivered_by: deliveredBy,
    });
    if (error) throw error;
  }
}

import { Injectable } from "@angular/core";
import { AuditLog } from "../types/models";
import { FILTER_ALL, SUPABASE_TABLE } from "../types/constants";
import { SupabaseService } from "./supabase.service";

export type AuditActionFilter = AuditLog["action"] | typeof FILTER_ALL;

export interface AuditLogQuery {
  page: number;
  pageSize: number;
  action?: AuditActionFilter;
  changedBy?: string;
  tableName?: string;
}

export interface AuditLogPage {
  rows: AuditLog[];
  total: number;
}

@Injectable({ providedIn: "root" })
export class AuditLogService {
  constructor(private readonly supabase: SupabaseService) {}

  async recent(limit = 30): Promise<AuditLog[]> {
    const { data, error } = await this.supabase.client
      .from(SUPABASE_TABLE.AuditLogs)
      .select("*")
      .order("changed_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data ?? []) as AuditLog[];
  }

  async page(query: AuditLogQuery): Promise<AuditLogPage> {
    const page = Math.max(1, query.page);
    const pageSize = Math.max(1, query.pageSize);
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let request = this.supabase.client
      .from(SUPABASE_TABLE.AuditLogs)
      .select("*", { count: "exact" })
      .order("changed_at", { ascending: false })
      .range(from, to);

    if (query.action && query.action !== FILTER_ALL) {
      request = request.eq("action", query.action);
    }

    if (query.changedBy) {
      request = request.eq("changed_by", query.changedBy);
    }

    if (query.tableName) {
      request = request.eq("table_name", query.tableName);
    }

    const { data, error, count } = await request;
    if (error) throw error;
    return { rows: (data ?? []) as AuditLog[], total: count ?? 0 };
  }
}

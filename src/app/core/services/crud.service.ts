import { SupabaseService } from './supabase.service';

export abstract class CrudService<T extends { id: string }, I extends object> {
  protected constructor(
    protected readonly supabase: SupabaseService,
    private readonly table: string,
    private readonly orderColumn: string = 'created_at'
  ) {}

  async list(): Promise<T[]> {
    const { data, error } = await this.supabase.client
      .from(this.table)
      .select('*')
      .order(this.orderColumn, { ascending: false });
    if (error) throw error;
    return (data ?? []) as T[];
  }

  async create(payload: I): Promise<T> {
    const { data, error } = await this.supabase.client
      .from(this.table)
      .insert(payload)
      .select()
      .single();
    if (error) throw error;
    return data as T;
  }

  async update(id: string, payload: Partial<I>): Promise<T> {
    const { data, error } = await this.supabase.client
      .from(this.table)
      .update(payload as never)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as T;
  }

  async remove(id: string): Promise<void> {
    const { error } = await this.supabase.client.from(this.table).delete().eq('id', id);
    if (error) throw error;
  }
}

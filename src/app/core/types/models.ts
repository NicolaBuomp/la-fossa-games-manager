export type UserRole = 'staff' | 'admin';
export type SponsorStatus = 'contattato' | 'in_trattativa' | 'confermato' | 'pagato';
export type SponsorType = 'cash' | 'in_natura';

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  role: UserRole;
  active: boolean;
  created_at: string;
}

export interface Expense {
  id: string;
  date: string;
  description: string;
  category: string;
  amount: number;
  paid_by: string | null;
  payment_method: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Income {
  id: string;
  date: string;
  source: string;
  category: string;
  amount: number;
  received_by: string | null;
  payment_method: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Sponsor {
  id: string;
  company_name: string;
  contact_name: string | null;
  contact_info: string | null;
  type: SponsorType;
  value: number;
  status: SponsorStatus;
  deliverables: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Registration {
  id: string;
  name: string;
  tournament: string;
  contact: string | null;
  fee: number;
  paid: boolean;
  registration_date: string;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export type InsertExpense = Omit<Expense, 'id' | 'created_by' | 'created_at' | 'updated_at'>;
export type InsertIncome = Omit<Income, 'id' | 'created_by' | 'created_at' | 'updated_at'>;
export type InsertSponsor = Omit<Sponsor, 'id' | 'created_by' | 'created_at' | 'updated_at'>;
export type InsertRegistration = Omit<Registration, 'id' | 'created_by' | 'created_at' | 'updated_at'>;

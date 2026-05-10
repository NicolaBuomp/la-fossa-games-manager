export type UserRole = 'staff' | 'admin';
export type SponsorStatus = 'contattato' | 'in_trattativa' | 'confermato' | 'pagato';
export type SponsorType = 'cash' | 'in_natura';
export type TournamentSport = 'calcio' | 'pallavolo' | 'altro';
export type ParticipantGender = 'uomo' | 'donna';

export interface Profile {
  id: string;
  email: string | null;
  username: string | null;
  full_name: string | null;
  role: UserRole;
  active: boolean;
  created_at: string;
}

export interface CreateUserInput {
  firstName: string;
  lastName: string;
  username: string;
  role: UserRole;
}

export interface CreateUserResult {
  id: string;
  email: string;
  username: string;
  temporaryPassword: string;
}

export interface ResetPasswordResult {
  id: string;
  username: string;
  temporaryPassword: string;
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
  updated_by: string | null;
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
  updated_by: string | null;
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
  updated_by: string | null;
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
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Tournament {
  id: string;
  code: string | null;
  name: string;
  sport: TournamentSport;
  fee: number;
  date: string | null;
  notes: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface TournamentTeam {
  id: string;
  tournament_id: string;
  name: string;
  captain_name: string | null;
  captain_contact: string | null;
  vice_captain_name: string | null;
  vice_captain_contact: string | null;
  fee: number;
  paid: boolean;
  notes: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface TeamParticipant {
  id: string;
  team_id: string;
  first_name: string;
  last_name: string;
  contact: string | null;
  gender: ParticipantGender;
  registered: boolean;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface TournamentTeamWithParticipants extends TournamentTeam {
  team_participants: TeamParticipant[];
}

export interface TournamentWithTeams extends Tournament {
  tournament_teams: TournamentTeamWithParticipants[];
}

export interface PublicTournament {
  id: string;
  name: string;
  sport: TournamentSport;
  fee: number;
  date: string | null;
}

export interface ParticipationRequest {
  id: string;
  tournament_id: string;
  first_name: string;
  last_name: string;
  phone: string;
  privacy_accepted: boolean;
  whatsapp_accepted: boolean;
  rules_accepted: boolean;
  status: 'nuova' | 'in_gestione' | 'contattata' | 'archiviata';
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ParticipationRequestNote {
  id: string;
  request_id: string;
  note: string;
  created_by: string | null;
  created_at: string;
}

export interface ParticipationRequestNoteWithProfile extends ParticipationRequestNote {
  profiles: Pick<Profile, 'full_name' | 'email'> | null;
}

export interface ParticipationRequestWithTournament extends ParticipationRequest {
  tournaments: Pick<Tournament, 'name'> | null;
  participation_request_notes: ParticipationRequestNoteWithProfile[];
}

export interface AuditLog {
  id: string;
  table_name: string;
  record_id: string;
  action: 'insert' | 'update' | 'delete';
  changed_by: string | null;
  changed_by_name: string | null;
  changed_at: string;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
}

export type InsertExpense = Omit<Expense, 'id' | 'created_by' | 'updated_by' | 'created_at' | 'updated_at'>;
export type InsertIncome = Omit<Income, 'id' | 'created_by' | 'updated_by' | 'created_at' | 'updated_at'>;
export type InsertSponsor = Omit<Sponsor, 'id' | 'created_by' | 'updated_by' | 'created_at' | 'updated_at'>;
export type InsertRegistration = Omit<Registration, 'id' | 'created_by' | 'updated_by' | 'created_at' | 'updated_at'>;
export type InsertTournament = Omit<Tournament, 'id' | 'code' | 'created_by' | 'updated_by' | 'created_at' | 'updated_at'> & { code?: string | null };
export type InsertTournamentTeam = Omit<TournamentTeam, 'id' | 'created_by' | 'updated_by' | 'created_at' | 'updated_at'>;
export type InsertTeamParticipant = Omit<TeamParticipant, 'id' | 'created_by' | 'updated_by' | 'created_at' | 'updated_at'>;
export type InsertParticipationRequest = Omit<ParticipationRequest, 'id' | 'status' | 'updated_by' | 'created_at' | 'updated_at'>;

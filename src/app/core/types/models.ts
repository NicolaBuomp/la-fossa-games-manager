export type UserRole = 'staff' | 'admin' | 'owner' | 'tesoriere';
export type SponsorStatus = 'contattato' | 'in_trattativa' | 'confermato' | 'pagato';
export type SponsorCategory = 'bronzo' | 'argento' | 'oro' | 'platino';
export type ExpenseStatus = 'pagata' | 'da_rimborsare' | 'rimborsata';
export type TournamentStatus =
  | 'draft'
  | 'registrations_open'
  | 'registrations_closed'
  | 'groups_generated'
  | 'in_progress'
  | 'completed'
  | 'archived';
export type TournamentPublicStatus =
  | 'hidden'
  | 'registrations_open'
  | 'published'
  | 'results_published';
export type TournamentMatchStatus =
  | 'scheduled'
  | 'live'
  | 'completed'
  | 'cancelled';
export type ParticipationRequestStatus = 'nuova' | 'in_gestione' | 'contattata' | 'archiviata' | 'trasferita';
export type AuditAction = 'insert' | 'update' | 'delete';

export interface Profile {
  id: string;
  email: string | null;
  username: string | null;
  full_name: string | null;
  roles: UserRole[];
  active: boolean;
  created_at: string;
}

export interface CreateUserInput {
  firstName: string;
  lastName: string;
  username: string;
  roles: UserRole[];
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
  status: ExpenseStatus;
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
  delivered_to_treasurer: boolean;
  delivered_at: string | null;
  delivered_by: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export type TransactionType = 'income' | 'expense';
export type TransactionSourceTable = 'incomes' | 'expenses' | 'tournament_teams' | 'sponsors';

export interface Transaction {
  id: string;
  source_table: TransactionSourceTable;
  source_id: string;
  type: TransactionType;
  date: string;
  description: string;
  category: string;
  amount: number;
  payment_method: string | null;
  person: string | null;
  expense_status: string | null;
  delivered_to_treasurer: boolean;
  delivered_at: string | null;
  delivered_by: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Sponsor {
  id: string;
  company_name: string;
  category: SponsorCategory;
  contact_name: string | null;
  contact_info: string | null;
  promised_amount: number;
  received_amount: number;
  payment_method: string | null;
  responsible_user_id: string | null;
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
  fee: number;
  date: string | null;
  status: TournamentStatus;
  public_status: TournamentPublicStatus;
  published_at: string | null;
  notes: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface TournamentGroupTeam {
  id: string;
  group_id: string;
  team_id: string;
  seed: number | null;
  created_at: string;
  tournament_teams?: Pick<TournamentTeam, 'id' | 'name'> | null;
}

export interface TournamentGroup {
  id: string;
  tournament_id: string;
  name: string;
  seed_index: number | null;
  created_at: string;
  updated_at: string;
  tournament_group_teams?: TournamentGroupTeam[];
}

export interface TournamentMatch {
  id: string;
  tournament_id: string;
  group_id: string | null;
  round_label: string | null;
  home_team_id: string;
  away_team_id: string;
  home_score: number;
  away_score: number;
  status: TournamentMatchStatus;
  starts_at: string | null;
  ends_at: string | null;
  field_label: string | null;
  created_at: string;
  updated_at: string;
  home_team?: Pick<TournamentTeam, 'id' | 'name'> | null;
  away_team?: Pick<TournamentTeam, 'id' | 'name'> | null;
  tournament_groups?: Pick<TournamentGroup, 'name'> | null;
}

export interface TournamentStanding {
  id: string;
  tournament_id: string;
  group_id: string;
  team_id: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goals_for: number;
  goals_against: number;
  goal_diff: number;
  points: number;
  rank: number;
  updated_at: string;
  tournament_teams?: Pick<TournamentTeam, 'id' | 'name'> | null;
  tournament_groups?: Pick<TournamentGroup, 'name'> | null;
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

export interface OperationalTournament extends TournamentWithTeams {
  tournament_groups: TournamentGroup[];
  tournament_matches: TournamentMatch[];
  tournament_standings: TournamentStanding[];
}

export interface PublicTournament {
  id: string;
  name: string;
  code: string | null;
  fee: number;
  date: string | null;
  public_status?: TournamentPublicStatus;
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
  status: ParticipationRequestStatus;
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
  tournaments: Pick<Tournament, 'name' | 'code' | 'fee'> | null;
  participation_request_notes: ParticipationRequestNoteWithProfile[];
}

export interface AuditLog {
  id: string;
  table_name: string;
  record_id: string;
  action: AuditAction;
  changed_by: string | null;
  changed_by_name: string | null;
  changed_at: string;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  operation_id?: string | null;
  summary?: string | null;
  entity_label?: string | null;
  context?: Record<string, unknown> | null;
}

export type InsertExpense = Omit<Expense, 'id' | 'created_by' | 'updated_by' | 'created_at' | 'updated_at'>;
export type InsertIncome = Omit<Income, 'id' | 'delivered_to_treasurer' | 'delivered_at' | 'delivered_by' | 'created_by' | 'updated_by' | 'created_at' | 'updated_at'>;

export interface DeliveryItem {
  source_table: TransactionSourceTable;
  source_id: string;
}
export type InsertSponsor = Omit<Sponsor, 'id' | 'created_by' | 'updated_by' | 'created_at' | 'updated_at'>;
export type InsertTournament = Omit<
  Tournament,
  | 'id'
  | 'code'
  | 'status'
  | 'public_status'
  | 'published_at'
  | 'created_by'
  | 'updated_by'
  | 'created_at'
  | 'updated_at'
> & { code?: string | null };
export type UpdateTournamentPublication = Pick<Tournament, 'status' | 'public_status' | 'published_at'>;
export type InsertTournamentTeam = Omit<TournamentTeam, 'id' | 'created_by' | 'updated_by' | 'created_at' | 'updated_at'>;
export type InsertTeamParticipant = Omit<TeamParticipant, 'id' | 'created_by' | 'updated_by' | 'created_at' | 'updated_at'>;
export type InsertParticipationRequest = Omit<ParticipationRequest, 'id' | 'status' | 'updated_by' | 'created_at' | 'updated_at'>;

export interface PagedResult<T> {
  data: T[];
  total: number;
}

export interface TransactionSummary {
  totalIncomes: number;
  totalExpenses: number;
  incomeCount: number;
  expenseCount: number;
  pendingDelivery: number;
  pendingDeliveryCount: number;
}

export interface SponsorsSummary {
  contactedCount: number;
  negotiatingCount: number;
  confirmedPaidCount: number;
  promisedTotal: number;
  receivedTotal: number;
}

export interface RequestStatusCounts {
  newCount: number;
  managingCount: number;
  contactedCount: number;
  archivedCount: number;
}

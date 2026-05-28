import {
  AuditAction,
  ExpenseStatus,
  ParticipationRequestStatus,
  SponsorCategory,
  SponsorStatus,
  TournamentMatchStatus,
  TournamentPublicStatus,
  TournamentStatus,
  TransactionSourceTable,
  TransactionType,
  UserRole,
} from "./models";

type Option<T extends string> = {
  id: T;
  label: string;
};

type StatusOption<T extends string> = Option<T> & {
  className: string;
};

export const USER_ROLE = {
  Staff: "staff",
  Admin: "admin",
  Owner: "owner",
  Treasurer: "tesoriere",
} as const satisfies Record<string, UserRole>;

export const ASSIGNABLE_ROLES = [
  { value: USER_ROLE.Staff, label: "Staff" },
  { value: USER_ROLE.Admin, label: "Admin" },
  { value: USER_ROLE.Treasurer, label: "Tesoriere" },
] as const satisfies ReadonlyArray<{
  value: Exclude<UserRole, "owner">;
  label: string;
}>;

export const USER_ROLE_BADGE_CLASSES = {
  [USER_ROLE.Owner]: "border-accent bg-accent text-on-accent",
  [USER_ROLE.Admin]: "border-accent bg-accent text-on-accent",
  [USER_ROLE.Treasurer]: "state-warning",
  [USER_ROLE.Staff]: "state-info",
} as const satisfies Record<UserRole, string>;

export const SPONSOR_STATUS = {
  Contacted: "contattato",
  Negotiating: "in_trattativa",
  Confirmed: "confermato",
  Paid: "pagato",
} as const satisfies Record<string, SponsorStatus>;


export const SPONSOR_CATEGORY = {
  Bronzo: "bronzo",
  Argento: "argento",
  Oro: "oro",
  Platino: "platino",
} as const satisfies Record<string, SponsorCategory>;

export const EXPENSE_STATUS = {
  Paid: "pagata",
  ToRefund: "da_rimborsare",
  Refunded: "rimborsata",
} as const satisfies Record<string, ExpenseStatus>;


export const TOURNAMENT_STATUS = {
  Draft: "draft",
  RegistrationsOpen: "registrations_open",
  RegistrationsClosed: "registrations_closed",
  GroupsGenerated: "groups_generated",
  InProgress: "in_progress",
  Completed: "completed",
  Archived: "archived",
} as const satisfies Record<string, TournamentStatus>;

export const TOURNAMENT_PUBLIC_STATUS = {
  Hidden: "hidden",
  RegistrationsOpen: "registrations_open",
  Published: "published",
  ResultsPublished: "results_published",
} as const satisfies Record<string, TournamentPublicStatus>;

export const TOURNAMENT_MATCH_STATUS = {
  Scheduled: "scheduled",
  Live: "live",
  Completed: "completed",
  Cancelled: "cancelled",
} as const satisfies Record<string, TournamentMatchStatus>;

export const PARTICIPATION_REQUEST_STATUS = {
  New: "nuova",
  Managing: "in_gestione",
  Contacted: "contattata",
  Archived: "archiviata",
  Transferred: "trasferita",
} as const satisfies Record<string, ParticipationRequestStatus>;

export const TRANSACTION_TYPE = {
  Income: "income",
  Expense: "expense",
} as const satisfies Record<string, TransactionType>;

export const TRANSACTION_SOURCE_TABLE = {
  Incomes: "incomes",
  Expenses: "expenses",
  TournamentTeams: "tournament_teams",
  Sponsors: "sponsors",
} as const satisfies Record<string, TransactionSourceTable>;

export const AUDIT_ACTION = {
  Insert: "insert",
  Update: "update",
  Delete: "delete",
} as const satisfies Record<string, AuditAction>;

export const FILTER_ALL = "all";
export const PAGE_SIZE = 25;

export const DELIVERY_STATUS = {
  Pending: "pending",
  Delivered: "delivered",
} as const;

export type DeliveryStatusFilter =
  | typeof FILTER_ALL
  | (typeof DELIVERY_STATUS)[keyof typeof DELIVERY_STATUS];

export const THEME_MODE = {
  System: "system",
  Light: "light",
  Dark: "dark",
} as const;

export type ThemeModeValue = (typeof THEME_MODE)[keyof typeof THEME_MODE];
export type ResolvedThemeValue =
  | typeof THEME_MODE.Light
  | typeof THEME_MODE.Dark;

export const THEME_MODE_OPTIONS = [
  { id: THEME_MODE.System, label: "Auto" },
  { id: THEME_MODE.Light, label: "Chiaro" },
  { id: THEME_MODE.Dark, label: "Scuro" },
] as const satisfies ReadonlyArray<Option<ThemeModeValue>>;

export const SHELL_BADGE = {
  TournamentRequests: "tournamentRequests",
  SponsorRequests: "sponsorRequests",
} as const;

export const SHELL_NAV_ITEMS = [
  { path: "/app/dashboard", label: "Home", short: "H", group: "Gestionale" },
  {
    path: "/app/tornei",
    label: "Tornei",
    short: "T",
    group: "Gestionale",
  },
  {
    path: "/app/participation-requests",
    label: "Richieste",
    short: "R",
    badge: SHELL_BADGE.TournamentRequests,
    group: "Gestionale",
  },
  {
    path: "/app/sponsors",
    label: "Sponsor",
    short: "S",
    badge: SHELL_BADGE.SponsorRequests,
    group: "Gestionale",
  },
  {
    path: "/app/transactions",
    label: "Transazioni",
    short: "$",
    group: "Finanze",
  },
  {
    path: "/app/fatturazione",
    label: "Fatture",
    short: "F",
    group: "Finanze",
  },
  {
    path: "/app/tesoreria",
    label: "Tesoriere",
    short: "T",
    treasuryOnly: true,
    group: "Finanze",
  },
  { path: "/app/profile", label: "Profilo", short: "P", group: "Account" },
  {
    path: "/app/users",
    label: "Utenti",
    short: "U",
    adminOnly: true,
    group: "Admin",
  },
  {
    path: "/app/audit",
    label: "Audit",
    short: "A",
    adminOnly: true,
    group: "Admin",
  },
] as const;

export const SUPABASE_TABLE = {
  AuditLogs: "audit_logs",
  Expenses: "expenses",
  Incomes: "incomes",
  ParticipationRequestNotes: "participation_request_notes",
  ParticipationRequests: "participation_requests",
  Profiles: "profiles",
  PublicTournamentMatches: "public_tournament_matches",
  PublicTournamentStandings: "public_tournament_standings",
  Sponsors: "sponsors",
  TeamParticipants: "team_participants",
  TournamentMatches: "tournament_matches",
  TournamentTeams: "tournament_teams",
  Tournaments: "tournaments",
  TransactionsView: "transactions_view",
} as const;

export const SUPABASE_RPC = {
  GenerateGroupStage: "generate_group_stage",
  GetDashboardFinancials: "get_dashboard_financials",
  GetParticipationRequestCounts: "get_participation_request_counts",
  GetSponsorsSummary: "get_sponsors_summary",
  ListTransactionsWithSummary: "list_transactions_with_summary",
  MarkTransactionDelivered: "mark_transaction_delivered",
  RecalculateGroupStandings: "recalculate_group_standings",
  ResetTournamentSchedule: "reset_tournament_schedule",
  UpdateOwnProfileName: "update_own_profile_name",
  UpdateUserRoles: "update_user_roles",
  UserDisplayNames: "user_display_names",
  UsernameLoginEmail: "username_login_email",
} as const;

export const SUPABASE_FUNCTION = {
  AdminCreateUser: "admin-create-user",
  AdminResetPassword: "admin-reset-password",
} as const;

export const DEFAULT_TOURNAMENT_CODE = {
  Football5: "calcio-a-5",
  Football5Under15: "calcio-a-5-under-15",
  Volleyball: "pallavolo",
  Briscola: "briscola",
  Fifa: "fifa",
  PingPong: "ping-pong",
  TableFootball: "calcio-balilla",
} as const;

export const DEFAULT_TOURNAMENT_CODES = Object.values(
  DEFAULT_TOURNAMENT_CODE,
) as readonly string[];
export const SOLO_TOURNAMENT_CODES: readonly string[] = [
  DEFAULT_TOURNAMENT_CODE.Fifa,
  DEFAULT_TOURNAMENT_CODE.PingPong,
];
export const DUO_TOURNAMENT_CODES: readonly string[] = [
  DEFAULT_TOURNAMENT_CODE.Briscola,
  DEFAULT_TOURNAMENT_CODE.TableFootball,
];
export const DIRECT_TOURNAMENT_CODES: readonly string[] = [
  ...SOLO_TOURNAMENT_CODES,
  ...DUO_TOURNAMENT_CODES,
];

export const DEFAULT_TOURNAMENTS = [
  { code: DEFAULT_TOURNAMENT_CODE.Football5, name: "Calcio a 5", fee: 0 },
  { code: DEFAULT_TOURNAMENT_CODE.Football5Under15, name: "Calcio a 5 Under 15", fee: 0 },
  { code: DEFAULT_TOURNAMENT_CODE.Volleyball, name: "Green Volley", fee: 50 },
  { code: DEFAULT_TOURNAMENT_CODE.Briscola, name: "Briscola", fee: 0 },
  { code: DEFAULT_TOURNAMENT_CODE.Fifa, name: "Fifa", fee: 0 },
  { code: DEFAULT_TOURNAMENT_CODE.PingPong, name: "Ping Pong", fee: 0 },
  { code: DEFAULT_TOURNAMENT_CODE.TableFootball, name: "Calcio Balilla", fee: 0 },
] as const satisfies ReadonlyArray<{ code: string; name: string; fee: number }>;

export const TOURNAMENT_MIN_PARTICIPANTS_BY_CODE: Readonly<
  Record<string, number>
> = {
  [DEFAULT_TOURNAMENT_CODE.Volleyball]: 5,
  [DEFAULT_TOURNAMENT_CODE.Briscola]: 2,
  [DEFAULT_TOURNAMENT_CODE.Fifa]: 1,
  [DEFAULT_TOURNAMENT_CODE.PingPong]: 1,
  [DEFAULT_TOURNAMENT_CODE.TableFootball]: 2,
} as const;


export const EXPENSE_CATEGORIES = [
  "Attrezzatura",
  "Premi/Trofei",
  "Catering",
  "Affitto campi/sale",
  "Marketing",
  "Arbitri/Staff",
  "Assicurazione",
  "Trasporti",
  "Materiale promo",
  "Altro",
] as const;

export const INCOME_CATEGORIES = [
  "Iscrizioni",
  "Sponsor",
  "Bar/Ristoro",
  "Merchandising",
  "Biglietti",
  "Donazioni",
  "Altro",
] as const;

export const PAYMENT_METHOD = {
  Cash: "Contanti",
  BankTransfer: "Bonifico",
  Card: "POS/Carta",
  Paypal: "PayPal",
  Other: "Altro",
} as const;

export const PAYMENT_METHODS = Object.values(PAYMENT_METHOD);

export const EXPENSE_STATUSES = [
  { id: EXPENSE_STATUS.Paid, label: "Pagata", className: "state-success" },
  {
    id: EXPENSE_STATUS.ToRefund,
    label: "Da rimborsare",
    className: "state-warning",
  },
  { id: EXPENSE_STATUS.Refunded, label: "Rimborsata", className: "state-info" },
] as const satisfies ReadonlyArray<StatusOption<ExpenseStatus>>;

export const SPONSOR_CATEGORIES = [
  { id: SPONSOR_CATEGORY.Bronzo, label: "Bronzo" },
  { id: SPONSOR_CATEGORY.Argento, label: "Argento" },
  { id: SPONSOR_CATEGORY.Oro, label: "Oro" },
  { id: SPONSOR_CATEGORY.Platino, label: "Platino" },
] as const satisfies ReadonlyArray<Option<SponsorCategory>>;

export const SPONSOR_STATUSES = [
  {
    id: SPONSOR_STATUS.Contacted,
    label: "Contattato",
    className: "state-neutral",
  },
  {
    id: SPONSOR_STATUS.Negotiating,
    label: "In trattativa",
    className: "state-warning",
  },
  {
    id: SPONSOR_STATUS.Confirmed,
    label: "Confermato",
    className: "state-info",
  },
  { id: SPONSOR_STATUS.Paid, label: "Pagato", className: "state-success" },
] as const satisfies ReadonlyArray<StatusOption<SponsorStatus>>;

export const PARTICIPATION_REQUEST_STATUSES = [
  {
    id: PARTICIPATION_REQUEST_STATUS.New,
    label: "Nuove",
    className: "state-warning",
  },
  {
    id: PARTICIPATION_REQUEST_STATUS.Managing,
    label: "In gestione",
    className: "state-info",
  },
  {
    id: PARTICIPATION_REQUEST_STATUS.Contacted,
    label: "Contattate",
    className: "state-success",
  },
  {
    id: PARTICIPATION_REQUEST_STATUS.Archived,
    label: "Archiviate",
    className: "state-neutral",
  },
  {
    id: PARTICIPATION_REQUEST_STATUS.Transferred,
    label: "Trasferite",
    className: "state-success",
  },
] as const satisfies ReadonlyArray<StatusOption<ParticipationRequestStatus>>;

export const TOURNAMENT_MATCH_STATUSES = [
  {
    id: TOURNAMENT_MATCH_STATUS.Scheduled,
    label: "Programmato",
    className: "state-neutral",
  },
  {
    id: TOURNAMENT_MATCH_STATUS.Live,
    label: "Live",
    className: "state-warning",
  },
  {
    id: TOURNAMENT_MATCH_STATUS.Completed,
    label: "Completato",
    className: "state-success",
  },
  {
    id: TOURNAMENT_MATCH_STATUS.Cancelled,
    label: "Annullato",
    className: "state-danger",
  },
] as const satisfies ReadonlyArray<StatusOption<TournamentMatchStatus>>;

export const TOURNAMENT_STATUSES = [
  { id: TOURNAMENT_STATUS.Draft, label: "Bozza", className: "state-neutral" },
  {
    id: TOURNAMENT_STATUS.RegistrationsOpen,
    label: "Iscrizioni aperte",
    className: "state-success",
  },
  {
    id: TOURNAMENT_STATUS.RegistrationsClosed,
    label: "Iscrizioni chiuse",
    className: "state-warning",
  },
  {
    id: TOURNAMENT_STATUS.GroupsGenerated,
    label: "Gironi generati",
    className: "state-info",
  },
  {
    id: TOURNAMENT_STATUS.InProgress,
    label: "In corso",
    className: "state-warning",
  },
  {
    id: TOURNAMENT_STATUS.Completed,
    label: "Completato",
    className: "state-success",
  },
  {
    id: TOURNAMENT_STATUS.Archived,
    label: "Archiviato",
    className: "state-neutral",
  },
] as const satisfies ReadonlyArray<StatusOption<TournamentStatus>>;

export const TOURNAMENT_PUBLIC_STATUSES = [
  {
    id: TOURNAMENT_PUBLIC_STATUS.Hidden,
    label: "Nascosto",
    className: "state-neutral",
  },
  {
    id: TOURNAMENT_PUBLIC_STATUS.RegistrationsOpen,
    label: "Iscrizioni pubbliche",
    className: "state-info",
  },
  {
    id: TOURNAMENT_PUBLIC_STATUS.Published,
    label: "Pubblicato",
    className: "state-success",
  },
  {
    id: TOURNAMENT_PUBLIC_STATUS.ResultsPublished,
    label: "Risultati pubblicati",
    className: "state-success",
  },
] as const satisfies ReadonlyArray<StatusOption<TournamentPublicStatus>>;

export const AUDIT_ACTIONS = [
  {
    id: AUDIT_ACTION.Insert,
    label: "Aggiunto",
    phrase: "inserito",
    className: "state-success",
  },
  {
    id: AUDIT_ACTION.Update,
    label: "Modificato",
    phrase: "modificato",
    className: "state-info",
  },
  {
    id: AUDIT_ACTION.Delete,
    label: "Eliminato",
    phrase: "eliminato",
    className: "state-danger",
  },
] as const satisfies ReadonlyArray<
  StatusOption<AuditAction> & { phrase: string }
>;

export const AUDIT_TABLE_LABELS: Readonly<Record<string, string>> = {
  [SUPABASE_TABLE.Expenses]: "spesa",
  [SUPABASE_TABLE.Incomes]: "entrata",
  [SUPABASE_TABLE.Sponsors]: "sponsor",
  registrations: "iscrizione",
  [SUPABASE_TABLE.Tournaments]: "torneo",
  [SUPABASE_TABLE.TournamentTeams]: "squadra",
  [SUPABASE_TABLE.TeamParticipants]: "partecipante",
} as const;

export const AUDIT_TABLE_PLURAL_LABELS: Readonly<Record<string, string>> = {
  [SUPABASE_TABLE.Expenses]: "spese",
  [SUPABASE_TABLE.Incomes]: "entrate",
  [SUPABASE_TABLE.Sponsors]: "sponsor",
  registrations: "iscrizioni",
  [SUPABASE_TABLE.Tournaments]: "tornei",
  [SUPABASE_TABLE.TournamentTeams]: "squadre",
  [SUPABASE_TABLE.TeamParticipants]: "partecipanti",
} as const;

export const PUBLIC_SPONSOR_LEAD_DELIVERABLES =
  "Richiesta informazioni sponsor dal sito pubblico";

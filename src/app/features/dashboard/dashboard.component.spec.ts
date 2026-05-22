import { TestBed } from "@angular/core/testing";
import { AuditLogService } from "../../core/services/audit-log.service";
import { AuthService } from "../../core/services/auth.service";
import { ExpensesService } from "../../core/services/expenses.service";
import { RegistrationsService } from "../../core/services/registrations.service";
import { RequestBadgesService } from "../../core/services/request-badges.service";
import { SnackbarService } from "../../core/services/snackbar.service";
import { SponsorsService } from "../../core/services/sponsors.service";
import { SupabaseService } from "../../core/services/supabase.service";
import { Expense, Registration, Sponsor } from "../../core/types/models";
import { DashboardComponent } from "./dashboard.component";

describe("DashboardComponent", () => {
  let component: DashboardComponent;

  const expense = (amount: number): Expense => ({
    id: `expense-${amount}`,
    date: "2026-05-01",
    description: "Expense",
    category: "General",
    amount,
    status: "pagata",
    paid_by: null,
    payment_method: null,
    notes: null,
    created_by: null,
    updated_by: null,
    created_at: "2026-05-01T10:00:00Z",
    updated_at: "2026-05-01T10:00:00Z",
  });

  const sponsor = (status: Sponsor["status"], value: number): Sponsor => ({
    id: `${status}-${value}`,
    company_name: "Sponsor",
    category: "bronzo",
    contact_name: null,
    contact_info: null,
    type: "cash",
    value,
    promised_amount: value,
    received_amount: status === "pagato" ? value : 0,
    payment_method: "Contanti",
    responsible_user_id: null,
    status,
    deliverables: null,
    notes: null,
    created_by: null,
    updated_by: null,
    created_at: "2026-05-01T10:00:00Z",
    updated_at: "2026-05-01T10:00:00Z",
  });

  const registration = (paid: boolean, fee: number): Registration => ({
    id: `${paid}-${fee}`,
    name: "Team",
    tournament: "Tournament",
    contact: null,
    fee,
    paid,
    registration_date: "2026-05-01",
    notes: null,
    created_by: null,
    updated_by: null,
    created_at: "2026-05-01T10:00:00Z",
    updated_at: "2026-05-01T10:00:00Z",
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: SnackbarService, useValue: { error: jasmine.createSpy() } }],
    });
    component = TestBed.runInInjectionContext(
      () =>
        new DashboardComponent(
          {
            isAdmin: () => true,
            profile: () => ({
              id: "user-1",
              email: "staff@example.com",
              username: "staff",
              full_name: "Staff User",
              roles: ["admin"],
              active: true,
              created_at: "2026-05-01T10:00:00Z",
            }),
            user: () => ({ id: "user-1", email: "staff@example.com" }),
          } as unknown as AuthService,
          {} as ExpensesService,
          {} as SponsorsService,
          {} as RegistrationsService,
          {} as AuditLogService,
          {
            tournamentRequests: () => 2,
            sponsorRequests: () => 1,
          } as unknown as RequestBadgesService,
          {} as SupabaseService,
        ),
    );
  });

  it("computes financial totals and probable balance from financials signal", () => {
    component.financials.set({
      total_expenses: 150,
      total_incomes: 200,
      sponsor_paid: 300,
      sponsor_confirmed: 150,
      sponsor_negotiating: 75,
      sponsor_paid_count: 1,
      reg_paid_amount: 50,
      reg_pending_amount: 50,
      reg_paid_count: 1,
      reg_pending_count: 2,
    });

    expect(component.totalExpenses()).toBe(150);
    expect(component.recordedIncome()).toBe(200);
    expect(component.sponsorPaid()).toBe(300);
    expect(component.sponsorConfirmed()).toBe(150);
    expect(component.regPaidAmount()).toBe(50);
    expect(component.regPendingAmount()).toBe(50);
    expect(component.totalIncome()).toBe(550);
    expect(component.balance()).toBe(400);
    expect(component.probableBalance()).toBe(675);
  });

  it("computes registration counters and payment rate from financials signal", () => {
    component.financials.set({
      total_expenses: 0,
      total_incomes: 0,
      sponsor_paid: 0,
      sponsor_confirmed: 0,
      sponsor_negotiating: 0,
      sponsor_paid_count: 0,
      reg_paid_amount: 70,
      reg_pending_amount: 30,
      reg_paid_count: 2,
      reg_pending_count: 1,
    });

    expect(component.regPaidCount()).toBe(2);
    expect(component.regPendingCount()).toBe(1);
    expect(component.regTotalCount()).toBe(3);
    expect(component.regPaymentRate()).toBe(67);
  });

  it("surfaces pending request badges", () => {
    expect(component.pendingTournamentRequests()).toBe(2);
    expect(component.pendingSponsorRequests()).toBe(1);
    expect(component.hasPendingRequests()).toBeTrue();
  });

  it("computes staff home counters from records touched by the current user", () => {
    component.registrations.set([
      { ...registration(false, 50), created_by: "user-1" },
      { ...registration(true, 20), created_by: "user-2" },
    ]);
    component.sponsors.set([
      { ...sponsor("confermato", 100), responsible_user_id: "user-1" },
      { ...sponsor("contattato", 100), created_by: "user-2" },
    ]);
    component.expenses.set([
      { ...expense(20), updated_by: "user-1", status: "da_rimborsare" },
      { ...expense(30), created_by: "user-2" },
    ]);
    component.auditLogs.set([
      {
        id: "audit-1",
        table_name: "tournament_teams",
        record_id: "team-1",
        action: "insert",
        changed_by: "user-1",
        changed_by_name: "Staff User",
        changed_at: "2026-05-02T10:00:00Z",
        old_data: null,
        new_data: null,
      },
      {
        id: "audit-2",
        table_name: "sponsors",
        record_id: "sponsor-1",
        action: "update",
        changed_by: "user-1",
        changed_by_name: "Staff User",
        changed_at: "2026-05-01T10:00:00Z",
        old_data: null,
        new_data: null,
      },
    ]);

    expect(component.ownRegistrations().length).toBe(1);
    expect(component.ownUnpaidRegistrations()).toBe(1);
    expect(component.ownSponsors().length).toBe(1);
    expect(component.ownConfirmedSponsors()).toBe(1);
    expect(component.ownExpenses().length).toBe(1);
    expect(component.ownExpensesToRefund()).toBe(1);
    expect(component.staffInsertCount()).toBe(1);
    expect(component.staffUpdateCount()).toBe(1);
    expect(component.totalStaffActions()).toBe(2);
  });
});

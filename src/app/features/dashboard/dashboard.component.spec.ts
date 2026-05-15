import { TestBed } from "@angular/core/testing";
import { AuditLogService } from "../../core/services/audit-log.service";
import { ExpensesService } from "../../core/services/expenses.service";
import { IncomesService } from "../../core/services/incomes.service";
import { RegistrationsService } from "../../core/services/registrations.service";
import { RequestBadgesService } from "../../core/services/request-badges.service";
import { SnackbarService } from "../../core/services/snackbar.service";
import { SponsorsService } from "../../core/services/sponsors.service";
import { Expense, Income, Registration, Sponsor } from "../../core/types/models";
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

  const income = (amount: number): Income => ({
    id: `income-${amount}`,
    date: "2026-05-01",
    source: "Income",
    category: "General",
    amount,
    received_by: null,
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
          {} as ExpensesService,
          {} as IncomesService,
          {} as SponsorsService,
          {} as RegistrationsService,
          {} as AuditLogService,
          {
            refresh: jasmine.createSpy().and.resolveTo(),
            tournamentRequests: () => 2,
            sponsorRequests: () => 1,
          } as unknown as RequestBadgesService,
        ),
    );
  });

  it("computes financial totals and probable balance", () => {
    component.expenses.set([expense(100), expense(50)]);
    component.incomes.set([income(200)]);
    component.sponsors.set([
      sponsor("pagato", 300),
      sponsor("confermato", 150),
      sponsor("in_trattativa", 75),
      sponsor("contattato", 40),
    ]);
    component.registrations.set([
      registration(true, 50),
      registration(false, 20),
      registration(false, 30),
    ]);

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

  it("computes registration counters and payment rate", () => {
    component.registrations.set([
      registration(true, 50),
      registration(true, 20),
      registration(false, 30),
    ]);

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
});

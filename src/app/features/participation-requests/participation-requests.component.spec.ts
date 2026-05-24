import { TestBed } from "@angular/core/testing";
import { ParticipationRequestsService } from "../../core/services/participation-requests.service";
import { RequestBadgesService } from "../../core/services/request-badges.service";
import { SnackbarService } from "../../core/services/snackbar.service";
import { PagedResult, ParticipationRequestWithTournament } from "../../core/types/models";
import { ParticipationRequestsComponent } from "./participation-requests.component";

describe("ParticipationRequestsComponent", () => {
  let service: jasmine.SpyObj<ParticipationRequestsService>;
  let badges: jasmine.SpyObj<RequestBadgesService>;
  let snackbar: jasmine.SpyObj<SnackbarService>;
  let component: ParticipationRequestsComponent;

  const request = (
    overrides: Partial<ParticipationRequestWithTournament> = {},
  ): ParticipationRequestWithTournament => ({
    id: "request-1",
    tournament_id: "tournament-1",
    first_name: "mario",
    last_name: "rossi",
    phone: "333 123 4567",
    privacy_accepted: true,
    whatsapp_accepted: true,
    rules_accepted: true,
    status: "nuova",
    updated_by: null,
    created_at: "2026-05-14T10:00:00Z",
    updated_at: "2026-05-14T10:00:00Z",
    tournaments: {
      name: "Calcio a 5",
      code: "calcio-a-5",
      fee: 0,
    },
    participation_request_notes: [],
    ...overrides,
  });

  beforeEach(() => {
    service = jasmine.createSpyObj<ParticipationRequestsService>(
      "ParticipationRequestsService",
      ["list", "countsByStatus", "updateStatus", "transferToTournament", "addNote", "remove"],
    );
    service.list.and.resolveTo({ data: [], total: 0 } as PagedResult<ParticipationRequestWithTournament>);
    service.countsByStatus.and.resolveTo({ newCount: 0, managingCount: 0, contactedCount: 0, archivedCount: 0 });
    service.updateStatus.and.resolveTo();
    service.transferToTournament.and.resolveTo();
    service.addNote.and.resolveTo();
    service.remove.and.resolveTo();
    badges = jasmine.createSpyObj<RequestBadgesService>("RequestBadgesService", [
      "clear",
    ]);
    snackbar = jasmine.createSpyObj<SnackbarService>("SnackbarService", [
      "error",
      "success",
    ]);

    TestBed.configureTestingModule({
      providers: [{ provide: SnackbarService, useValue: snackbar }],
    });
    component = TestBed.runInInjectionContext(
      () => new ParticipationRequestsComponent(service, badges),
    );
  });

  it("calls service with status filter and shows counts from statusCounts", () => {
    component.statusCounts.set({ newCount: 3, managingCount: 2, contactedCount: 1, archivedCount: 0 });

    component.setStatusFilter("contattata");

    expect(service.list).toHaveBeenCalled();
    expect(component.newCount()).toBe(3);
    expect(component.managingCount()).toBe(2);
    expect(component.contactedCount()).toBe(1);
  });

  it("normalizes phone numbers for display and WhatsApp links", () => {
    expect(component.normalizePhone(" 333 123 4567 ")).toBe("3331234567");
    expect(component.whatsappUrl("333 123 4567")).toBe(
      "https://wa.me/393331234567",
    );
    expect(component.whatsappUrl("+39 333 123 4567")).toBe(
      "https://wa.me/393331234567",
    );
  });

  it("builds a football transfer payload without participants", async () => {
    const item = request({
      first_name: "mARIO",
      last_name: "d'amico",
      tournaments: {
        name: "Calcio a 5",
        code: "calcio-a-5",
        fee: 0,
      },
    });

    component.openTransferModal(item);
    component.transferForm.team_name = "  fossa team  ";
    component.transferForm.captain_name = "  mario rossi  ";
    component.transferForm.captain_contact = " 333 ";
    component.transferForm.vice_captain_name = " luigi verdi ";
    component.transferForm.vice_captain_contact = " 334 ";
    component.transferForm.paid = true;
    component.transferForm.notes = " nota ";

    await component.transferRequestToTournament();

    const payload = service.transferToTournament.calls.argsFor(0)[1];
    expect(payload).toEqual({
      team_name: "Fossa Team",
      captain_name: "Mario Rossi",
      captain_contact: "333",
      vice_captain_name: "Luigi Verdi",
      vice_captain_contact: "334",
      paid: true,
      notes: "nota",
      participants: [],
    });
  });

  it("builds a direct duo transfer payload with two participants", async () => {
    const item = request({
      first_name: "mario",
      last_name: "rossi",
      tournaments: {
        name: "Briscola",
        code: "briscola",
        fee: 0,
      },
    });

    component.openTransferModal(item);
    component.transferForm.person2 = {
      first_name: " luigi ",
      last_name: " verdi ",
      contact: " 334 ",
    };

    await component.transferRequestToTournament();

    const payload = service.transferToTournament.calls.argsFor(0)[1];
    expect(payload.team_name).toBe("Mario / Luigi");
    expect(payload.participants).toEqual([
      {
        first_name: "Mario",
        last_name: "Rossi",
        contact: "3331234567",
        registered: false,
      },
      {
        first_name: "Luigi",
        last_name: "Verdi",
        contact: "334",
        registered: false,
      },
    ]);
  });
});

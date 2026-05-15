import { TestBed } from "@angular/core/testing";
import { AuthService } from "../../core/services/auth.service";
import { ExportService } from "../../core/services/export.service";
import { RegistrationsService } from "../../core/services/registrations.service";
import { SnackbarService } from "../../core/services/snackbar.service";
import {
  InsertTeamParticipant,
  InsertTournamentTeam,
  TeamParticipant,
  TournamentTeam,
  TournamentWithTeams,
} from "../../core/types/models";
import { RegistrationsComponent } from "./registrations.component";

describe("RegistrationsComponent", () => {
  let service: jasmine.SpyObj<RegistrationsService>;
  let snackbar: jasmine.SpyObj<SnackbarService>;
  let component: RegistrationsComponent;

  const participant = (
    id: string,
    overrides: Partial<TeamParticipant> = {},
  ): TeamParticipant => ({
    id,
    team_id: "team-1",
    first_name: `Name ${id}`,
    last_name: `Surname ${id}`,
    contact: null,
    gender: "uomo",
    registered: false,
    created_by: null,
    updated_by: null,
    created_at: "2026-05-01T10:00:00Z",
    updated_at: "2026-05-01T10:00:00Z",
    ...overrides,
  });

  const tournament = (
    overrides: Partial<TournamentWithTeams> = {},
  ): TournamentWithTeams => ({
    id: "tournament-1",
    code: "pallavolo",
    name: "Green Volley",
    sport: "pallavolo",
    fee: 50,
    date: null,
    notes: null,
    created_by: null,
    updated_by: null,
    created_at: "2026-05-01T10:00:00Z",
    updated_at: "2026-05-01T10:00:00Z",
    tournament_teams: [
      {
        id: "team-1",
        tournament_id: "tournament-1",
        name: "Team",
        captain_name: null,
        captain_contact: null,
        vice_captain_name: null,
        vice_captain_contact: null,
        fee: 50,
        paid: false,
        notes: null,
        created_by: null,
        updated_by: null,
        created_at: "2026-05-01T10:00:00Z",
        updated_at: "2026-05-01T10:00:00Z",
        team_participants: [],
      },
    ],
    ...overrides,
  });

  beforeEach(() => {
    service = jasmine.createSpyObj<RegistrationsService>(
      "RegistrationsService",
      [
        "listTournaments",
        "createTeam",
        "updateTeam",
        "createParticipant",
        "updateParticipant",
        "removeTeam",
        "removeParticipant",
      ],
    );
    service.listTournaments.and.resolveTo([]);
    service.createTeam.and.callFake(async (payload: InsertTournamentTeam) => ({
      id: "created-team",
      created_by: null,
      updated_by: null,
      created_at: "2026-05-01T10:00:00Z",
      updated_at: "2026-05-01T10:00:00Z",
      ...payload,
    }) as TournamentTeam);
    service.createParticipant.and.callFake(
      async (payload: InsertTeamParticipant) => ({
        id: `participant-${service.createParticipant.calls.count()}`,
        created_by: null,
        updated_by: null,
        created_at: "2026-05-01T10:00:00Z",
        updated_at: "2026-05-01T10:00:00Z",
        ...payload,
      }),
    );
    service.updateTeam.and.resolveTo({} as TournamentTeam);
    service.updateParticipant.and.resolveTo({} as TeamParticipant);
    snackbar = jasmine.createSpyObj<SnackbarService>("SnackbarService", [
      "error",
      "warning",
      "success",
    ]);

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: { isAdmin: () => true } },
        { provide: RegistrationsService, useValue: service },
        { provide: ExportService, useValue: { downloadCsv: jasmine.createSpy() } },
        { provide: SnackbarService, useValue: snackbar },
      ],
    });

    component = TestBed.runInInjectionContext(() => new RegistrationsComponent());
  });

  it("normalizes team payloads and uses the tournament fee", async () => {
    component.tournaments.set([tournament()]);

    await component.saveTeam({
      tournament_id: "tournament-1",
      name: "  Team A  ",
      captain_name: "  Mario  ",
      captain_contact: "  333  ",
      vice_captain_name: "",
      vice_captain_contact: "",
      fee: 0,
      paid: true,
      notes: "  ok  ",
    });

    expect(service.createTeam).toHaveBeenCalledOnceWith({
      tournament_id: "tournament-1",
      name: "Team A",
      captain_name: "Mario",
      captain_contact: "333",
      vice_captain_name: null,
      vice_captain_contact: null,
      fee: 50,
      paid: true,
      notes: "ok",
    });
  });

  it("blocks adding participants beyond the tournament limit", () => {
    component.tournaments.set([
      tournament({
        tournament_teams: [
          {
            ...tournament().tournament_teams[0],
            team_participants: ["1", "2", "3", "4", "5"].map((id) =>
              participant(id),
            ),
          },
        ],
      }),
    ]);

    component.newParticipant("team-1");

    expect(component.modalMode()).toBeNull();
    expect(component.error()).toContain("Limite persone raggiunto");
    expect(snackbar.warning).toHaveBeenCalled();
  });

  it("allows only one registered FIPAV participant for Green Volley", async () => {
    component.tournaments.set([
      tournament({
        tournament_teams: [
          {
            ...tournament().tournament_teams[0],
            team_participants: [participant("registered", { registered: true })],
          },
        ],
      }),
    ]);

    await component.saveParticipant({
      team_id: "team-1",
      first_name: "Anna",
      last_name: "Bianchi",
      contact: "333",
      gender: "donna",
      registered: true,
    });

    expect(service.createParticipant).not.toHaveBeenCalled();
    expect(component.modalError()).toContain("massimo 1 tesserato FIPAV");
  });

  it("creates direct duo entries as one team and two participants", async () => {
    component.tournaments.set([
      tournament({
        id: "briscola",
        code: "briscola",
        name: "Briscola",
        sport: "altro",
        fee: 20,
        tournament_teams: [],
      }),
    ]);

    await component.saveDirectEntry({
      tournament_id: "briscola",
      paid: true,
      person1: { first_name: " Mario ", last_name: " Rossi ", contact: " 333 " },
      person2: { first_name: " Luigi ", last_name: " Verdi ", contact: " 334 " },
    });

    expect(service.createTeam).toHaveBeenCalledOnceWith({
      tournament_id: "briscola",
      name: "Mario / Luigi",
      captain_name: null,
      captain_contact: null,
      vice_captain_name: null,
      vice_captain_contact: null,
      fee: 20,
      paid: true,
      notes: null,
    });
    expect(service.createParticipant.calls.count()).toBe(2);
    expect(service.createParticipant.calls.argsFor(0)[0]).toEqual(
      jasmine.objectContaining({
        team_id: "created-team",
        first_name: "Mario",
        last_name: "Rossi",
        contact: "333",
      }),
    );
    expect(service.createParticipant.calls.argsFor(1)[0]).toEqual(
      jasmine.objectContaining({
        team_id: "created-team",
        first_name: "Luigi",
        last_name: "Verdi",
        contact: "334",
      }),
    );
  });
});

import { RegistrationsService } from "./registrations.service";
import { SupabaseService } from "./supabase.service";
import { TournamentWithTeams } from "../types/models";

class SelectInQuery {
  constructor(private readonly response: unknown) {}

  in(): Promise<unknown> {
    return Promise.resolve(this.response);
  }
}

class TableQuery {
  constructor(
    private readonly table: string,
    private readonly responses: Record<string, unknown>,
  ) {}

  upsert(): Promise<unknown> {
    return Promise.resolve(this.responses[`${this.table}.upsert`]);
  }

  select(): SelectInQuery {
    return new SelectInQuery(this.responses[`${this.table}.select`]);
  }
}

describe("RegistrationsService", () => {
  function serviceWith(responses: Record<string, unknown>): RegistrationsService {
    const client = {
      from: (table: string) => new TableQuery(table, responses),
    };
    return new RegistrationsService({ client } as unknown as SupabaseService);
  }

  const tournament = (
    overrides: Partial<TournamentWithTeams>,
  ): TournamentWithTeams => ({
    id: "tournament-1",
    code: "pallavolo",
    name: "Green Volley",
    sport: "pallavolo",
    fee: 50,
    date: null,
    status: "registrations_open",
    public_status: "registrations_open",
    published_at: null,
    notes: null,
    created_by: null,
    updated_by: null,
    created_at: "2026-05-01T10:00:00Z",
    updated_at: "2026-05-01T10:00:00Z",
    tournament_teams: [],
    ...overrides,
  });

  it("normalizes tournament data and sorts teams and participants", async () => {
    const service = serviceWith({
      "tournaments.upsert": { error: null },
      "tournaments.select": {
        error: null,
        data: [
          tournament({
            fee: "50" as unknown as number,
            tournament_teams: [
              {
                id: "team-b",
                tournament_id: "tournament-1",
                name: "Zeta",
                captain_name: undefined as unknown as null,
                captain_contact: null,
                vice_captain_name: null,
                vice_captain_contact: null,
                fee: "50" as unknown as number,
                paid: false,
                notes: null,
                created_by: null,
                updated_by: null,
                created_at: "2026-05-03T10:00:00Z",
                updated_at: "2026-05-03T10:00:00Z",
                team_participants: [
                  {
                    id: "p-2",
                    team_id: "team-b",
                    first_name: "Luca",
                    last_name: "Verdi",
                    contact: null,
                    gender: null as unknown as "uomo",
                    registered: 1 as unknown as boolean,
                    created_by: null,
                    updated_by: null,
                    created_at: "2026-05-03T10:00:00Z",
                    updated_at: "2026-05-03T10:00:00Z",
                  },
                  {
                    id: "p-1",
                    team_id: "team-b",
                    first_name: "Anna",
                    last_name: "Bianchi",
                    contact: null,
                    gender: "donna",
                    registered: false,
                    created_by: null,
                    updated_by: null,
                    created_at: "2026-05-03T10:00:00Z",
                    updated_at: "2026-05-03T10:00:00Z",
                  },
                ],
              },
              {
                id: "team-a",
                tournament_id: "tournament-1",
                name: "Alfa",
                captain_name: null,
                captain_contact: null,
                vice_captain_name: null,
                vice_captain_contact: null,
                fee: 0,
                paid: true,
                notes: null,
                created_by: null,
                updated_by: null,
                created_at: "2026-05-02T10:00:00Z",
                updated_at: "2026-05-02T10:00:00Z",
                team_participants: [],
              },
            ],
          }),
        ],
      },
    });

    const result = await service.listTournaments();

    expect(result[0].fee).toBe(50);
    expect(result[0].tournament_teams.map((team) => team.name)).toEqual([
      "Alfa",
      "Zeta",
    ]);
    expect(result[0].tournament_teams[1].captain_name).toBeNull();
    expect(result[0].tournament_teams[1].fee).toBe(50);
    expect(
      result[0].tournament_teams[1].team_participants.map(
        (participant) => participant.last_name,
      ),
    ).toEqual(["Bianchi", "Verdi"]);
    expect(result[0].tournament_teams[1].team_participants[1].gender).toBe(
      "uomo",
    );
    expect(result[0].tournament_teams[1].team_participants[1].registered).toBe(
      true,
    );
  });

  it("maps tournament teams to legacy registrations sorted by creation date", async () => {
    const service = serviceWith({
      "tournaments.upsert": { error: null },
      "tournaments.select": {
        error: null,
        data: [
          tournament({
            name: "Green Volley",
            tournament_teams: [
              {
                id: "old",
                tournament_id: "tournament-1",
                name: "Old Team",
                captain_name: null,
                captain_contact: null,
                vice_captain_name: null,
                vice_captain_contact: null,
                fee: 50,
                paid: false,
                notes: "note",
                created_by: null,
                updated_by: null,
                created_at: "2026-05-01T10:00:00Z",
                updated_at: "2026-05-01T10:00:00Z",
                team_participants: [],
              },
              {
                id: "new",
                tournament_id: "tournament-1",
                name: "New Team",
                captain_name: null,
                captain_contact: null,
                vice_captain_name: null,
                vice_captain_contact: null,
                fee: 50,
                paid: true,
                notes: null,
                created_by: null,
                updated_by: null,
                created_at: "2026-05-04T10:00:00Z",
                updated_at: "2026-05-04T10:00:00Z",
                team_participants: [],
              },
            ],
          }),
        ],
      },
    });

    const result = await service.list();

    expect(result.map((item) => item.id)).toEqual(["new", "old"]);
    expect(result[0]).toEqual(
      jasmine.objectContaining({
        name: "New Team",
        tournament: "Green Volley",
        contact: null,
        fee: 50,
        paid: true,
        registration_date: "2026-05-04",
      }),
    );
  });

  it("throws Supabase errors", async () => {
    const error = new Error("upsert failed");
    const service = serviceWith({
      "tournaments.upsert": { error },
    });

    await expectAsync(service.listTournaments()).toBeRejectedWith(error);
  });
});

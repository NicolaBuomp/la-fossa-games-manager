import {
  ParticipationRequestsService,
  ParticipationRequestTransferPayload,
} from "./participation-requests.service";
import { SupabaseService } from "./supabase.service";
import { ParticipationRequestWithTournament } from "../types/models";

type QueryResponse = { data?: unknown; error?: unknown; count?: number | null };

class ParticipationQuery {
  constructor(
    private readonly table: string,
    private readonly calls: string[],
    private readonly responses: Record<string, QueryResponse[]>,
  ) {}

  select(columns?: string, options?: unknown): ParticipationQuery {
    this.calls.push(`${this.table}.select:${columns ?? ""}:${JSON.stringify(options ?? {})}`);
    return this;
  }

  neq(column: string, value: string): ParticipationQuery {
    this.calls.push(`${this.table}.neq:${column}:${value}`);
    return this;
  }

  eq(column: string, value: string): ParticipationQuery {
    this.calls.push(`${this.table}.eq:${column}:${value}`);
    return this;
  }

  order(column: string): Promise<QueryResponse> {
    this.calls.push(`${this.table}.order:${column}`);
    return Promise.resolve(this.next(`${this.table}.order`));
  }

  update(payload: unknown): ParticipationQuery {
    this.calls.push(`${this.table}.update:${JSON.stringify(payload)}`);
    return this;
  }

  delete(): ParticipationQuery {
    this.calls.push(`${this.table}.delete`);
    return this;
  }

  insert(payload: unknown): ParticipationQuery {
    this.calls.push(`${this.table}.insert:${JSON.stringify(payload)}`);
    return this;
  }

  single(): Promise<QueryResponse> {
    this.calls.push(`${this.table}.single`);
    return Promise.resolve(this.next(`${this.table}.single`));
  }

  then<TResult1 = QueryResponse, TResult2 = never>(
    onfulfilled?: ((value: QueryResponse) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2> {
    return Promise.resolve(this.next(`${this.table}.then`)).then(
      onfulfilled,
      onrejected,
    );
  }

  private next(key: string): QueryResponse {
    const list = this.responses[key] ?? [];
    const response = list.shift();
    if (!response) {
      throw new Error(`Missing fake response for ${key}`);
    }
    return response;
  }
}

describe("ParticipationRequestsService", () => {
  function setup(responses: Record<string, QueryResponse[]>) {
    const calls: string[] = [];
    const client = {
      from: (table: string) => new ParticipationQuery(table, calls, responses),
      auth: {
        getUser: () =>
          Promise.resolve({ data: { user: { id: "user-1" } }, error: null }),
      },
    };
    return {
      calls,
      service: new ParticipationRequestsService({
        client,
      } as unknown as SupabaseService),
    };
  }

  const request = (
    overrides: Partial<ParticipationRequestWithTournament> = {},
  ): ParticipationRequestWithTournament => ({
    id: "request-1",
    tournament_id: "tournament-1",
    first_name: "Mario",
    last_name: "Rossi",
    email: null,
    phone: "333 1234567",
    privacy_accepted: true,
    whatsapp_accepted: true,
    rules_accepted: true,
    status: "nuova",
    updated_by: null,
    created_at: "2026-05-14T10:00:00Z",
    updated_at: "2026-05-14T10:00:00Z",
    tournaments: {
      name: "Green Volley",
      code: "pallavolo",
      sport: "pallavolo",
      fee: 50,
    },
    participation_request_notes: [],
    ...overrides,
  });

  it("falls back when related profile reads are blocked and sorts notes", async () => {
    const newer = {
      id: "note-2",
      request_id: "request-1",
      note: "newer",
      created_by: null,
      created_at: "2026-05-14T12:00:00Z",
      profiles: null,
    };
    const older = {
      id: "note-1",
      request_id: "request-1",
      note: "older",
      created_by: null,
      created_at: "2026-05-14T11:00:00Z",
      profiles: null,
    };
    const { service } = setup({
      "participation_requests.order": [
        { error: new Error("profiles blocked"), data: null },
        {
          error: null,
          data: [
            request({
              participation_request_notes: [older, newer],
            }),
          ],
        },
      ],
    });

    const result = await service.list();

    expect(result).toHaveSize(1);
    expect(result[0].participation_request_notes.map((note) => note.id)).toEqual(
      ["note-2", "note-1"],
    );
  });

  it("falls back to base requests when notes are blocked", async () => {
    const { service } = setup({
      "participation_requests.order": [
        { error: new Error("profiles blocked"), data: null },
        { error: new Error("notes blocked"), data: null },
        { error: null, data: [request()] },
      ],
    });

    const result = await service.list();

    expect(result[0].participation_request_notes).toEqual([]);
  });

  it("returns pending count with zero fallback", async () => {
    const { service } = setup({
      "participation_requests.then": [{ error: null, count: null }],
    });

    await expectAsync(service.pendingCount()).toBeResolvedTo(0);
  });

  it("transfers a request to a tournament and marks it transferred", async () => {
    const { calls, service } = setup({
      "tournament_teams.single": [{ error: null, data: { id: "team-1" } }],
      "team_participants.then": [{ error: null }],
      "participation_requests.then": [{ error: null }],
    });
    const payload: ParticipationRequestTransferPayload = {
      team_name: "Mario Rossi",
      captain_name: null,
      captain_contact: null,
      vice_captain_name: null,
      vice_captain_contact: null,
      paid: true,
      notes: "ok",
      participants: [
        {
          first_name: "Mario",
          last_name: "Rossi",
          contact: "3331234567",
          gender: "uomo",
          registered: true,
        },
      ],
    };

    await service.transferToTournament(request(), payload);

    expect(calls.some((call) => call.includes("tournament_teams.insert"))).toBeTrue();
    expect(calls.some((call) => call.includes('"team_id":"team-1"'))).toBeTrue();
    expect(
      calls.some((call) =>
        call.includes('participation_requests.update:{"status":"trasferita"}'),
      ),
    ).toBeTrue();
  });

  it("rolls back the created team when participant insert fails", async () => {
    const participantError = new Error("participant insert failed");
    const { calls, service } = setup({
      "tournament_teams.single": [{ error: null, data: { id: "team-rollback" } }],
      "team_participants.then": [{ error: participantError }],
      "tournament_teams.then": [{ error: null }],
    });

    await expectAsync(
      service.transferToTournament(request(), {
        team_name: "Mario Rossi",
        captain_name: null,
        captain_contact: null,
        vice_captain_name: null,
        vice_captain_contact: null,
        paid: false,
        notes: null,
        participants: [
          {
            first_name: "Mario",
            last_name: "Rossi",
            contact: null,
            gender: "uomo",
            registered: false,
          },
        ],
      }),
    ).toBeRejectedWith(participantError);

    expect(calls).toContain("tournament_teams.delete");
    expect(calls).toContain("tournament_teams.eq:id:team-rollback");
  });
});

import { TournamentsService } from "./tournaments.service";
import { SupabaseService } from "./supabase.service";

class Query {
  constructor(
    private readonly table: string,
    private readonly responses: Record<string, unknown>,
    private readonly calls: string[],
  ) {}

  select(): Query {
    this.calls.push(`${this.table}.select`);
    return this;
  }

  order(column: string): Promise<unknown> {
    this.calls.push(`${this.table}.order:${column}`);
    return Promise.resolve(this.responses[`${this.table}.select`]);
  }

  update(payload: unknown): Query {
    this.calls.push(`${this.table}.update:${JSON.stringify(payload)}`);
    return this;
  }

  eq(column: string, value: unknown): Query {
    this.calls.push(`${this.table}.eq:${column}:${value}`);
    return this;
  }

  single(): Promise<unknown> {
    this.calls.push(`${this.table}.single`);
    return Promise.resolve(this.responses[`${this.table}.update`]);
  }
}

describe("TournamentsService", () => {
  function serviceWith(
    responses: Record<string, unknown>,
    calls: string[] = [],
  ): TournamentsService {
    const channel = {
      on: (event: string, config: unknown, callback: unknown) => {
        calls.push(`channel.on:${event}:${JSON.stringify(config)}`);
        calls.push(`channel.callback:${typeof callback}`);
        return channel;
      },
      subscribe: () => {
        calls.push("channel.subscribe");
        return channel;
      },
    };
    const client = {
      from: (table: string) => new Query(table, responses, calls),
      channel: (name: string) => {
        calls.push(`channel:${name}`);
        return channel;
      },
      removeChannel: (selectedChannel: unknown) => {
        calls.push(`removeChannel:${selectedChannel === channel}`);
        return Promise.resolve("ok");
      },
      rpc: (fn: string, payload: unknown) => {
        calls.push(`${fn}:${JSON.stringify(payload)}`);
        return Promise.resolve(responses[`rpc.${fn}`]);
      },
    };
    return new TournamentsService({ client } as unknown as SupabaseService);
  }

  it("normalizes operational tournament data", async () => {
    const service = serviceWith({
      "tournaments.select": {
        error: null,
        data: [
          {
            id: "tournament-1",
            code: "pallavolo",
            name: "Green Volley",
            sport: "pallavolo",
            fee: "50",
            date: null,
            status: null,
            public_status: "published",
            published_at: null,
            notes: null,
            created_by: null,
            updated_by: null,
            created_at: "2026-05-01T10:00:00Z",
            updated_at: "2026-05-01T10:00:00Z",
            tournament_teams: [
              {
                id: "team-2",
                tournament_id: "tournament-1",
                name: "Zeta",
                captain_name: undefined,
                captain_contact: undefined,
                vice_captain_name: null,
                vice_captain_contact: null,
                fee: "50",
                paid: false,
                notes: null,
                created_by: null,
                updated_by: null,
                created_at: "2026-05-01T10:00:00Z",
                updated_at: "2026-05-01T10:00:00Z",
                team_participants: [],
              },
              {
                id: "team-1",
                tournament_id: "tournament-1",
                name: "Alfa",
                captain_name: null,
                captain_contact: null,
                vice_captain_name: null,
                vice_captain_contact: null,
                fee: 50,
                paid: true,
                notes: null,
                created_by: null,
                updated_by: null,
                created_at: "2026-05-01T10:00:00Z",
                updated_at: "2026-05-01T10:00:00Z",
                team_participants: [],
              },
            ],
            tournament_groups: [
              {
                id: "group-1",
                tournament_id: "tournament-1",
                name: "Girone A",
                seed_index: "1",
                created_at: "2026-05-01T10:00:00Z",
                updated_at: "2026-05-01T10:00:00Z",
                tournament_group_teams: [],
              },
            ],
            tournament_matches: [
              {
                id: "match-1",
                tournament_id: "tournament-1",
                group_id: "group-1",
                round_label: "Gironi",
                home_team_id: "team-1",
                away_team_id: "team-2",
                home_score: "2",
                away_score: "1",
                status: "completed",
                starts_at: null,
                ends_at: null,
                field_label: null,
                created_at: "2026-05-01T10:00:00Z",
                updated_at: "2026-05-01T10:00:00Z",
              },
            ],
            tournament_standings: [
              {
                id: "standing-1",
                tournament_id: "tournament-1",
                group_id: "group-1",
                team_id: "team-1",
                played: "1",
                wins: "1",
                draws: "0",
                losses: "0",
                goals_for: "2",
                goals_against: "1",
                goal_diff: "1",
                points: "3",
                rank: "1",
                updated_at: "2026-05-01T10:00:00Z",
              },
            ],
          },
        ],
      },
    });

    const result = await service.listOperational();

    expect(result[0].fee).toBe(50);
    expect(result[0].status).toBe("registrations_open");
    expect(result[0].public_status).toBe("published");
    expect(result[0].tournament_teams.map((team) => team.name)).toEqual([
      "Alfa",
      "Zeta",
    ]);
    expect(result[0].tournament_teams[1].captain_name).toBeNull();
    expect(result[0].tournament_matches[0].home_score).toBe(2);
    expect(result[0].tournament_standings[0].points).toBe(3);
  });

  it("calls generate_group_stage with normalized group count", async () => {
    const calls: string[] = [];
    const service = serviceWith(
      {
        "rpc.generate_group_stage": {
          error: null,
          data: [
            {
              groups_created: "2",
              teams_assigned: "8",
              matches_created: "12",
              seeded_used: "0",
              note: "ok",
            },
          ],
        },
        "rpc.reset_tournament_schedule": {
          error: null,
          data: [
            {
              groups_deleted: "2",
              matches_deleted: "6",
              standings_deleted: "8",
              group_teams_deleted: "8",
            },
          ],
        },
      },
      calls,
    );

    const result = await service.generateGroupStage("tournament-1", 2.8);

    expect(result.matches_created).toBe(12);
    expect(calls[0]).toContain("generate_group_stage");
    expect(calls[0]).toContain('"p_group_count":2');
  });

  it("calls reset_tournament_schedule and normalizes counters", async () => {
    const calls: string[] = [];
    const service = serviceWith(
      {
        "rpc.reset_tournament_schedule": {
          error: null,
          data: [
            {
              groups_deleted: "2",
              matches_deleted: "6",
              standings_deleted: "8",
              group_teams_deleted: "8",
            },
          ],
        },
      },
      calls,
    );

    const result = await service.resetTournamentSchedule("tournament-1");

    expect(result.groups_deleted).toBe(2);
    expect(result.matches_deleted).toBe(6);
    expect(calls[0]).toContain("reset_tournament_schedule");
    expect(calls[0]).toContain('"p_tournament_id":"tournament-1"');
  });

  it("saves match results and recalculates group standings", async () => {
    const calls: string[] = [];
    const service = serviceWith(
      {
        "tournament_matches.update": {
          error: null,
          data: {
            id: "match-1",
            tournament_id: "tournament-1",
            group_id: "group-1",
            round_label: "Gironi",
            home_team_id: "team-1",
            away_team_id: "team-2",
            home_score: "3",
            away_score: "2",
            status: "completed",
            starts_at: null,
            ends_at: null,
            field_label: null,
            created_at: "2026-05-01T10:00:00Z",
            updated_at: "2026-05-01T10:00:00Z",
          },
        },
        "rpc.recalculate_group_standings": { error: null, data: null },
      },
      calls,
    );

    const result = await service.saveMatchResult({
      matchId: "match-1",
      groupId: "group-1",
      homeScore: 3,
      awayScore: 2,
      status: "completed",
    });

    expect(result.home_score).toBe(3);
    expect(calls).toContain("tournament_matches.eq:id:match-1");
    expect(
      calls.some((call) => call.startsWith("recalculate_group_standings")),
    ).toBeTrue();
  });

  it("rejects negative scores before writing", async () => {
    const calls: string[] = [];
    const service = serviceWith({}, calls);

    await expectAsync(
      service.saveMatchResult({
        matchId: "match-1",
        groupId: "group-1",
        homeScore: -1,
        awayScore: 0,
        status: "completed",
      }),
    ).toBeRejectedWithError("I punteggi non possono essere negativi.");
    expect(calls.length).toBe(0);
  });

  it("subscribes to public match changes with an optional tournament filter", async () => {
    const calls: string[] = [];
    const service = serviceWith({}, calls);

    const channel = service.subscribeToPublicMatchChanges(
      jasmine.createSpy(),
      "tournament-1",
    );
    await service.unsubscribe(channel);

    expect(calls[0]).toBe("channel:public-tournament-matches:tournament-1");
    expect(calls[1]).toContain('"table":"tournament_matches"');
    expect(calls[1]).toContain('"filter":"tournament_id=eq.tournament-1"');
    expect(calls).toContain("channel.subscribe");
    expect(calls).toContain("removeChannel:true");
  });
});

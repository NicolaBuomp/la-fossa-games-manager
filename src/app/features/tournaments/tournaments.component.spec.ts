import { TestBed } from "@angular/core/testing";
import { AuthService } from "../../core/services/auth.service";
import { SnackbarService } from "../../core/services/snackbar.service";
import { TournamentsService } from "../../core/services/tournaments.service";
import { OperationalTournament, TournamentMatch } from "../../core/types/models";
import { TournamentsComponent } from "./tournaments.component";

describe("TournamentsComponent", () => {
  function tournament(
    overrides: Partial<OperationalTournament> = {},
  ): OperationalTournament {
    return {
      id: "tournament-1",
      code: "pallavolo",
      name: "Green Volley",
      fee: 50,
      status: "registrations_open",
      public_status: "hidden",
      published_at: null,
      notes: null,
      created_by: null,
      updated_by: null,
      created_at: "2026-05-01T10:00:00Z",
      updated_at: "2026-05-01T10:00:00Z",
      tournament_teams: [],
      tournament_groups: [],
      tournament_matches: [],
      tournament_standings: [],
      ...overrides,
    };
  }

  function match(overrides: Partial<TournamentMatch> = {}): TournamentMatch {
    return {
      id: "match-1",
      tournament_id: "tournament-1",
      group_id: "group-1",
      round_label: "Gironi",
      home_team_id: "team-1",
      away_team_id: "team-2",
      home_score: 0,
      away_score: 0,
      status: "scheduled",
      starts_at: null,
      ends_at: null,
      field_label: null,
      created_at: "2026-05-01T10:00:00Z",
      updated_at: "2026-05-01T10:00:00Z",
      ...overrides,
    };
  }

  function createComponent(isAdmin: boolean): {
    component: TournamentsComponent;
    service: jasmine.SpyObj<TournamentsService>;
  } {
    TestBed.resetTestingModule();
    const service = jasmine.createSpyObj<TournamentsService>(
      "TournamentsService",
      [
        "listOperational",
        "generateGroupStage",
        "resetTournamentSchedule",
        "saveMatchResult",
        "updatePublication",
      ],
    );
    service.listOperational.and.resolveTo([]);
    service.generateGroupStage.and.resolveTo({
      groups_created: 2,
      teams_assigned: 8,
      matches_created: 12,
      seeded_used: 0,
      note: "ok",
    });
    service.resetTournamentSchedule.and.resolveTo({
      groups_deleted: 2,
      matches_deleted: 6,
      standings_deleted: 8,
      group_teams_deleted: 8,
    });
    service.saveMatchResult.and.resolveTo(match());
    service.updatePublication.and.resolveTo();

    TestBed.configureTestingModule({
      providers: [
        { provide: TournamentsService, useValue: service },
        {
          provide: AuthService,
          useValue: { isAdmin: () => isAdmin },
        },
        {
          provide: SnackbarService,
          useValue: {
            success: jasmine.createSpy(),
            error: jasmine.createSpy(),
          },
        },
      ],
    });

    const component = TestBed.runInInjectionContext(
      () => new TournamentsComponent(),
    );
    return { component, service };
  }

  it("blocks publication updates for staff users", async () => {
    const { component, service } = createComponent(false);
    await component.savePublication(
      tournament({ public_status: "published" }),
    );

    expect(service.updatePublication).not.toHaveBeenCalled();
  });

  it("sets published_at when an admin publishes a tournament", async () => {
    const { component, service } = createComponent(true);
    await component.savePublication(
      tournament({ public_status: "results_published" }),
    );

    expect(service.updatePublication).toHaveBeenCalledOnceWith(
      "tournament-1",
      jasmine.objectContaining({
        status: "registrations_open",
        public_status: "results_published",
      }),
    );
    expect(
      service.updatePublication.calls.mostRecent().args[1].published_at,
    ).toEqual(jasmine.any(String));
  });

  it("validates negative scores before saving", async () => {
    const { component, service } = createComponent(true);
    const invalidMatch = match({ home_score: -1, away_score: 0 });

    expect(component.canSaveMatch(invalidMatch)).toBeFalse();
    await component.saveMatch(invalidMatch);

    expect(service.saveMatchResult).not.toHaveBeenCalled();
  });

  it("requires confirmation before generating groups", async () => {
    const { component, service } = createComponent(true);
    const selected = tournament({ tournament_teams: [{ id: "team-1" } as never] });

    component.groupCount = 3;
    component.askGenerateGroups(selected);

    expect(component.pendingGenerateTournament()).toBe(selected);
    expect(service.generateGroupStage).not.toHaveBeenCalled();

    await component.confirmGenerateGroups();

    expect(service.generateGroupStage).toHaveBeenCalledOnceWith(
      "tournament-1",
      3,
    );
  });

  it("blocks schedule reset for staff users", async () => {
    const { component, service } = createComponent(false);
    const selected = tournament();

    component.askResetSchedule(selected);
    await component.confirmResetSchedule();

    expect(component.pendingResetTournament()).toBeNull();
    expect(service.resetTournamentSchedule).not.toHaveBeenCalled();
  });

  it("requires confirmation before resetting groups and schedule", async () => {
    const { component, service } = createComponent(true);
    const selected = tournament();

    component.askResetSchedule(selected);

    expect(component.pendingResetTournament()).toBe(selected);
    expect(service.resetTournamentSchedule).not.toHaveBeenCalled();

    await component.confirmResetSchedule();

    expect(service.resetTournamentSchedule).toHaveBeenCalledOnceWith(
      "tournament-1",
    );
  });
});

import { TestBed } from "@angular/core/testing";
import { TOURNAMENT_STATUSES, TOURNAMENT_PUBLIC_STATUSES, TOURNAMENT_MATCH_STATUS } from "../../../core/types/constants";
import { OperationalTournament } from "../../../core/types/models";
import { TorneiCardComponent } from "./tornei-card.component";

describe("TorneiCardComponent", () => {
  function makeTournament(overrides: Partial<OperationalTournament> = {}): OperationalTournament {
    return {
      id: "t-1",
      code: "calcio-a-5",
      name: "Calcio a 5",
      sport: "calcio",
      fee: 30,
      date: null,
      status: "registrations_open",
      public_status: "published",
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

  function makeComponent(tournament: OperationalTournament): TorneiCardComponent {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    const c = TestBed.runInInjectionContext(() => new TorneiCardComponent());
    c.tournament = tournament;
    return c;
  }

  // ------------------------------------------------------------------ sportLabel
  describe("sportLabel()", () => {
    it("mappa calcio", () => {
      const c = makeComponent(makeTournament());
      expect(c.sportLabel("calcio")).toBe("Calcio a 5");
    });

    it("mappa pallavolo", () => {
      const c = makeComponent(makeTournament());
      expect(c.sportLabel("pallavolo")).toBe("Pallavolo");
    });

    it("mappa altro", () => {
      const c = makeComponent(makeTournament());
      expect(c.sportLabel("altro")).toBe("Altro");
    });

    it("restituisce il valore grezzo per sport sconosciuto", () => {
      const c = makeComponent(makeTournament());
      expect(c.sportLabel("unknown")).toBe("unknown");
    });
  });

  // ------------------------------------------------------------------ sportEmoji
  describe("sportEmoji()", () => {
    it("restituisce ⚽ per calcio", () => {
      const c = makeComponent(makeTournament());
      expect(c.sportEmoji("calcio")).toBe("⚽");
    });

    it("restituisce 🏐 per pallavolo", () => {
      const c = makeComponent(makeTournament());
      expect(c.sportEmoji("pallavolo")).toBe("🏐");
    });

    it("restituisce 🏆 come fallback per sport sconosciuto", () => {
      const c = makeComponent(makeTournament());
      expect(c.sportEmoji("unknown")).toBe("🏆");
    });
  });

  // ------------------------------------------------------------------ sportStyle
  describe("sportStyle()", () => {
    it("restituisce stile verde per calcio", () => {
      const c = makeComponent(makeTournament());
      expect(c.sportStyle("calcio")).toContain("#dcfce7");
    });

    it("restituisce stile blu per pallavolo", () => {
      const c = makeComponent(makeTournament());
      expect(c.sportStyle("pallavolo")).toContain("#dbeafe");
    });

    it("usa stile 'altro' come fallback", () => {
      const c = makeComponent(makeTournament());
      expect(c.sportStyle("unknown")).toContain("#f3e8ff");
    });
  });

  // ------------------------------------------------------------------ statusLabel / statusClass
  describe("statusLabel() e statusClass()", () => {
    it("statusLabel restituisce l'etichetta corretta da TOURNAMENT_STATUSES", () => {
      const c = makeComponent(makeTournament());
      for (const s of TOURNAMENT_STATUSES) {
        expect(c.statusLabel(s.id)).toBe(s.label);
      }
    });

    it("statusClass restituisce la className corretta da TOURNAMENT_STATUSES", () => {
      const c = makeComponent(makeTournament());
      for (const s of TOURNAMENT_STATUSES) {
        expect(c.statusClass(s.id)).toBe(s.className);
      }
    });

    it("statusClass usa state-neutral come fallback", () => {
      const c = makeComponent(makeTournament());
      expect(c.statusClass("unknown" as never)).toBe("state-neutral");
    });
  });

  // ------------------------------------------------------------------ publicStatusLabel / publicStatusClass
  describe("publicStatusLabel() e publicStatusClass()", () => {
    it("publicStatusLabel mappa tutti gli stati pubblici", () => {
      const c = makeComponent(makeTournament());
      for (const s of TOURNAMENT_PUBLIC_STATUSES) {
        expect(c.publicStatusLabel(s.id)).toBe(s.label);
      }
    });

    it("publicStatusClass mappa tutti gli stati pubblici", () => {
      const c = makeComponent(makeTournament());
      for (const s of TOURNAMENT_PUBLIC_STATUSES) {
        expect(c.publicStatusClass(s.id)).toBe(s.className);
      }
    });
  });

  // ------------------------------------------------------------------ paidCount
  describe("paidCount()", () => {
    it("conta solo le squadre con paid=true", () => {
      const c = makeComponent(makeTournament({
        tournament_teams: [
          { id: "a", paid: true } as never,
          { id: "b", paid: false } as never,
          { id: "c", paid: true } as never,
        ],
      }));
      expect(c.paidCount()).toBe(2);
    });

    it("restituisce 0 se nessuna squadra", () => {
      const c = makeComponent(makeTournament());
      expect(c.paidCount()).toBe(0);
    });
  });

  // ------------------------------------------------------------------ openMatches
  describe("openMatches()", () => {
    it("esclude completed e cancelled", () => {
      const c = makeComponent(makeTournament({
        tournament_matches: [
          { id: "m1", status: TOURNAMENT_MATCH_STATUS.Scheduled } as never,
          { id: "m2", status: TOURNAMENT_MATCH_STATUS.Live } as never,
          { id: "m3", status: TOURNAMENT_MATCH_STATUS.Completed } as never,
          { id: "m4", status: TOURNAMENT_MATCH_STATUS.Cancelled } as never,
        ],
      }));
      expect(c.openMatches()).toBe(2);
    });

    it("restituisce 0 senza partite", () => {
      const c = makeComponent(makeTournament());
      expect(c.openMatches()).toBe(0);
    });
  });
});

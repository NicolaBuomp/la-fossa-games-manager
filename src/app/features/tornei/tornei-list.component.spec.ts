import { TestBed } from "@angular/core/testing";
import { Router } from "@angular/router";
import { AuthService } from "../../core/services/auth.service";
import { RegistrationsService } from "../../core/services/registrations.service";
import { SnackbarService } from "../../core/services/snackbar.service";
import { TournamentsService } from "../../core/services/tournaments.service";
import { OperationalTournament } from "../../core/types/models";
import { TorneiListComponent } from "./tornei-list.component";

describe("TorneiListComponent", () => {
  function makeTournament(overrides: Partial<OperationalTournament> = {}): OperationalTournament {
    return {
      id: "t-1",
      code: "calcio-a-5",
      name: "Calcio a 5",
      fee: 30,
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

  function setup(isAdmin = true) {
    TestBed.resetTestingModule();

    const tournamentsService = jasmine.createSpyObj<TournamentsService>(
      "TournamentsService",
      ["listOperational"],
    );
    tournamentsService.listOperational.and.resolveTo([]);

    const registrationsService = jasmine.createSpyObj<RegistrationsService>(
      "RegistrationsService",
      ["createTournament"],
    );
    registrationsService.createTournament.and.resolveTo({} as never);

    const router = jasmine.createSpyObj<Router>("Router", ["navigate"]);
    router.navigate.and.resolveTo(true);

    const snackbar = { success: jasmine.createSpy(), error: jasmine.createSpy(), warning: jasmine.createSpy() };

    TestBed.configureTestingModule({
      providers: [
        { provide: TournamentsService, useValue: tournamentsService },
        { provide: RegistrationsService, useValue: registrationsService },
        { provide: AuthService, useValue: { isAdmin: () => isAdmin } },
        { provide: SnackbarService, useValue: snackbar },
        { provide: Router, useValue: router },
      ],
    });

    const component = TestBed.runInInjectionContext(() => new TorneiListComponent());
    return { component, tournamentsService, registrationsService, router, snackbar };
  }

  // ------------------------------------------------------------------ state
  describe("stato iniziale", () => {
    it("parte con lista tornei vuota e loading false", () => {
      const { component } = setup();
      expect(component.tournaments()).toEqual([]);
      expect(component.loading()).toBeFalse();
    });

    it("totalTeams è 0 con nessun torneo", () => {
      const { component } = setup();
      expect(component.totalTeams()).toBe(0);
    });

    it("publishedCount è 0 con nessun torneo", () => {
      const { component } = setup();
      expect(component.publishedCount()).toBe(0);
    });

    it("openMatchCount è 0 con nessun torneo", () => {
      const { component } = setup();
      expect(component.openMatchCount()).toBe(0);
    });
  });

  // ------------------------------------------------------------------ computed
  describe("computed signals", () => {
    it("totalTeams somma le squadre di tutti i tornei", () => {
      const { component } = setup();
      component.tournaments.set([
        makeTournament({ tournament_teams: [{ id: "a" } as never, { id: "b" } as never] }),
        makeTournament({ id: "t-2", tournament_teams: [{ id: "c" } as never] }),
      ]);
      expect(component.totalTeams()).toBe(3);
    });

    it("publishedCount conta solo tornei con public_status published o results_published", () => {
      const { component } = setup();
      component.tournaments.set([
        makeTournament({ public_status: "published" }),
        makeTournament({ id: "t-2", public_status: "results_published" }),
        makeTournament({ id: "t-3", public_status: "hidden" }),
        makeTournament({ id: "t-4", public_status: "registrations_open" }),
      ]);
      expect(component.publishedCount()).toBe(2);
    });

    it("openMatchCount conta solo partite non completate e non cancellate", () => {
      const { component } = setup();
      component.tournaments.set([
        makeTournament({
          tournament_matches: [
            { id: "m1", status: "scheduled" } as never,
            { id: "m2", status: "live" } as never,
            { id: "m3", status: "completed" } as never,
            { id: "m4", status: "cancelled" } as never,
          ],
        }),
      ]);
      expect(component.openMatchCount()).toBe(2);
    });
  });

  // ------------------------------------------------------------------ load
  describe("load()", () => {
    it("chiama listOperational e popola tournaments", async () => {
      const { component, tournamentsService } = setup();
      const data = [makeTournament()];
      tournamentsService.listOperational.and.resolveTo(data);

      await component.load();

      expect(component.tournaments()).toEqual(data);
      expect(component.loading()).toBeFalse();
      expect(component.error()).toBe("");
    });

    it("imposta error se il servizio lancia un'eccezione", async () => {
      const { component, tournamentsService } = setup();
      tournamentsService.listOperational.and.rejectWith(new Error("Network error"));

      await component.load();

      expect(component.error()).toBe("Network error");
      expect(component.loading()).toBeFalse();
    });

    it("non esegue una seconda load mentre è già in corso", async () => {
      const { component, tournamentsService } = setup();
      let resolveFirst!: (v: OperationalTournament[]) => void;
      tournamentsService.listOperational.and.returnValue(
        new Promise((res) => { resolveFirst = res; }),
      );

      const p1 = component.load();
      const p2 = component.load();

      resolveFirst([]);
      await Promise.all([p1, p2]);

      expect(tournamentsService.listOperational).toHaveBeenCalledTimes(1);
    });
  });

  // ------------------------------------------------------------------ modal
  describe("gestione modale", () => {
    it("openNewModal apre il modal e pulisce l'errore", () => {
      const { component } = setup();
      component.modalError.set("vecchio errore");
      component.openNewModal();
      expect(component.modalOpen()).toBeTrue();
      expect(component.modalError()).toBe("");
    });

    it("closeModal chiude il modal", () => {
      const { component } = setup();
      component.openNewModal();
      component.closeModal();
      expect(component.modalOpen()).toBeFalse();
    });
  });

  // ------------------------------------------------------------------ createTournament
  describe("createTournament()", () => {
    const payload = { name: "Nuovo Torneo", sport: "calcio" as const, fee: 50, date: null, notes: null };

    it("chiama registrationsService.createTournament e poi ricarica", async () => {
      const { component, registrationsService, tournamentsService } = setup();
      tournamentsService.listOperational.and.resolveTo([]);

      component.openNewModal();
      await component.createTournament(payload);

      expect(registrationsService.createTournament).toHaveBeenCalledWith(jasmine.objectContaining({ name: "Nuovo Torneo" }));
      expect(tournamentsService.listOperational).toHaveBeenCalled();
      expect(component.modalOpen()).toBeFalse();
    });

    it("imposta modalError se il salvataggio fallisce", async () => {
      const { component, registrationsService } = setup();
      registrationsService.createTournament.and.rejectWith(new Error("Duplicate"));

      component.openNewModal();
      await component.createTournament(payload);

      expect(component.modalError()).toBe("Duplicate");
      expect(component.modalOpen()).toBeTrue();
    });

    it("non esegue un secondo salvataggio mentre è in corso il primo", async () => {
      const { component, registrationsService } = setup();
      let resolve!: (v: unknown) => void;
      registrationsService.createTournament.and.returnValue(new Promise<never>((r) => { resolve = r as never; }));

      component.openNewModal();
      const p1 = component.createTournament(payload);
      const p2 = component.createTournament(payload);

      resolve({} as never);
      await Promise.all([p1, p2]);

      expect(registrationsService.createTournament).toHaveBeenCalledTimes(1);
    });
  });

  // ------------------------------------------------------------------ navigate
  describe("navigate()", () => {
    it("naviga verso /app/tornei/:id", () => {
      const { component, router } = setup();
      component.navigate("t-42");
      expect(router.navigate).toHaveBeenCalledWith(["/app/tornei", "t-42"]);
    });
  });
});

import { TestBed } from "@angular/core/testing";
import { Router } from "@angular/router";
import { AuthService } from "../../../core/services/auth.service";
import { RegistrationsService } from "../../../core/services/registrations.service";
import { SnackbarService } from "../../../core/services/snackbar.service";
import {
  TeamParticipant,
  TournamentTeamWithParticipants,
  TournamentWithTeams,
} from "../../../core/types/models";
import { TorneiTabIscrittiComponent } from "./tornei-tab-iscritti.component";

describe("TorneiTabIscrittiComponent", () => {
  function makeTeam(overrides: Partial<TournamentTeamWithParticipants> = {}): TournamentTeamWithParticipants {
    return {
      id: "team-1",
      tournament_id: "t-1",
      name: "Aquile",
      captain_name: "Mario",
      captain_contact: "333111",
      vice_captain_name: null,
      vice_captain_contact: null,
      fee: 30,
      paid: false,
      notes: null,
      created_by: null,
      updated_by: null,
      created_at: "2026-05-01T10:00:00Z",
      updated_at: "2026-05-01T10:00:00Z",
      team_participants: [],
      ...overrides,
    };
  }

  function makeTournament(overrides: Partial<TournamentWithTeams> = {}): TournamentWithTeams {
    return {
      id: "t-1",
      code: "calcio-a-5",
      name: "Calcio a 5",
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
      ...overrides,
    };
  }

  function makeParticipant(overrides: Partial<TeamParticipant> = {}): TeamParticipant {
    return {
      id: "p-1",
      team_id: "team-1",
      first_name: "Luca",
      last_name: "Rossi",
      contact: "333",
      registered: false,
      created_by: null,
      updated_by: null,
      created_at: "2026-05-01T10:00:00Z",
      updated_at: "2026-05-01T10:00:00Z",
      ...overrides,
    };
  }

  function setup(tournament: TournamentWithTeams = makeTournament()) {
    TestBed.resetTestingModule();

    const service = jasmine.createSpyObj<RegistrationsService>("RegistrationsService", [
      "createTeam", "updateTeam", "removeTeam",
      "createParticipant", "updateParticipant", "removeParticipant",
    ]);
    service.updateTeam.and.resolveTo({} as never);
    service.removeTeam.and.resolveTo();
    service.createTeam.and.resolveTo({ id: "new-team" } as never);
    service.createParticipant.and.resolveTo({} as never);
    service.updateParticipant.and.resolveTo({} as never);
    service.removeParticipant.and.resolveTo();

    const router = jasmine.createSpyObj<Router>("Router", ["navigate"]);
    router.navigate.and.resolveTo(true);

    const snackbar = {
      success: jasmine.createSpy(),
      error: jasmine.createSpy(),
      warning: jasmine.createSpy(),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: RegistrationsService, useValue: service },
        { provide: AuthService, useValue: { isAdmin: () => true } },
        { provide: SnackbarService, useValue: snackbar },
        { provide: Router, useValue: router },
      ],
    });

    const component = TestBed.runInInjectionContext(() => new TorneiTabIscrittiComponent());
    component.tournament = () => tournament;
    component.tournamentId = tournament.id;

    return { component, service, router, snackbar };
  }

  // ------------------------------------------------------------------ computed
  describe("computed signals", () => {
    it("teamCount rispecchia il numero di squadre", () => {
      const tournament = makeTournament({ tournament_teams: [makeTeam(), makeTeam({ id: "team-2" })] });
      const { component } = setup(tournament);
      expect(component.teamCount()).toBe(2);
    });

    it("paidCount conta solo squadre paid=true", () => {
      const t = makeTournament({
        tournament_teams: [
          makeTeam({ paid: true }),
          makeTeam({ id: "t2", paid: false }),
          makeTeam({ id: "t3", paid: true }),
        ],
      });
      const { component } = setup(t);
      expect(component.paidCount()).toBe(2);
    });

    it("paidAmount moltiplica paidCount per fee del torneo", () => {
      const t = makeTournament({
        fee: 30,
        tournament_teams: [
          makeTeam({ paid: true }),
          makeTeam({ id: "t2", paid: false }),
        ],
      });
      const { component } = setup(t);
      expect(component.paidAmount()).toBe(30);
    });

    it("isDirect è true per tornei con codice diretto (es. fifa)", () => {
      const t = makeTournament({ code: "fifa" });
      const { component } = setup(t);
      expect(component.isDirect()).toBeTrue();
    });

    it("isDirect è false per tornei standard (calcio-a-5)", () => {
      const { component } = setup();
      expect(component.isDirect()).toBeFalse();
    });

    it("isDuo è true per codici duo (briscola)", () => {
      const t = makeTournament({ code: "briscola" });
      const { component } = setup(t);
      expect(component.isDuo()).toBeTrue();
    });
  });

  // ------------------------------------------------------------------ filteredTeams
  describe("filteredTeams()", () => {
    const t = makeTournament({
      tournament_teams: [
        makeTeam({ id: "t1", name: "Aquile", captain_name: "Mario", paid: true }),
        makeTeam({ id: "t2", name: "Tigri", captain_name: "Luigi", paid: false }),
        makeTeam({ id: "t3", name: "Leoni", captain_name: "Luigi", paid: true }),
      ],
    });

    it("restituisce tutte le squadre senza filtri", () => {
      const { component } = setup(t);
      expect(component.filteredTeams().length).toBe(3);
    });

    it("filtra per searchQuery sul nome squadra", () => {
      const { component } = setup(t);
      component.searchQuery.set("aqui");
      expect(component.filteredTeams().length).toBe(1);
      expect(component.filteredTeams()[0].name).toBe("Aquile");
    });

    it("filtra per searchQuery sul capitano", () => {
      const { component } = setup(t);
      component.searchQuery.set("luigi");
      expect(component.filteredTeams().length).toBe(2);
    });

    it("filtra per paymentFilter=paid", () => {
      const { component } = setup(t);
      component.paymentFilter.set("paid");
      expect(component.filteredTeams().every((x) => x.paid)).toBeTrue();
    });

    it("filtra per paymentFilter=pending", () => {
      const { component } = setup(t);
      component.paymentFilter.set("pending");
      expect(component.filteredTeams().every((x) => !x.paid)).toBeTrue();
    });
  });

  // ------------------------------------------------------------------ onTogglePaid
  describe("onTogglePaid()", () => {
    it("chiama updateTeam con paid invertito", async () => {
      const team = makeTeam({ paid: false });
      const { component, service } = setup(makeTournament({ tournament_teams: [team] }));

      await component.onTogglePaid(team);

      expect(service.updateTeam).toHaveBeenCalledOnceWith("team-1", { paid: true });
    });
  });

  // ------------------------------------------------------------------ onAskRemoveTeam / doConfirm
  describe("onAskRemoveTeam() + doConfirm()", () => {
    it("imposta confirmPending e doConfirm chiama removeTeam", async () => {
      const { component, service } = setup();

      component.onAskRemoveTeam("team-1");
      expect(component.confirmPending()).not.toBeNull();

      await component.doConfirm();
      expect(service.removeTeam).toHaveBeenCalledOnceWith("team-1");
      expect(component.confirmPending()).toBeNull();
    });
  });

  // ------------------------------------------------------------------ onAskRemoveParticipant
  describe("onAskRemoveParticipant() + doConfirm()", () => {
    it("richiede conferma e poi chiama removeParticipant", async () => {
      const { component, service } = setup();

      component.onAskRemoveParticipant("p-1");
      expect(component.confirmPending()).not.toBeNull();

      await component.doConfirm();
      expect(service.removeParticipant).toHaveBeenCalledOnceWith("p-1");
    });
  });

  // ------------------------------------------------------------------ modal
  describe("apertura / chiusura modal", () => {
    it("onAddNew apre modal 'team' per tornei standard", () => {
      const { component } = setup();
      component.onAddNew();
      expect(component.modalMode()).toBe("team");
    });

    it("onAddNew apre modal 'direct' per tornei diretti (fifa)", () => {
      const { component } = setup(makeTournament({ code: "fifa" }));
      component.onAddNew();
      expect(component.modalMode()).toBe("direct");
    });

    it("closeModal resetta modalMode e gli editing", () => {
      const { component } = setup();
      component.onAddNew();
      component.closeModal();
      expect(component.modalMode()).toBeNull();
      expect(component.editingTeam()).toBeNull();
    });
  });

  // ------------------------------------------------------------------ openTeamDetail
  describe("openTeamDetail()", () => {
    it("naviga verso la pagina dettaglio squadra", () => {
      const { component, router } = setup();
      component.openTeamDetail("team-99");
      expect(router.navigate).toHaveBeenCalledWith(["/app/tornei", "t-1", "squadre", "team-99"]);
    });
  });

  // ------------------------------------------------------------------ onSaveTeam
  describe("onSaveTeam()", () => {
    it("non salva se captain_contact è vuoto", async () => {
      const { component, service } = setup();
      const payload = {
        tournament_id: "t-1", name: "Aquile", captain_name: "Mario",
        captain_contact: "", vice_captain_name: null, vice_captain_contact: null,
        fee: 30, paid: false, notes: null,
      };

      await component.onSaveTeam(payload);

      expect(service.createTeam).not.toHaveBeenCalled();
      expect(component.modalError()).toContain("capitano");
    });

    it("chiama createTeam in modalità creazione", async () => {
      const { component, service } = setup();
      component.onAddNew();
      const payload = {
        tournament_id: "t-1", name: "Aquile", captain_name: "Mario",
        captain_contact: "333111", vice_captain_name: null, vice_captain_contact: null,
        fee: 30, paid: false, notes: null,
      };

      await component.onSaveTeam(payload);

      expect(service.createTeam).toHaveBeenCalled();
      expect(component.modalMode()).toBeNull();
    });

    it("chiama updateTeam in modalità modifica", async () => {
      const team = makeTeam();
      const t = makeTournament({ tournament_teams: [team] });
      const { component, service } = setup(t);

      component.onEditTeam(team);
      const payload = {
        tournament_id: "t-1", name: "Aquile aggiornate", captain_name: "Mario",
        captain_contact: "333111", vice_captain_name: null, vice_captain_contact: null,
        fee: 30, paid: false, notes: null,
      };

      await component.onSaveTeam(payload);

      expect(service.updateTeam).toHaveBeenCalled();
    });
  });

  // ------------------------------------------------------------------ onSaveParticipant
  describe("onSaveParticipant()", () => {
    it("chiama createParticipant in modalità creazione", async () => {
      const team = makeTeam();
      const t = makeTournament({ tournament_teams: [team] });
      const { component, service } = setup(t);

      component.onNewParticipant("team-1");
      const payload = {
        team_id: "team-1", first_name: "Luca", last_name: "Rossi",
        contact: "333", gender: "uomo" as const, registered: false,
      };

      await component.onSaveParticipant(payload);

      expect(service.createParticipant).toHaveBeenCalled();
    });

    it("chiama updateParticipant in modalità modifica", async () => {
      const participant = makeParticipant();
      const team = makeTeam({ team_participants: [participant] });
      const t = makeTournament({ tournament_teams: [team] });
      const { component, service } = setup(t);

      component.onEditParticipant(participant);
      const payload = {
        team_id: "team-1", first_name: "Luca Editato", last_name: "Rossi",
        contact: "333", gender: "uomo" as const, registered: false,
      };

      await component.onSaveParticipant(payload);

      expect(service.updateParticipant).toHaveBeenCalled();
    });

    it("blocca l'aggiunta di più di 1 tesserato FIPAV in pallavolo", async () => {
      const registeredParticipant = makeParticipant({ registered: true });
      const team = makeTeam({ team_participants: [registeredParticipant] });
      const t = makeTournament({ code: "pallavolo", tournament_teams: [team] });
      const { component, service } = setup(t);

      component.onNewParticipant("team-1");
      const payload = {
        team_id: "team-1", first_name: "Paolo", last_name: "Bianchi",
        contact: "444", gender: "uomo" as const, registered: true,
      };

      await component.onSaveParticipant(payload);

      expect(service.createParticipant).not.toHaveBeenCalled();
      expect(component.modalError()).toContain("FIPAV");
    });
  });

  // ------------------------------------------------------------------ eur
  describe("eur()", () => {
    it("formatta i valori in euro", () => {
      const { component } = setup();
      const result = component.eur(1500);
      expect(result).toContain("1.500");
    });
  });
});

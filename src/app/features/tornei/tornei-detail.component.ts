import { Component, OnInit, computed, inject, signal } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { AuthService } from "../../core/services/auth.service";
import { RegistrationsService } from "../../core/services/registrations.service";
import { SnackbarService } from "../../core/services/snackbar.service";
import { TournamentsService } from "../../core/services/tournaments.service";
import {
  TOURNAMENT_PUBLIC_STATUSES,
  TOURNAMENT_STATUSES,
} from "../../core/types/constants";
import {
  OperationalTournament,
  TournamentWithTeams,
} from "../../core/types/models";
import { EmptyStateComponent } from "../../shared/components/ui.component";
import { TorneiTabClassificheComponent } from "./components/tornei-tab-classifiche.component";
import { TorneiTabGironiComponent } from "./components/tornei-tab-gironi.component";
import { TorneiTabImpostazioniComponent } from "./components/tornei-tab-impostazioni.component";
import { TorneiTabIscrittiComponent } from "./components/tornei-tab-iscritti.component";
import { TorneiTabPartiteComponent } from "./components/tornei-tab-partite.component";
import { TorneiTabPubblicazioneComponent } from "./components/tornei-tab-pubblicazione.component";

type TorneiTab =
  | "iscritti"
  | "impostazioni"
  | "gironi"
  | "partite"
  | "classifiche"
  | "pubblicazione";

const TABS: { id: TorneiTab; label: string; adminOnly?: boolean }[] = [
  { id: "iscritti", label: "Iscritti" },
  { id: "impostazioni", label: "Impostazioni" },
  { id: "gironi", label: "Gironi" },
  { id: "partite", label: "Partite" },
  { id: "classifiche", label: "Classifiche" },
  { id: "pubblicazione", label: "Pubblicazione", adminOnly: true },
];

@Component({
  selector: "lfg-tornei-detail",
  standalone: true,
  imports: [
    EmptyStateComponent,
    TorneiTabGironiComponent,
    TorneiTabPartiteComponent,
    TorneiTabClassificheComponent,
    TorneiTabPubblicazioneComponent,
    TorneiTabImpostazioniComponent,
    TorneiTabIscrittiComponent,
  ],
  template: `
    @if (loading() && !tournament()) {
      <!-- Skeleton -->
      <div
        class="bg-strong -mx-4 -mt-4 mb-6 px-4 pb-6 pt-5 sm:-mx-6 sm:-mt-6 sm:px-6"
      >
        <div class="h-4 w-32 animate-pulse rounded bg-white/10 mb-3"></div>
        <div class="h-8 w-64 animate-pulse rounded bg-white/10"></div>
      </div>
    } @else if (!tournament()) {
      <lfg-empty-state
        title="Torneo non trovato"
        text="Il torneo richiesto non esiste o è stato rimosso."
      />
    } @else {
      <!-- HERO HEADER DARK -->
      <header
        class="bg-strong text-on-strong -mx-4 -mt-4 px-4 pb-0 pt-5 sm:-mx-6 sm:-mt-6 sm:px-6"
        style="position:sticky;top:0;z-index:30;"
      >
        <!-- Back + breadcrumb -->
        <button
          type="button"
          class="mb-3 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide opacity-60 hover:opacity-100 transition-opacity"
          (click)="goBack()"
        >
          ← Tornei
        </button>

        <!-- Title row -->
        <div class="flex flex-wrap items-start justify-between gap-2 pb-3">
          <div class="min-w-0">
            <h1
              class="font-display text-2xl uppercase leading-tight sm:text-3xl"
            >
              {{ tournament()!.name }}
            </h1>
            <p class="mt-1 text-xs font-semibold opacity-60">
              @if (tournament()!.fee) {
                €{{ tournament()!.fee }}
              }
              @if (tournament()!.date) {
                @if (tournament()!.fee) { · }{{ dateLabel(tournament()!.date) }}
              }
            </p>
          </div>
          <div class="flex flex-wrap gap-1.5 pt-0.5">
            <span
              class="rounded px-2 py-0.5 text-[10px] font-bold uppercase"
              [class]="statusClass(tournament()!.status)"
            >
              {{ statusLabel(tournament()!.status) }}
            </span>
            @if (tournament()!.public_status !== "hidden") {
              <span
                class="rounded px-2 py-0.5 text-[10px] font-bold uppercase"
                [class]="publicStatusClass(tournament()!.public_status)"
              >
                {{ publicStatusLabel(tournament()!.public_status) }}
              </span>
            }
          </div>
        </div>

        <!-- Tab bar scrollable -->
        <nav
          class="flex gap-1 overflow-x-auto no-scrollbar pb-0"
          style="margin: 0 -1rem; padding: 0 1rem; border-bottom: 2px solid rgba(255,255,255,0.1);"
        >
          @for (tab of visibleTabs(); track tab.id) {
            <button
              type="button"
              class="flex-shrink-0 rounded-t-lg px-4 py-2.5 text-xs font-black uppercase tracking-wide transition-all"
              [class.bg-accent]="activeTab() === tab.id"
              [class.text-on-accent]="activeTab() === tab.id"
              [class.opacity-60]="activeTab() !== tab.id"
              [class.text-on-strong]="activeTab() !== tab.id"
              [class.hover:opacity-100]="activeTab() !== tab.id"
              (click)="setTab(tab.id)"
            >
              {{ tab.label }}
            </button>
          }
        </nav>
      </header>

      <!-- TAB CONTENT -->
      <div class="pt-6">
        @if (error()) {
          <p
            class="mb-4 form-error"
          >
            {{ error() }}
          </p>
        }

        @if (activeTab() === "iscritti" && tournamentWithTeams()) {
          <lfg-tornei-tab-iscritti
            [tournament]="tournamentWithTeamsNN"
            [tournamentId]="tournamentId()"
            (reloadRequired)="reload()"
          />
        }

        @if (activeTab() === "impostazioni") {
          <lfg-tornei-tab-impostazioni
            [tournament]="tournamentNN"
            (reloadRequired)="reload()"
          />
        }

        @if (activeTab() === "gironi") {
          <lfg-tornei-tab-gironi
            [tournament]="tournamentNN"
            (reloadRequired)="reload()"
          />
        }

        @if (activeTab() === "partite") {
          <lfg-tornei-tab-partite
            [tournament]="tournamentNN"
            (reloadRequired)="reload()"
          />
        }

        @if (activeTab() === "classifiche") {
          <lfg-tornei-tab-classifiche [tournament]="tournamentNN" />
        }

        @if (activeTab() === "pubblicazione" && auth.isAdmin()) {
          <lfg-tornei-tab-pubblicazione
            [tournament]="tournamentNN"
            (reloadRequired)="reload()"
          />
        }
      </div>
    }
  `,
})
export class TorneiDetailComponent implements OnInit {
  readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly tournamentsService = inject(TournamentsService);
  private readonly registrationsService = inject(RegistrationsService);
  private readonly snackbar = inject(SnackbarService);

  tournament = signal<OperationalTournament | null>(null);
  tournamentWithTeams = signal<TournamentWithTeams | null>(null);
  loading = signal(false);
  error = signal("");
  activeTab = signal<TorneiTab>("iscritti");

  tournamentId = computed(() => this.route.snapshot.params["id"] as string);

  // Non-null wrappers for tab inputs (used only inside @if guards)
  tournamentNN = computed(() => this.tournament()!);
  tournamentWithTeamsNN = computed(() => this.tournamentWithTeams()!);

  visibleTabs = computed(() =>
    TABS.filter((tab) => !tab.adminOnly || this.auth.isAdmin()),
  );

  ngOnInit(): void {
    const tab = this.route.snapshot.queryParams["tab"] as TorneiTab | undefined;
    if (tab && TABS.some((t) => t.id === tab)) {
      this.activeTab.set(tab);
    }
    void this.load();
  }

  async load(): Promise<void> {
    const id = this.tournamentId();
    if (!id) return;
    if (this.loading()) return;
    this.loading.set(true);
    this.error.set("");
    try {
      const [operational, withTeams] = await Promise.all([
        this.tournamentsService.getOperational(id),
        this.registrationsService.getTournamentWithTeams(id),
      ]);
      this.tournament.set(operational);
      this.tournamentWithTeams.set(withTeams);
    } catch (err) {
      this.error.set(
        err instanceof Error ? err.message : "Errore nel caricamento.",
      );
      this.snackbar.error(this.error());
    } finally {
      this.loading.set(false);
    }
  }

  async reload(): Promise<void> {
    await this.load();
  }

  setTab(tab: TorneiTab): void {
    this.activeTab.set(tab);
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab },
      queryParamsHandling: "merge",
      replaceUrl: true,
    });
  }

  goBack(): void {
    void this.router.navigate(["/app/tornei"]);
  }

  dateLabel(date: string | null | undefined): string {
    if (!date) return "";
    try {
      return new Intl.DateTimeFormat("it-IT", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(new Date(date));
    } catch {
      return date;
    }
  }

  statusLabel(status: string): string {
    return TOURNAMENT_STATUSES.find((s) => s.id === status)?.label ?? status;
  }

  statusClass(status: string): string {
    return (
      TOURNAMENT_STATUSES.find((s) => s.id === status)?.className ??
      "state-neutral"
    );
  }

  publicStatusLabel(status: string): string {
    return (
      TOURNAMENT_PUBLIC_STATUSES.find((s) => s.id === status)?.label ?? status
    );
  }

  publicStatusClass(status: string): string {
    return (
      TOURNAMENT_PUBLIC_STATUSES.find((s) => s.id === status)?.className ??
      "state-neutral"
    );
  }
}

import {
  AfterViewInit,
  Component,
  computed,
  ElementRef,
  inject,
  OnDestroy,
  OnInit,
  signal,
  ViewEncapsulation,
} from "@angular/core";
import { RealtimeChannel } from "@supabase/supabase-js";
import { PublicParticipationService } from "../../core/services/public-participation.service";
import { SnackbarService } from "../../core/services/snackbar.service";
import {
  PublicTournamentMatch,
  TournamentsService,
} from "../../core/services/tournaments.service";
import { PublicTournament } from "../../core/types/models";
import {
  DEFAULT_TOURNAMENT_CODE,
  PAYMENT_METHOD,
  PUBLIC_SPONSOR_LEAD_DELIVERABLES,
  SPONSOR_CATEGORY,
  SPONSOR_STATUS,
  TOURNAMENT_MATCH_STATUS,
} from "../../core/types/constants";
import { LANDING_GAMES } from "./landing-content";
import {
  ContactReason,
  Countdown,
  LandingGame,
  LandingParticipationForm,
  LandingSectionNavigation,
  PublicMatchGroup,
} from "./landing.models";
import { LandingContactSectionComponent } from "./landing-contact-section.component";
import { LandingFooterComponent } from "./landing-footer.component";
import { LandingHeroComponent } from "./landing-hero.component";
import { LandingOverviewSectionComponent } from "./landing-overview-section.component";
import { LandingPublicResultsSectionComponent } from "./landing-public-results-section.component";
import { LandingSponsorSectionComponent } from "./landing-sponsor-section.component";
import { LandingTournamentsSectionComponent } from "./landing-tournaments-section.component";

@Component({
  standalone: true,
  imports: [
    LandingHeroComponent,
    LandingTournamentsSectionComponent,
    LandingPublicResultsSectionComponent,
    LandingOverviewSectionComponent,
    LandingSponsorSectionComponent,
    LandingContactSectionComponent,
    LandingFooterComponent,
  ],
  encapsulation: ViewEncapsulation.None,
  styles: [
    `
      @keyframes shimmer {
        0% {
          background-position: -200% center;
        }
        100% {
          background-position: 200% center;
        }
      }
      @keyframes revealUp {
        from {
          opacity: 0;
          transform: translate3d(0, 26px, 0);
        }
        to {
          opacity: 1;
          transform: translate3d(0, 0, 0);
        }
      }
      .hero-title {
        background: linear-gradient(
          90deg,
          #ffd400 35%,
          #fffbe6 50%,
          #ffd400 65%
        );
        background-size: 250% auto;
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        animation: shimmer 5s linear infinite;
      }
      .page-grain {
        background-image:
          radial-gradient(
            circle at 20% 20%,
            rgba(255, 212, 0, 0.05),
            transparent 45%
          ),
          radial-gradient(
            circle at 80% 10%,
            rgba(255, 255, 255, 0.02),
            transparent 42%
          ),
          radial-gradient(
            circle at 50% 80%,
            rgba(255, 212, 0, 0.03),
            transparent 42%
          );
      }
      .page-grain::after {
        content: "";
        position: absolute;
        inset: 0;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.95' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='120' height='120' filter='url(%23n)' opacity='0.08'/%3E%3C/svg%3E");
        opacity: 0.17;
        mix-blend-mode: soft-light;
      }
      .reveal-up {
        opacity: 0;
      }
      .reveal-up.reveal-visible {
        animation: revealUp 720ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
      }
      .delay-1 {
        animation-delay: 120ms;
      }
      .delay-2 {
        animation-delay: 220ms;
      }
      .delay-3 {
        animation-delay: 320ms;
      }
      @keyframes sponsorPulse {
        0% {
          opacity: 0;
          transform: scale(0.985);
        }
        45% {
          opacity: 0.5;
        }
        100% {
          opacity: 0;
          transform: scale(1.02);
        }
      }
      .sponsor-logo-card {
        position: relative;
        overflow: hidden;
        transition:
          transform 240ms cubic-bezier(0.22, 1, 0.36, 1),
          border-color 220ms ease,
          background-color 220ms ease,
          box-shadow 220ms ease;
      }
      .sponsor-logo-card::before {
        content: "";
        position: absolute;
        inset: 0;
        border-radius: inherit;
        border: 1px solid rgba(255, 212, 0, 0.55);
        opacity: 0;
        pointer-events: none;
      }
      .sponsor-logo-card::after {
        content: "";
        position: absolute;
        bottom: 14px;
        left: 18px;
        height: 2px;
        width: calc(100% - 36px);
        border-radius: 999px;
        background: #ffd400;
        opacity: 0.36;
        transform: scaleX(0.16);
        transform-origin: left;
        transition:
          transform 260ms cubic-bezier(0.22, 1, 0.36, 1),
          opacity 220ms ease;
      }
      .sponsor-logo-card img {
        pointer-events: none;
        transition: filter 220ms ease;
      }
      @media (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference) {
        .hero-parallax-glow,
        .hero-parallax-content {
          will-change: transform;
        }
      }
      @media (hover: hover) and (pointer: fine) {
        .sponsor-logo-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 18px 44px rgba(0, 0, 0, 0.28);
          border-color: rgba(255, 212, 0, 0.35);
        }
        .sponsor-logo-card:hover::before {
          animation: sponsorPulse 560ms cubic-bezier(0.22, 1, 0.36, 1);
        }
        .sponsor-logo-card:hover::after {
          opacity: 0.8;
          transform: scaleX(1);
        }
        .sponsor-logo-card:hover img {
          filter: saturate(1.06) contrast(1.04)
            drop-shadow(0 8px 14px rgba(10, 10, 10, 0.18));
        }
        .card-lift {
          transition:
            transform 260ms cubic-bezier(0.22, 1, 0.36, 1),
            border-color 220ms ease,
            box-shadow 220ms ease;
          transform: translate3d(0, 0, 0);
          will-change: transform;
        }
        .card-lift:hover {
          transform: translate3d(0, -8px, 0) rotateX(1.1deg);
        }
        .card-media {
          transition: transform 300ms cubic-bezier(0.22, 1, 0.36, 1);
          transform: translate3d(0, 0, 0);
          will-change: transform;
        }
        .card-lift:hover .card-media {
          transform: scale(1.05) rotate(-1deg);
        }
      }
      @media (prefers-reduced-motion: reduce) {
        .hero-title {
          animation: none;
          background-position: center;
        }
        .reveal-up {
          opacity: 1;
          animation: none;
          transform: none;
        }
      }

    `,
  ],
  template: `
    <main class="min-h-screen overflow-hidden bg-[#070707] text-white">
      <div aria-hidden="true" class="page-grain pointer-events-none fixed inset-0 z-0"></div>
      <lfg-landing-hero [countdownItems]="countdownItems.bind(this)" [heroGlowTransform]="heroGlowTransform" [heroContentTransform]="heroContentTransform" (navigate)="scrollToSection($event)" />
      <lfg-landing-tournaments-section [games]="games" [selectedGame]="selectedGame" [tournaments]="tournaments" (openGame)="openGameDetails($event)" (closeGame)="closeGameDetails()" (requestGameInfo)="requestGameInfo($event)" />
      <lfg-landing-public-results-section [publicMatches]="publicMatches" [loadingPublicMatches]="loadingPublicMatches" [publicMatchGroups]="publicMatchGroups" [livePublicMatches]="livePublicMatches" [publicResultsUpdatedAt]="publicResultsUpdatedAt" [resultsError]="resultsError" />
      <lfg-landing-overview-section />
      <lfg-landing-sponsor-section (sponsorContact)="selectSponsorContact($event)" />
      <lfg-landing-contact-section [eventAddress]="eventAddress" [eventDateRange]="eventDateRange" [participationForm]="participationForm" [tournaments]="tournaments" [loadingTournaments]="loadingTournaments" [submitting]="submitting" [success]="success" [error]="error" [formTitle]="formTitle.bind(this)" [submitLabel]="submitLabel.bind(this)" [successMessage]="successMessage.bind(this)" [tournamentLabel]="tournamentLabel.bind(this)" (reasonChange)="onReasonChange()" (submitParticipation)="submitParticipation()" />
      <lfg-landing-footer [eventAddress]="eventAddress" [eventDateRange]="eventDateRange" (navigate)="scrollToSection($event)" />
    </main>
  `,
})
export class LandingComponent implements OnInit, OnDestroy, AfterViewInit {
  tournaments = signal<PublicTournament[]>([]);
  publicMatches = signal<PublicTournamentMatch[]>([]);
  loadingTournaments = signal(false);
  loadingPublicMatches = signal(false);
  submitting = signal(false);
  success = signal(false);
  error = signal("");
  resultsError = signal("");
  participationForm = this.emptyParticipationForm();
  protected readonly eventDateRange = "22-26 giugno 2026";
  protected readonly eventAddress =
    "Via Vignale, 59, 81050 Santa Maria La Fossa CE";
  protected readonly countdown = signal<Countdown>(this.calculateCountdown());
  protected readonly selectedGame = signal<LandingGame | null>(null);
  protected readonly publicMatchGroups = computed(() =>
    this.groupPublicMatches(this.publicMatches()),
  );
  protected readonly livePublicMatches = computed(() =>
    this.publicMatches().filter((match) => match.status === TOURNAMENT_MATCH_STATUS.Live),
  );
  protected readonly publicResultsUpdatedAt = signal<string | null>(null);
  private readonly heroParallaxOffset = signal(0);
  protected readonly heroGlowTransform = computed(
    () =>
      `translate3d(0, ${this.heroParallaxOffset() * 0.18}px, 0) scale(1.04)`,
  );
  protected readonly heroContentTransform = computed(
    () => `translate3d(0, ${this.heroParallaxOffset() * -0.12}px, 0)`,
  );
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly participation = inject(PublicParticipationService);
  private readonly tournamentsService = inject(TournamentsService);
  private readonly snackbar = inject(SnackbarService);
  private countdownIntervalId: ReturnType<typeof setInterval> | null = null;
  private revealObserver: IntersectionObserver | null = null;
  private matchRealtimeChannel: RealtimeChannel | null = null;
  private matchRefreshTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private parallaxEnabled = false;
  private parallaxTicking = false;
  private readonly onScrollParallax = () => {
    if (!this.parallaxEnabled || this.parallaxTicking) {
      return;
    }

    this.parallaxTicking = true;
    window.requestAnimationFrame(() => {
      this.updateHeroParallax();
      this.parallaxTicking = false;
    });
  };

  ngOnInit(): void {
    void this.loadTournaments();
    void this.loadPublicMatches();
    this.subscribeToPublicMatchChanges();
    this.countdownIntervalId = setInterval(() => {
      this.countdown.set(this.calculateCountdown());
    }, 1000);

    this.parallaxEnabled = this.canUseParallax();
    if (this.parallaxEnabled) {
      this.updateHeroParallax();
      window.addEventListener("scroll", this.onScrollParallax, {
        passive: true,
      });
    }
  }

  ngOnDestroy(): void {
    if (this.countdownIntervalId) {
      clearInterval(this.countdownIntervalId);
    }

    if (this.matchRefreshTimeoutId) {
      clearTimeout(this.matchRefreshTimeoutId);
    }

    if (this.matchRealtimeChannel) {
      void this.tournamentsService.unsubscribe(this.matchRealtimeChannel);
      this.matchRealtimeChannel = null;
    }

    if (this.parallaxEnabled) {
      window.removeEventListener("scroll", this.onScrollParallax);
    }

    this.revealObserver?.disconnect();
  }

  ngAfterViewInit(): void {
    const hostElement = this.host.nativeElement as HTMLElement;
    const revealElements = hostElement.querySelectorAll(".reveal-up");
    if (!revealElements.length) {
      return;
    }

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (prefersReducedMotion || !("IntersectionObserver" in window)) {
      revealElements.forEach((element: Element) =>
        element.classList.add("reveal-visible"),
      );
      return;
    }

    this.revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }
          entry.target.classList.add("reveal-visible");
          this.revealObserver?.unobserve(entry.target);
        });
      },
      {
        threshold: 0.16,
        rootMargin: "0px 0px -8% 0px",
      },
    );

    revealElements.forEach((element: Element) =>
      this.revealObserver?.observe(element),
    );
  }

  protected readonly games = LANDING_GAMES;
  async loadTournaments(): Promise<void> {
    this.loadingTournaments.set(true);
    this.error.set("");
    try {
      const tournaments = await this.participation.listAvailableTournaments();
      this.tournaments.set(tournaments);
      this.participationForm.tournament_id = tournaments[0]?.id ?? "";
    } catch (error) {
      const message = this.message(error);
      this.error.set(message);
      this.snackbar.error(message);
    } finally {
      this.loadingTournaments.set(false);
    }
  }

  async loadPublicMatches(): Promise<void> {
    this.loadingPublicMatches.set(true);
    this.resultsError.set("");
    try {
      const matches = await this.tournamentsService.listPublicMatches();
      this.publicMatches.set(matches);
      this.publicResultsUpdatedAt.set(this.nowTimeLabel());
    } catch (error) {
      const message = this.message(error);
      this.resultsError.set(message);
    } finally {
      this.loadingPublicMatches.set(false);
    }
  }

  private subscribeToPublicMatchChanges(): void {
    this.matchRealtimeChannel =
      this.tournamentsService.subscribeToPublicMatchChanges(() => {
        this.schedulePublicMatchRefresh();
      });
  }

  private schedulePublicMatchRefresh(): void {
    if (this.matchRefreshTimeoutId) {
      clearTimeout(this.matchRefreshTimeoutId);
    }
    this.matchRefreshTimeoutId = setTimeout(() => {
      this.matchRefreshTimeoutId = null;
      void this.loadPublicMatches();
    }, 300);
  }

  async submitParticipation(): Promise<void> {
    this.error.set("");
    this.success.set(false);
    if (!this.isFormValid()) {
      const message =
        "Completa tutti i campi obbligatori e accetta le condizioni richieste.";
      this.error.set(message);
      this.snackbar.warning(message);
      return;
    }

    this.submitting.set(true);
    try {
      const normalizedPhone = this.normalizePhone(this.participationForm.phone);
      if (this.participationForm.reason === "sponsor") {
        await this.participation.createSponsorLead({
          company_name: this.participationForm.company_name.trim(),
          contact_name: `${this.participationForm.first_name.trim()} ${this.participationForm.last_name.trim()}`,
          contact_info: normalizedPhone,
          category: SPONSOR_CATEGORY.Bronzo,
          promised_amount: 0,
          received_amount: 0,
          payment_method: PAYMENT_METHOD.Cash,
          responsible_user_id: null,
          status: SPONSOR_STATUS.Contacted,
          deliverables: PUBLIC_SPONSOR_LEAD_DELIVERABLES,
          notes:
            "Lead sponsor generato dal form pubblico. Ricontattare via WhatsApp.",
        });
      } else {
        await this.participation.createRequest({
          tournament_id: this.participationForm.tournament_id,
          first_name: this.participationForm.first_name.trim(),
          last_name: this.participationForm.last_name.trim(),
          phone: normalizedPhone,
          privacy_accepted: this.participationForm.privacy_accepted,
          whatsapp_accepted: this.participationForm.whatsapp_accepted,
          rules_accepted: this.participationForm.rules_accepted,
        });
      }
      const selectedTournamentId = this.participationForm.tournament_id;
      const selectedReason = this.participationForm.reason;
      this.participationForm = this.emptyParticipationForm();
      this.participationForm.tournament_id = selectedTournamentId;
      this.participationForm.reason = selectedReason;
      this.success.set(true);
      this.snackbar.success(this.successMessage());
    } catch (error) {
      const message = this.message(error);
      this.error.set(message);
      this.snackbar.error(message);
    } finally {
      this.submitting.set(false);
    }
  }

  tournamentLabel(tournament: PublicTournament): string {
    const fee = tournament.fee ? ` · quota ${this.eur(tournament.fee)}` : "";
    const date = tournament.date
      ? ` · ${new Intl.DateTimeFormat("it-IT").format(new Date(tournament.date))}`
      : "";
    return `${tournament.name}${date}${fee}`;
  }

  countdownItems(): { label: string; value: string }[] {
    const countdown = this.countdown();
    return [
      { label: "Giorni", value: String(countdown.days).padStart(2, "0") },
      { label: "Ore", value: this.twoDigits(countdown.hours) },
      { label: "Min", value: this.twoDigits(countdown.minutes) },
      { label: "Sec", value: this.twoDigits(countdown.seconds) },
    ];
  }

  formTitle(): string {
    return this.participationForm.reason === "sponsor"
      ? "Dati sponsor"
      : "Dati contatto";
  }

  submitLabel(): string {
    return this.participationForm.reason === "sponsor"
      ? "Invia richiesta sponsor"
      : "Invia richiesta";
  }

  successMessage(): string {
    return this.participationForm.reason === "sponsor"
      ? "Richiesta sponsor inviata. Ti ricontatteremo via WhatsApp il prima possibile."
      : "Richiesta informazioni torneo inviata. Ti ricontatteremo via WhatsApp il prima possibile.";
  }

  scrollToSection(navigation: LandingSectionNavigation): void {
    const { event, sectionId } = navigation;
    event.preventDefault();
    const section = document.getElementById(sectionId);
    if (!section) {
      return;
    }

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    section.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "start" });
    window.history.replaceState(null, "", `#${sectionId}`);
  }

  onReasonChange(): void {
    this.success.set(false);
    this.error.set("");
  }

  selectSponsorContact(event: MouseEvent): void {
    this.participationForm.reason = "sponsor";
    this.onReasonChange();
    this.scrollToSection({ event, sectionId: "partecipa" });
  }

  openGameDetails(game: LandingGame): void {
    this.selectedGame.set(game);
  }

  closeGameDetails(): void {
    this.selectedGame.set(null);
  }

  requestGameInfo(game: LandingGame): void {
    this.participationForm.reason = "participation";
    const matchingTournament = this.tournaments().find((tournament) =>
      this.isTournamentForGame(tournament, game),
    );
    if (matchingTournament) {
      this.participationForm.tournament_id = matchingTournament.id;
    }
    this.closeGameDetails();
    this.scrollToSection({ event: new MouseEvent("click"), sectionId: "partecipa" });
  }

  private emptyParticipationForm() {
    return {
      reason: "participation" as ContactReason,
      tournament_id: "",
      company_name: "",
      first_name: "",
      last_name: "",
      phone: "",
      privacy_accepted: false,
      whatsapp_accepted: false,
      rules_accepted: false,
    };
  }

  private isFormValid(): boolean {
    const hasContactData = Boolean(
      this.participationForm.first_name.trim() &&
      this.participationForm.last_name.trim() &&
      this.participationForm.phone.trim() &&
      this.participationForm.privacy_accepted &&
      this.participationForm.whatsapp_accepted,
    );

    if (this.participationForm.reason === "sponsor") {
      return Boolean(
        hasContactData && this.participationForm.company_name.trim(),
      );
    }

    return Boolean(
      hasContactData &&
      this.participationForm.tournament_id &&
      this.participationForm.rules_accepted,
    );
  }

  private groupPublicMatches(
    matches: PublicTournamentMatch[],
  ): PublicMatchGroup[] {
    const byTournament = new Map<string, PublicTournamentMatch[]>();
    for (const match of matches) {
      const current = byTournament.get(match.tournament_name) ?? [];
      current.push(match);
      byTournament.set(match.tournament_name, current);
    }
    return [...byTournament.entries()].map(([tournamentName, rows]) => ({
      tournamentName,
      matches: rows,
    }));
  }

  private nowTimeLabel(): string {
    return new Intl.DateTimeFormat("it-IT", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).format(new Date());
  }

  protected eur(value: number): string {
    return new Intl.NumberFormat("it-IT", {
      style: "currency",
      currency: "EUR",
    }).format(value);
  }

  private calculateCountdown(): Countdown {
    const eventStart = new Date("2026-06-22T00:00:00+02:00").getTime();
    const remaining = Math.max(eventStart - Date.now(), 0);
    const totalSeconds = Math.floor(remaining / 1000);

    return {
      days: Math.floor(totalSeconds / 86400),
      hours: Math.floor((totalSeconds % 86400) / 3600),
      minutes: Math.floor((totalSeconds % 3600) / 60),
      seconds: totalSeconds % 60,
    };
  }

  private twoDigits(value: number): string {
    return value.toString().padStart(2, "0");
  }

  private sameTournamentName(
    tournamentName: string,
    gameName: string,
  ): boolean {
    const normalize = (value: string) =>
      value
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]/g, "");

    return normalize(tournamentName).includes(normalize(gameName));
  }

  private isTournamentForGame(
    tournament: PublicTournament,
    game: LandingGame,
  ): boolean {
    return (
      this.sameTournamentName(tournament.name, game.name) ||
      (game.name === "Green Volley" && tournament.code === DEFAULT_TOURNAMENT_CODE.Volleyball)
    );
  }

  private normalizePhone(phone: string): string {
    return phone.trim().replace(/\s+/g, "");
  }

  private canUseParallax(): boolean {
    if (typeof window === "undefined") {
      return false;
    }

    const hasFinePointer = window.matchMedia(
      "(hover: hover) and (pointer: fine)",
    ).matches;
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    return hasFinePointer && !prefersReducedMotion && window.innerWidth >= 1024;
  }

  private updateHeroParallax(): void {
    const scrollTop =
      window.scrollY ||
      window.pageYOffset ||
      document.documentElement.scrollTop;
    this.heroParallaxOffset.set(Math.min(scrollTop, 480));
  }

  private message(error: unknown): string {
    return error instanceof Error
      ? error.message
      : "Operazione non riuscita. Riprova tra qualche minuto.";
  }
}

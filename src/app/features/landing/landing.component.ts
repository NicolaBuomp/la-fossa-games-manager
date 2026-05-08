import { Component, OnInit, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { PublicParticipationService } from "../../core/services/public-participation.service";
import { PublicTournament } from "../../core/types/models";
type Game = {
  name: string;
  description: string;
  image: string;
};

@Component({
  standalone: true,
  imports: [FormsModule],
  template: `
    <main class="min-h-screen overflow-hidden bg-[#070707] text-white">
      <section class="relative min-h-[92vh] px-5 pb-10 pt-5 sm:px-8 lg:px-10">
        <div
          class="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(255,193,7,0.18),transparent_28%),linear-gradient(135deg,rgba(15,61,46,0)_58%,rgba(15,61,46,0.58)_58%,rgba(15,61,46,0.58)_68%,rgba(15,61,46,0)_68%)]"
        ></div>
        <div
          class="absolute left-0 top-0 h-52 w-72 -skew-x-[24deg] border-r border-fossa/35 bg-fossa/5"
        ></div>

        <div
          class="relative z-10 mx-auto flex min-h-[calc(92vh-3.75rem)] w-full max-w-7xl flex-col"
        >
          <nav class="flex items-center justify-between gap-4">
            <a
              href="#top"
              class="flex items-center gap-3"
              (click)="scrollToSection($event, 'top')"
            >
              <img
                src="/assets/brand/logo-social.png"
                alt="Logo La Fossa Games"
                class="h-12 w-12 rounded-full object-cover ring-1 ring-fossa/50 sm:h-14 sm:w-14"
              />
              <span
                class="hidden text-sm font-black uppercase tracking-[0.28em] text-fossa sm:block"
                >La Fossa Games</span
              >
            </a>
            <div
              class="flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] sm:gap-4"
            >
              <a
                href="#sport"
                class="hidden text-white/70 transition hover:text-fossa sm:inline"
                (click)="scrollToSection($event, 'sport')"
                >Sport</a
              >
              <a
                href="#partecipa"
                class="hidden text-white/70 transition hover:text-fossa sm:inline"
                (click)="scrollToSection($event, 'partecipa')"
                >Partecipa</a
              >
            </div>
          </nav>

          <div id="top" class="flex flex-1 items-center py-12 lg:py-16">
            <div class="max-w-4xl">
              <p
                class="mb-5 flex items-center gap-3 text-xs font-black uppercase tracking-[0.32em] text-fossa"
              >
                <span class="h-px w-10 bg-fossa"></span>
                Santa Maria La Fossa
              </p>
              <h1
                class="font-display text-[clamp(4rem,14vw,10.5rem)] uppercase leading-[0.78] text-fossa"
              >
                La Fossa<br />Games
              </h1>
              <p
                class="mt-7 max-w-2xl text-lg font-semibold leading-8 text-white/78 sm:text-xl"
              >
                Il torneo multisport di paese che mette insieme campo, tavoli da
                gioco, console e tifo. Edizione 1, 2026: una competizione
                aperta, intensa e pensata per vivere insieme la piazza.
              </p>
              <div class="mt-8 flex flex-wrap gap-3">
                <a
                  href="#partecipa"
                  class="rounded-md bg-fossa px-5 py-3 text-sm font-black uppercase tracking-[0.14em] text-ink shadow-[0_0_34px_rgba(255,212,0,0.25)] transition hover:bg-white"
                  (click)="scrollToSection($event, 'partecipa')"
                >
                  Partecipa
                </a>
                <a
                  href="#sport"
                  class="rounded-md border border-white/20 px-5 py-3 text-sm font-black uppercase tracking-[0.14em] text-white transition hover:border-fossa hover:text-fossa"
                  (click)="scrollToSection($event, 'sport')"
                >
                  Scopri i giochi
                </a>
              </div>
              <div
                class="mt-10 grid max-w-2xl grid-cols-3 overflow-hidden rounded-md border border-fossa/25 bg-black/70 text-center shadow-2xl backdrop-blur"
              >
                <div class="border-r border-fossa/20 px-3 py-4">
                  <p class="text-2xl font-black text-fossa">2026</p>
                  <p
                    class="mt-1 text-[0.65rem] font-bold uppercase tracking-[0.18em] text-white/52"
                  >
                    Edizione 1
                  </p>
                </div>
                <div class="border-r border-fossa/20 px-3 py-4">
                  <p class="text-2xl font-black text-fossa">7</p>
                  <p
                    class="mt-1 text-[0.65rem] font-bold uppercase tracking-[0.18em] text-white/52"
                  >
                    Sport
                  </p>
                </div>
                <div class="px-3 py-4">
                  <p class="text-[clamp(1rem,4vw,1.5rem)] font-black text-fossa">
                    Iscrizioni
                  </p>
                  <p
                    class="mt-1 text-[0.65rem] font-bold uppercase tracking-[0.18em] text-white/52"
                  >
                    Aperte
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        id="sport"
        class="bg-[#f7f2e8] px-5 py-16 text-ink sm:px-8 lg:px-10"
      >
        <div class="mx-auto max-w-7xl">
          <div
            class="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"
          >
            <div>
              <p
                class="text-xs font-black uppercase tracking-[0.28em] text-[#0f3d2e]"
              >
                Le sfide
              </p>
              <h2
                class="mt-3 max-w-3xl font-display text-4xl uppercase leading-none sm:text-6xl"
              >
                Un evento, più campi di gioco.
              </h2>
            </div>
            <p class="max-w-xl text-base font-semibold leading-7 text-black/62">
              Calcio a 5, calcio a 5 under 14, pallavolo, calcio balilla, carte,
              FIFA 26 e ping pong: format diversi, stessa energia competitiva.
            </p>
          </div>

          <div
            class="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7"
          >
            @for (game of games; track game.name) {
              <article
                class="group rounded-lg border border-black/10 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-fossa"
              >
                <div
                  class="flex aspect-square items-center justify-center rounded-md bg-black p-5"
                >
                  <img
                    [src]="game.image"
                    [alt]="game.name"
                    class="h-full w-full object-contain transition group-hover:scale-105"
                  />
                </div>
                <h3 class="mt-5 text-xl font-black uppercase leading-none">
                  {{ game.name }}
                </h3>
                <p class="mt-3 text-sm font-semibold leading-6 text-black/58">
                  {{ game.description }}
                </p>
              </article>
            }
          </div>
        </div>
      </section>

      <section class="bg-fossa px-5 py-16 text-ink sm:px-8 lg:px-10">
        <div
          class="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1fr_0.8fr] lg:items-end"
        >
          <div>
            <p class="text-xs font-black uppercase tracking-[0.28em]">
              Perche nasce
            </p>
            <h2
              class="mt-3 max-w-4xl font-display text-4xl uppercase leading-none sm:text-6xl"
            >
              Competizione locale, identità forte.
            </h2>
            <p
              class="mt-6 max-w-3xl text-lg font-semibold leading-8 text-black/72"
            >
              La Fossa Games nasce per creare un appuntamento riconoscibile:
              squadre, amici, famiglie e tifosi nello stesso calendario, con una
              comunicazione curata e un'organizzazione chiara.
            </p>
          </div>
          <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <div
              class="rounded-md border border-black/15 bg-black px-5 py-4 text-fossa"
            >
              <p class="text-3xl font-black">Sport</p>
              <p class="mt-1 text-sm font-bold uppercase tracking-[0.14em]">
                Campo e tavoli
              </p>
            </div>
            <div class="rounded-md border border-black/15 bg-white px-5 py-4">
              <p class="text-3xl font-black">Social</p>
              <p class="mt-1 text-sm font-bold uppercase tracking-[0.14em]">
                Foto, risultati, storie
              </p>
            </div>
          </div>
        </div>
      </section>

      <section
        id="partecipa"
        class="bg-[#07120e] px-5 py-16 text-white sm:px-8 lg:px-10"
      >
        <div
          class="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.85fr_1fr] lg:items-start"
        >
          <div>
            <p
              class="text-xs font-black uppercase tracking-[0.28em] text-fossa"
            >
              Prossimi passi
            </p>
            <h2
              class="mt-3 max-w-4xl font-display text-4xl uppercase leading-none text-fossa sm:text-6xl"
            >
              Richiedi di partecipare.
            </h2>
            <p
              class="mt-6 max-w-2xl text-lg font-semibold leading-8 text-white/72"
            >
              Seleziona il torneo disponibile e lascia i tuoi dati. Gli admin
              gestiranno la richiesta e ti contatteranno il prima possibile via
              WhatsApp per conferma, dettagli e prossimi passi.
            </p>
            <img
              src="/assets/brand/logo-social.png"
              alt="Logo social La Fossa Games 2026"
              class="mx-auto h-40 w-40 rounded-full object-cover sm:h-48 sm:w-48"
            />
            <div class="mt-8 space-y-4">
              <div
                class="flex items-center justify-between gap-4 border-t border-white/10 pt-4"
              >
                <span
                  class="text-sm font-bold uppercase tracking-[0.16em] text-white/48"
                  >Luogo</span
                >
                <span class="text-right font-black">Santa Maria La Fossa</span>
              </div>
              <div
                class="flex items-center justify-between gap-4 border-t border-white/10 pt-4"
              >
                <span
                  class="text-sm font-bold uppercase tracking-[0.16em] text-white/48"
                  >Edizione</span
                >
                <span class="text-right font-black">1 / 2026</span>
              </div>
              <div
                class="flex items-center justify-between gap-4 border-t border-white/10 pt-4"
              >
                <span
                  class="text-sm font-bold uppercase tracking-[0.16em] text-white/48"
                  >Stato</span
                >
                <span class="text-right font-black text-fossa">In arrivo</span>
              </div>
            </div>
          </div>

          <form
            class="rounded-lg border border-fossa/20 bg-black p-5 shadow-2xl sm:p-6"
            (ngSubmit)="submitParticipation()"
          >
            <div class="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p
                  class="text-xs font-black uppercase tracking-[0.24em] text-fossa"
                >
                  Contatto iscrizione
                </p>
                <h3 class="mt-2 font-display text-3xl uppercase leading-none">
                  Dati partecipante
                </h3>
              </div>
              @if (loadingTournaments()) {
                <span
                  class="rounded-full border border-white/10 px-3 py-1 text-xs font-bold text-white/60"
                  >Caricamento</span
                >
              }
            </div>

            @if (success()) {
              <p
                class="mt-5 rounded-md border border-emerald-400/30 bg-emerald-500/10 p-3 text-sm font-semibold text-emerald-100"
              >
                Richiesta inviata. Gli admin la prenderanno in carico e ti
                contatteranno via WhatsApp il prima possibile.
              </p>
            }

            @if (error()) {
              <p
                class="mt-5 rounded-md border border-red-400/30 bg-red-500/10 p-3 text-sm font-semibold text-red-100"
              >
                {{ error() }}
              </p>
            }

            <div class="mt-5 grid gap-4">
              <label
                class="grid gap-2 text-sm font-black uppercase tracking-[0.12em] text-white/72"
              >
                Torneo
                <select
                  required
                  name="tournament"
                  [(ngModel)]="participationForm.tournament_id"
                  class="rounded-md border border-white/10 bg-[#101010] px-3 py-3 text-base font-semibold normal-case tracking-normal text-white outline-none focus:border-fossa"
                >
                  <option value="" disabled>Seleziona un torneo</option>
                  @for (tournament of tournaments(); track tournament.id) {
                    <option [value]="tournament.id">
                      {{ tournamentLabel(tournament) }}
                    </option>
                  }
                </select>
              </label>

              <div class="grid gap-4 sm:grid-cols-2">
                <label
                  class="grid gap-2 text-sm font-black uppercase tracking-[0.12em] text-white/72"
                >
                  Nome
                  <input
                    required
                    name="firstName"
                    [(ngModel)]="participationForm.first_name"
                    autocomplete="given-name"
                    class="rounded-md border border-white/10 bg-[#101010] px-3 py-3 text-base font-semibold normal-case tracking-normal text-white outline-none focus:border-fossa"
                  />
                </label>
                <label
                  class="grid gap-2 text-sm font-black uppercase tracking-[0.12em] text-white/72"
                >
                  Cognome
                  <input
                    required
                    name="lastName"
                    [(ngModel)]="participationForm.last_name"
                    autocomplete="family-name"
                    class="rounded-md border border-white/10 bg-[#101010] px-3 py-3 text-base font-semibold normal-case tracking-normal text-white outline-none focus:border-fossa"
                  />
                </label>
              </div>

              <div class="grid gap-4 sm:grid-cols-2">
                <label
                  class="grid gap-2 text-sm font-black uppercase tracking-[0.12em] text-white/72"
                >
                  Email
                  <input
                    required
                    type="email"
                    name="email"
                    [(ngModel)]="participationForm.email"
                    autocomplete="email"
                    class="rounded-md border border-white/10 bg-[#101010] px-3 py-3 text-base font-semibold normal-case tracking-normal text-white outline-none focus:border-fossa"
                  />
                </label>
                <label
                  class="grid gap-2 text-sm font-black uppercase tracking-[0.12em] text-white/72"
                >
                  Telefono
                  <input
                    required
                    type="tel"
                    name="phone"
                    [(ngModel)]="participationForm.phone"
                    autocomplete="tel"
                    class="rounded-md border border-white/10 bg-[#101010] px-3 py-3 text-base font-semibold normal-case tracking-normal text-white outline-none focus:border-fossa"
                  />
                </label>
              </div>

              <div
                class="grid gap-3 rounded-md border border-white/10 bg-white/[0.03] p-4"
              >
                <label
                  class="flex gap-3 text-sm font-semibold leading-6 text-white/74"
                >
                  <input
                    required
                    type="checkbox"
                    name="privacy"
                    [(ngModel)]="participationForm.privacy_accepted"
                    class="mt-1 h-4 w-4 shrink-0 accent-fossa"
                  />
                  <span
                    >Accetto il trattamento dei dati personali per la gestione
                    della richiesta di partecipazione.</span
                  >
                </label>
                <label
                  class="flex gap-3 text-sm font-semibold leading-6 text-white/74"
                >
                  <input
                    required
                    type="checkbox"
                    name="whatsapp"
                    [(ngModel)]="participationForm.whatsapp_accepted"
                    class="mt-1 h-4 w-4 shrink-0 accent-fossa"
                  />
                  <span
                    >Autorizzo il contatto via WhatsApp al numero indicato per
                    informazioni organizzative sul torneo.</span
                  >
                </label>
                <label
                  class="flex gap-3 text-sm font-semibold leading-6 text-white/74"
                >
                  <input
                    required
                    type="checkbox"
                    name="rules"
                    [(ngModel)]="participationForm.rules_accepted"
                    class="mt-1 h-4 w-4 shrink-0 accent-fossa"
                  />
                  <span
                    >Dichiaro di accettare regolamento, comunicazioni operative
                    e condizioni di partecipazione che saranno confermate dagli
                    admin.</span
                  >
                </label>
              </div>

              <button
                type="submit"
                [disabled]="submitting() || loadingTournaments()"
                class="rounded-md bg-fossa px-5 py-3 text-sm font-black uppercase tracking-[0.14em] text-ink transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {{ submitting() ? "Invio in corso" : "Invia richiesta" }}
              </button>
            </div>
          </form>
        </div>
      </section>

      <footer class="border-t border-fossa/20 bg-[#050505] px-5 py-10 text-white sm:px-8 lg:px-10">
        <div
          class="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end"
        >
          <div>
            <a
              href="#top"
              class="inline-flex items-center gap-3"
              (click)="scrollToSection($event, 'top')"
            >
              <img
                src="/assets/brand/logo-social.png"
                alt="Logo La Fossa Games"
                class="h-12 w-12 rounded-full object-cover ring-1 ring-fossa/50"
              />
              <span
                class="text-sm font-black uppercase tracking-[0.24em] text-fossa"
                >La Fossa Games</span
              >
            </a>
            <p class="mt-5 max-w-xl text-sm font-semibold leading-6 text-white/58">
              Torneo multisport di Santa Maria La Fossa. Sport, giochi,
              community e organizzazione locale per l'edizione 2026.
            </p>
          </div>

          <div class="grid gap-6 sm:grid-cols-2">
            <div>
              <p
                class="text-xs font-black uppercase tracking-[0.22em] text-white/38"
              >
                Navigazione
              </p>
              <div class="mt-4 grid gap-3 text-sm font-black uppercase tracking-[0.14em]">
                <a
                  href="#top"
                  class="text-white/72 transition hover:text-fossa"
                  (click)="scrollToSection($event, 'top')"
                >
                  Home
                </a>
                <a
                  href="#sport"
                  class="text-white/72 transition hover:text-fossa"
                  (click)="scrollToSection($event, 'sport')"
                >
                  Sport
                </a>
                <a
                  href="#partecipa"
                  class="text-white/72 transition hover:text-fossa"
                  (click)="scrollToSection($event, 'partecipa')"
                >
                  Partecipa
                </a>
              </div>
            </div>

            <div>
              <p
                class="text-xs font-black uppercase tracking-[0.22em] text-white/38"
              >
                Evento
              </p>
              <div class="mt-4 grid gap-3 text-sm font-semibold text-white/64">
                <span>Santa Maria La Fossa</span>
                <span>Edizione 1 / 2026</span>
                <span class="font-black uppercase tracking-[0.14em] text-fossa">
                  Richieste aperte
                </span>
              </div>
            </div>
          </div>
        </div>

        <div
          class="mx-auto mt-8 flex max-w-7xl flex-col gap-3 border-t border-white/10 pt-5 text-xs font-bold uppercase tracking-[0.16em] text-white/38 sm:flex-row sm:items-center sm:justify-between"
        >
          <span>&copy; 2026 La Fossa Games</span>
          <a
            href="#top"
            class="transition hover:text-fossa"
            (click)="scrollToSection($event, 'top')"
            >Torna su</a
          >
        </div>
      </footer>
    </main>
  `,
})
export class LandingComponent implements OnInit {
  tournaments = signal<PublicTournament[]>([]);
  loadingTournaments = signal(false);
  submitting = signal(false);
  success = signal(false);
  error = signal("");
  participationForm = this.emptyParticipationForm();

  constructor(private readonly participation: PublicParticipationService) {}

  ngOnInit(): void {
    void this.loadTournaments();
  }

  protected readonly games: Game[] = [
    {
      name: "Calcio a 5",
      description: "Squadre, gironi e partite ad alta intensita.",
      image: "/assets/brand/icona-calcio.png",
    },
    {
      name: "Calcio a 5 under 14",
      description:
        "Il torneo dedicato ai piu giovani, con spirito di squadra e fair play.",
      image: "/assets/brand/icona-calcio.png",
    },
    {
      name: "Pallavolo",
      description: "Battute, muri e scambi di squadra sotto rete.",
      image: "/assets/brand/icona-pallavolo.png",
    },
    {
      name: "Calcio balilla",
      description: "Coppie, riflessi e sfide punto su punto.",
      image: "/assets/brand/icona-calcio-balilla.png",
    },
    {
      name: "Carte",
      description: "Tavoli da gioco per chi sa leggere la mano.",
      image: "/assets/brand/icona-carte.png",
    },
    {
      name: "FIFA 26",
      description: "Console, controller e finale da vivere sullo schermo.",
      image: "/assets/brand/icona-fifa-26.png",
    },
    {
      name: "Ping pong",
      description: "Scambi rapidi, ritmo e concentrazione.",
      image: "/assets/brand/icona-ping-pong.png",
    },
  ];

  async loadTournaments(): Promise<void> {
    this.loadingTournaments.set(true);
    this.error.set("");
    try {
      const tournaments = await this.participation.listAvailableTournaments();
      this.tournaments.set(tournaments);
      this.participationForm.tournament_id = tournaments[0]?.id ?? "";
    } catch (error) {
      this.error.set(this.message(error));
    } finally {
      this.loadingTournaments.set(false);
    }
  }

  async submitParticipation(): Promise<void> {
    this.error.set("");
    this.success.set(false);
    if (!this.isFormValid()) {
      this.error.set(
        "Completa tutti i campi e accetta le condizioni richieste.",
      );
      return;
    }

    this.submitting.set(true);
    try {
      await this.participation.createRequest({
        tournament_id: this.participationForm.tournament_id,
        first_name: this.participationForm.first_name.trim(),
        last_name: this.participationForm.last_name.trim(),
        email: this.participationForm.email.trim().toLowerCase(),
        phone: this.participationForm.phone.trim(),
        privacy_accepted: this.participationForm.privacy_accepted,
        whatsapp_accepted: this.participationForm.whatsapp_accepted,
        rules_accepted: this.participationForm.rules_accepted,
      });
      const selectedTournamentId = this.participationForm.tournament_id;
      this.participationForm = this.emptyParticipationForm();
      this.participationForm.tournament_id = selectedTournamentId;
      this.success.set(true);
    } catch (error) {
      this.error.set(this.message(error));
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

  scrollToSection(event: MouseEvent, sectionId: string): void {
    event.preventDefault();
    const section = document.getElementById(sectionId);
    if (!section) {
      return;
    }

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    section.scrollIntoView({
      behavior: prefersReducedMotion ? "auto" : "smooth",
      block: "start",
    });
    window.history.replaceState(null, "", `#${sectionId}`);
  }

  private emptyParticipationForm() {
    return {
      tournament_id: "",
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      privacy_accepted: false,
      whatsapp_accepted: false,
      rules_accepted: false,
    };
  }

  private isFormValid(): boolean {
    return Boolean(
      this.participationForm.tournament_id &&
      this.participationForm.first_name.trim() &&
      this.participationForm.last_name.trim() &&
      this.participationForm.email.trim() &&
      this.participationForm.phone.trim() &&
      this.participationForm.privacy_accepted &&
      this.participationForm.whatsapp_accepted &&
      this.participationForm.rules_accepted,
    );
  }

  private eur(value: number): string {
    return new Intl.NumberFormat("it-IT", {
      style: "currency",
      currency: "EUR",
    }).format(value);
  }

  private message(error: unknown): string {
    return error instanceof Error
      ? error.message
      : "Operazione non riuscita. Riprova tra qualche minuto.";
  }
}

import { Component, OnDestroy, OnInit, inject, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { PublicParticipationService } from "../../core/services/public-participation.service";
import { SnackbarService } from "../../core/services/snackbar.service";
import { PublicTournament } from "../../core/types/models";
import { ModalComponent } from "../../shared/components/ui.component";

type ContactReason = "participation" | "sponsor";

type Game = {
  name: string;
  description: string;
  image: string;
};

type SponsorTier = {
  name: string;
  color: string;
  description: string;
  perks: string[];
};

type Countdown = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

@Component({
  standalone: true,
  imports: [FormsModule, ModalComponent],
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
    `,
  ],
  template: `
    <main class="min-h-screen overflow-hidden bg-[#070707] text-white">
      <section class="relative min-h-screen px-5 pb-8 pt-5 sm:px-8 lg:px-10">
        <div
          class="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(255,193,7,0.18),transparent_28%),linear-gradient(135deg,rgba(15,61,46,0)_58%,rgba(15,61,46,0.58)_58%,rgba(15,61,46,0.58)_68%,rgba(15,61,46,0)_68%)]"
        ></div>
        <div
          class="absolute left-0 top-0 h-52 w-72 -skew-x-[24deg] border-r border-fossa/35 bg-fossa/5"
        ></div>

        <div
          class="relative z-10 mx-auto flex min-h-[calc(100vh-3.25rem)] w-full max-w-7xl flex-col"
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
                href="#sponsor"
                class="hidden text-white/70 transition hover:text-fossa sm:inline"
                (click)="scrollToSection($event, 'sponsor')"
                >Sponsor</a
              >
              <a
                href="#partecipa"
                class="hidden text-white/70 transition hover:text-fossa sm:inline"
                (click)="scrollToSection($event, 'partecipa')"
                >Contatti</a
              >
              <a
                href="https://www.instagram.com/lafossagames?igsh=MXZuMTBhNjA3NjRjaw%3D%3D&utm_source=qr"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                class="hidden h-8 w-8 items-center justify-center rounded-md border border-white/15 text-white/50 transition hover:border-fossa/50 hover:text-fossa sm:flex"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path
                    d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"
                  />
                </svg>
              </a>
              <a
                href="https://www.facebook.com/profile.php?id=61589316541437"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                class="hidden h-8 w-8 items-center justify-center rounded-md border border-white/15 text-white/50 transition hover:border-fossa/50 hover:text-fossa sm:flex"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path
                    d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
                  />
                </svg>
              </a>
              <button
                type="button"
                class="flex h-9 w-9 items-center justify-center rounded-md border border-white/15 text-white/70 transition hover:border-fossa/50 hover:text-fossa sm:hidden"
                [attr.aria-label]="
                  mobileMenuOpen() ? 'Chiudi menu' : 'Apri menu'
                "
                [attr.aria-expanded]="mobileMenuOpen()"
                (click)="mobileMenuOpen.set(!mobileMenuOpen())"
              >
                @if (mobileMenuOpen()) {
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                  >
                    <line x1="2" y1="2" x2="14" y2="14" />
                    <line x1="14" y1="2" x2="2" y2="14" />
                  </svg>
                } @else {
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                  >
                    <line x1="2" y1="4" x2="14" y2="4" />
                    <line x1="2" y1="8" x2="14" y2="8" />
                    <line x1="2" y1="12" x2="14" y2="12" />
                  </svg>
                }
              </button>
            </div>
          </nav>

          @if (mobileMenuOpen()) {
            <div
              class="relative z-20 mt-2 rounded-md border border-white/10 bg-black/90 py-2 backdrop-blur sm:hidden"
            >
              <a
                href="#sport"
                class="block px-5 py-3 text-xs font-black uppercase tracking-[0.2em] text-white/70 transition hover:bg-white/5 hover:text-fossa"
                (click)="
                  mobileMenuOpen.set(false); scrollToSection($event, 'sport')
                "
                >Sport</a
              >
              <a
                href="#sponsor"
                class="block px-5 py-3 text-xs font-black uppercase tracking-[0.2em] text-white/70 transition hover:bg-white/5 hover:text-fossa"
                (click)="
                  mobileMenuOpen.set(false); scrollToSection($event, 'sponsor')
                "
                >Sponsor</a
              >
              <a
                href="#partecipa"
                class="block px-5 py-3 text-xs font-black uppercase tracking-[0.2em] text-white/70 transition hover:bg-white/5 hover:text-fossa"
                (click)="
                  mobileMenuOpen.set(false);
                  scrollToSection($event, 'partecipa')
                "
                >Contatti</a
              >
            </div>
          }

          <div id="top" class="flex flex-1 items-center py-6 lg:py-8">
            <div class="max-w-4xl">
              <p
                class="mb-5 flex items-center gap-3 text-xs font-black uppercase tracking-[0.32em] text-fossa"
              >
                <span class="h-px w-10 bg-fossa"></span>
                Santa Maria La Fossa
              </p>
              <h1
                class="hero-title font-display text-[clamp(3.4rem,10vw,6.85rem)] uppercase leading-[0.8]"
              >
                La Fossa<br />Games
              </h1>
              <p
                class="mt-5 max-w-2xl text-base font-semibold leading-7 text-white/78"
              >
                Cinque giorni. Sei sport. Una piazza sola. Tornei aperti a
                tutti, dal calcio a 5 alla briscola — si gioca per vincere, e
                soprattutto per stare insieme.
              </p>
              <div class="mt-5 flex flex-wrap gap-3">
                <a
                  href="#partecipa"
                  class="rounded-md bg-fossa px-5 py-3 text-sm font-black uppercase tracking-[0.14em] text-ink shadow-[0_0_34px_rgba(255,212,0,0.25)] transition hover:bg-white"
                  (click)="scrollToSection($event, 'partecipa')"
                >
                  Iscriviti
                </a>
                <a
                  href="#sport"
                  class="rounded-md border border-white/20 px-5 py-3 text-sm font-black uppercase tracking-[0.14em] text-white transition hover:border-fossa hover:text-fossa"
                  (click)="scrollToSection($event, 'sport')"
                >
                  Scopri i tornei
                </a>
              </div>
              <div
                class="mt-5 grid max-w-2xl grid-cols-3 overflow-hidden rounded-md border border-fossa/25 bg-black/70 text-center shadow-2xl backdrop-blur"
              >
                <div class="border-r border-fossa/20 px-3 py-3">
                  <p class="text-2xl font-black text-fossa">22-26</p>
                  <p
                    class="mt-1 text-[0.65rem] font-bold uppercase tracking-[0.18em] text-white/52"
                  >
                    Giugno 2026
                  </p>
                </div>
                <div class="border-r border-fossa/20 px-3 py-3">
                  <p class="text-2xl font-black text-fossa">6</p>
                  <p
                    class="mt-1 text-[0.65rem] font-bold uppercase tracking-[0.18em] text-white/52"
                  >
                    Sport
                  </p>
                </div>
                <div class="px-3 py-3">
                  <p
                    class="text-[clamp(1rem,4vw,1.5rem)] font-black text-fossa"
                  >
                    Iscrizioni
                  </p>
                  <p
                    class="mt-1 text-[0.65rem] font-bold uppercase tracking-[0.18em] text-white/52"
                  >
                    Aperte
                  </p>
                </div>
              </div>

              <div
                class="mt-3 max-w-2xl rounded-md border border-white/10 bg-white/[0.04] p-3 backdrop-blur"
              >
                <div class="flex flex-wrap items-center justify-between gap-2">
                  <p
                    class="text-xs font-black uppercase tracking-[0.2em] text-white/50"
                  >
                    Al via tra
                  </p>
                  <p
                    class="text-sm font-black uppercase tracking-[0.14em] text-fossa"
                  >
                    22-26 giugno 2026
                  </p>
                </div>
                <div class="mt-3 grid grid-cols-4 gap-2 text-center">
                  @for (item of countdownItems(); track item.label) {
                    <div
                      class="rounded-md bg-black/70 px-2 py-2.5 ring-1 ring-fossa/20"
                    >
                      <p
                        class="text-[clamp(1.25rem,4vw,1.85rem)] font-black leading-none text-fossa"
                      >
                        {{ item.value }}
                      </p>
                      <p
                        class="mt-2 text-[0.6rem] font-bold uppercase tracking-[0.16em] text-white/48"
                      >
                        {{ item.label }}
                      </p>
                    </div>
                  }
                </div>
              </div>
            </div>
          </div>
          <a
            href="#sport"
            class="absolute bottom-6 left-1/2 -translate-x-1/2 hidden flex-col items-center gap-1.5 text-[0.6rem] font-black uppercase tracking-[0.22em] text-white/30 transition hover:text-fossa sm:flex"
            (click)="scrollToSection($event, 'sport')"
            aria-label="Scorri verso i tornei"
          >
            Scopri
            <svg
              class="animate-bounce"
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <polyline points="3,5 8,11 13,5" />
            </svg>
          </a>
        </div>
      </section>

      <section
        id="sport"
        class="scroll-mt-6 bg-surface px-5 py-16 text-primary sm:px-8 lg:px-10"
      >
        <div class="mx-auto max-w-7xl">
          <div
            class="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"
          >
            <div>
              <p
                class="text-xs font-black uppercase tracking-[0.28em] text-muted"
              >
                I tornei
              </p>
              <h2
                class="mt-3 max-w-3xl font-display text-4xl uppercase leading-none sm:text-6xl"
              >
                Sette tornei, per tutte le età.
              </h2>
            </div>
          </div>

          <div
            class="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4 xl:grid-cols-7"
          >
            @for (game of games; track game.name) {
              <button
                type="button"
                class="group flex w-full touch-manipulation flex-col rounded-lg border border-soft bg-surface p-3 text-left shadow-sm transition hover:-translate-y-1 hover:border-fossa focus:outline-none focus:ring-4 focus:ring-fossa/45 sm:p-5"
                [attr.aria-label]="'Apri dettagli ' + game.name"
                (click)="openGameDetails(game)"
              >
                <div
                  class="aspect-square w-full items-center justify-center rounded-md bg-black p-4 sm:p-5 flex"
                >
                  <img
                    [src]="game.image"
                    [alt]="game.name"
                    class="h-full w-full object-contain transition group-hover:scale-105"
                  />
                </div>
                <h3
                  class="mt-4 text-lg font-black uppercase leading-none sm:mt-5 sm:text-xl"
                >
                  {{ game.name }}
                </h3>
                <p
                  class="mt-2.5 text-sm font-semibold leading-6 text-muted sm:mt-3"
                >
                  {{ game.description }}
                </p>
                <span
                  class="mt-auto pt-4 text-xs font-black uppercase tracking-[0.16em] text-muted sm:pt-5"
                >
                  Dettagli
                </span>
              </button>
            }
          </div>

          @if (selectedGame(); as game) {
            <lfg-modal
              [open]="true"
              [title]="game.name"
              (close)="closeGameDetails()"
            >
              <div class="text-ink">
                <div class="flex justify-center">
                  <div
                    class="flex h-20 w-20 items-center justify-center rounded-2xl bg-[#111] p-4"
                  >
                    <img
                      [src]="game.image"
                      [alt]="game.name"
                      class="h-full w-full object-contain"
                    />
                  </div>
                </div>
                <div class="mt-5">
                  <p
                    class="text-sm font-semibold leading-6 text-muted sm:text-base sm:leading-7"
                  >
                    {{ game.description }}
                  </p>
                  <div
                    class="mt-4 rounded-md border border-soft bg-surface-muted p-3.5 sm:mt-5 sm:p-4"
                  >
                    <p
                      class="text-[0.68rem] font-black uppercase tracking-[0.18em] text-muted"
                    >
                      Regolamento
                    </p>
                    <p class="mt-2 text-sm font-black leading-6">
                      Il regolamento ufficiale sarà disponibile a breve.
                    </p>
                  </div>
                  <button
                    type="button"
                    class="mt-5 w-full rounded-md bg-fossa px-5 py-3 text-sm font-black uppercase tracking-[0.12em] text-ink transition hover:bg-black hover:text-fossa sm:w-auto"
                    (click)="requestGameInfo(game)"
                  >
                    Chiedi informazioni
                  </button>
                </div>
              </div>
            </lfg-modal>
          }
        </div>
      </section>

      <section class="bg-fossa px-5 py-16 text-ink sm:px-8 lg:px-10">
        <div
          class="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1fr_0.8fr] lg:items-end"
        >
          <div>
            <p class="text-xs font-black uppercase tracking-[0.28em]">
              Perché nasce
            </p>
            <h2
              class="mt-3 max-w-4xl font-display text-4xl uppercase leading-none sm:text-6xl"
            >
              Un calendario, tutta la fossa.
            </h2>
            <p
              class="mt-6 max-w-3xl text-lg font-semibold leading-8 text-black/72"
            >
              Mettere nello stesso programma chi gioca, chi tifa e chi guarda da
              bordocampo. Questo è La Fossa Games.
            </p>
            <div
              class="mt-8 grid grid-cols-3 gap-4 border-t border-black/15 pt-8"
            >
              <div>
                <p
                  class="font-display text-5xl uppercase leading-none sm:text-6xl"
                >
                  7
                </p>
                <p
                  class="mt-2 text-xs font-black uppercase tracking-[0.18em] text-black/58"
                >
                  Tornei
                </p>
              </div>
              <div>
                <p
                  class="font-display text-5xl uppercase leading-none sm:text-6xl"
                >
                  5
                </p>
                <p
                  class="mt-2 text-xs font-black uppercase tracking-[0.18em] text-black/58"
                >
                  Giorni
                </p>
              </div>
              <div>
                <p
                  class="font-display text-5xl uppercase leading-none sm:text-6xl"
                >
                  1ª
                </p>
                <p
                  class="mt-2 text-xs font-black uppercase tracking-[0.18em] text-black/58"
                >
                  Edizione
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        id="sponsor"
        class="scroll-mt-6 bg-[#090909] px-5 py-16 text-white sm:px-8 lg:px-10"
      >
        <div class="mx-auto max-w-7xl">
          <div
            class="flex flex-col justify-between gap-5 lg:flex-row lg:items-end"
          >
            <div>
              <p
                class="text-xs font-black uppercase tracking-[0.28em] text-fossa"
              >
                Scegli la tua visibilità
              </p>
              <h2
                class="mt-3 max-w-4xl font-display text-4xl uppercase leading-none text-fossa sm:text-6xl"
              >
                Tipologie sponsor disponibili.
              </h2>
            </div>
            <div class="max-w-xl">
              <p class="text-base font-semibold leading-7 text-white/68">
                Tre livelli di presenza per aziende e attività che vogliono
                sostenere La Fossa Games e comparire nei momenti chiave
                dell'evento.
              </p>
              <a
                href="#partecipa"
                class="mt-5 inline-flex rounded-md bg-fossa px-5 py-3 text-sm font-black uppercase tracking-[0.14em] text-ink transition hover:bg-white"
                (click)="selectSponsorContact($event)"
              >
                Richiedi informazioni sponsor
              </a>
            </div>
          </div>

          <div class="mt-10 grid gap-4 lg:grid-cols-3">
            @for (tier of sponsorTiers; track tier.name) {
              <article
                class="relative rounded-lg border p-5 shadow-2xl transition hover:-translate-y-1 sm:p-6"
                [class]="
                  tier.name === 'Gold'
                    ? 'border-[#ffd400]/50 bg-[#ffd400]/[0.06] ring-1 ring-[#ffd400]/20 shadow-[0_0_48px_rgba(255,212,0,0.10)]'
                    : 'border-white/10 bg-white/[0.04] hover:border-fossa/70'
                "
              >
                @if (tier.name === "Gold") {
                  <span
                    class="absolute -top-3 left-5 rounded-full bg-[#ffd400] px-3 py-0.5 text-[0.65rem] font-black uppercase tracking-[0.18em] text-black"
                  >
                    Consigliato
                  </span>
                }
                <div class="flex items-center gap-4">
                  <div
                    class="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border text-3xl font-black"
                    [class]="
                      tier.name === 'Gold'
                        ? 'shadow-[0_0_20px_rgba(255,212,0,0.35)]'
                        : ''
                    "
                    [style.border-color]="tier.color"
                    [style.color]="tier.color"
                  >
                    ★
                  </div>
                  <div class="min-w-0">
                    <h3
                      class="font-display text-4xl uppercase italic leading-none sm:text-5xl"
                      [style.color]="tier.color"
                    >
                      {{ tier.name }}
                    </h3>
                    <div
                      class="mt-3 h-px w-full"
                      [style.background-color]="tier.color"
                    ></div>
                  </div>
                </div>
                <p class="mt-5 text-sm font-semibold leading-6 text-white/58">
                  {{ tier.description }}
                </p>
                <ul class="mt-6 grid gap-4">
                  @for (perk of tier.perks; track perk) {
                    <li
                      class="grid grid-cols-[auto_1fr] gap-3 text-sm font-bold uppercase leading-6 tracking-[0.08em] text-white/82"
                    >
                      <span
                        class="mt-1 h-2.5 w-2.5 rounded-full"
                        [style.background-color]="tier.color"
                      ></span>
                      <span>{{ perk }}</span>
                    </li>
                  }
                </ul>
              </article>
            }
          </div>
        </div>
      </section>

      <section
        id="partecipa"
        class="scroll-mt-6 bg-[#07120e] px-5 py-16 text-white sm:px-8 lg:px-10"
      >
        <div
          class="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.85fr_1fr] lg:items-start"
        >
          <div>
            <p
              class="text-xs font-black uppercase tracking-[0.28em] text-fossa"
            >
              Iscrizioni e sponsor
            </p>
            <h2
              class="mt-3 max-w-4xl font-display text-4xl uppercase leading-none text-fossa sm:text-6xl"
            >
              Partecipa o diventa sponsor.
            </h2>
            <p
              class="mt-6 max-w-2xl text-lg font-semibold leading-8 text-white/72"
            >
              Scegli se vuoi partecipare a un torneo o ricevere informazioni
              sulle sponsorizzazioni, lascia un numero WhatsApp e ti
              ricontatteremo con dettagli e prossimi passi.
            </p>
            <img
              src="/assets/brand/logo-social.png"
              alt="Logo social La Fossa Games 2026"
              class="mx-auto h-40 w-40 rounded-full object-cover sm:h-48 sm:w-48"
            />
            <div class="mt-8 space-y-4">
              <div
                class="grid gap-2 border-t border-white/10 pt-4 sm:grid-cols-[auto_1fr] sm:items-start sm:gap-4"
              >
                <span
                  class="text-sm font-bold uppercase tracking-[0.16em] text-white/48"
                  >Luogo</span
                >
                <span class="font-black sm:text-right">{{ eventAddress }}</span>
              </div>
              <div
                class="grid gap-2 border-t border-white/10 pt-4 sm:grid-cols-[auto_1fr] sm:items-start sm:gap-4"
              >
                <span
                  class="text-sm font-bold uppercase tracking-[0.16em] text-white/48"
                  >Date</span
                >
                <span class="font-black sm:text-right">{{
                  eventDateRange
                }}</span>
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
                  Richiesta contatto
                </p>
                <h3
                  class="mt-2 font-display text-2xl uppercase leading-none sm:text-3xl"
                >
                  {{ formTitle() }}
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
                class="state-success mt-5 rounded-md border p-3 text-sm font-semibold"
              >
                {{ successMessage() }}
              </p>
            }

            @if (error()) {
              <p
                class="state-danger mt-5 rounded-md border p-3 text-sm font-semibold"
              >
                {{ error() }}
              </p>
            }

            <fieldset
              [disabled]="
                submitting() ||
                (participationForm.reason === 'participation' &&
                  loadingTournaments())
              "
              class="mt-5 grid gap-4 disabled:opacity-70"
            >
              <label
                class="grid gap-2 text-sm font-black uppercase tracking-[0.12em] text-white/72"
              >
                Motivo del contatto
                <select
                  required
                  name="contactReason"
                  [(ngModel)]="participationForm.reason"
                  (ngModelChange)="onReasonChange()"
                  class="rounded-md border border-white/20 bg-[#101010] px-3 py-3 text-base font-semibold normal-case tracking-normal text-white outline-none transition focus:border-fossa focus:ring-2 focus:ring-fossa/20"
                >
                  <option value="participation">Informazioni torneo</option>
                  <option value="sponsor">Informazioni sponsor</option>
                </select>
              </label>

              @if (participationForm.reason === "participation") {
                <label
                  class="grid gap-2 text-sm font-black uppercase tracking-[0.12em] text-white/72"
                >
                  Torneo
                  <select
                    required
                    name="tournament"
                    [(ngModel)]="participationForm.tournament_id"
                    class="rounded-md border border-white/20 bg-[#101010] px-3 py-3 text-base font-semibold normal-case tracking-normal text-white outline-none transition focus:border-fossa focus:ring-2 focus:ring-fossa/20"
                  >
                    <option value="" disabled>Seleziona un torneo</option>
                    @for (tournament of tournaments(); track tournament.id) {
                      <option [value]="tournament.id">
                        {{ tournamentLabel(tournament) }}
                      </option>
                    }
                  </select>
                </label>
              } @else {
                <label
                  class="grid gap-2 text-sm font-black uppercase tracking-[0.12em] text-white/72"
                >
                  Azienda o attività
                  <input
                    required
                    name="companyName"
                    [(ngModel)]="participationForm.company_name"
                    autocomplete="organization"
                    class="rounded-md border border-white/20 bg-[#101010] px-3 py-3 text-base font-semibold normal-case tracking-normal text-white outline-none transition focus:border-fossa focus:ring-2 focus:ring-fossa/20"
                  />
                </label>
              }

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
                    class="rounded-md border border-white/20 bg-[#101010] px-3 py-3 text-base font-semibold normal-case tracking-normal text-white outline-none transition focus:border-fossa focus:ring-2 focus:ring-fossa/20"
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
                    class="rounded-md border border-white/20 bg-[#101010] px-3 py-3 text-base font-semibold normal-case tracking-normal text-white outline-none transition focus:border-fossa focus:ring-2 focus:ring-fossa/20"
                  />
                </label>
              </div>

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
                  class="rounded-md border border-white/20 bg-[#101010] px-3 py-3 text-base font-semibold normal-case tracking-normal text-white outline-none transition focus:border-fossa focus:ring-2 focus:ring-fossa/20"
                />
              </label>

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
                    della richiesta di contatto.</span
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
                    >Autorizzo il contatto via WhatsApp per conferme, dettagli
                    organizzativi e informazioni richieste.</span
                  >
                </label>
                @if (participationForm.reason === "participation") {
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
                      >Dichiaro di accettare regolamento, comunicazioni
                      operative e condizioni di partecipazione.</span
                    >
                  </label>
                }
              </div>

              <button
                type="submit"
                [disabled]="
                  submitting() ||
                  (participationForm.reason === 'participation' &&
                    loadingTournaments())
                "
                class="rounded-md bg-fossa px-5 py-3 text-sm font-black uppercase tracking-[0.14em] text-ink transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {{ submitting() ? "Invio in corso" : submitLabel() }}
              </button>
            </fieldset>
          </form>
        </div>
      </section>

      <footer
        class="border-t border-fossa/20 bg-[#050505] px-5 py-10 text-white sm:px-8 lg:px-10"
      >
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
            <p
              class="mt-5 max-w-xl text-sm font-semibold leading-6 text-white/58"
            >
              Cinque giorni di sport, giochi e comunità a Santa Maria La Fossa,
              dal 22 al 26 giugno 2026.
            </p>
          </div>

          <div class="grid gap-6 sm:grid-cols-2">
            <div>
              <p
                class="text-xs font-black uppercase tracking-[0.22em] text-white/38"
              >
                Navigazione
              </p>
              <div
                class="mt-4 grid gap-3 text-sm font-black uppercase tracking-[0.14em]"
              >
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
                  href="#sponsor"
                  class="text-white/72 transition hover:text-fossa"
                  (click)="scrollToSection($event, 'sponsor')"
                >
                  Sponsor
                </a>
                <a
                  href="#partecipa"
                  class="text-white/72 transition hover:text-fossa"
                  (click)="scrollToSection($event, 'partecipa')"
                >
                  Contatti
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
                <span>{{ eventAddress }}</span>
                <span>{{ eventDateRange }}</span>
                <span class="font-black uppercase tracking-[0.14em] text-fossa">
                  Richieste aperte
                </span>
              </div>
              <p
                class="mt-6 text-xs font-black uppercase tracking-[0.22em] text-white/38"
              >
                Seguici
              </p>
              <div class="mt-4 flex gap-3">
                <a
                  href="https://www.instagram.com/lafossagames?igsh=MXZuMTBhNjA3NjRjaw%3D%3D&utm_source=qr"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram La Fossa Games"
                  class="flex h-9 w-9 items-center justify-center rounded-md border border-white/10 text-white/50 transition hover:border-fossa/50 hover:text-fossa"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path
                      d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"
                    />
                  </svg>
                </a>
                <a
                  href="https://www.facebook.com/profile.php?id=61589316541437"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook La Fossa Games"
                  class="flex h-9 w-9 items-center justify-center rounded-md border border-white/10 text-white/50 transition hover:border-fossa/50 hover:text-fossa"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path
                      d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
                    />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>

        <div
          class="mx-auto mt-8 flex max-w-7xl flex-col gap-3 border-t border-white/10 pt-5 text-xs font-bold uppercase tracking-[0.16em] text-white/38 sm:flex-row sm:items-center sm:justify-between"
        >
          <span>&copy; 2026 La Fossa Games</span>
          <div class="flex flex-wrap items-center gap-x-5 gap-y-2">
            <a href="/login" class="text-white/30 transition hover:text-fossa">
              Area manager
            </a>
            <a
              href="#top"
              class="transition hover:text-fossa"
              (click)="scrollToSection($event, 'top')"
              >Torna su</a
            >
          </div>
        </div>
      </footer>
    </main>
  `,
})
export class LandingComponent implements OnInit, OnDestroy {
  tournaments = signal<PublicTournament[]>([]);
  loadingTournaments = signal(false);
  submitting = signal(false);
  success = signal(false);
  error = signal("");
  mobileMenuOpen = signal(false);
  participationForm = this.emptyParticipationForm();
  protected readonly eventDateRange = "22-26 giugno 2026";
  protected readonly eventAddress =
    "Via Vignale, 59, 81050 Santa Maria La Fossa CE";
  protected readonly countdown = signal<Countdown>(this.calculateCountdown());
  protected readonly selectedGame = signal<Game | null>(null);
  private readonly snackbar = inject(SnackbarService);
  private countdownIntervalId: ReturnType<typeof setInterval> | null = null;

  constructor(private readonly participation: PublicParticipationService) {}

  ngOnInit(): void {
    void this.loadTournaments();
    this.countdownIntervalId = setInterval(() => {
      this.countdown.set(this.calculateCountdown());
    }, 1000);
  }

  ngOnDestroy(): void {
    if (this.countdownIntervalId) {
      clearInterval(this.countdownIntervalId);
    }
  }

  protected readonly games: Game[] = [
    {
      name: "Calcio a 5",
      description: "Squadre, gironi e partite ad alta intensità.",
      image: "/assets/brand/icona-calcio.png",
    },
    {
      name: "Calcio a 5 under 15",
      description:
        "Il torneo dedicato ai più giovani, con spirito di squadra e fair play.",
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
      name: "Briscola",
      description: "Tavoli da gioco, lettura della mano e sangue freddo.",
      image: "/assets/brand/icona-carte.png",
    },
    {
      name: "FIFA 26",
      description:
        "Console, controller e partite da vivere fino all'ultimo gol.",
      image: "/assets/brand/icona-fifa-26.png",
    },
    {
      name: "Ping pong",
      description: "Scambi rapidi, ritmo alto e concentrazione.",
      image: "/assets/brand/icona-ping-pong.png",
    },
  ];

  protected readonly sponsorTiers: SponsorTier[] = [
    {
      name: "Gold",
      color: "#ffd400",
      description:
        "La presenza più completa per massima riconoscibilità prima e durante l'evento.",
      perks: [
        "Logo su cartellone dedicato",
        "Visibilità sui social e sito web",
        "Premiazioni e menzioni durante l'evento",
        "Attività promozionali",
      ],
    },
    {
      name: "Silver",
      color: "#c8c8c8",
      description:
        "Una soluzione intermedia per essere presenti sui materiali principali dell'evento.",
      perks: [
        "Logo su cartellone dedicato 2x1",
        "Visibilità sui social e sito web",
        "Menzioni durante l'evento",
      ],
    },
    {
      name: "Bronzo",
      color: "#d98945",
      description:
        "La formula essenziale per sostenere l'iniziativa e comparire nella comunicazione sponsor.",
      perks: [
        "Logo su cartellone insieme agli altri sponsor",
        "Visibilità sui social",
        "Menzioni durante l'evento",
      ],
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
      const message = this.message(error);
      this.error.set(message);
      this.snackbar.error(message);
    } finally {
      this.loadingTournaments.set(false);
    }
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
          type: "cash",
          value: 0,
          status: "contattato",
          deliverables: "Richiesta informazioni sponsor dal sito pubblico",
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

  onReasonChange(): void {
    this.success.set(false);
    this.error.set("");
  }

  selectSponsorContact(event: MouseEvent): void {
    this.participationForm.reason = "sponsor";
    this.onReasonChange();
    this.scrollToSection(event, "partecipa");
  }

  openGameDetails(game: Game): void {
    this.selectedGame.set(game);
  }

  closeGameDetails(): void {
    this.selectedGame.set(null);
  }

  requestGameInfo(game: Game): void {
    this.participationForm.reason = "participation";
    const matchingTournament = this.tournaments().find((tournament) =>
      this.sameTournamentName(tournament.name, game.name),
    );
    if (matchingTournament) {
      this.participationForm.tournament_id = matchingTournament.id;
    }
    this.closeGameDetails();
    this.scrollToSection(new MouseEvent("click"), "partecipa");
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

  private eur(value: number): string {
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

  private normalizePhone(phone: string): string {
    return phone.trim().replace(/\s+/g, "");
  }

  private message(error: unknown): string {
    return error instanceof Error
      ? error.message
      : "Operazione non riuscita. Riprova tra qualche minuto.";
  }
}

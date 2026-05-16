import {
  AfterViewInit,
  Component,
  computed,
  ElementRef,
  inject,
  OnDestroy,
  OnInit,
  signal,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { RealtimeChannel } from "@supabase/supabase-js";
import {
  SPONSOR_ASSETS,
  SponsorAsset,
} from "../../core/generated/sponsor-assets";
import { PublicParticipationService } from "../../core/services/public-participation.service";
import { SnackbarService } from "../../core/services/snackbar.service";
import {
  PublicTournamentMatch,
  TournamentsService,
} from "../../core/services/tournaments.service";
import { PublicTournament } from "../../core/types/models";
import { ParticipationFormTabsComponent } from "../../shared/components/participation-form-tabs.component";
import { ModalComponent } from "../../shared/components/ui.component";

type ContactReason = "participation" | "sponsor";

type Game = {
  name: string;
  description: string;
  details: string;
  image: string;
  format: string;
  audience: string;
  highlights: string[];
  rules?: string[];
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

type PublicMatchGroup = {
  tournamentName: string;
  matches: PublicTournamentMatch[];
};

@Component({
  standalone: true,
  imports: [FormsModule, ModalComponent, ParticipationFormTabsComponent],
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
      <div
        aria-hidden="true"
        class="page-grain pointer-events-none fixed inset-0 z-0"
      ></div>
      <section class="relative min-h-screen px-5 pb-8 pt-5 sm:px-8 lg:px-10">
        <div
          class="hero-parallax-glow absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(255,193,7,0.18),transparent_28%),linear-gradient(135deg,rgba(15,61,46,0)_58%,rgba(15,61,46,0.58)_58%,rgba(15,61,46,0.58)_68%,rgba(15,61,46,0)_68%)]"
          [style.transform]="heroGlowTransform()"
        ></div>
        <div
          class="absolute left-0 top-0 h-52 w-72 -skew-x-[24deg] border-r border-accent-35 bg-accent-5"
        ></div>

        <div
          class="relative z-10 mx-auto flex min-h-[calc(100vh-3.25rem)] w-full max-w-7xl flex-col"
        >
          <nav
            class="sticky top-3 z-30 flex items-center justify-between gap-4 rounded-md border border-white/10 bg-black/45 px-3 py-2 backdrop-blur-md"
          >
            <a
              href="#top"
              class="flex items-center gap-3"
              (click)="scrollToSection($event, 'top')"
            >
              <img
                src="/assets/brand/logo-social.png"
                alt="Logo La Fossa Games"
                class="h-12 w-12 rounded-full object-cover ring-1 ring-accent-50 sm:h-14 sm:w-14"
              />
              <span
                class="hidden text-sm font-black uppercase tracking-[0.28em] text-accent sm:block"
                >La Fossa Games</span
              >
            </a>
            <div
              class="flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] sm:gap-4"
            >
              <a
                href="#sport"
                class="hidden text-white/70 transition hover:text-accent sm:inline"
                (click)="scrollToSection($event, 'sport')"
                >Sport</a
              >
              <a
                href="#sponsor"
                class="hidden text-white/70 transition hover:text-accent sm:inline"
                (click)="scrollToSection($event, 'sponsor')"
                >Sponsor</a
              >
              <a
                href="#partecipa"
                class="hidden text-white/70 transition hover:text-accent sm:inline"
                (click)="scrollToSection($event, 'partecipa')"
                >Contatti</a
              >
              <a
                href="https://www.instagram.com/lafossagames?igsh=MXZuMTBhNjA3NjRjaw%3D%3D&utm_source=qr"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                class="hidden h-8 w-8 items-center justify-center rounded-md border border-white/15 text-white/50 transition hover-border-accent-50 hover:text-accent sm:flex"
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
                class="hidden h-8 w-8 items-center justify-center rounded-md border border-white/15 text-white/50 transition hover-border-accent-50 hover:text-accent sm:flex"
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
                class="flex h-9 w-9 items-center justify-center rounded-md border border-white/15 text-white/70 transition hover-border-accent-50 hover:text-accent sm:hidden"
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
                class="block px-5 py-3 text-xs font-black uppercase tracking-[0.2em] text-white/70 transition hover:bg-white/5 hover:text-accent"
                (click)="
                  mobileMenuOpen.set(false); scrollToSection($event, 'sport')
                "
                >Sport</a
              >
              <a
                href="#sponsor"
                class="block px-5 py-3 text-xs font-black uppercase tracking-[0.2em] text-white/70 transition hover:bg-white/5 hover:text-accent"
                (click)="
                  mobileMenuOpen.set(false); scrollToSection($event, 'sponsor')
                "
                >Sponsor</a
              >
              <a
                href="#partecipa"
                class="block px-5 py-3 text-xs font-black uppercase tracking-[0.2em] text-white/70 transition hover:bg-white/5 hover:text-accent"
                (click)="
                  mobileMenuOpen.set(false);
                  scrollToSection($event, 'partecipa')
                "
                >Contatti</a
              >
            </div>
          }

          <div id="top" class="flex flex-1 items-center py-6 lg:py-8">
            <div
              class="hero-parallax-content max-w-4xl"
              [style.transform]="heroContentTransform()"
            >
              <p
                class="reveal-up mb-5 flex items-center gap-3 text-xs font-black uppercase tracking-[0.32em] text-accent"
              >
                <span class="h-px w-10 bg-accent"></span>
                Santa Maria La Fossa
              </p>
              <h1
                class="hero-title reveal-up delay-1 font-display text-[clamp(3.4rem,10vw,6.85rem)] uppercase leading-[0.8]"
              >
                La Fossa<br />Games
              </h1>
              <p
                class="reveal-up delay-2 mt-5 max-w-2xl text-[0.97rem] font-semibold leading-6 text-white/78 sm:text-base sm:leading-7"
              >
                Cinque giorni. Sei sport. Una piazza sola. Tornei aperti a
                tutti, dal calcio a 5 alla briscola — si gioca per vincere, e
                soprattutto per stare insieme.
              </p>
              <div class="reveal-up delay-2 mt-5 flex flex-wrap gap-3">
                <a
                  href="#partecipa"
                  class="rounded-md bg-accent px-5 py-3 text-sm font-black uppercase tracking-[0.14em] text-on-accent shadow-[0_0_34px_rgba(255,212,0,0.25)] transition hover:bg-white"
                  (click)="scrollToSection($event, 'partecipa')"
                >
                  Iscriviti
                </a>
                <a
                  href="#sport"
                  class="rounded-md border border-white/20 px-5 py-3 text-sm font-black uppercase tracking-[0.14em] text-white transition hover-border-accent hover:text-accent"
                  (click)="scrollToSection($event, 'sport')"
                >
                  Scopri i tornei
                </a>
              </div>
              <div
                class="reveal-up delay-3 mt-5 grid max-w-2xl grid-cols-3 overflow-hidden rounded-md border border-accent-25 bg-black/70 text-center shadow-2xl backdrop-blur"
              >
                <div class="border-r border-accent-20 px-3 py-3">
                  <p class="text-2xl font-black text-accent">22-26</p>
                  <p
                    class="mt-1 text-[0.65rem] font-bold uppercase tracking-[0.18em] text-white/52"
                  >
                    Giugno 2026
                  </p>
                </div>
                <div class="border-r border-accent-20 px-3 py-3">
                  <p class="text-2xl font-black text-accent">6</p>
                  <p
                    class="mt-1 text-[0.65rem] font-bold uppercase tracking-[0.18em] text-white/52"
                  >
                    Sport
                  </p>
                </div>
                <div class="px-3 py-3">
                  <p
                    class="text-[clamp(1rem,4vw,1.5rem)] font-black text-accent"
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
                class="reveal-up delay-3 mt-3 max-w-2xl rounded-md border border-white/10 bg-white/[0.04] p-3 backdrop-blur"
              >
                <div class="flex flex-wrap items-center justify-between gap-2">
                  <p
                    class="text-xs font-black uppercase tracking-[0.2em] text-white/50"
                  >
                    Al via tra
                  </p>
                  <p
                    class="text-sm font-black uppercase tracking-[0.14em] text-accent"
                  >
                    22-26 giugno 2026
                  </p>
                </div>
                <div class="mt-3 grid grid-cols-4 gap-2 text-center">
                  @for (item of countdownItems(); track item.label) {
                    <div
                      class="rounded-md bg-black/70 px-2 py-2.5 ring-1 ring-accent-20"
                    >
                      <p
                        class="text-[clamp(1.25rem,4vw,1.85rem)] font-black leading-none text-accent"
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
            class="absolute bottom-6 left-1/2 -translate-x-1/2 hidden flex-col items-center gap-1.5 text-[0.6rem] font-black uppercase tracking-[0.22em] text-white/30 transition hover:text-accent sm:flex"
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
        <div class="mx-auto max-w-7xl reveal-up">
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
                class="card-lift group flex min-h-[17.5rem] w-full touch-manipulation flex-col overflow-hidden rounded-lg border border-soft bg-surface text-left shadow-sm transition hover-border-accent hover:shadow-[0_18px_44px_rgba(10,10,10,0.12)] focus:outline-none focus:ring-4 focus-ring-accent-45 sm:min-h-[19rem]"
                [attr.aria-label]="'Apri dettagli ' + game.name"
                (click)="openGameDetails(game)"
              >
                <div
                  class="flex aspect-square w-full items-center justify-center border-b border-soft bg-strong p-2 sm:p-3"
                >
                  <img
                    [src]="game.image"
                    [alt]="game.name"
                    class="card-media h-full w-full object-contain drop-shadow-[0_10px_22px_rgba(255,212,0,0.18)]"
                  />
                </div>
                <div class="flex flex-1 flex-col p-3 sm:p-4">
                  <p
                    class="text-[0.62rem] font-black uppercase tracking-[0.18em] text-muted"
                  >
                    Torneo
                  </p>
                  <h3
                    class="mt-2 text-lg font-black uppercase leading-[0.95] text-primary sm:text-xl"
                  >
                    {{ game.name }}
                  </h3>
                  <p
                    class="mt-2 line-clamp-3 text-sm font-semibold leading-6 text-muted"
                  >
                    {{ game.description }}
                  </p>
                  <span
                    class="mt-auto inline-flex items-center gap-2 pt-4 text-xs font-black uppercase tracking-[0.16em] text-primary transition group-hover:text-on-accent"
                  >
                    Dettagli
                    <span
                      aria-hidden="true"
                      class="h-1.5 w-1.5 rounded-full bg-accent transition group-hover:ring-4 group-hover-ring-accent-25"
                    ></span>
                  </span>
                </div>
              </button>
            }
          </div>

          @if (selectedGame(); as game) {
            <lfg-modal
              [open]="true"
              [title]="game.name"
              (close)="closeGameDetails()"
            >
              <div class="text-primary">
                <div
                  class="rounded-lg border border-accent-30 bg-surface-muted p-4 sm:p-5"
                >
                  <div class="flex items-start gap-4 sm:items-center">
                    <div
                      class="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-accent-25 bg-strong p-2 shadow-[0_14px_30px_rgba(10,10,10,0.24)] ring-1 ring-white/10 sm:h-24 sm:w-24 sm:p-2.5"
                    >
                      <img
                        [src]="game.image"
                        [alt]="game.name"
                        class="h-full w-full scale-[1.55] object-cover drop-shadow-[0_0_16px_rgba(255,212,0,0.35)]"
                      />
                    </div>
                    <div>
                      <p
                        class="text-[0.68rem] font-black uppercase tracking-[0.18em] text-muted"
                      >
                        Torneo ufficiale
                      </p>
                      <p
                        class="mt-1 text-lg font-black uppercase leading-tight sm:text-xl"
                      >
                        {{ game.name }}
                      </p>
                      <p
                        class="mt-2 text-sm font-semibold leading-6 text-muted"
                      >
                        {{ game.details }}
                      </p>
                    </div>
                  </div>
                </div>

                <div class="mt-4 grid gap-2 sm:grid-cols-3">
                  <div
                    class="rounded-xl border border-soft bg-surface-muted px-3 py-2.5"
                  >
                    <p
                      class="text-[0.62rem] font-black uppercase tracking-[0.18em] text-muted"
                    >
                      Formula
                    </p>
                    <p class="mt-1 text-sm font-black leading-5">
                      {{ game.format }}
                    </p>
                  </div>
                  <div
                    class="rounded-xl border border-soft bg-surface-muted px-3 py-2.5"
                  >
                    <p
                      class="text-[0.62rem] font-black uppercase tracking-[0.18em] text-muted"
                    >
                      Per chi
                    </p>
                    <p class="mt-1 text-sm font-black leading-5">
                      {{ game.audience }}
                    </p>
                  </div>
                  @if (tournamentForGame(game); as tournament) {
                    <div
                      class="rounded-xl border border-soft bg-surface-muted px-3 py-2.5"
                    >
                      <p
                        class="text-[0.62rem] font-black uppercase tracking-[0.18em] text-muted"
                      >
                        Quota
                      </p>
                      <p class="mt-1 text-sm font-black leading-5">
                        {{
                          tournament.fee ? eur(tournament.fee) : "Da confermare"
                        }}
                      </p>
                    </div>
                  } @else {
                    <div
                      class="rounded-xl border border-soft bg-surface-muted px-3 py-2.5"
                    >
                      <p
                        class="text-[0.62rem] font-black uppercase tracking-[0.18em] text-muted"
                      >
                        Iscrizioni
                      </p>
                      <p class="mt-1 text-sm font-black leading-5">Aperte</p>
                    </div>
                  }
                </div>

                <div
                  class="mt-5 rounded-xl border border-soft bg-surface-muted p-4"
                >
                  <p
                    class="text-[0.68rem] font-black uppercase tracking-[0.18em] text-muted"
                  >
                    Cosa aspettarti
                  </p>
                  <ul class="mt-3 grid gap-2">
                    @for (highlight of game.highlights; track highlight) {
                      <li
                        class="grid grid-cols-[auto_1fr] items-start gap-2 text-sm font-semibold leading-6 text-primary"
                      >
                        <span
                          class="mt-2 h-1.5 w-1.5 rounded-full bg-accent ring-2 ring-accent-30"
                        ></span>
                        <span>{{ highlight }}</span>
                      </li>
                    }
                  </ul>
                </div>

                <div class="mt-4">
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
                    @if (game.rules?.length) {
                      <ul class="mt-3 grid gap-2">
                        @for (rule of game.rules; track rule) {
                          <li
                            class="grid grid-cols-[auto_1fr] items-start gap-2 text-sm font-semibold leading-6 text-primary"
                          >
                            <span
                              class="mt-2 h-1.5 w-1.5 rounded-full bg-accent ring-2 ring-accent-30"
                            ></span>
                            <span>{{ rule }}</span>
                          </li>
                        }
                      </ul>
                    } @else {
                      <p class="mt-2 text-sm font-black leading-6 text-primary">
                        Il regolamento ufficiale sarà disponibile a breve.
                      </p>
                    }
                  </div>
                  <button
                    type="button"
                    class="mt-5 w-full rounded-md bg-accent px-5 py-3 text-sm font-black uppercase tracking-[0.12em] text-on-accent transition hover:bg-strong hover:text-accent sm:w-auto"
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

      @if (publicMatches().length || loadingPublicMatches()) {
        <section
          id="risultati"
          class="scroll-mt-6 bg-[#07120e] px-5 py-16 text-white sm:px-8 lg:px-10"
        >
          <div class="mx-auto max-w-7xl reveal-up">
            <div
              class="flex flex-col justify-between gap-5 lg:flex-row lg:items-end"
            >
              <div>
                <p
                  class="text-xs font-black uppercase tracking-[0.28em] text-accent"
                >
                  Risultati live
                </p>
                <h2
                  class="mt-3 max-w-4xl font-display text-4xl uppercase leading-none text-accent sm:text-6xl"
                >
                  Partite e punteggi in tempo reale.
                </h2>
              </div>
              <div
                class="rounded-md border border-white/10 bg-white/[0.04] px-4 py-3"
              >
                <p
                  class="text-xs font-black uppercase tracking-[0.18em] text-white/45"
                >
                  Aggiornamento
                </p>
                <p class="mt-1 text-sm font-black text-white">
                  {{ publicResultsUpdatedAt() || "Connessione attiva" }}
                </p>
              </div>
            </div>

            @if (livePublicMatches().length) {
              <div
                class="mt-8 rounded-lg border border-accent-35 bg-accent px-4 py-3 text-on-accent"
              >
                <p class="text-sm font-black uppercase tracking-[0.14em]">
                  {{ livePublicMatches().length }} partite live ora
                </p>
              </div>
            }

            @if (resultsError()) {
              <p
                class="mt-5 rounded-lg border border-red-400/30 bg-red-500/10 p-3 text-sm font-semibold text-red-100"
              >
                {{ resultsError() }}
              </p>
            }

            <div class="mt-8 grid gap-5">
              @for (group of publicMatchGroups(); track group.tournamentName) {
                <section
                  class="rounded-lg border border-white/10 bg-black/35 p-4"
                >
                  <h3 class="font-display text-2xl uppercase text-accent">
                    {{ group.tournamentName }}
                  </h3>
                  <div class="mt-4 grid gap-3 lg:grid-cols-2">
                    @for (match of group.matches; track match.id) {
                      <article
                        class="rounded-lg border border-white/10 bg-white/[0.04] p-4"
                        [class.border-accent]="match.status === 'live'"
                      >
                        <div
                          class="flex flex-wrap items-center justify-between gap-2"
                        >
                          <div>
                            <p
                              class="text-xs font-black uppercase tracking-[0.16em] text-white/42"
                            >
                              {{
                                match.group_name ||
                                  match.round_label ||
                                  "Partita"
                              }}
                            </p>
                            <p class="mt-1 text-xs font-semibold text-white/52">
                              {{ publicMatchTimeLabel(match) }}
                            </p>
                          </div>
                          <span
                            class="rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wide"
                            [class]="publicMatchBadgeClass(match.status)"
                          >
                            {{ publicMatchStatusLabel(match.status) }}
                          </span>
                        </div>

                        <div class="mt-4 grid gap-2">
                          <div
                            class="grid grid-cols-[1fr_auto] items-center gap-3 rounded-md bg-black/35 px-3 py-2"
                          >
                            <p class="truncate text-base font-black">
                              {{ match.home_team_name }}
                            </p>
                            <p class="text-3xl font-black text-accent">
                              {{ match.home_score }}
                            </p>
                          </div>
                          <div
                            class="grid grid-cols-[1fr_auto] items-center gap-3 rounded-md bg-black/35 px-3 py-2"
                          >
                            <p class="truncate text-base font-black">
                              {{ match.away_team_name }}
                            </p>
                            <p class="text-3xl font-black text-accent">
                              {{ match.away_score }}
                            </p>
                          </div>
                        </div>

                        @if (match.field_label) {
                          <p
                            class="mt-3 text-xs font-bold uppercase tracking-[0.14em] text-white/45"
                          >
                            Campo: {{ match.field_label }}
                          </p>
                        }
                      </article>
                    }
                  </div>
                </section>
              }
            </div>
          </div>
        </section>
      }

      <section class="bg-accent px-5 py-16 text-on-accent sm:px-8 lg:px-10">
        <div
          class="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1fr_0.8fr] lg:items-end reveal-up"
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
        <div class="mx-auto max-w-7xl reveal-up">
          <div
            class="flex flex-col justify-between gap-5 lg:flex-row lg:items-end"
          >
            <div>
              <p
                class="text-xs font-black uppercase tracking-[0.28em] text-accent"
              >
                Scegli la tua visibilità
              </p>
              <h2
                class="mt-3 max-w-4xl font-display text-4xl uppercase leading-none text-accent sm:text-6xl"
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
                class="mt-5 inline-flex rounded-md bg-accent px-5 py-3 text-sm font-black uppercase tracking-[0.14em] text-on-accent transition hover:bg-white"
                (click)="selectSponsorContact($event)"
              >
                Richiedi informazioni sponsor
              </a>
            </div>
          </div>

          @if (hasSponsorLogos) {
            <div
              class="mt-12 border-y border-white/10 py-8 sm:py-10"
              aria-label="Sponsor La Fossa Games"
            >
              <div
                class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"
              >
                <div>
                  <p
                    class="text-xs font-black uppercase tracking-[0.28em] text-accent"
                  >
                    I nostri sponsor
                  </p>
                  <h3
                    class="mt-2 font-display text-3xl uppercase leading-none text-white sm:text-4xl"
                  >
                    Partner sul campo.
                  </h3>
                </div>
                <p
                  class="max-w-md text-sm font-semibold leading-6 text-white/58"
                >
                  Presenze ufficiali, ordinate per visibilità e pensate per
                  restare pulite anche da mobile.
                </p>
              </div>

              @if (mainSponsors.length) {
                <div class="mt-7 grid gap-4">
                  @for (logo of mainSponsors; track logo.src) {
                    <article
                      class="sponsor-logo-card flex min-h-64 flex-col justify-between rounded-md border border-accent/30 bg-white p-5 shadow-[0_22px_60px_rgba(0,0,0,0.22)] sm:min-h-72 sm:p-7 lg:min-h-80"
                    >
                      <div
                        class="flex items-center justify-between gap-4 text-[0.65rem] font-black uppercase tracking-[0.22em] text-black/42"
                      >
                        <span class="text-[#0f3d2e]">Main sponsor</span>
                      </div>
                      <div
                        class="my-3 flex h-48 w-full items-center justify-center sm:h-56 lg:h-64"
                      >
                        <img
                          [src]="logo.src"
                          [alt]="logo.name"
                          class="h-full w-full scale-110 object-contain object-center sm:scale-[1.15]"
                          loading="lazy"
                        />
                      </div>
                    </article>
                  }
                </div>
              }

              @if (mediumSponsors.length) {
                <div class="mt-6">
                  <div
                    class="mb-3 flex items-center justify-between gap-3 text-xs font-black uppercase tracking-[0.22em]"
                  >
                    <p class="text-white/42">Altri Sponsor</p>
                  </div>
                  <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    @for (logo of mediumSponsors; track logo.src) {
                      <article
                        class="sponsor-logo-card flex min-h-44 items-center justify-center rounded-md border border-white/10 bg-white px-4 py-5 sm:min-h-48 lg:min-h-52"
                      >
                        <div
                          class="flex h-36 w-full items-center justify-center sm:h-40 lg:h-44"
                        >
                          <img
                            [src]="logo.src"
                            [alt]="logo.name"
                            class="h-full w-full scale-125 object-contain object-center"
                            loading="lazy"
                          />
                        </div>
                      </article>
                    }
                  </div>
                </div>
              }

              @if (baseSponsors.length) {
                <div class="mt-5">
                  <div
                    class="mb-2 flex items-center justify-between gap-3 text-xs font-black uppercase tracking-[0.22em]"
                  >
                    <p class="text-white/35">Sponsor base</p>
                  </div>
                  <div class="grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
                    @for (logo of baseSponsors; track logo.src) {
                      <article
                        class="sponsor-logo-card flex min-h-36 items-center justify-center rounded-md border border-white/10 bg-white px-3 py-3 sm:min-h-40"
                      >
                        <div
                          class="flex h-28 w-full items-center justify-center sm:h-32"
                        >
                          <img
                            [src]="logo.src"
                            [alt]="logo.name"
                            class="h-full w-full scale-[1.35] object-contain object-center"
                            loading="lazy"
                          />
                        </div>
                      </article>
                    }
                  </div>
                </div>
              }
            </div>
          }

          <div class="mt-10 grid gap-4 lg:grid-cols-3">
            @for (tier of sponsorTiers; track tier.name) {
              <article
                class="card-lift relative rounded-lg border p-5 shadow-2xl transition sm:p-6"
                [class]="
                  tier.name === 'Gold'
                    ? 'border-[#ffd400]/50 bg-[#ffd400]/[0.06] ring-1 ring-[#ffd400]/20 shadow-[0_0_48px_rgba(255,212,0,0.10)]'
                    : 'border-white/10 bg-white/[0.04] hover-border-accent-70'
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
          class="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.85fr_1fr] lg:items-start reveal-up"
        >
          <div>
            <p
              class="text-xs font-black uppercase tracking-[0.28em] text-accent"
            >
              Iscrizioni e sponsor
            </p>
            <h2
              class="mt-3 max-w-4xl font-display text-4xl uppercase leading-none text-accent sm:text-6xl"
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

          <lfg-participation-form-tabs
            [form]="participationForm"
            [tournaments]="tournaments"
            [loadingTournaments]="loadingTournaments"
            [submitting]="submitting"
            [success]="success"
            [error]="error"
            [title]="formTitle.bind(this)"
            [submitLabel]="submitLabel.bind(this)"
            [successMessage]="successMessage.bind(this)"
            [tournamentLabel]="tournamentLabel.bind(this)"
            (reasonChange)="onReasonChange()"
            (submit)="submitParticipation()"
          />
        </div>
      </section>

      <footer
        class="border-t border-accent-20 bg-[#050505] px-5 py-10 text-white sm:px-8 lg:px-10"
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
                class="h-12 w-12 rounded-full object-cover ring-1 ring-accent-50"
              />
              <span
                class="text-sm font-black uppercase tracking-[0.24em] text-accent"
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
                  class="text-white/72 transition hover:text-accent"
                  (click)="scrollToSection($event, 'top')"
                >
                  Home
                </a>
                <a
                  href="#sport"
                  class="text-white/72 transition hover:text-accent"
                  (click)="scrollToSection($event, 'sport')"
                >
                  Sport
                </a>
                <a
                  href="#sponsor"
                  class="text-white/72 transition hover:text-accent"
                  (click)="scrollToSection($event, 'sponsor')"
                >
                  Sponsor
                </a>
                <a
                  href="#partecipa"
                  class="text-white/72 transition hover:text-accent"
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
                <span
                  class="font-black uppercase tracking-[0.14em] text-accent"
                >
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
                  class="flex h-9 w-9 items-center justify-center rounded-md border border-white/10 text-white/50 transition hover-border-accent-50 hover:text-accent"
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
                  class="flex h-9 w-9 items-center justify-center rounded-md border border-white/10 text-white/50 transition hover-border-accent-50 hover:text-accent"
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
            <a href="/login" class="text-white/30 transition hover:text-accent">
              Area manager
            </a>
            <a
              href="#top"
              class="transition hover:text-accent"
              (click)="scrollToSection($event, 'top')"
              >Torna su</a
            >
          </div>
        </div>
      </footer>
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
  mobileMenuOpen = signal(false);
  participationForm = this.emptyParticipationForm();
  protected readonly eventDateRange = "22-26 giugno 2026";
  protected readonly eventAddress =
    "Via Vignale, 59, 81050 Santa Maria La Fossa CE";
  protected readonly countdown = signal<Countdown>(this.calculateCountdown());
  protected readonly selectedGame = signal<Game | null>(null);
  protected readonly publicMatchGroups = computed(() =>
    this.groupPublicMatches(this.publicMatches()),
  );
  protected readonly livePublicMatches = computed(() =>
    this.publicMatches().filter((match) => match.status === "live"),
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

  protected readonly games: Game[] = [
    {
      name: "Calcio a 5",
      description: "Squadre, gironi e partite ad alta intensità.",
      details: "Il classico torneo di quartiere, ritmo alto e grande tifo.",
      image: "/assets/icone/icona-calcio.svg",
      format: "A squadre",
      audience: "Open",
      highlights: [
        "Partite veloci e calendario concentrato.",
        "Gironi iniziali e fase a eliminazione.",
        "Premiazione finale.",
      ],
      rules: [
        "Squadre composte da massimo 8 giocatori.",
        "Formula con gironi iniziali e fase a eliminazione diretta. In caso di pareggio nelle fasi finali si procede ai rigori.",
        "In caso di parità in classifica valgono, nell'ordine: scontri diretti, differenza reti, gol fatti e sorteggio.",
        "Si applicano le regole ufficiali del calcio a 5.",
        "Ritardo massimo consentito: 10 minuti. Oltre il limite, sconfitta 6-0 a tavolino.",
        "Rispetto obbligatorio per arbitri, avversari e organizzazione. Bestemmie, risse o comportamenti antisportivi possono portare ad ammonizione, espulsione o esclusione.",
        "Quota: 80 euro per squadra, più 10 euro a partita per squadra.",
        "Iscrizioni aperte fino al 19 giugno.",
        "I capitani saranno inseriti in un gruppo WhatsApp dedicato con regolamento ufficiale e comunicazioni organizzative.",
      ],
    },
    {
      name: "Calcio a 5 under 15",
      description:
        "Il torneo dedicato ai più giovani, con spirito di squadra e fair play.",
      details: "Spazio ai più piccoli con partite pensate per età e sicurezza.",
      image: "/assets/icone/icona-calcio.svg",
      format: "A squadre",
      audience: "Under 15",
      highlights: [
        "Gironi bilanciati per categoria.",
        "Focus su fair play e partecipazione.",
        "Finale con premiazione dedicata.",
      ],
    },
    {
      name: "Green Volley",
      description: "Torneo 3 vs 3 su campo in erba sintetica.",
      image: "/assets/icone/icona-pallavolo.svg",
      details:
        "Area Mercato, Santa Maria la Fossa. Iscrizioni aperte fino al 19 giugno.",
      format: "3 vs 3",
      audience: "Open",
      highlights: [
        "Squadre da 3 giocatori, con massimo 5 giocatori in rosa.",
        "Massimo 1 tesserato FIPAV per squadra.",
        "Quota iscrizione: 50 euro a squadra.",
        "Campo in erba sintetica.",
        "I capitani saranno aggiunti a un gruppo WhatsApp con regolamento ufficiale e comunicazioni.",
      ],
      rules: [
        "Formula con gironi più fase a eliminazione diretta.",
        "Partite al meglio dei 3 set: primi due set ai 21 punti, eventuale terzo set ai 15.",
        "Classifica gironi: vittoria 3 punti, sconfitta 0 punti.",
        "In caso di parità valgono, nell'ordine: scontri diretti, differenza set, differenza punti e sorteggio.",
        "Si applicano le regole ufficiali del green volley.",
        "Cambi illimitati, battuta libera anche dall'alto e rotazione obbligatoria.",
        "Punto per l'avversario in caso di tocco di rete, tocco della linea in battuta o più di 3 tocchi escluso il muro.",
        "Ritardo massimo consentito: 10 minuti. Oltre il limite, partita persa a tavolino.",
        "Rispetto obbligatorio per arbitri, avversari e organizzazione. Bestemmie, risse o atti antisportivi possono portare ad ammonizione, espulsione o esclusione.",
        "Info e iscrizioni in DM o al 335 5653748, Gaetano.",
      ],
    },
    {
      name: "Calcio balilla",
      description: "Coppie, riflessi e sfide punto su punto.",
      image: "/assets/icone/icona-calcio-balilla.svg",
      details:
        "Sfide a coppie dove coordinazione e velocità fanno la differenza.",
      format: "A coppie",
      audience: "Open",
      highlights: [
        "Tabellone ad eliminazione diretta.",
        "Partite rapide e spettacolari.",
        "Finalissima davanti al pubblico.",
      ],
    },
    {
      name: "Briscola",
      description:
        "Torneo a coppie con gironi, fasi finali e partite a 120 punti.",
      image: "/assets/icone/icona-briscola.svg",
      details:
        "Sfide al meglio delle partite, classifica a punti e regolamento dedicato per gestire spareggi e parità.",
      format: "A coppie",
      audience: "Open",
      highlights: [
        "Fase a gironi al meglio delle 3 partite.",
        "Fasi finali al meglio delle 5 partite.",
        "Quota iscrizione: 20 euro a squadra.",
        "Iscrizioni aperte fino al 19 giugno.",
        "Gruppo WhatsApp per capitani con regolamento ufficiale e comunicazioni.",
      ],
      rules: [
        "Fase a gironi: sfide al meglio delle 3 partite a 120 punti.",
        "In caso di 1-1 nei gironi si gioca uno spareggio secco a 120 punti.",
        "In caso di parità nel singolo scontro dei gironi, ad esempio 70-50 e 50-70, si gioca una minipartita a 60 punti.",
        "Ogni vittoria nella fase a gironi vale 3 punti.",
        "A parità di punti in classifica conta la differenza tra 120 vinti e 120 persi. Se la parità persiste, si gioca una partita di spareggio con le stesse modalità.",
        "Fasi finali: sfide al meglio delle 5 partite a 120 punti.",
        "In caso di 2-2 nelle fasi finali si gioca uno spareggio secco a 120 punti.",
        "In caso di parità nel singolo scontro delle fasi finali si gioca una nuova partita a 120 punti.",
        "Durante tutta la partita è consentito parlare con il proprio compagno.",
        "È vietato rivedere il mazzetto delle carte già giocate.",
        "Se un giocatore sbaglia a giocare una carta, la mano può essere ripetuta solo con il consenso degli avversari. La scelta vale per tutta la partita e si applica a entrambe le coppie.",
        "Ritardo massimo consentito: 15 minuti. Oltre il limite, partita persa a tavolino.",
        "Gironi, calendario, accoppiamenti e tabellone saranno comunicati prima dell'inizio del torneo.",
        "Info e iscrizioni in DM, su lafossagames.com o al 351 5578081, Gianmarco.",
      ],
    },
    {
      name: "FIFA 26",
      description:
        "Console, controller e partite da vivere fino all'ultimo gol.",
      image: "/assets/icone/icona-fc26.svg",
      details: "Torneo eSports in presenza con partite uno contro uno.",
      format: "Singolo",
      audience: "Open",
      highlights: [
        "Bracket competitivo ad eliminazione.",
        "Setup ufficiale e regole condivise.",
        "Finale live con pubblico.",
      ],
    },
    {
      name: "Ping pong",
      description: "Scambi rapidi, ritmo alto e concentrazione.",
      image: "/assets/icone/icona-pingpong.svg",
      details: "Velocità, tecnica e riflessi in un torneo individuale.",
      format: "Singolo",
      audience: "Open",
      highlights: [
        "Partite a set con tabellone progressivo.",
        "Sfide ravvicinate e tempi rapidi.",
        "Finale con premiazione sul palco.",
      ],
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
  protected readonly mainSponsors = SPONSOR_ASSETS.filter((sponsor) =>
    sponsor.src.startsWith("/assets/sponsor/main/"),
  );
  protected readonly mediumSponsors: SponsorAsset[] = SPONSOR_ASSETS.filter(
    (sponsor) =>
      !sponsor.src.startsWith("/assets/sponsor/main/") &&
      !sponsor.src.startsWith("/assets/sponsor/base/"),
  );
  protected readonly baseSponsors: SponsorAsset[] = SPONSOR_ASSETS.filter(
    (sponsor) => sponsor.src.startsWith("/assets/sponsor/base/"),
  );
  protected readonly hasSponsorLogos = SPONSOR_ASSETS.length > 0;

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
          category: "bronzo",
          type: "cash",
          value: 0,
          promised_amount: 0,
          received_amount: 0,
          payment_method: "Contanti",
          responsible_user_id: null,
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

  protected publicMatchStatusLabel(
    status: PublicTournamentMatch["status"],
  ): string {
    return (
      {
        scheduled: "Programmata",
        live: "Live",
        completed: "Finale",
        cancelled: "Annullata",
      } satisfies Record<PublicTournamentMatch["status"], string>
    )[status];
  }

  protected publicMatchBadgeClass(
    status: PublicTournamentMatch["status"],
  ): string {
    if (status === "live") {
      return "border-accent bg-accent text-on-accent";
    }
    if (status === "completed") {
      return "border-emerald-400/35 bg-emerald-400/10 text-emerald-100";
    }
    if (status === "cancelled") {
      return "border-red-400/35 bg-red-400/10 text-red-100";
    }
    return "border-white/15 text-white/70";
  }

  protected publicMatchTimeLabel(match: PublicTournamentMatch): string {
    if (match.starts_at) {
      return new Intl.DateTimeFormat("it-IT", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(match.starts_at));
    }
    return match.field_label
      ? `Campo ${match.field_label}`
      : "Orario da definire";
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
      this.isTournamentForGame(tournament, game),
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

  protected tournamentForGame(game: Game): PublicTournament | null {
    return (
      this.tournaments().find((tournament) =>
        this.isTournamentForGame(tournament, game),
      ) ?? null
    );
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
    game: Game,
  ): boolean {
    return (
      this.sameTournamentName(tournament.name, game.name) ||
      (game.name === "Green Volley" && tournament.sport === "pallavolo")
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

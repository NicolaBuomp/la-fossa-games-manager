import { Component, EventEmitter, Output } from "@angular/core";
import {
  SPONSOR_ASSETS,
  SponsorAsset,
} from "../../core/generated/sponsor-assets";
import { SPONSOR_TIERS } from "./landing-content";

@Component({
  selector: "lfg-landing-sponsor-section",
  standalone: true,
  styles: [
    `
      @keyframes platinumPulse {
        0%,
        100% {
          box-shadow:
            0 0 32px rgba(229, 228, 226, 0.18),
            0 0 64px rgba(229, 228, 226, 0.06);
        }
        50% {
          box-shadow:
            0 0 48px rgba(229, 228, 226, 0.38),
            0 0 96px rgba(229, 228, 226, 0.14);
        }
      }
      @keyframes silverPulse {
        0%,
        100% {
          box-shadow:
            0 0 24px rgba(200, 200, 200, 0.14),
            0 0 48px rgba(200, 200, 200, 0.04);
        }
        50% {
          box-shadow:
            0 0 36px rgba(200, 200, 200, 0.28),
            0 0 72px rgba(200, 200, 200, 0.1);
        }
      }
      @keyframes tickerLeft {
        from {
          transform: translateX(0);
        }
        to {
          transform: translateX(-50%);
        }
      }
      @keyframes tickerRight {
        from {
          transform: translateX(-50%);
        }
        to {
          transform: translateX(0);
        }
      }
      .ticker-track {
        display: flex;
        width: max-content;
        animation: tickerLeft 30s linear infinite;
      }
      .ticker-track-right {
        display: flex;
        width: max-content;
        animation: tickerRight 36s linear infinite;
      }
      .ticker-wrapper:hover .ticker-track,
      .ticker-wrapper:hover .ticker-track-right {
        animation-play-state: paused;
      }
      .platinum-hero {
        animation: platinumPulse 3s ease-in-out infinite;
      }
      .silver-hero {
        animation: silverPulse 3.5s ease-in-out infinite;
      }
      @media (prefers-reduced-motion: reduce) {
        .ticker-track,
        .ticker-track-right,
        .platinum-hero,
        .silver-hero {
          animation: none;
        }
      }
    `,
  ],
  template: `
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
              Partnership pensate per farsi notare.
            </h2>
          </div>
          <div class="max-w-xl">
            <p class="text-base font-semibold leading-7 text-white/68">
              Un impianto chiaro, quattro livelli e una presenza visiva curata:
              il tuo brand entra nel ritmo dell'evento con spazio reale, online
              e sul campo.
            </p>
            <a
              href="#partecipa"
              class="mt-5 inline-flex min-h-11 items-center rounded-md bg-accent px-5 py-3 text-sm font-black uppercase tracking-[0.14em] text-on-accent transition hover:-translate-y-0.5 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-[#090909]"
              (click)="sponsorContact.emit($event)"
            >
              Richiedi informazioni sponsor
            </a>
          </div>
        </div>

        <div class="mt-8 grid grid-cols-3 gap-3 sm:gap-4">
          <article
            class="rounded-md border border-accent/30 bg-accent/[0.05] px-3 py-3 sm:px-4"
          >
            <p
              class="font-display text-3xl leading-none text-accent sm:text-4xl"
            >
              4
            </p>
            <p
              class="mt-1 text-[0.68rem] font-black uppercase tracking-[0.18em] text-white/58 sm:text-xs"
            >
              Livelli
            </p>
          </article>
          <article
            class="rounded-md border border-white/10 bg-white/[0.03] px-3 py-3 sm:px-4"
          >
            <p
              class="font-display text-3xl leading-none text-accent sm:text-4xl"
            >
              5
            </p>
            <p
              class="mt-1 text-[0.68rem] font-black uppercase tracking-[0.18em] text-white/58 sm:text-xs"
            >
              Giorni evento
            </p>
          </article>
          <article
            class="rounded-md border border-[#10B981]/35 bg-[#10B981]/[0.06] px-3 py-3 sm:px-4"
          >
            <p
              class="font-display text-3xl leading-none text-[#6af0c1] sm:text-4xl"
            >
              1
            </p>
            <p
              class="mt-1 text-[0.68rem] font-black uppercase tracking-[0.18em] text-white/58 sm:text-xs"
            >
              Community unica
            </p>
          </article>
        </div>

        <div class="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          @for (tier of sponsorTiers; track tier.name) {
            <article
              class="card-lift relative rounded-lg border p-5 shadow-2xl transition sm:p-6"
              [class]="
                tier.name === 'Platino'
                  ? 'border-[#e5e4e2]/40 bg-[#e5e4e2]/[0.06] ring-1 ring-[#e5e4e2]/20 shadow-[0_0_42px_rgba(229,228,226,0.07)]'
                  : tier.name === 'Oro'
                    ? 'border-[#ffd400]/55 bg-[#ffd400]/[0.08] ring-1 ring-[#ffd400]/30 shadow-[0_0_42px_rgba(255,212,0,0.09)] md:col-span-2 lg:col-span-1'
                    : tier.name === 'Argento'
                      ? 'border-white/15 bg-white/[0.06]'
                      : 'border-[#d98945]/30 bg-[#d98945]/[0.06]'
              "
            >
              @if (tier.name === "Platino" || tier.name === "Oro") {
                <span
                  class="absolute -top-3 left-5 rounded-full px-3 py-0.5 text-[0.65rem] font-black uppercase tracking-[0.18em] text-black"
                  [class]="
                    tier.name === 'Platino' ? 'bg-[#e5e4e2]' : 'bg-[#ffd400]'
                  "
                >
                  {{
                    tier.name === "Platino" ? "Top di gamma" : "Più equilibrato"
                  }}
                </span>
              }
              <div class="flex items-center gap-4">
                <div
                  class="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border text-3xl font-black"
                  [class]="
                    tier.name === 'Platino'
                      ? 'shadow-[0_0_20px_rgba(229,228,226,0.40)]'
                      : tier.name === 'Oro'
                        ? 'shadow-[0_0_20px_rgba(255,212,0,0.35)]'
                        : ''
                  "
                  [style.border-color]="tier.color"
                  [style.color]="tier.color"
                >
                  {{ tierIcon[tier.name] }}
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
              <p class="mt-5 text-sm font-semibold leading-6 text-white/70">
                {{ tier.description }}
              </p>
              <ul class="mt-6 grid gap-4">
                @for (perk of tier.perks; track perk) {
                  <li
                    class="grid grid-cols-[auto_1fr] gap-3 text-sm font-bold uppercase leading-6 tracking-[0.08em] text-white/88"
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
            </div>

            <!-- PLATINO: card hero centrata con glow pulsante -->
            @if (platinumSponsors.length) {
              <div class="mt-8">
                <div class="mb-4 flex items-center gap-3">
                  <span class="text-sm text-[#e5e4e2]">✦</span>
                  <p
                    class="text-xs font-black uppercase tracking-[0.28em] text-[#e5e4e2]"
                  >
                    Platino
                  </p>
                </div>
                <div class="flex flex-wrap justify-center gap-5">
                  @for (logo of platinumSponsors; track logo.src) {
                    <article
                      class="platinum-hero relative flex w-full max-w-sm flex-col items-center justify-center rounded-xl border border-[#e5e4e2]/40 bg-white px-8 py-8 transition-transform duration-300 hover:-translate-y-1"
                    >
                      <span
                        class="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#e5e4e2] px-4 py-1 text-[0.6rem] font-black uppercase tracking-[0.22em] text-black"
                      >
                        Partner Ufficiale
                      </span>
                      <div class="flex h-44 w-full items-center justify-center">
                        <img
                          [src]="logo.src"
                          [alt]="logo.name"
                          class="h-full w-full object-contain object-center"
                          loading="lazy"
                        />
                      </div>
                      <p
                        class="mt-4 text-center text-[0.6rem] font-black uppercase tracking-widest text-black/40"
                      >
                        {{ logo.name }}
                      </p>
                    </article>
                  }
                </div>
              </div>
            }

            <!-- ORO: grid standard -->
            @if (goldSponsors.length) {
              <div class="mt-8">
                <div class="mb-4 flex items-center gap-3">
                  <span class="text-sm" style="color: #ffd400">★</span>
                  <p
                    class="text-xs font-black uppercase tracking-[0.28em]"
                    style="color: #ffd400"
                  >
                    Oro
                  </p>
                </div>
                <div
                  class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
                >
                  @for (logo of goldSponsors; track logo.src) {
                    <article
                      class="flex min-h-44 flex-col items-center justify-center rounded-md border border-[#ffd400]/25 bg-white px-4 py-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-[#ffd400]/55 hover:shadow-[0_0_24px_rgba(255,212,0,0.30)] lg:min-h-56 lg:p-6"
                    >
                      <div
                        class="flex h-32 w-full items-center justify-center lg:h-44"
                      >
                        <img
                          [src]="logo.src"
                          [alt]="logo.name"
                          class="h-full w-full object-contain object-center"
                          loading="lazy"
                        />
                      </div>
                      <p
                        class="mt-3 text-center text-[0.6rem] font-black uppercase tracking-widest text-black/40"
                      >
                        {{ logo.name }}
                      </p>
                    </article>
                  }
                </div>
              </div>
            }

            <!-- ARGENTO: card singola con glow argento -->
            @if (silverSponsors.length) {
              <div class="mt-8">
                <div class="mb-4 flex items-center gap-3">
                  <span class="text-sm" style="color: #c8c8c8">◆</span>
                  <p
                    class="text-xs font-black uppercase tracking-[0.28em]"
                    style="color: #c8c8c8"
                  >
                    Argento
                  </p>
                </div>
                @if (silverSponsors.length === 1) {
                  <div class="flex flex-wrap justify-center gap-5">
                    @for (logo of silverSponsors; track logo.src) {
                      <article
                        class="silver-hero relative flex w-full max-w-xs flex-col items-center justify-center rounded-xl border border-[#c8c8c8]/35 bg-white px-6 py-6 transition-transform duration-300 hover:-translate-y-1"
                      >
                        <div
                          class="flex h-36 w-full items-center justify-center"
                        >
                          <img
                            [src]="logo.src"
                            [alt]="logo.name"
                            class="h-full w-full object-contain object-center"
                            loading="lazy"
                          />
                        </div>
                        <p
                          class="mt-3 text-center text-[0.6rem] font-black uppercase tracking-widest text-black/40"
                        >
                          {{ logo.name }}
                        </p>
                      </article>
                    }
                  </div>
                } @else {
                  <div
                    class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4"
                  >
                    @for (logo of silverSponsors; track logo.src) {
                      <article
                        class="flex min-h-36 flex-col items-center justify-center rounded-md border border-white/10 bg-white px-3 py-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-[#c8c8c8]/50 hover:shadow-[0_0_24px_rgba(200,200,200,0.30)] lg:min-h-48 lg:px-4 lg:py-5"
                      >
                        <div
                          class="flex h-28 w-full items-center justify-center lg:h-40"
                        >
                          <img
                            [src]="logo.src"
                            [alt]="logo.name"
                            class="h-full w-full object-contain object-center"
                            loading="lazy"
                          />
                        </div>
                        <p
                          class="mt-2 text-center text-[0.6rem] font-black uppercase tracking-widest text-black/40"
                        >
                          {{ logo.name }}
                        </p>
                      </article>
                    }
                  </div>
                }
              </div>
            }

            <!-- BRONZO: doppio ticker infinito -->
            @if (bronzeSponsors.length) {
              <div class="mt-8">
                <div class="mb-4 flex items-center gap-3">
                  <span class="text-sm" style="color: #d98945">●</span>
                  <p
                    class="text-xs font-black uppercase tracking-[0.28em]"
                    style="color: #d98945"
                  >
                    Bronzo
                  </p>
                </div>

                <!-- Riga 1: scorre a sinistra -->
                <div class="ticker-wrapper overflow-hidden">
                  <div
                    class="ticker-track"
                    role="list"
                    aria-label="Sponsor Bronzo"
                  >
                    @for (logo of bronzeRow1; track $index) {
                      <div
                        class="mx-2 flex min-h-28 w-40 shrink-0 flex-col items-center justify-center rounded-md border border-white/10 bg-white px-2 py-3 transition-all duration-300 hover:border-[#d98945]/40 hover:shadow-[0_0_20px_rgba(217,137,69,0.25)] sm:w-48 lg:w-52"
                        [attr.role]="
                          $index < bronzeSponsors.length ? 'listitem' : null
                        "
                        [attr.aria-hidden]="
                          $index >= bronzeSponsors.length ? 'true' : null
                        "
                      >
                        <div
                          class="flex h-20 w-full items-center justify-center"
                        >
                          <img
                            [src]="logo.src"
                            [alt]="
                              $index < bronzeSponsors.length ? logo.name : ''
                            "
                            class="h-full w-full object-contain object-center"
                            loading="lazy"
                          />
                        </div>
                        <p
                          class="mt-2 text-center text-[0.55rem] font-black uppercase tracking-widest text-black/40"
                        >
                          {{ logo.name }}
                        </p>
                      </div>
                    }
                  </div>
                </div>

                <!-- Riga 2: scorre a destra (direzione opposta) -->
                @if (bronzeRow2.length > 0) {
                  <div class="ticker-wrapper mt-3 overflow-hidden">
                    <div
                      class="ticker-track-right"
                      role="presentation"
                      aria-hidden="true"
                    >
                      @for (logo of bronzeRow2; track $index) {
                        <div
                          class="mx-2 flex min-h-28 w-40 shrink-0 flex-col items-center justify-center rounded-md border border-white/10 bg-white px-2 py-3 transition-all duration-300 hover:border-[#d98945]/40 hover:shadow-[0_0_20px_rgba(217,137,69,0.25)] sm:w-48 lg:w-52"
                        >
                          <div
                            class="flex h-20 w-full items-center justify-center"
                          >
                            <img
                              [src]="logo.src"
                              [alt]="''"
                              class="h-full w-full object-contain object-center"
                              loading="lazy"
                            />
                          </div>
                          <p
                            class="mt-2 text-center text-[0.55rem] font-black uppercase tracking-widest text-black/40"
                          >
                            {{ logo.name }}
                          </p>
                        </div>
                      }
                    </div>
                  </div>
                }
              </div>
            }
          </div>
        }

        <div class="mt-8 flex justify-center lg:justify-end">
          <a
            href="#partecipa"
            class="inline-flex min-h-11 items-center rounded-md border border-accent/40 bg-accent/[0.08] px-5 py-3 text-sm font-black uppercase tracking-[0.14em] text-accent transition hover:-translate-y-0.5 hover:bg-accent hover:text-on-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-[#090909]"
            (click)="sponsorContact.emit($event)"
          >
            Diventa sponsor ufficiale
          </a>
        </div>
      </div>
    </section>
  `,
})
export class LandingSponsorSectionComponent {
  @Output() sponsorContact = new EventEmitter<MouseEvent>();

  protected readonly tierIcon: Record<string, string> = {
    Platino: "✦",
    Oro: "★",
    Argento: "◆",
    Bronzo: "●",
  };

  protected readonly sponsorTiers = SPONSOR_TIERS;
  protected readonly platinumSponsors = SPONSOR_ASSETS.filter(
    (s) => s.category === "platino",
  );
  protected readonly goldSponsors: SponsorAsset[] = SPONSOR_ASSETS.filter(
    (s) => s.category === "oro",
  );
  protected readonly silverSponsors: SponsorAsset[] = SPONSOR_ASSETS.filter(
    (s) => s.category === "argento",
  );
  protected readonly bronzeSponsors: SponsorAsset[] = SPONSOR_ASSETS.filter(
    (s) => s.category === "bronzo",
  );
  protected readonly hasSponsorLogos = SPONSOR_ASSETS.length > 0;

  protected readonly bronzeRow1: SponsorAsset[];
  protected readonly bronzeRow2: SponsorAsset[];

  constructor() {
    const bronze = this.bronzeSponsors;
    const half = Math.ceil(bronze.length / 2);
    const firstHalf = bronze.slice(0, half);
    const secondHalf = bronze.slice(half);
    // Duplica ogni metà per il loop seamless
    this.bronzeRow1 = [...firstHalf, ...firstHalf];
    this.bronzeRow2 =
      secondHalf.length > 0 ? [...secondHalf, ...secondHalf] : [];
  }
}

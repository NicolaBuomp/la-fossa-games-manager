import { Component, EventEmitter, Output } from "@angular/core";
import {
  SPONSOR_ASSETS,
  SponsorAsset,
} from "../../core/generated/sponsor-assets";
import { SPONSOR_TIERS } from "./landing-content";

@Component({
  selector: "lfg-landing-sponsor-section",
  standalone: true,
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
              Un impianto chiaro, tre livelli e una presenza visiva curata: il
              tuo brand entra nel ritmo dell'evento con spazio reale, online e
              sul campo.
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
              3
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
                tier.name === 'Gold'
                  ? 'border-[#ffd400]/55 bg-[#ffd400]/[0.08] ring-1 ring-[#ffd400]/30 shadow-[0_0_42px_rgba(255,212,0,0.09)] md:col-span-2 lg:col-span-1'
                  : tier.name === 'Silver'
                    ? 'border-white/15 bg-white/[0.06]'
                    : 'border-[#d98945]/30 bg-[#d98945]/[0.06]'
              "
            >
              @if (tier.name === "Gold") {
                <span
                  class="absolute -top-3 left-5 rounded-full bg-[#ffd400] px-3 py-0.5 text-[0.65rem] font-black uppercase tracking-[0.18em] text-black"
                >
                  Visibilità massima
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

            @if (mainSponsors.length) {
              <div class="mt-7">
                <div
                  class="mb-3 flex items-center justify-between gap-3 text-xs font-black uppercase tracking-[0.22em]"
                >
                  <p class="text-accent">Main sponsor</p>
                </div>
                <div
                  class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
                >
                  @for (logo of mainSponsors; track logo.src) {
                    <article
                      class="sponsor-logo-card flex min-h-52 items-center justify-center rounded-md border border-accent/30 bg-white px-5 py-6 shadow-[0_18px_40px_rgba(0,0,0,0.2)] lg:min-h-72 lg:p-6"
                    >
                      <div
                        class="flex h-40 w-full items-center justify-center lg:h-56"
                      >
                        <img
                          [src]="logo.src"
                          [alt]="logo.name"
                          class="h-full w-full object-contain object-center lg:scale-110"
                          loading="lazy"
                        />
                      </div>
                    </article>
                  }
                </div>
              </div>
            }

            @if (mediumSponsors.length) {
              <div class="mt-6">
                <div
                  class="mb-3 flex items-center justify-between gap-3 text-xs font-black uppercase tracking-[0.22em]"
                >
                  <p class="text-white/42">Altri Sponsor</p>
                </div>
                <div
                  class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4"
                >
                  @for (logo of mediumSponsors; track logo.src) {
                    <article
                      class="sponsor-logo-card flex min-h-36 items-center justify-center rounded-md border border-white/10 bg-white px-3 py-4 lg:min-h-48 lg:px-4 lg:py-5"
                    >
                      <div
                        class="flex h-28 w-full items-center justify-center lg:h-40"
                      >
                        <img
                          [src]="logo.src"
                          [alt]="logo.name"
                          class="h-full w-full object-contain object-center lg:scale-125"
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
                ></div>
                <div
                  class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5"
                >
                  @for (logo of baseSponsors; track logo.src) {
                    <article
                      class="sponsor-logo-card flex min-h-28 items-center justify-center rounded-md border border-white/10 bg-white px-2 py-3 lg:min-h-36 lg:px-3"
                    >
                      <div
                        class="flex h-20 w-full items-center justify-center lg:h-28"
                      >
                        <img
                          [src]="logo.src"
                          [alt]="logo.name"
                          class="h-full w-full object-contain object-center lg:scale-[1.35]"
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

  protected readonly sponsorTiers = SPONSOR_TIERS;
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
}

import { LandingSectionNavigation } from "./landing.models";
import { Component, Input, Output, EventEmitter, signal } from "@angular/core";

@Component({
  selector: "lfg-landing-hero",
  standalone: true,
  template: `
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
                  (click)="navigateTo($event, 'top')"
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
                    (click)="navigateTo($event, 'sport')"
                    >Sport</a
                  >
                  <a
                    href="#sponsor"
                    class="hidden text-white/70 transition hover:text-accent sm:inline"
                    (click)="navigateTo($event, 'sponsor')"
                    >Sponsor</a
                  >
                  <a
                    href="#partecipa"
                    class="hidden text-white/70 transition hover:text-accent sm:inline"
                    (click)="navigateTo($event, 'partecipa')"
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
                      mobileMenuOpen.set(false); navigateTo($event, 'sport')
                    "
                    >Sport</a
                  >
                  <a
                    href="#sponsor"
                    class="block px-5 py-3 text-xs font-black uppercase tracking-[0.2em] text-white/70 transition hover:bg-white/5 hover:text-accent"
                    (click)="
                      mobileMenuOpen.set(false); navigateTo($event, 'sponsor')
                    "
                    >Sponsor</a
                  >
                  <a
                    href="#partecipa"
                    class="block px-5 py-3 text-xs font-black uppercase tracking-[0.2em] text-white/70 transition hover:bg-white/5 hover:text-accent"
                    (click)="
                      mobileMenuOpen.set(false);
                      navigateTo($event, 'partecipa')
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
                      (click)="navigateTo($event, 'partecipa')"
                    >
                      Iscriviti
                    </a>
                    <a
                      href="#sport"
                      class="rounded-md border border-white/20 px-5 py-3 text-sm font-black uppercase tracking-[0.14em] text-white transition hover-border-accent hover:text-accent"
                      (click)="navigateTo($event, 'sport')"
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
            </div>
          </section>
  `,
})
export class LandingHeroComponent {
  @Input({ required: true }) countdownItems!: () => { label: string; value: string }[];
  @Input({ required: true }) heroGlowTransform!: () => string;
  @Input({ required: true }) heroContentTransform!: () => string;
  @Output() navigate = new EventEmitter<LandingSectionNavigation>();

  protected readonly mobileMenuOpen = signal(false);

  protected navigateTo(event: MouseEvent, sectionId: LandingSectionNavigation["sectionId"]): void {
    this.navigate.emit({ event, sectionId });
  }
}

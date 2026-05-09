import { Component, OnInit, computed, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { RequestBadgesService } from '../../core/services/request-badges.service';

interface NavItem {
  path: string;
  label: string;
  short: string;
  icon: string;
  badge?: 'tournamentRequests' | 'sponsorRequests';
  adminOnly?: boolean;
}

@Component({
  selector: 'lfg-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="min-h-screen bg-paper text-ink lg:flex">
      <aside class="hidden lg:flex lg:w-72 lg:flex-col lg:border-r lg:border-black/10 lg:bg-white">
        <div class="px-6 py-7">
          <p class="font-display text-2xl uppercase leading-none">La Fossa<br><span class="text-fossa">Games</span></p>
          <p class="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">Event manager</p>
        </div>
        <nav class="flex-1 space-y-1 px-4">
          @for (item of visibleNav(); track item.path) {
            <a [routerLink]="item.path" routerLinkActive="bg-ink text-white" class="flex items-center justify-between gap-3 rounded-lg px-4 py-3 text-sm font-bold uppercase tracking-wide text-neutral-700 transition hover:bg-black/5 hover:text-ink">
              <span>{{ item.label }}</span>
              @if (badgeCount(item) > 0) {
                <span class="grid min-h-6 min-w-6 place-items-center rounded-full bg-fossa px-2 text-[11px] font-black leading-none text-ink ring-1 ring-black/10">
                  {{ badgeCount(item) }}
                </span>
              }
            </a>
          }
        </nav>
        <div class="border-t border-black/10 p-4">
          <p class="truncate text-sm font-semibold">{{ auth.profile()?.full_name || auth.user()?.email }}</p>
          <p class="mb-3 text-xs uppercase tracking-wider text-neutral-500">{{ auth.profile()?.role }}</p>
          <button class="w-full rounded-lg bg-neutral-100 px-4 py-2 text-sm font-bold uppercase tracking-wide" (click)="auth.signOut()">Logout</button>
        </div>
      </aside>

      <section class="min-w-0 flex-1">
        <header class="sticky top-0 z-20 border-b border-black/10 bg-paper/95 px-5 py-4 backdrop-blur lg:hidden">
          <div class="flex items-center justify-between gap-4">
            <div class="flex min-w-0 items-center gap-3">
              <button
                type="button"
                class="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white text-ink ring-1 ring-black/10"
                aria-label="Apri menu"
                [attr.aria-expanded]="mobileMenuOpen()"
                (click)="openMobileMenu()">
                <svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                  <path d="M4 7h16" />
                  <path d="M4 12h16" />
                  <path d="M4 17h16" />
                </svg>
              </button>
              <div class="min-w-0">
                <p class="truncate font-display text-xl uppercase">La Fossa<span class="text-expense">.</span></p>
                <p class="truncate text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-500">Gestionale evento</p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <a routerLink="/app/profile" aria-label="Apri profilo" class="grid h-10 w-10 place-items-center rounded-full bg-white text-ink ring-1 ring-black/10">
                <svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                  <path d="M20 21a8 8 0 0 0-16 0" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </a>
              <button class="rounded-full bg-ink px-4 py-2 text-xs font-bold uppercase tracking-wide text-white" (click)="auth.signOut()">Esci</button>
            </div>
          </div>
        </header>

        @if (mobileMenuOpen()) {
          <div class="fixed inset-0 z-40 bg-black/35 lg:hidden" (click)="closeMobileMenu()"></div>
          <aside class="fixed inset-y-0 left-0 z-50 flex w-72 max-w-[82vw] flex-col border-r border-black/10 bg-white shadow-2xl lg:hidden">
            <div class="flex items-start justify-between gap-4 px-5 py-5">
              <div>
                <p class="font-display text-2xl uppercase leading-none">La Fossa<br><span class="text-fossa">Games</span></p>
                <p class="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">Event manager</p>
              </div>
              <button
                type="button"
                class="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-neutral-100 text-ink"
                aria-label="Chiudi menu"
                (click)="closeMobileMenu()">
                <svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                  <path d="M6 6l12 12" />
                  <path d="M18 6L6 18" />
                </svg>
              </button>
            </div>

            <nav class="flex-1 space-y-1 px-4">
              @for (item of visibleNav(); track item.path) {
                <a
                  [routerLink]="item.path"
                  routerLinkActive="bg-ink text-white"
                  class="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-bold uppercase tracking-wide text-neutral-700 transition hover:bg-black/5 hover:text-ink"
                  (click)="closeMobileMenu()">
                  <span class="grid h-8 w-8 place-items-center rounded-full bg-black/5 text-sm">{{ item.icon }}</span>
                  <span class="min-w-0 flex-1">{{ item.label }}</span>
                  @if (badgeCount(item) > 0) {
                    <span class="grid min-h-6 min-w-6 place-items-center rounded-full bg-fossa px-2 text-[11px] font-black leading-none text-ink ring-1 ring-black/10">
                      {{ badgeCount(item) }}
                    </span>
                  }
                </a>
              }
            </nav>

            <div class="border-t border-black/10 p-4">
              <p class="truncate text-sm font-semibold">{{ auth.profile()?.full_name || auth.user()?.email }}</p>
              <p class="mb-3 text-xs uppercase tracking-wider text-neutral-500">{{ auth.profile()?.role }}</p>
              <button class="w-full rounded-lg bg-neutral-100 px-4 py-2 text-sm font-bold uppercase tracking-wide" (click)="auth.signOut()">Logout</button>
            </div>
          </aside>
        }

        <main class="mx-auto w-full max-w-7xl px-4 pb-8 pt-5 sm:px-6 lg:px-8 lg:py-8">
          <router-outlet />
        </main>
      </section>
    </div>
  `
})
export class ShellComponent implements OnInit {
  readonly mobileMenuOpen = signal(false);

  readonly nav: NavItem[] = [
    { path: '/app/dashboard', label: 'Home', short: 'H', icon: '⌂', adminOnly: true },
    { path: '/app/expenses', label: 'Spese', short: '-', icon: '-', adminOnly: true },
    { path: '/app/incomes', label: 'Entrate', short: '+', icon: '+', adminOnly: true },
    { path: '/app/registrations', label: 'Iscritti', short: 'I', icon: '▦' },
    { path: '/app/participation-requests', label: 'Richieste', short: 'R', icon: '□', badge: 'tournamentRequests', adminOnly: true },
    { path: '/app/sponsors', label: 'Sponsor', short: 'S', icon: '◆', badge: 'sponsorRequests', adminOnly: true },
    { path: '/app/profile', label: 'Profilo', short: 'P', icon: '◉' },
    { path: '/app/users', label: 'Utenti', short: 'U', icon: '⋯', adminOnly: true }
  ];

  readonly visibleNav = computed(() => this.nav.filter((item) => !item.adminOnly || this.auth.isAdmin()));

  constructor(
    readonly auth: AuthService,
    private readonly badges: RequestBadgesService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    void this.refreshBadges();
    this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe(() => {
      void this.refreshBadges();
    });
  }

  openMobileMenu(): void {
    this.mobileMenuOpen.set(true);
    void this.refreshBadges();
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
  }

  badgeCount(item: NavItem): number {
    if (item.badge === 'tournamentRequests') {
      return this.badges.tournamentRequests();
    }
    if (item.badge === 'sponsorRequests') {
      return this.badges.sponsorRequests();
    }
    return 0;
  }

  private async refreshBadges(): Promise<void> {
    if (!this.auth.isAdmin()) {
      this.badges.clear();
      return;
    }

    try {
      await this.badges.refresh();
    } catch {
      this.badges.clear();
    }
  }
}

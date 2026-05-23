import { Component, OnDestroy, OnInit, computed, signal } from "@angular/core";
import { RouterLink, RouterLinkActive, RouterOutlet } from "@angular/router";
import { AuthService } from "../../core/services/auth.service";
import { LoadingService } from "../../core/services/loading.service";
import { RequestBadgesService } from "../../core/services/request-badges.service";
import { ThemeMode, ThemeService } from "../../core/services/theme.service";
import {
  SHELL_BADGE,
  SHELL_NAV_ITEMS,
  THEME_MODE_OPTIONS,
} from "../../core/types/constants";

interface NavItem {
  path: string;
  label: string;
  short: string;
  badge?: (typeof SHELL_BADGE)[keyof typeof SHELL_BADGE];
  adminOnly?: boolean;
  treasuryOnly?: boolean;
  group?: string;
}

@Component({
  selector: "lfg-shell",
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    @if (globalLoading.active()) {
      <div
        class="bg-accent fixed inset-x-0 top-0 z-[100] h-0.5 animate-pulse"
      ></div>
    }
    <div class="min-h-screen bg-app text-primary lg:flex">
      <aside
        class="hidden lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-72 lg:self-start lg:flex-col lg:border-r lg:border-soft lg:bg-surface"
      >
        <div class="px-6 py-7">
          <p class="font-display text-2xl uppercase leading-none">
            La Fossa<br /><span class="text-accent">Games</span>
          </p>
          <p
            class="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted"
          >
            Event manager
          </p>
        </div>
        <nav class="flex-1 overflow-y-auto px-4 py-2">
          @for (item of visibleNav(); track item.path; let i = $index) {
            @if (isNewGroup(i)) {
              <div class="mx-2 my-2 border-t border-soft"></div>
              <p class="mb-1 mt-2 px-2 text-[9px] font-bold uppercase tracking-[0.2em] text-muted">{{ item.group }}</p>
            }
            @if (i === 0) {
              <p class="mb-1 px-2 text-[9px] font-bold uppercase tracking-[0.2em] text-muted">{{ item.group }}</p>
            }
            <a
              [routerLink]="item.path"
              routerLinkActive="bg-accent-5 border-l-[3px] border-accent text-primary"
              class="flex items-center justify-between gap-3 rounded-lg border-l-[3px] border-transparent px-4 py-3 text-sm font-bold uppercase tracking-wide text-muted transition hover:bg-surface-muted hover:text-primary"
            >
              <span>{{ item.label }}</span>
              @if (badgeCount(item) > 0) {
                <span
                  class="bg-accent text-on-accent grid min-h-6 min-w-6 place-items-center rounded-full border border-soft px-2 text-[11px] font-black leading-none"
                >
                  {{ badgeCount(item) }}
                </span>
              }
            </a>
          }
        </nav>
        <div class="border-t border-soft p-5">
          <div class="mb-4 rounded-lg border border-soft bg-surface-muted p-3">
            <p class="eyebrow mb-2">Tema</p>
            <div class="grid grid-cols-3 gap-1">
              @for (mode of themeModes; track mode.id) {
                <button
                  type="button"
                  class="rounded-md border px-2 py-1.5 text-[10px] font-bold uppercase tracking-wide transition"
                  [class.bg-accent]="theme.mode() === mode.id"
                  [class.text-on-accent]="theme.mode() === mode.id"
                  [class.border-accent]="theme.mode() === mode.id"
                  [class.bg-surface]="theme.mode() !== mode.id"
                  [class.text-primary]="theme.mode() !== mode.id"
                  [class.border-soft]="theme.mode() !== mode.id"
                  (click)="setTheme(mode.id)"
                >
                  {{ mode.label }}
                </button>
              }
            </div>
          </div>
          <div class="flex items-center gap-3 py-1">
            <div class="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-accent text-on-accent text-sm font-black">
              {{ (auth.profile()?.full_name || auth.user()?.email || '?').charAt(0).toUpperCase() }}
            </div>
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-semibold leading-tight">
                {{ auth.profile()?.full_name || auth.user()?.email }}
              </p>
              <p class="text-[10px] uppercase tracking-wider text-muted">
                {{ auth.profile()?.roles?.join(', ') }}
              </p>
            </div>
          </div>
          <button
            class="hover-border-accent mt-3 w-full rounded-lg border border-soft bg-surface-muted px-4 py-2 text-sm font-bold uppercase tracking-wide text-primary transition"
            (click)="auth.signOut()"
          >
            Esci
          </button>
        </div>
      </aside>

      <section class="min-w-0 flex-1">
        <header
          class="sticky top-0 z-20 border-b border-soft bg-app px-5 py-4 backdrop-blur lg:hidden"
        >
          <div class="flex items-center justify-between gap-4">
            <div class="flex min-w-0 items-center gap-3">
              <button
                type="button"
                class="relative grid h-10 w-10 shrink-0 place-items-center rounded-full border border-soft bg-surface text-primary"
                aria-label="Apri menu"
                [attr.aria-expanded]="mobileMenuOpen()"
                (click)="openMobileMenu()"
              >
                <svg
                  viewBox="0 0 24 24"
                  class="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  aria-hidden="true"
                >
                  <path d="M4 7h16" />
                  <path d="M4 12h16" />
                  <path d="M4 17h16" />
                </svg>
                @if (totalBadgeCount() > 0) {
                  <span class="bg-accent text-on-accent absolute -right-1 -top-1 grid min-h-5 min-w-5 place-items-center rounded-full px-1 text-[10px] font-black leading-none">
                    {{ totalBadgeCount() }}
                  </span>
                }
              </button>
              <div class="min-w-0">
                <p class="truncate font-display text-xl uppercase">
                  La Fossa <span class="text-accent">Games</span>
                </p>
                <p
                  class="truncate text-[10px] font-bold uppercase tracking-[0.18em] text-muted"
                >
                  Gestionale evento
                </p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <a
                routerLink="/app/profile"
                aria-label="Apri profilo"
                class="grid h-10 w-10 place-items-center rounded-full border border-soft bg-surface text-primary"
              >
                <svg
                  viewBox="0 0 24 24"
                  class="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  aria-hidden="true"
                >
                  <path d="M20 21a8 8 0 0 0-16 0" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </a>
              <button
                class="hover-accent rounded-full border border-soft bg-surface-muted px-4 py-2 text-xs font-bold uppercase tracking-wide text-primary transition"
                (click)="auth.signOut()"
              >
                Esci
              </button>
            </div>
          </div>
        </header>

        @if (mobileMenuOpen()) {
          <div
            class="animate-fade-in fixed inset-0 z-40 bg-black/35 lg:hidden"
            (click)="closeMobileMenu()"
          ></div>
          <aside
            class="animate-slide-in-left fixed inset-y-0 left-0 z-50 flex w-72 max-w-[82vw] flex-col border-r border-soft bg-surface shadow-2xl lg:hidden"
          >
            <div class="flex items-start justify-between gap-4 px-5 py-5">
              <div>
                <p class="font-display text-2xl uppercase leading-none">
                  La Fossa<br /><span class="text-accent">Games</span>
                </p>
                <p
                  class="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted"
                >
                  Event manager
                </p>
              </div>
              <button
                type="button"
                class="hover-border-accent grid h-10 w-10 shrink-0 place-items-center rounded-full border border-soft bg-surface-muted text-primary transition"
                aria-label="Chiudi menu"
                (click)="closeMobileMenu()"
              >
                <svg
                  viewBox="0 0 24 24"
                  class="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  aria-hidden="true"
                >
                  <path d="M6 6l12 12" />
                  <path d="M18 6L6 18" />
                </svg>
              </button>
            </div>

            <nav class="flex-1 overflow-y-auto px-4 py-2">
              @for (item of visibleNav(); track item.path; let i = $index) {
                @if (isNewGroup(i)) {
                  <div class="mx-2 my-2 border-t border-soft"></div>
                  <p class="mb-1 mt-2 px-2 text-[9px] font-bold uppercase tracking-[0.2em] text-muted">{{ item.group }}</p>
                }
                @if (i === 0) {
                  <p class="mb-1 px-2 text-[9px] font-bold uppercase tracking-[0.2em] text-muted">{{ item.group }}</p>
                }
                <a
                  [routerLink]="item.path"
                  routerLinkActive="bg-accent-5 border-l-[3px] border-accent text-primary"
                  class="flex items-center gap-3 rounded-lg border-l-[3px] border-transparent px-4 py-3 text-sm font-bold uppercase tracking-wide text-muted transition hover:bg-surface-muted hover:text-primary"
                  (click)="closeMobileMenu()"
                >
                  <span class="min-w-0 flex-1">{{ item.label }}</span>
                  @if (badgeCount(item) > 0) {
                    <span
                      class="bg-accent text-on-accent grid min-h-6 min-w-6 place-items-center rounded-full border border-soft px-2 text-[11px] font-black leading-none"
                    >
                      {{ badgeCount(item) }}
                    </span>
                  }
                </a>
              }
            </nav>

            <div class="border-t border-soft p-5">
              <div class="mb-4 rounded-lg border border-soft bg-surface-muted p-3">
                <p class="eyebrow mb-2">Tema</p>
                <div class="grid grid-cols-3 gap-1">
                  @for (mode of themeModes; track mode.id) {
                    <button
                      type="button"
                      class="rounded-md border px-2 py-1.5 text-[10px] font-bold uppercase tracking-wide transition"
                      [class.bg-accent]="theme.mode() === mode.id"
                      [class.text-on-accent]="theme.mode() === mode.id"
                      [class.border-accent]="theme.mode() === mode.id"
                      [class.bg-surface]="theme.mode() !== mode.id"
                      [class.text-primary]="theme.mode() !== mode.id"
                      [class.border-soft]="theme.mode() !== mode.id"
                      (click)="setTheme(mode.id)"
                    >
                      {{ mode.label }}
                    </button>
                  }
                </div>
              </div>
              <div class="flex items-center gap-3 py-1">
                <div class="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-accent text-on-accent text-sm font-black">
                  {{ (auth.profile()?.full_name || auth.user()?.email || '?').charAt(0).toUpperCase() }}
                </div>
                <div class="min-w-0 flex-1">
                  <p class="truncate text-sm font-semibold leading-tight">
                    {{ auth.profile()?.full_name || auth.user()?.email }}
                  </p>
                  <p class="text-[10px] uppercase tracking-wider text-muted">
                    {{ auth.profile()?.roles?.join(', ') }}
                  </p>
                </div>
              </div>
              <button
                class="hover-border-accent mt-3 w-full rounded-lg border border-soft bg-surface-muted px-4 py-2 text-sm font-bold uppercase tracking-wide text-primary transition"
                (click)="auth.signOut()"
              >
                Esci
              </button>
            </div>
          </aside>
        }

        <main
          class="mx-auto w-full max-w-7xl px-4 pb-8 pt-5 sm:px-6 lg:px-8 lg:py-8 md:pb-24 lg:pb-8"
        >
          <router-outlet />
        </main>

        <!-- Bottom nav tablet (md: 768–1023px) -->
        <nav
          class="bg-surface border-t border-soft fixed inset-x-0 bottom-0 z-30 hidden md:flex lg:hidden"
          aria-label="Navigazione principale"
        >
          @for (item of bottomNavItems(); track item.path) {
            <a
              [routerLink]="item.path"
              routerLinkActive="text-accent"
              class="relative flex flex-1 flex-col items-center justify-center gap-1 py-2.5 text-muted transition hover:text-primary"
            >
              @if (badgeCount(item) > 0) {
                <span class="bg-accent text-on-accent absolute right-[calc(50%-18px)] top-1.5 grid min-h-4 min-w-4 place-items-center rounded-full px-1 text-[9px] font-black leading-none">
                  {{ badgeCount(item) }}
                </span>
              }
              <svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
                @switch (item.path) {
                  @case ('/app/dashboard') {
                    <path stroke-linecap="round" stroke-linejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
                  }
                  @case ('/app/tornei') {
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/>
                  }
                  @case ('/app/participation-requests') {
                    <path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                  }
                  @case ('/app/sponsors') {
                    <path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
                  }
                  @case ('/app/transactions') {
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  }
                }
              </svg>
              <span class="text-[10px] font-bold uppercase tracking-wide">{{ item.label }}</span>
            </a>
          }
          <!-- Hamburger per voci extra -->
          <button
            type="button"
            class="relative flex flex-1 flex-col items-center justify-center gap-1 py-2.5 text-muted transition hover:text-primary"
            aria-label="Altro"
            (click)="openMobileMenu()"
          >
            @if (totalBadgeCount() > 0) {
              <span class="bg-accent text-on-accent absolute right-[calc(50%-18px)] top-1.5 grid min-h-4 min-w-4 place-items-center rounded-full px-1 text-[9px] font-black leading-none">
                {{ totalBadgeCount() }}
              </span>
            }
            <svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16"/>
            </svg>
            <span class="text-[10px] font-bold uppercase tracking-wide">Altro</span>
          </button>
        </nav>
      </section>
    </div>
  `,
})
export class ShellComponent implements OnInit, OnDestroy {
  readonly mobileMenuOpen = signal(false);
  readonly themeModes = THEME_MODE_OPTIONS;
  readonly nav: readonly NavItem[] = SHELL_NAV_ITEMS;

  readonly visibleNav = computed(() =>
    this.nav.filter((item) => {
      if (item.adminOnly && !this.auth.isAdmin()) return false;
      if (item.treasuryOnly && !this.auth.canAccessTreasury()) return false;
      return true;
    }),
  );

  readonly totalBadgeCount = computed(() =>
    this.badges.tournamentRequests() + this.badges.sponsorRequests(),
  );

  readonly bottomNavItems = computed(() => {
    const bottomPaths = [
      "/app/dashboard",
      "/app/tornei",
      "/app/participation-requests",
      "/app/sponsors",
      "/app/transactions",
    ];
    return this.visibleNav().filter((item) => bottomPaths.includes(item.path));
  });

  isNewGroup(index: number): boolean {
    const items = this.visibleNav();
    if (index === 0) return false;
    return items[index].group !== items[index - 1].group;
  }

  constructor(
    readonly auth: AuthService,
    readonly theme: ThemeService,
    readonly globalLoading: LoadingService,
    private readonly badges: RequestBadgesService,
  ) {}

  ngOnInit(): void {
    void this.badges.startWatching();
  }

  ngOnDestroy(): void {
    void this.badges.stopWatching();
  }

  openMobileMenu(): void {
    this.mobileMenuOpen.set(true);
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
  }

  badgeCount(item: NavItem): number {
    if (item.badge === SHELL_BADGE.TournamentRequests) {
      return this.badges.tournamentRequests();
    }
    if (item.badge === SHELL_BADGE.SponsorRequests) {
      return this.badges.sponsorRequests();
    }
    return 0;
  }

  setTheme(mode: ThemeMode): void {
    this.theme.setMode(mode);
  }

}

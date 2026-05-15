import { Component, OnInit, computed, signal } from "@angular/core";
import {
  NavigationEnd,
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from "@angular/router";
import { filter } from "rxjs";
import { AuthService } from "../../core/services/auth.service";
import { LoadingService } from "../../core/services/loading.service";
import { RequestBadgesService } from "../../core/services/request-badges.service";
import { ThemeMode, ThemeService } from "../../core/services/theme.service";

interface NavItem {
  path: string;
  label: string;
  short: string;
  badge?: "tournamentRequests" | "sponsorRequests";
  adminOnly?: boolean;
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
        <nav class="flex-1 space-y-1 overflow-y-auto px-4">
          @for (item of visibleNav(); track item.path) {
            <a
              [routerLink]="item.path"
              routerLinkActive="bg-accent text-on-accent"
              class="flex items-center justify-between gap-3 rounded-lg px-4 py-3 text-sm font-bold uppercase tracking-wide text-muted transition hover:bg-surface-muted hover:text-primary"
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
        <div class="border-t border-soft p-4">
          <div class="mb-3 rounded-lg border border-soft bg-surface-muted p-2">
            <p
              class="text-[10px] font-bold uppercase tracking-[0.16em] text-muted"
            >
              Tema
            </p>
            <div class="mt-2 grid grid-cols-3 gap-1">
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
          <p class="truncate text-sm font-semibold">
            {{ auth.profile()?.full_name || auth.user()?.email }}
          </p>
          <p class="mb-3 text-xs uppercase tracking-wider text-muted">
            {{ auth.profile()?.role }}
          </p>
          <button
            class="hover-border-accent w-full rounded-lg border border-soft bg-surface-muted px-4 py-2 text-sm font-bold uppercase tracking-wide text-primary transition"
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
                class="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-soft bg-surface text-primary"
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
            class="fixed inset-0 z-40 bg-black/35 lg:hidden"
            (click)="closeMobileMenu()"
          ></div>
          <aside
            class="fixed inset-y-0 left-0 z-50 flex w-72 max-w-[82vw] flex-col border-r border-soft bg-surface shadow-2xl lg:hidden"
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

            <nav class="flex-1 space-y-1 px-4">
              @for (item of visibleNav(); track item.path) {
                <a
                  [routerLink]="item.path"
                  routerLinkActive="bg-accent text-on-accent"
                  class="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-bold uppercase tracking-wide text-muted transition hover:bg-surface-muted hover:text-primary"
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

            <div class="border-t border-soft p-4">
              <div
                class="mb-3 rounded-lg border border-soft bg-surface-muted p-2"
              >
                <p
                  class="text-[10px] font-bold uppercase tracking-[0.16em] text-muted"
                >
                  Tema
                </p>
                <div class="mt-2 grid grid-cols-3 gap-1">
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
              <p class="truncate text-sm font-semibold">
                {{ auth.profile()?.full_name || auth.user()?.email }}
              </p>
              <p class="mb-3 text-xs uppercase tracking-wider text-muted">
                {{ auth.profile()?.role }}
              </p>
              <button
                class="hover-border-accent w-full rounded-lg border border-soft bg-surface-muted px-4 py-2 text-sm font-bold uppercase tracking-wide text-primary transition"
                (click)="auth.signOut()"
              >
                Esci
              </button>
            </div>
          </aside>
        }

        <main
          class="mx-auto w-full max-w-7xl px-4 pb-8 pt-5 sm:px-6 lg:px-8 lg:py-8"
        >
          <router-outlet />
        </main>
      </section>
    </div>
  `,
})
export class ShellComponent implements OnInit {
  readonly mobileMenuOpen = signal(false);
  readonly themeModes: { id: ThemeMode; label: string }[] = [
    { id: "system", label: "Auto" },
    { id: "light", label: "Chiaro" },
    { id: "dark", label: "Scuro" },
  ];

  readonly nav: NavItem[] = [
    {
      path: "/app/dashboard",
      label: "Home",
      short: "H",
    },
    {
      path: "/app/expenses",
      label: "Spese",
      short: "-",
    },
    {
      path: "/app/incomes",
      label: "Entrate",
      short: "+",
      adminOnly: true,
    },
    { path: "/app/registrations", label: "Iscritti", short: "I" },
    {
      path: "/app/participation-requests",
      label: "Richieste",
      short: "R",
      badge: "tournamentRequests",
    },
    {
      path: "/app/sponsors",
      label: "Sponsor",
      short: "S",
      badge: "sponsorRequests",
    },
    { path: "/app/profile", label: "Profilo", short: "P" },
    {
      path: "/app/users",
      label: "Utenti",
      short: "U",
      adminOnly: true,
    },
    {
      path: "/app/audit",
      label: "Audit",
      short: "A",
      adminOnly: true,
    },
  ];

  readonly visibleNav = computed(() =>
    this.nav.filter((item) => !item.adminOnly || this.auth.isAdmin()),
  );

  constructor(
    readonly auth: AuthService,
    readonly theme: ThemeService,
    readonly globalLoading: LoadingService,
    private readonly badges: RequestBadgesService,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    void this.refreshBadges();
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
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
    if (item.badge === "tournamentRequests") {
      return this.badges.tournamentRequests();
    }
    if (item.badge === "sponsorRequests") {
      return this.badges.sponsorRequests();
    }
    return 0;
  }

  setTheme(mode: ThemeMode): void {
    this.theme.setMode(mode);
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

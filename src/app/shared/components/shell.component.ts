import { Component, computed } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

interface NavItem {
  path: string;
  label: string;
  short: string;
  icon: string;
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
            <a [routerLink]="item.path" routerLinkActive="bg-ink text-white" class="block rounded-lg px-4 py-3 text-sm font-bold uppercase tracking-wide text-neutral-700 transition hover:bg-black/5">
              {{ item.label }}
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
            <div>
              <p class="font-display text-xl uppercase">La Fossa<span class="text-expense">.</span></p>
              <p class="text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-500">Gestionale evento</p>
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

        <main class="mx-auto w-full max-w-7xl px-4 pb-28 pt-5 sm:px-6 lg:px-8 lg:py-8">
          <router-outlet />
        </main>

        <nav class="fixed bottom-0 left-0 right-0 z-30 border-t border-black/10 bg-paper lg:hidden">
          <div class="grid" [class.grid-cols-7]="auth.isAdmin()" [class.grid-cols-6]="!auth.isAdmin()">
            @for (item of visibleNav(); track item.path) {
              <a [routerLink]="item.path" routerLinkActive="text-ink" class="flex flex-col items-center gap-1 px-1 py-3 text-center text-neutral-400">
                <span class="text-base font-black">{{ item.icon }}</span>
                <span class="text-[9px] font-bold uppercase tracking-wide">{{ item.label }}</span>
              </a>
            }
          </div>
        </nav>
      </section>
    </div>
  `
})
export class ShellComponent {
  readonly nav: NavItem[] = [
    { path: '/app/dashboard', label: 'Home', short: 'H', icon: '⌂' },
    { path: '/app/expenses', label: 'Spese', short: '-', icon: '-' },
    { path: '/app/incomes', label: 'Entrate', short: '+', icon: '+' },
    { path: '/app/registrations', label: 'Iscritti', short: 'I', icon: '▦' },
    { path: '/app/sponsors', label: 'Sponsor', short: 'S', icon: '◆' },
    { path: '/app/profile', label: 'Profilo', short: 'P', icon: '◉' },
    { path: '/app/users', label: 'Utenti', short: 'U', icon: '⋯', adminOnly: true }
  ];

  readonly visibleNav = computed(() => this.nav.filter((item) => !item.adminOnly || this.auth.isAdmin()));

  constructor(readonly auth: AuthService) {}
}

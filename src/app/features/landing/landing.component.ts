import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  standalone: true,
  imports: [RouterLink],
  template: `
    <main class="min-h-screen bg-paper text-ink">
      <section class="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-5 py-6">
        <nav class="flex items-center justify-between">
          <p class="font-display text-xl uppercase">La Fossa <span class="text-fossa">Games</span></p>
          <a routerLink="/login" class="rounded-full bg-ink px-4 py-2 text-sm font-bold uppercase tracking-wide text-white">Login staff</a>
        </nav>

        <div class="grid flex-1 items-center gap-8 py-12 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <p class="mb-4 inline-flex rounded-full bg-fossa px-3 py-1 text-xs font-black uppercase tracking-[0.18em]">Gestionale evento sportivo</p>
            <h1 class="max-w-3xl font-display text-5xl uppercase leading-[0.92] sm:text-7xl lg:text-8xl">
              La Fossa Games
            </h1>
            <p class="mt-6 max-w-2xl text-lg leading-8 text-neutral-700">
              Area pubblica dell'evento. L'accesso ai dati organizzativi, contabili e di staff e' riservato agli utenti autorizzati.
            </p>
            <div class="mt-8 flex flex-wrap gap-3">
              <a routerLink="/login" class="rounded-lg bg-ink px-5 py-3 text-sm font-bold uppercase tracking-wide text-white">Accedi al gestionale</a>
              <a href="mailto:info@lafossagames.it" class="rounded-lg border border-black/15 bg-white px-5 py-3 text-sm font-bold uppercase tracking-wide">Contatti evento</a>
            </div>
          </div>

          <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <article class="rounded-lg bg-ink p-6 text-white">
              <p class="text-xs font-bold uppercase tracking-[0.2em] text-white/50">Organizzazione</p>
              <p class="mt-4 text-3xl font-black">Budget, sponsor e iscrizioni in un unico flusso.</p>
            </article>
            <article class="rounded-lg border border-black/10 bg-white p-6">
              <p class="text-xs font-bold uppercase tracking-[0.2em] text-neutral-500">Accesso protetto</p>
              <p class="mt-4 text-2xl font-black">Supabase Auth, ruoli staff/admin e policy RLS.</p>
            </article>
          </div>
        </div>
      </section>
    </main>
  `
})
export class LandingComponent {}

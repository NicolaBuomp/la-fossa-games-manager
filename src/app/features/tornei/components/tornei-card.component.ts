import { Component, EventEmitter, Input, Output } from "@angular/core";
import { OperationalTournament, TournamentPublicStatus, TournamentStatus } from "../../../core/types/models";
import { TOURNAMENT_MATCH_STATUS, TOURNAMENT_PUBLIC_STATUSES, TOURNAMENT_STATUSES } from "../../../core/types/constants";

@Component({
  selector: "lfg-tornei-card",
  standalone: true,
  template: `
    <article
      class="group flex flex-col rounded-xl border border-soft bg-surface p-4 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-accent hover:shadow-lg cursor-pointer"
      [style.--index]="index"
      style="animation: cardIn 0.4s ease both; animation-delay: calc(var(--index, 0) * 60ms);"
      (click)="open.emit(tournament.id)"
    >
      <!-- Sport badge -->
      <div class="mb-3 flex items-center justify-between gap-2">
        <span
          class="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-black uppercase tracking-wider"
          [style]="sportStyle(tournament.sport)"
        >
          <svg viewBox="0 0 24 24" class="h-3 w-3" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
            @switch (tournament.sport) {
              @case ('calcio') { <circle cx="12" cy="12" r="10"/><path d="M12 2a10 10 0 00-6.88 2.77M12 2a10 10 0 016.88 2.77M2.05 13a10 10 0 003.92 6.12M21.95 13a10 10 0 01-3.92 6.12M9 21.54A10 10 0 0012 22a10 10 0 003-.46M7 8l5 3 5-3M12 11v6"/> }
              @case ('pallavolo') { <circle cx="12" cy="12" r="10"/><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/><path d="M12 2c2.76 4 4 8 4 10s-1.24 6-4 10M12 2C9.24 6 8 10 8 12s1.24 6 4 10"/> }
              @default { <path stroke-linecap="round" stroke-linejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/> }
            }
          </svg>
          {{ sportLabel(tournament.sport) }}
        </span>
        <span class="text-[11px] font-semibold text-muted tabular-nums">
          {{ tournament.tournament_teams.length }} squadre
        </span>
      </div>

      <!-- Nome torneo -->
      <h2 class="font-display text-lg uppercase leading-snug group-hover:text-primary">
        {{ tournament.name }}
      </h2>

      <!-- Status badges -->
      <div class="mt-2 flex flex-wrap gap-1.5">
        <span
          class="inline-block rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
          [class]="statusClass(tournament.status)"
        >{{ statusLabel(tournament.status) }}</span>
        @if (tournament.public_status !== 'hidden') {
          <span
            class="inline-block rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
            [class]="publicStatusClass(tournament.public_status)"
          >{{ publicStatusLabel(tournament.public_status) }}</span>
        }
      </div>

      <!-- Stats row -->
      <div class="mt-3 flex items-center gap-3 text-xs font-semibold text-muted tabular-nums">
        <span>{{ paidCount() }} / {{ tournament.tournament_teams.length }} pagate</span>
        @if (openMatches() > 0) {
          <span class="text-warning">· {{ openMatches() }} partite aperte</span>
        }
      </div>

      <!-- CTA -->
      <div class="mt-4 flex items-center justify-end">
        <span class="text-xs font-black uppercase tracking-wide text-muted transition-colors group-hover:text-accent">
          Apri →
        </span>
      </div>
    </article>
  `,
  styles: [`
    @keyframes cardIn {
      from { opacity: 0; transform: translateY(8px); }
      to   { opacity: 1; transform: translateY(0); }
    }
  `],
})
export class TorneiCardComponent {
  @Input({ required: true }) tournament!: OperationalTournament;
  @Input() index = 0;
  @Output() open = new EventEmitter<string>();

  paidCount(): number {
    return this.tournament.tournament_teams.filter((t) => t.paid).length;
  }

  openMatches(): number {
    return this.tournament.tournament_matches.filter(
      (m) => m.status !== TOURNAMENT_MATCH_STATUS.Completed && m.status !== TOURNAMENT_MATCH_STATUS.Cancelled,
    ).length;
  }

  sportLabel(sport: string): string {
    const map: Record<string, string> = { calcio: "Calcio a 5", pallavolo: "Pallavolo", altro: "Altro" };
    return map[sport] ?? sport;
  }

  sportEmoji(sport: string): string {
    const map: Record<string, string> = { calcio: "⚽", pallavolo: "🏐", altro: "🎮" };
    return map[sport] ?? "🏆";
  }

  sportStyle(sport: string): string {
    const styles: Record<string, string> = {
      calcio: "background:#dcfce7;color:#14532d;border-color:#86efac;",
      pallavolo: "background:#dbeafe;color:#1e3a8a;border-color:#93c5fd;",
      altro: "background:#f3e8ff;color:#581c87;border-color:#d8b4fe;",
    };
    return styles[sport] ?? styles["altro"];
  }

  statusLabel(status: TournamentStatus): string {
    return TOURNAMENT_STATUSES.find((s) => s.id === status)?.label ?? status;
  }

  statusClass(status: TournamentStatus): string {
    return TOURNAMENT_STATUSES.find((s) => s.id === status)?.className ?? "state-neutral";
  }

  publicStatusLabel(status: TournamentPublicStatus): string {
    return TOURNAMENT_PUBLIC_STATUSES.find((s) => s.id === status)?.label ?? status;
  }

  publicStatusClass(status: TournamentPublicStatus): string {
    return TOURNAMENT_PUBLIC_STATUSES.find((s) => s.id === status)?.className ?? "state-neutral";
  }
}

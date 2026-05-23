import { Component, EventEmitter, Input, Output } from "@angular/core";
import { OperationalTournament, TournamentPublicStatus, TournamentStatus } from "../../../core/types/models";
import { TOURNAMENT_MATCH_STATUS, TOURNAMENT_PUBLIC_STATUSES, TOURNAMENT_STATUSES } from "../../../core/types/constants";

@Component({
  selector: "lfg-tornei-card",
  standalone: true,
  template: `
    <article
      class="group flex flex-col rounded-xl border border-soft bg-surface p-4 shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:border-accent hover:shadow-md cursor-pointer"
      [style.--index]="index"
      style="animation: cardIn 0.4s ease both; animation-delay: calc(var(--index, 0) * 60ms);"
      (click)="open.emit(tournament.id)"
    >
      <!-- Sport badge -->
      <div class="mb-3 flex items-center justify-between gap-2">
        <span
          class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-black uppercase tracking-wider"
          [style]="sportStyle(tournament.sport)"
        >
          {{ sportEmoji(tournament.sport) }} {{ sportLabel(tournament.sport) }}
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
      calcio: "background:#dcfce7;color:#14532d;",
      pallavolo: "background:#dbeafe;color:#1e3a8a;",
      altro: "background:#f3e8ff;color:#581c87;",
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

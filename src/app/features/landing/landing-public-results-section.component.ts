import { PublicTournamentMatch } from "../../core/services/tournaments.service";
import {
  TOURNAMENT_MATCH_STATUS,
  TOURNAMENT_MATCH_STATUSES,
} from "../../core/types/constants";
import { PublicMatchGroup } from "./landing.models";
import { Component, Input } from "@angular/core";

@Component({
  selector: "lfg-landing-public-results-section",
  standalone: true,
  template: `
          @if (publicMatches().length || loadingPublicMatches()) {
            <section
              id="risultati"
              class="scroll-mt-6 bg-[#07120e] px-5 py-16 text-white sm:px-8 lg:px-10"
            >
              <div class="mx-auto max-w-7xl reveal-up">
                <div
                  class="flex flex-col justify-between gap-5 lg:flex-row lg:items-end"
                >
                  <div>
                    <p
                      class="text-xs font-black uppercase tracking-[0.28em] text-accent"
                    >
                      Risultati live
                    </p>
                    <h2
                      class="mt-3 max-w-4xl font-display text-4xl uppercase leading-none text-accent sm:text-6xl"
                    >
                      Partite e punteggi in tempo reale.
                    </h2>
                  </div>
                  <div
                    class="rounded-md border border-white/10 bg-white/[0.04] px-4 py-3"
                  >
                    <p
                      class="text-xs font-black uppercase tracking-[0.18em] text-white/45"
                    >
                      Aggiornamento
                    </p>
                    <p class="mt-1 text-sm font-black text-white">
                      {{ publicResultsUpdatedAt() || "Connessione attiva" }}
                    </p>
                  </div>
                </div>
    
                @if (livePublicMatches().length) {
                  <div
                    class="mt-8 rounded-lg border border-accent-35 bg-accent px-4 py-3 text-on-accent"
                  >
                    <p class="text-sm font-black uppercase tracking-[0.14em]">
                      {{ livePublicMatches().length }} partite live ora
                    </p>
                  </div>
                }
    
                @if (resultsError()) {
                  <p
                    class="mt-5 rounded-lg border border-red-400/30 bg-red-500/10 p-3 text-sm font-semibold text-red-100"
                  >
                    {{ resultsError() }}
                  </p>
                }
    
                <div class="mt-8 grid gap-5">
                  @for (group of publicMatchGroups(); track group.tournamentName) {
                    <section
                      class="rounded-lg border border-white/10 bg-black/35 p-4"
                    >
                      <h3 class="font-display text-2xl uppercase text-accent">
                        {{ group.tournamentName }}
                      </h3>
                      <div class="mt-4 grid gap-3 lg:grid-cols-2">
                        @for (match of group.matches; track match.id) {
                          <article
                            class="rounded-lg border border-white/10 bg-white/[0.04] p-4"
                            [class.border-accent]="match.status === matchStatus.Live"
                          >
                            <div
                              class="flex flex-wrap items-center justify-between gap-2"
                            >
                              <div>
                                <p
                                  class="text-xs font-black uppercase tracking-[0.16em] text-white/42"
                                >
                                  {{
                                    match.group_name ||
                                      match.round_label ||
                                      "Partita"
                                  }}
                                </p>
                                <p class="mt-1 text-xs font-semibold text-white/52">
                                  {{ timeLabel(match) }}
                                </p>
                              </div>
                              <span
                                class="rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wide"
                                [class]="badgeClass(match.status)"
                              >
                                {{ statusLabel(match.status) }}
                              </span>
                            </div>
    
                            <div class="mt-4 grid gap-2">
                              <div
                                class="grid grid-cols-[1fr_auto] items-center gap-3 rounded-md bg-black/35 px-3 py-2"
                              >
                                <p class="truncate text-base font-black">
                                  {{ match.home_team_name }}
                                </p>
                                <p class="text-3xl font-black text-accent">
                                  {{ match.home_score }}
                                </p>
                              </div>
                              <div
                                class="grid grid-cols-[1fr_auto] items-center gap-3 rounded-md bg-black/35 px-3 py-2"
                              >
                                <p class="truncate text-base font-black">
                                  {{ match.away_team_name }}
                                </p>
                                <p class="text-3xl font-black text-accent">
                                  {{ match.away_score }}
                                </p>
                              </div>
                            </div>
    
                            @if (match.field_label) {
                              <p
                                class="mt-3 text-xs font-bold uppercase tracking-[0.14em] text-white/45"
                              >
                                Campo: {{ match.field_label }}
                              </p>
                            }
                          </article>
                        }
                      </div>
                    </section>
                  }
                </div>
              </div>
            </section>
          }
  `,
})
export class LandingPublicResultsSectionComponent {
  @Input({ required: true }) publicMatches!: () => PublicTournamentMatch[];
  @Input({ required: true }) loadingPublicMatches!: () => boolean;
  @Input({ required: true }) publicMatchGroups!: () => PublicMatchGroup[];
  @Input({ required: true }) livePublicMatches!: () => PublicTournamentMatch[];
  @Input({ required: true }) publicResultsUpdatedAt!: () => string | null;
  @Input({ required: true }) resultsError!: () => string;

  protected statusLabel(status: PublicTournamentMatch["status"]): string {
    if (status === TOURNAMENT_MATCH_STATUS.Completed) return "Finale";
    return TOURNAMENT_MATCH_STATUSES.find((item) => item.id === status)?.label ?? status;
  }

  protected badgeClass(status: PublicTournamentMatch["status"]): string {
    if (status === TOURNAMENT_MATCH_STATUS.Live) return "border-accent bg-accent text-on-accent";
    if (status === TOURNAMENT_MATCH_STATUS.Completed) return "border-emerald-400/35 bg-emerald-400/10 text-emerald-100";
    if (status === TOURNAMENT_MATCH_STATUS.Cancelled) return "border-red-400/35 bg-red-400/10 text-red-100";
    return "border-white/15 text-white/70";
  }

  protected timeLabel(match: PublicTournamentMatch): string {
    if (match.starts_at) {
      return new Intl.DateTimeFormat("it-IT", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }).format(new Date(match.starts_at));
    }
    return match.field_label ? `Campo ${match.field_label}` : "Orario da definire";
  }

  protected readonly matchStatus = TOURNAMENT_MATCH_STATUS;
}

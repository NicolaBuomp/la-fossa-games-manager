import { Component, Input } from "@angular/core";
import { OperationalTournament, TournamentStanding } from "../../../core/types/models";
import { EmptyStateComponent } from "../../../shared/components/ui.component";

@Component({
  selector: "lfg-tornei-tab-classifiche",
  standalone: true,
  imports: [EmptyStateComponent],
  template: `
    <div class="animate-fade-in">
      @if (!tournament().tournament_standings.length) {
        <lfg-empty-state
          title="Classifiche non disponibili"
          text="Le classifiche vengono create dopo la generazione dei gironi."
          icon="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
        />
      } @else {
        <div class="grid gap-4 lg:grid-cols-2">
          @for (group of tournament().tournament_groups; track group.id) {
            <article class="overflow-hidden rounded-xl border border-soft bg-surface shadow-sm">
              <header class="border-b border-soft px-4 py-3">
                <h3 class="font-display text-xl uppercase">{{ group.name }}</h3>
              </header>
              <!-- Desktop table -->
              <div class="hidden overflow-x-auto sm:block">
                <table class="w-full min-w-[34rem] text-sm">
                  <thead class="bg-surface-muted text-left text-[10px] uppercase tracking-wide text-muted">
                    <tr>
                      <th class="px-3 py-2">#</th>
                      <th class="px-3 py-2">Squadra</th>
                      <th class="px-3 py-2 text-right">Pt</th>
                      <th class="px-3 py-2 text-right">G</th>
                      <th class="px-3 py-2 text-right">V</th>
                      <th class="px-3 py-2 text-right">N</th>
                      <th class="px-3 py-2 text-right">P</th>
                      <th class="px-3 py-2 text-right">DR</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (standing of standingsFor(group.id); track standing.id) {
                      <tr class="border-t border-soft">
                        <td class="px-3 py-2 font-black">{{ standing.rank }}</td>
                        <td class="px-3 py-2 font-bold">{{ standing.tournament_teams?.name || "Squadra" }}</td>
                        <td class="px-3 py-2 text-right font-black">{{ standing.points }}</td>
                        <td class="px-3 py-2 text-right">{{ standing.played }}</td>
                        <td class="px-3 py-2 text-right">{{ standing.wins }}</td>
                        <td class="px-3 py-2 text-right">{{ standing.draws }}</td>
                        <td class="px-3 py-2 text-right">{{ standing.losses }}</td>
                        <td class="px-3 py-2 text-right">{{ standing.goal_diff }}</td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
              <!-- Mobile cards -->
              <div class="grid gap-2 p-3 sm:hidden">
                @for (standing of standingsFor(group.id); track standing.id) {
                  <div class="rounded-lg bg-surface-muted p-3">
                    <div class="flex items-start justify-between gap-3">
                      <div class="min-w-0">
                        <p class="truncate text-sm font-black">
                          {{ standing.rank }}. {{ standing.tournament_teams?.name || "Squadra" }}
                        </p>
                        <p class="mt-1 text-xs font-semibold text-muted">
                          {{ standing.played }} giocate · DR {{ standing.goal_diff }}
                        </p>
                      </div>
                      <div class="text-right">
                        <p class="text-xl font-black">{{ standing.points }}</p>
                        <p class="text-[10px] font-bold uppercase text-muted">Pt</p>
                      </div>
                    </div>
                    <div class="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                      <div class="rounded-md bg-surface px-2 py-1.5">
                        <p class="font-black">{{ standing.wins }}</p>
                        <p class="text-[10px] uppercase text-muted">V</p>
                      </div>
                      <div class="rounded-md bg-surface px-2 py-1.5">
                        <p class="font-black">{{ standing.draws }}</p>
                        <p class="text-[10px] uppercase text-muted">N</p>
                      </div>
                      <div class="rounded-md bg-surface px-2 py-1.5">
                        <p class="font-black">{{ standing.losses }}</p>
                        <p class="text-[10px] uppercase text-muted">P</p>
                      </div>
                    </div>
                  </div>
                }
              </div>
            </article>
          }
        </div>
      }
    </div>
  `,
})
export class TorneiTabClassificheComponent {
  @Input({ required: true }) tournament!: () => OperationalTournament;

  standingsFor(groupId: string): TournamentStanding[] {
    return this.tournament().tournament_standings.filter((s) => s.group_id === groupId);
  }
}

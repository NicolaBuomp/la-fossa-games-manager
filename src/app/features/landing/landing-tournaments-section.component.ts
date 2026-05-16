import { PublicTournament } from "../../core/types/models";
import { ModalComponent } from "../../shared/components/ui.component";
import { LandingGame } from "./landing.models";
import { Component, Input, Output, EventEmitter } from "@angular/core";

@Component({
  selector: "lfg-landing-tournaments-section",
  standalone: true,
  imports: [ModalComponent],
  template: `
          <section
            id="sport"
            class="scroll-mt-6 bg-surface px-5 py-16 text-primary sm:px-8 lg:px-10"
          >
            <div class="mx-auto max-w-7xl reveal-up">
              <div
                class="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"
              >
                <div>
                  <p
                    class="text-xs font-black uppercase tracking-[0.28em] text-muted"
                  >
                    I tornei
                  </p>
                  <h2
                    class="mt-3 max-w-3xl font-display text-4xl uppercase leading-none sm:text-6xl"
                  >
                    Sette tornei, per tutte le età.
                  </h2>
                </div>
              </div>
    
              <div
                class="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4 xl:grid-cols-7"
              >
                @for (game of games; track game.name) {
                  <button
                    type="button"
                    class="card-lift group flex min-h-[17.5rem] w-full touch-manipulation flex-col overflow-hidden rounded-lg border border-soft bg-surface text-left shadow-sm transition hover-border-accent hover:shadow-[0_18px_44px_rgba(10,10,10,0.12)] focus:outline-none focus:ring-4 focus-ring-accent-45 sm:min-h-[19rem]"
                    [attr.aria-label]="'Apri dettagli ' + game.name"
                    (click)="openGame.emit(game)"
                  >
                    <div
                      class="flex aspect-square w-full items-center justify-center border-b border-soft bg-strong p-2 sm:p-3"
                    >
                      <img
                        [src]="game.image"
                        [alt]="game.name"
                        class="card-media h-full w-full object-contain drop-shadow-[0_10px_22px_rgba(255,212,0,0.18)]"
                      />
                    </div>
                    <div class="flex flex-1 flex-col p-3 sm:p-4">
                      <p
                        class="text-[0.62rem] font-black uppercase tracking-[0.18em] text-muted"
                      >
                        Torneo
                      </p>
                      <h3
                        class="mt-2 text-lg font-black uppercase leading-[0.95] text-primary sm:text-xl"
                      >
                        {{ game.name }}
                      </h3>
                      <p
                        class="mt-2 line-clamp-3 text-sm font-semibold leading-6 text-muted"
                      >
                        {{ game.description }}
                      </p>
                      <span
                        class="mt-auto inline-flex items-center gap-2 pt-4 text-xs font-black uppercase tracking-[0.16em] text-primary transition group-hover:text-on-accent"
                      >
                        Dettagli
                        <span
                          aria-hidden="true"
                          class="h-1.5 w-1.5 rounded-full bg-accent transition group-hover:ring-4 group-hover-ring-accent-25"
                        ></span>
                      </span>
                    </div>
                  </button>
                }
              </div>
    
              @if (selectedGame(); as game) {
                <lfg-modal
                  [open]="true"
                  [title]="game.name"
                  (close)="closeGame.emit()"
                >
                  <div class="text-primary">
                    <div
                      class="rounded-lg border border-accent-30 bg-surface-muted p-4 sm:p-5"
                    >
                      <div class="flex items-start gap-4 sm:items-center">
                        <div
                          class="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-accent-25 bg-strong p-2 shadow-[0_14px_30px_rgba(10,10,10,0.24)] ring-1 ring-white/10 sm:h-24 sm:w-24 sm:p-2.5"
                        >
                          <img
                            [src]="game.image"
                            [alt]="game.name"
                            class="h-full w-full scale-[1.55] object-cover drop-shadow-[0_0_16px_rgba(255,212,0,0.35)]"
                          />
                        </div>
                        <div>
                          <p
                            class="text-[0.68rem] font-black uppercase tracking-[0.18em] text-muted"
                          >
                            Torneo ufficiale
                          </p>
                          <p
                            class="mt-1 text-lg font-black uppercase leading-tight sm:text-xl"
                          >
                            {{ game.name }}
                          </p>
                          <p
                            class="mt-2 text-sm font-semibold leading-6 text-muted"
                          >
                            {{ game.details }}
                          </p>
                        </div>
                      </div>
                    </div>
    
                    <div class="mt-4 grid gap-2 sm:grid-cols-3">
                      <div
                        class="rounded-xl border border-soft bg-surface-muted px-3 py-2.5"
                      >
                        <p
                          class="text-[0.62rem] font-black uppercase tracking-[0.18em] text-muted"
                        >
                          Formula
                        </p>
                        <p class="mt-1 text-sm font-black leading-5">
                          {{ game.format }}
                        </p>
                      </div>
                      <div
                        class="rounded-xl border border-soft bg-surface-muted px-3 py-2.5"
                      >
                        <p
                          class="text-[0.62rem] font-black uppercase tracking-[0.18em] text-muted"
                        >
                          Per chi
                        </p>
                        <p class="mt-1 text-sm font-black leading-5">
                          {{ game.audience }}
                        </p>
                      </div>
                      @if (tournamentForGame(game); as tournament) {
                        <div
                          class="rounded-xl border border-soft bg-surface-muted px-3 py-2.5"
                        >
                          <p
                            class="text-[0.62rem] font-black uppercase tracking-[0.18em] text-muted"
                          >
                            Quota
                          </p>
                          <p class="mt-1 text-sm font-black leading-5">
                            {{
                              tournament.fee ? eur(tournament.fee) : "Da confermare"
                            }}
                          </p>
                        </div>
                      } @else {
                        <div
                          class="rounded-xl border border-soft bg-surface-muted px-3 py-2.5"
                        >
                          <p
                            class="text-[0.62rem] font-black uppercase tracking-[0.18em] text-muted"
                          >
                            Iscrizioni
                          </p>
                          <p class="mt-1 text-sm font-black leading-5">Aperte</p>
                        </div>
                      }
                    </div>
    
                    <div
                      class="mt-5 rounded-xl border border-soft bg-surface-muted p-4"
                    >
                      <p
                        class="text-[0.68rem] font-black uppercase tracking-[0.18em] text-muted"
                      >
                        Cosa aspettarti
                      </p>
                      <ul class="mt-3 grid gap-2">
                        @for (highlight of game.highlights; track highlight) {
                          <li
                            class="grid grid-cols-[auto_1fr] items-start gap-2 text-sm font-semibold leading-6 text-primary"
                          >
                            <span
                              class="mt-2 h-1.5 w-1.5 rounded-full bg-accent ring-2 ring-accent-30"
                            ></span>
                            <span>{{ highlight }}</span>
                          </li>
                        }
                      </ul>
                    </div>
    
                    <div class="mt-4">
                      <p
                        class="text-sm font-semibold leading-6 text-muted sm:text-base sm:leading-7"
                      >
                        {{ game.description }}
                      </p>
                      <div
                        class="mt-4 rounded-md border border-soft bg-surface-muted p-3.5 sm:mt-5 sm:p-4"
                      >
                        <p
                          class="text-[0.68rem] font-black uppercase tracking-[0.18em] text-muted"
                        >
                          Regolamento
                        </p>
                        @if (game.rules?.length) {
                          <ul class="mt-3 grid gap-2">
                            @for (rule of game.rules; track rule) {
                              <li
                                class="grid grid-cols-[auto_1fr] items-start gap-2 text-sm font-semibold leading-6 text-primary"
                              >
                                <span
                                  class="mt-2 h-1.5 w-1.5 rounded-full bg-accent ring-2 ring-accent-30"
                                ></span>
                                <span>{{ rule }}</span>
                              </li>
                            }
                          </ul>
                        } @else {
                          <p class="mt-2 text-sm font-black leading-6 text-primary">
                            Il regolamento ufficiale sarà disponibile a breve.
                          </p>
                        }
                      </div>
                      <button
                        type="button"
                        class="mt-5 w-full rounded-md bg-accent px-5 py-3 text-sm font-black uppercase tracking-[0.12em] text-on-accent transition hover:bg-strong hover:text-accent sm:w-auto"
                        (click)="requestGameInfo.emit(game)"
                      >
                        Chiedi informazioni
                      </button>
                    </div>
                  </div>
                </lfg-modal>
              }
            </div>
          </section>
  `,
})
export class LandingTournamentsSectionComponent {
  @Input({ required: true }) games!: LandingGame[];
  @Input({ required: true }) selectedGame!: () => LandingGame | null;
  @Input({ required: true }) tournaments!: () => PublicTournament[];
  @Output() openGame = new EventEmitter<LandingGame>();
  @Output() closeGame = new EventEmitter<void>();
  @Output() requestGameInfo = new EventEmitter<LandingGame>();

  protected eur(value: number): string {
    return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(value);
  }

  protected tournamentForGame(game: LandingGame): PublicTournament | null {
    return this.tournaments().find((tournament) => this.isTournamentForGame(tournament, game)) ?? null;
  }

  private sameTournamentName(tournamentName: string, gameName: string): boolean {
    const normalize = (value: string) => value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");
    return normalize(tournamentName).includes(normalize(gameName));
  }

  private isTournamentForGame(tournament: PublicTournament, game: LandingGame): boolean {
    return this.sameTournamentName(tournament.name, game.name) || (game.name === "Green Volley" && tournament.sport === "pallavolo");
  }
}

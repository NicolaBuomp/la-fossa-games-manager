import { PublicTournament } from "../../core/types/models";
import { ParticipationFormTabsComponent } from "../../shared/components/participation-form-tabs.component";
import { LandingParticipationForm } from "./landing.models";
import { Component, Input, Output, EventEmitter } from "@angular/core";

@Component({
  selector: "lfg-landing-contact-section",
  standalone: true,
  imports: [ParticipationFormTabsComponent],
  template: `
          <section
            id="partecipa"
            class="scroll-mt-6 bg-[#07120e] px-5 py-16 text-white sm:px-8 lg:px-10"
          >
            <div
              class="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.85fr_1fr] lg:items-start reveal-up"
            >
              <div>
                <p
                  class="text-xs font-black uppercase tracking-[0.28em] text-accent"
                >
                  Iscrizioni e sponsor
                </p>
                <h2
                  class="mt-3 max-w-4xl font-display text-4xl uppercase leading-none text-accent sm:text-6xl"
                >
                  Partecipa o diventa sponsor.
                </h2>
                <p
                  class="mt-6 max-w-2xl text-lg font-semibold leading-8 text-white/72"
                >
                  Scegli se vuoi partecipare a un torneo o ricevere informazioni
                  sulle sponsorizzazioni, lascia un numero WhatsApp e ti
                  ricontatteremo con dettagli e prossimi passi.
                </p>
                <img
                  src="/assets/brand/logo-social.png"
                  alt="Logo social La Fossa Games 2026"
                  class="mx-auto h-40 w-40 rounded-full object-cover sm:h-48 sm:w-48"
                />
                <div class="mt-8 space-y-4">
                  <div
                    class="grid gap-2 border-t border-white/10 pt-4 sm:grid-cols-[auto_1fr] sm:items-start sm:gap-4"
                  >
                    <span
                      class="text-sm font-bold uppercase tracking-[0.16em] text-white/48"
                      >Luogo</span
                    >
                    <span class="font-black sm:text-right">{{ eventAddress }}</span>
                  </div>
                  <div
                    class="grid gap-2 border-t border-white/10 pt-4 sm:grid-cols-[auto_1fr] sm:items-start sm:gap-4"
                  >
                    <span
                      class="text-sm font-bold uppercase tracking-[0.16em] text-white/48"
                      >Date</span
                    >
                    <span class="font-black sm:text-right">{{
                      eventDateRange
                    }}</span>
                  </div>
                </div>
              </div>
    
              <lfg-participation-form-tabs
                [form]="participationForm"
                [tournaments]="tournaments"
                [loadingTournaments]="loadingTournaments"
                [submitting]="submitting"
                [success]="success"
                [error]="error"
                [title]="formTitle.bind(this)"
                [submitLabel]="submitLabel.bind(this)"
                [successMessage]="successMessage.bind(this)"
                [tournamentLabel]="tournamentLabel.bind(this)"
                (reasonChange)="reasonChange.emit()"
                (submit)="submitParticipation.emit()"
              />
            </div>
          </section>
  `,
})
export class LandingContactSectionComponent {
  @Input({ required: true }) eventAddress!: string;
  @Input({ required: true }) eventDateRange!: string;
  @Input({ required: true }) participationForm!: LandingParticipationForm;
  @Input({ required: true }) tournaments!: () => PublicTournament[];
  @Input({ required: true }) loadingTournaments!: () => boolean;
  @Input({ required: true }) submitting!: () => boolean;
  @Input({ required: true }) success!: () => boolean;
  @Input({ required: true }) error!: () => string;
  @Input({ required: true }) formTitle!: () => string;
  @Input({ required: true }) submitLabel!: () => string;
  @Input({ required: true }) successMessage!: () => string;
  @Input({ required: true }) tournamentLabel!: (tournament: PublicTournament) => string;
  @Output() reasonChange = new EventEmitter<void>();
  @Output() submitParticipation = new EventEmitter<void>();
}

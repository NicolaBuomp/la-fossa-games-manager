import { Component, EventEmitter, Input, Output } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { PublicTournament } from "../../core/types/models";

export type ParticipationFormReason = "participation" | "sponsor";

export interface ParticipationFormValue {
  reason: ParticipationFormReason;
  tournament_id: string;
  company_name: string;
  first_name: string;
  last_name: string;
  phone: string;
  privacy_accepted: boolean;
  whatsapp_accepted: boolean;
  rules_accepted: boolean;
}

@Component({
  selector: "lfg-participation-form-tabs",
  standalone: true,
  imports: [FormsModule],
  host: { class: "block" },
  template: `
    <form
      class="rounded-lg border border-white/15 bg-black p-5 shadow-2xl sm:p-6"
      (ngSubmit)="submitted.emit()"
    >
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p class="text-accent text-xs font-black uppercase tracking-[0.24em]">
            Richiesta contatto
          </p>
          <h3
            class="mt-2 font-display text-2xl uppercase leading-none sm:text-3xl"
          >
            {{ title() }}
          </h3>
        </div>
        @if (loadingTournaments()) {
          <span
            class="rounded-full border border-white/10 px-3 py-1 text-xs font-bold text-white/60"
            >Caricamento</span
          >
        }
      </div>

      @if (success()) {
        <p
          class="state-success mt-5 rounded-md border p-3 text-sm font-semibold"
        >
          {{ successMessage() }}
        </p>
      }

      @if (error()) {
        <p
          class="state-danger mt-5 rounded-md border p-3 text-sm font-semibold"
        >
          {{ error() }}
        </p>
      }

      <fieldset
        [disabled]="
          submitting() ||
          (form.reason === 'participation' && loadingTournaments())
        "
        class="mt-5 grid gap-4 disabled:opacity-70"
      >
        <div
          class="grid grid-cols-2 gap-2 rounded-md border border-white/10 bg-white/[0.03] p-1"
        >
          <button
            type="button"
            class="rounded px-3 py-2 text-xs font-black uppercase tracking-[0.12em] transition"
            [class.bg-accent]="form.reason === 'participation'"
            [class.text-on-accent]="form.reason === 'participation'"
            [class.text-white]="form.reason !== 'participation'"
            (click)="setReason('participation')"
          >
            Torneo
          </button>
          <button
            type="button"
            class="rounded px-3 py-2 text-xs font-black uppercase tracking-[0.12em] transition"
            [class.bg-accent]="form.reason === 'sponsor'"
            [class.text-on-accent]="form.reason === 'sponsor'"
            [class.text-white]="form.reason !== 'sponsor'"
            (click)="setReason('sponsor')"
          >
            Sponsor
          </button>
        </div>

        @if (form.reason === "participation") {
          <label
            class="grid gap-2 text-sm font-black uppercase tracking-[0.12em] text-white/72"
          >
            Torneo
            <select
              required
              name="tournament"
              [(ngModel)]="form.tournament_id"
              class="focus-border-accent focus-ring-accent rounded-md border border-white/20 bg-[#101010] px-3 py-3 text-base font-semibold normal-case tracking-normal text-white outline-none transition"
            >
              <option value="" disabled>Seleziona un torneo</option>
              @for (tournament of tournaments(); track tournament.id) {
                <option [value]="tournament.id">
                  {{ tournamentLabel(tournament) }}
                </option>
              }
            </select>
          </label>
        } @else {
          <label
            class="grid gap-2 text-sm font-black uppercase tracking-[0.12em] text-white/72"
          >
            Azienda o attività
            <input
              required
              name="companyName"
              [(ngModel)]="form.company_name"
              autocomplete="organization"
              class="focus-border-accent focus-ring-accent rounded-md border border-white/20 bg-[#101010] px-3 py-3 text-base font-semibold normal-case tracking-normal text-white outline-none transition"
            />
          </label>
        }

        <div class="grid gap-4 sm:grid-cols-2">
          <label
            class="grid gap-2 text-sm font-black uppercase tracking-[0.12em] text-white/72"
          >
            Nome
            <input
              required
              name="firstName"
              [(ngModel)]="form.first_name"
              autocomplete="given-name"
              class="focus-border-accent focus-ring-accent rounded-md border border-white/20 bg-[#101010] px-3 py-3 text-base font-semibold normal-case tracking-normal text-white outline-none transition"
            />
          </label>
          <label
            class="grid gap-2 text-sm font-black uppercase tracking-[0.12em] text-white/72"
          >
            Cognome
            <input
              required
              name="lastName"
              [(ngModel)]="form.last_name"
              autocomplete="family-name"
              class="focus-border-accent focus-ring-accent rounded-md border border-white/20 bg-[#101010] px-3 py-3 text-base font-semibold normal-case tracking-normal text-white outline-none transition"
            />
          </label>
        </div>

        <label
          class="grid gap-2 text-sm font-black uppercase tracking-[0.12em] text-white/72"
        >
          Telefono
          <input
            required
            type="tel"
            name="phone"
            [(ngModel)]="form.phone"
            autocomplete="tel"
            class="focus-border-accent focus-ring-accent rounded-md border border-white/20 bg-[#101010] px-3 py-3 text-base font-semibold normal-case tracking-normal text-white outline-none transition"
          />
        </label>

        <div
          class="grid gap-3 rounded-md border border-white/10 bg-white/[0.03] p-4"
        >
          <label
            class="flex gap-3 text-sm font-semibold leading-6 text-white/74"
          >
            <input
              required
              type="checkbox"
              name="privacy"
              [(ngModel)]="form.privacy_accepted"
              class="mt-1 h-4 w-4 shrink-0"
            />
            <span>
              Accetto il trattamento dei dati personali per la gestione della
              richiesta di contatto.
            </span>
          </label>
          <label
            class="flex gap-3 text-sm font-semibold leading-6 text-white/74"
          >
            <input
              required
              type="checkbox"
              name="whatsapp"
              [(ngModel)]="form.whatsapp_accepted"
              class="mt-1 h-4 w-4 shrink-0"
            />
            <span>
              Autorizzo il contatto via WhatsApp per conferme, dettagli
              organizzativi e informazioni richieste.
            </span>
          </label>
          @if (form.reason === "participation") {
            <label
              class="flex gap-3 text-sm font-semibold leading-6 text-white/74"
            >
              <input
                required
                type="checkbox"
                name="rules"
                [(ngModel)]="form.rules_accepted"
                class="mt-1 h-4 w-4 shrink-0"
              />
              <span>
                Dichiaro di accettare regolamento, comunicazioni operative e
                condizioni di partecipazione.
              </span>
            </label>
          }
        </div>

        <button
          type="submit"
          [disabled]="
            submitting() ||
            (form.reason === 'participation' && loadingTournaments())
          "
          class="bg-accent text-on-accent rounded-md px-5 py-3 text-sm font-black uppercase tracking-[0.14em] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {{ submitting() ? "Invio in corso" : submitLabel() }}
        </button>
      </fieldset>
    </form>
  `,
})
export class ParticipationFormTabsComponent {
  @Input({ required: true }) form!: ParticipationFormValue;
  @Input({ required: true }) tournaments!: () => PublicTournament[];
  @Input({ required: true }) loadingTournaments!: () => boolean;
  @Input({ required: true }) submitting!: () => boolean;
  @Input({ required: true }) success!: () => boolean;
  @Input({ required: true }) error!: () => string;
  @Input({ required: true }) title!: () => string;
  @Input({ required: true }) submitLabel!: () => string;
  @Input({ required: true }) successMessage!: () => string;
  @Input({ required: true }) tournamentLabel!: (
    tournament: PublicTournament,
  ) => string;
  @Output() reasonChange = new EventEmitter<ParticipationFormReason>();
  @Output() submitted = new EventEmitter<void>();

  setReason(reason: ParticipationFormReason): void {
    this.form.reason = reason;
    this.reasonChange.emit(reason);
  }
}

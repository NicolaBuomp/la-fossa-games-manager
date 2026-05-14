import { Component, inject, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { PublicParticipationService } from "../../core/services/public-participation.service";
import { SnackbarService } from "../../core/services/snackbar.service";

@Component({
  selector: "lfg-participation-form-tabs",
  standalone: true,
  imports: [FormsModule],
  template: `
    <section class="space-y-6">
      <div class="flex gap-2">
        <button
          (click)="tab.set('tournament')"
          [class.text-ink]="tab() === 'tournament'"
          [class.text-muted]="tab() !== 'tournament'"
          [class.border-b-2]="tab() === 'tournament'"
          [class.border-fossa]="tab() === 'tournament'"
          class="pb-2 text-sm font-bold uppercase transition"
        >
          Partecipa a un Torneo
        </button>
        <button
          (click)="tab.set('sponsor')"
          [class.text-ink]="tab() === 'sponsor'"
          [class.text-muted]="tab() !== 'sponsor'"
          [class.border-b-2]="tab() === 'sponsor'"
          [class.border-fossa]="tab() === 'sponsor'"
          class="pb-2 text-sm font-bold uppercase transition"
        >
          Diventa Sponsor
        </button>
      </div>

      @if (tab() === "tournament") {
        <form class="space-y-4" (ngSubmit)="submitTournament()">
          <fieldset [disabled]="saving()" class="space-y-4 disabled:opacity-70">
            <label class="grid gap-1 text-sm font-bold">
              Nome e Cognome <span class="text-red-500">*</span>
              <input
                type="text"
                required
                [(ngModel)]="tournamentForm.contact_name"
                name="contact_name"
                placeholder="Es. Mario Rossi"
                class="rounded-lg border border-black/10 bg-neutral-50 px-3 py-2 text-sm font-normal focus:border-ink focus:outline-none focus:ring-2 focus:ring-fossa/20"
              />
            </label>
            <label class="grid gap-1 text-sm font-bold">
              Email <span class="text-red-500">*</span>
              <input
                type="email"
                required
                [(ngModel)]="tournamentForm.email"
                name="email"
                placeholder="Es. mario@example.com"
                class="rounded-lg border border-black/10 bg-neutral-50 px-3 py-2 text-sm font-normal focus:border-ink focus:outline-none focus:ring-2 focus:ring-fossa/20"
              />
            </label>
            <label class="grid gap-1 text-sm font-bold">
              Telefono <span class="text-red-500">*</span>
              <input
                type="tel"
                required
                [(ngModel)]="tournamentForm.phone"
                name="phone"
                placeholder="Es. 3XXXXXXXXX"
                class="rounded-lg border border-black/10 bg-neutral-50 px-3 py-2 text-sm font-normal focus:border-ink focus:outline-none focus:ring-2 focus:ring-fossa/20"
              />
            </label>
            <label class="grid gap-1 text-sm font-bold">
              Torneo di interesse <span class="text-red-500">*</span>
              <input
                type="text"
                required
                [(ngModel)]="tournamentForm.tournament"
                name="tournament"
                placeholder="Es. Calcio a 5"
                class="rounded-lg border border-black/10 bg-neutral-50 px-3 py-2 text-sm font-normal focus:border-ink focus:outline-none focus:ring-2 focus:ring-fossa/20"
              />
            </label>
            <label class="grid gap-1 text-sm font-bold">
              Messaggio
              <textarea
                [(ngModel)]="tournamentForm.message"
                name="message"
                rows="4"
                placeholder="Condividi i tuoi dettagli o domande..."
                class="rounded-lg border border-black/10 bg-neutral-50 px-3 py-2 text-sm font-normal focus:border-ink focus:outline-none focus:ring-2 focus:ring-fossa/20"
              ></textarea>
            </label>
            @if (error()) {
              <p
                class="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
              >
                {{ error() }}
              </p>
            }
            <button
              type="submit"
              class="w-full rounded-lg bg-fossa px-4 py-3 text-sm font-bold uppercase text-ink transition hover:bg-fossa/90 disabled:opacity-60"
            >
              {{ saving() ? "Invio…" : "Invia Richiesta" }}
            </button>
          </fieldset>
        </form>
      }

      @if (tab() === "sponsor") {
        <form class="space-y-4" (ngSubmit)="submitSponsor()">
          <fieldset [disabled]="saving()" class="space-y-4 disabled:opacity-70">
            <label class="grid gap-1 text-sm font-bold">
              Ragione Sociale <span class="text-red-500">*</span>
              <input
                type="text"
                required
                [(ngModel)]="sponsorForm.company_name"
                name="company_name"
                placeholder="Es. Azienda Rossi s.r.l."
                class="rounded-lg border border-black/10 bg-neutral-50 px-3 py-2 text-sm font-normal focus:border-ink focus:outline-none focus:ring-2 focus:ring-fossa/20"
              />
            </label>
            <label class="grid gap-1 text-sm font-bold">
              Contatto <span class="text-red-500">*</span>
              <input
                type="text"
                required
                [(ngModel)]="sponsorForm.contact_name"
                name="contact_name"
                placeholder="Es. Luca Bianchi"
                class="rounded-lg border border-black/10 bg-neutral-50 px-3 py-2 text-sm font-normal focus:border-ink focus:outline-none focus:ring-2 focus:ring-fossa/20"
              />
            </label>
            <label class="grid gap-1 text-sm font-bold">
              Email <span class="text-red-500">*</span>
              <input
                type="email"
                required
                [(ngModel)]="sponsorForm.email"
                name="email"
                placeholder="Es. luca@azienda.com"
                class="rounded-lg border border-black/10 bg-neutral-50 px-3 py-2 text-sm font-normal focus:border-ink focus:outline-none focus:ring-2 focus:ring-fossa/20"
              />
            </label>
            <label class="grid gap-1 text-sm font-bold">
              Telefono <span class="text-red-500">*</span>
              <input
                type="tel"
                required
                [(ngModel)]="sponsorForm.phone"
                name="phone"
                placeholder="Es. 3XXXXXXXXX"
                class="rounded-lg border border-black/10 bg-neutral-50 px-3 py-2 text-sm font-normal focus:border-ink focus:outline-none focus:ring-2 focus:ring-fossa/20"
              />
            </label>
            <label class="grid gap-1 text-sm font-bold">
              Messaggio
              <textarea
                [(ngModel)]="sponsorForm.message"
                name="message"
                rows="4"
                placeholder="Descrivi il tuo interesse di sponsorship..."
                class="rounded-lg border border-black/10 bg-neutral-50 px-3 py-2 text-sm font-normal focus:border-ink focus:outline-none focus:ring-2 focus:ring-fossa/20"
              ></textarea>
            </label>
            @if (error()) {
              <p
                class="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
              >
                {{ error() }}
              </p>
            }
            <button
              type="submit"
              class="w-full rounded-lg bg-fossa px-4 py-3 text-sm font-bold uppercase text-ink transition hover:bg-fossa/90 disabled:opacity-60"
            >
              {{ saving() ? "Invio…" : "Contattami" }}
            </button>
          </fieldset>
        </form>
      }
    </section>
  `,
})
export class ParticipationFormTabsComponent {
  private readonly service = inject(PublicParticipationService);
  private readonly snackbar = inject(SnackbarService);

  tab = signal<"tournament" | "sponsor">("tournament");
  saving = signal(false);
  error = signal("");

  tournamentForm = {
    contact_name: "",
    email: "",
    phone: "",
    tournament: "",
    message: "",
  };

  sponsorForm = {
    company_name: "",
    contact_name: "",
    email: "",
    phone: "",
    message: "",
  };

  async submitTournament(): Promise<void> {
    if (this.saving()) return;
    this.saving.set(true);
    this.error.set("");
    try {
      await this.service.createRequest({
        contact_name: this.tournamentForm.contact_name,
        email: this.tournamentForm.email,
        phone: this.tournamentForm.phone,
        tournament: this.tournamentForm.tournament,
        notes: this.tournamentForm.message,
      });
      this.snackbar.success("Richiesta inviata con successo!");
      this.tournamentForm = {
        contact_name: "",
        email: "",
        phone: "",
        tournament: "",
        message: "",
      };
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : "Errore nell'invio della richiesta";
      this.error.set(msg);
      this.snackbar.error(msg);
    } finally {
      this.saving.set(false);
    }
  }

  async submitSponsor(): Promise<void> {
    if (this.saving()) return;
    this.saving.set(true);
    this.error.set("");
    try {
      await this.service.createSponsorLead({
        company_name: this.sponsorForm.company_name,
        contact_name: this.sponsorForm.contact_name,
        email: this.sponsorForm.email,
        phone: this.sponsorForm.phone,
        notes: this.sponsorForm.message,
      });
      this.snackbar.success("Richiesta sponsor inviata con successo!");
      this.sponsorForm = {
        company_name: "",
        contact_name: "",
        email: "",
        phone: "",
        message: "",
      };
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : "Errore nell'invio della richiesta";
      this.error.set(msg);
      this.snackbar.error(msg);
    } finally {
      this.saving.set(false);
    }
  }
}

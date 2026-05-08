import { Component, signal } from "@angular/core";

type CookieConsent = "accepted" | "rejected";

const COOKIE_CONSENT_KEY = "lfg_cookie_consent";
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

@Component({
  selector: "lfg-cookie-banner",
  standalone: true,
  template: `
    @if (visible()) {
      <section
        class="fixed inset-x-0 bottom-0 z-[70] border-t border-white/10 bg-[#050505]/95 px-5 py-4 text-white shadow-2xl backdrop-blur sm:px-6"
        aria-label="Preferenze cookie"
      >
        <div
          class="mx-auto flex max-w-7xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div class="max-w-3xl">
            <p class="text-sm font-black uppercase tracking-[0.18em] text-fossa">
              Cookie
            </p>
            <p class="mt-2 text-sm font-semibold leading-6 text-white/72">
              Usiamo cookie tecnici necessari al funzionamento del sito. Puoi
              accettare o rifiutare eventuali cookie non essenziali; al momento
              non vengono caricati strumenti di tracciamento esterni.
            </p>
          </div>

          <div class="flex shrink-0 flex-col gap-2 sm:flex-row">
            <button
              type="button"
              class="rounded-md border border-white/20 px-4 py-3 text-xs font-black uppercase tracking-[0.14em] text-white transition hover:border-fossa hover:text-fossa"
              (click)="reject()"
            >
              Rifiuta
            </button>
            <button
              type="button"
              class="rounded-md bg-fossa px-4 py-3 text-xs font-black uppercase tracking-[0.14em] text-ink transition hover:bg-white"
              (click)="accept()"
            >
              Accetta
            </button>
          </div>
        </div>
      </section>
    }
  `,
})
export class CookieBannerComponent {
  readonly visible = signal(!this.currentConsent());

  accept(): void {
    this.saveConsent("accepted");
  }

  reject(): void {
    this.saveConsent("rejected");
  }

  private saveConsent(consent: CookieConsent): void {
    document.cookie = `${COOKIE_CONSENT_KEY}=${consent}; Max-Age=${ONE_YEAR_SECONDS}; Path=/; SameSite=Lax`;
    this.visible.set(false);
  }

  private currentConsent(): CookieConsent | null {
    const value = document.cookie
      .split("; ")
      .find((cookie) => cookie.startsWith(`${COOKIE_CONSENT_KEY}=`))
      ?.split("=")[1];

    return value === "accepted" || value === "rejected" ? value : null;
  }
}

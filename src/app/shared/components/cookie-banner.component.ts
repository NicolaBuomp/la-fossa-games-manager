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
        class="fixed inset-x-0 bottom-0 z-[70] p-3 text-white sm:inset-x-auto sm:bottom-5 sm:right-5 sm:w-[min(28rem,calc(100vw-2.5rem))]"
        aria-label="Preferenze cookie"
      >
        <div
          class="rounded-lg border border-white/10 bg-[#050505]/95 p-4 shadow-2xl backdrop-blur"
        >
          <div>
            <p
              class="text-accent text-xs font-black uppercase tracking-[0.18em]"
            >
              Cookie
            </p>
            <p
              class="mt-2 text-xs font-semibold leading-5 text-white/72 sm:text-sm"
            >
              Usiamo cookie tecnici necessari. Al momento non carichiamo
              strumenti di tracciamento esterni.
            </p>
          </div>

          <div class="mt-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              class="rounded-md border border-white/20 px-4 py-2.5 text-xs font-black uppercase tracking-[0.14em] text-white transition hover-border-accent hover-text-accent"
              (click)="reject()"
            >
              Rifiuta
            </button>
            <button
              type="button"
              class="bg-accent text-on-accent rounded-md px-4 py-2.5 text-xs font-black uppercase tracking-[0.14em] transition hover:bg-white"
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

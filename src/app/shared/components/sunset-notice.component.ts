import { Component, signal } from "@angular/core";

const NEW_APP_URL = "https://la-fossa-events-management.vercel.app/";

@Component({
  selector: "lfg-sunset-banner",
  standalone: true,
  template: `
    <div
      class="bg-accent text-on-accent sticky top-0 z-[60] px-4 py-2 text-center text-xs font-black uppercase tracking-[0.14em]"
      role="alert"
    >
      Supporto concluso: questo gestionale non è più aggiornato.
      <a
        [href]="newAppUrl"
        class="underline transition hover:text-white"
      >
        Vai al nuovo gestionale
      </a>
      &mdash; se non hai un account, richiedi la registrazione.
    </div>
  `,
})
export class SunsetBannerComponent {
  readonly newAppUrl = NEW_APP_URL;
}

@Component({
  selector: "lfg-sunset-notice",
  standalone: true,
  template: `
    @if (visible()) {
      <div
        class="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
        role="alertdialog"
        aria-modal="true"
        aria-label="Avviso fine supporto"
      >
        <section
          class="w-full max-w-lg rounded-lg border border-white/10 bg-[#050505]/95 p-6 text-white shadow-2xl"
        >
          <p class="text-accent text-xs font-black uppercase tracking-[0.18em]">
            Avviso importante
          </p>
          <h2 class="mt-2 text-lg font-black">
            Il supporto a questo gestionale è concluso
          </h2>
          <p class="mt-3 text-sm font-semibold leading-6 text-white/72">
            Questo gestionale non riceverà più aggiornamenti né assistenza. Il
            nuovo gestionale è disponibile all'indirizzo seguente. Se non hai
            ancora un account, ti preghiamo di richiedere la registrazione.
          </p>

          <div class="mt-5 grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              class="rounded-md border border-white/20 px-4 py-2.5 text-xs font-black uppercase tracking-[0.14em] text-white transition hover-border-accent hover-text-accent"
              (click)="dismiss()"
            >
              Continua comunque
            </button>
            <a
              [href]="newAppUrl"
              class="bg-accent text-on-accent rounded-md px-4 py-2.5 text-center text-xs font-black uppercase tracking-[0.14em] transition hover:bg-white"
            >
              Vai al nuovo gestionale
            </a>
          </div>
        </section>
      </div>
    }
  `,
})
export class SunsetNoticeComponent {
  readonly newAppUrl = NEW_APP_URL;
  readonly visible = signal(true);

  dismiss(): void {
    this.visible.set(false);
  }
}

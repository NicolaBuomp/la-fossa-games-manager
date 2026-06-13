import { Component } from "@angular/core";

const NEW_APP_URL = "https://la-fossa-events-management.vercel.app/";

@Component({
  selector: "lfg-migrated-page",
  standalone: true,
  template: `
    <main
      class="flex min-h-screen items-center justify-center bg-[#070707] p-4 text-white"
      role="alertdialog"
      aria-modal="true"
      aria-label="Gestionale trasferito"
    >
      <section
        class="w-full max-w-lg rounded-lg border border-white/10 bg-[#050505]/95 p-7 text-center shadow-2xl"
      >
        <p class="text-accent text-xs font-black uppercase tracking-[0.18em]">
          Avviso importante
        </p>
        <h1 class="mt-3 text-2xl font-black">
          Ci siamo trasferiti al nuovo gestionale
        </h1>
        <p class="mt-4 text-sm font-semibold leading-6 text-white/72">
          Questo gestionale non è più attivo: tutte le sue pagine sono state
          disattivate. Da ora la gestione avviene esclusivamente sul nuovo
          gestionale, raggiungibile all'indirizzo seguente. Se non hai ancora un
          account, richiedi la registrazione.
        </p>

        <a
          [href]="newAppUrl"
          class="bg-accent text-on-accent mt-6 inline-block rounded-md px-6 py-3 text-xs font-black uppercase tracking-[0.14em] transition hover:bg-white"
        >
          Vai al nuovo gestionale
        </a>
      </section>
    </main>
  `,
})
export class MigratedPageComponent {
  readonly newAppUrl = NEW_APP_URL;
}

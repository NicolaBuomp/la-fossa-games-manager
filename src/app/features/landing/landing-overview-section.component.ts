import { Component } from "@angular/core";

@Component({
  selector: "lfg-landing-overview-section",
  standalone: true,
  template: `
          <section class="bg-accent px-5 py-16 text-on-accent sm:px-8 lg:px-10">
            <div
              class="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1fr_0.8fr] lg:items-end reveal-up"
            >
              <div>
                <p class="text-xs font-black uppercase tracking-[0.28em]">
                  Perché nasce
                </p>
                <h2
                  class="mt-3 max-w-4xl font-display text-4xl uppercase leading-none sm:text-6xl"
                >
                  Un calendario, tutta la fossa.
                </h2>
                <p
                  class="mt-6 max-w-3xl text-lg font-semibold leading-8 text-black/72"
                >
                  Mettere nello stesso programma chi gioca, chi tifa e chi guarda da
                  bordocampo. Questo è La Fossa Games.
                </p>
                <div
                  class="mt-8 grid grid-cols-3 gap-4 border-t border-black/15 pt-8"
                >
                  <div>
                    <p
                      class="font-display text-5xl uppercase leading-none sm:text-6xl"
                    >
                      7
                    </p>
                    <p
                      class="mt-2 text-xs font-black uppercase tracking-[0.18em] text-black/58"
                    >
                      Tornei
                    </p>
                  </div>
                  <div>
                    <p
                      class="font-display text-5xl uppercase leading-none sm:text-6xl"
                    >
                      5
                    </p>
                    <p
                      class="mt-2 text-xs font-black uppercase tracking-[0.18em] text-black/58"
                    >
                      Giorni
                    </p>
                  </div>
                  <div>
                    <p
                      class="font-display text-5xl uppercase leading-none sm:text-6xl"
                    >
                      1ª
                    </p>
                    <p
                      class="mt-2 text-xs font-black uppercase tracking-[0.18em] text-black/58"
                    >
                      Edizione
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
  `,
})
export class LandingOverviewSectionComponent {
}

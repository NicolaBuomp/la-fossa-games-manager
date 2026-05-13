import { Component, computed, inject } from "@angular/core";
import { SnackbarService } from "../../core/services/snackbar.service";

@Component({
  selector: "lfg-snackbar",
  standalone: true,
  template: `
    @if (snackbar.message(); as message) {
      <section
        class="pointer-events-none fixed inset-x-3 top-3 z-[120] flex justify-center sm:inset-x-auto sm:right-4 sm:top-4 sm:justify-end"
      >
        <article
          class="pointer-events-auto w-full max-w-md animate-fade-in rounded-xl border p-3 shadow-2xl sm:p-4"
          [class]="toneClass()"
          role="status"
          aria-live="polite"
        >
          <div class="flex items-start gap-3">
            <p class="min-w-0 flex-1 text-sm font-semibold leading-5">
              {{ message.text }}
            </p>
            <button
              type="button"
              class="rounded-md bg-black/10 px-2 py-1 text-xs font-bold uppercase tracking-wide"
              (click)="snackbar.dismiss()"
            >
              Chiudi
            </button>
          </div>
        </article>
      </section>
    }
  `,
})
export class SnackbarComponent {
  readonly snackbar = inject(SnackbarService);

  readonly toneClass = computed(() => {
    const tone = this.snackbar.message()?.tone ?? "info";
    if (tone === "success") return "state-success";
    if (tone === "error") return "state-danger";
    if (tone === "warning") return "state-warning";
    return "state-info";
  });
}

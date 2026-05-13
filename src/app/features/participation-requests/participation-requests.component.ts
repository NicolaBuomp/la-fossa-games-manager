import { Component, OnInit, inject, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ParticipationRequestsService } from "../../core/services/participation-requests.service";
import { RequestBadgesService } from "../../core/services/request-badges.service";
import { SnackbarService } from "../../core/services/snackbar.service";
import {
  ParticipationRequest,
  ParticipationRequestNoteWithProfile,
  ParticipationRequestWithTournament,
} from "../../core/types/models";
import {
  ConfirmModalComponent,
  EmptyStateComponent,
  KpiPanelComponent,
  StatusBadgeComponent,
  SummaryCardComponent,
} from "../../shared/components/ui.component";

type RequestStatus = ParticipationRequest["status"];

@Component({
  standalone: true,
  imports: [
    FormsModule,
    EmptyStateComponent,
    KpiPanelComponent,
    StatusBadgeComponent,
    SummaryCardComponent,
    ConfirmModalComponent,
  ],
  template: `
    <section class="space-y-4">
      <div class="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p class="text-xs font-bold uppercase tracking-[0.18em] text-muted">
            Area admin
          </p>
          <h1 class="font-display text-3xl uppercase">
            Richieste partecipazione
          </h1>
        </div>
        <button
          [disabled]="loading()"
          class="rounded-lg bg-surface px-4 py-2 text-sm font-bold ring-1 ring-black/10 disabled:cursor-not-allowed disabled:opacity-60"
          (click)="load()"
        >
          Aggiorna
        </button>
      </div>

      <lfg-kpi-panel title="KPI richieste" storageKey="participation-requests">
        <section class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <lfg-summary-card
            label="Nuove"
            [value]="String(newCount())"
            tone="warning"
            hint="In attesa di presa in carico"
          />
          <lfg-summary-card
            label="In gestione"
            [value]="String(managingCount())"
            hint="Già accettate, da contattare"
          />
          <lfg-summary-card
            label="Contattate"
            [value]="String(contactedCount())"
            tone="income"
            hint="Richieste seguite"
          />
          <lfg-summary-card
            label="Archiviate"
            [value]="String(archivedCount())"
            hint="Chiuse o non procedibili"
          />
        </section>
      </lfg-kpi-panel>

      @if (error()) {
        <p class="state-danger rounded-lg border p-3 text-sm">
          {{ error() }}
        </p>
      }

      @if (!requests().length && !loading()) {
        <lfg-empty-state
          title="Nessuna richiesta"
          text="Le richieste inviate dal sito pubblico compariranno qui."
        />
      } @else {
        <div class="grid gap-3">
          @for (request of requests(); track request.id) {
            <article
              class="rounded-lg border border-soft bg-surface p-4 shadow-sm"
            >
              <div class="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p
                    class="text-xs font-bold uppercase tracking-[0.16em] text-muted"
                  >
                    {{ request.tournaments?.name || "Torneo non disponibile" }}
                  </p>
                  <h2 class="mt-1 text-xl font-black">
                    {{ request.first_name }} {{ request.last_name }}
                  </h2>
                  <p class="mt-1 text-sm text-muted">
                    Arrivata il {{ formatDateTime(request.created_at) }}
                  </p>
                </div>
                <lfg-status-badge
                  [label]="statusLabel(request.status)"
                  [className]="statusClass(request.status)"
                />
              </div>

              <div class="mt-4 grid gap-3 sm:grid-cols-2">
                <a
                  class="rounded-lg bg-surface-muted px-3 py-3 text-sm font-bold ring-1 ring-black/10 transition hover:opacity-90"
                  [href]="whatsappUrl(request.phone)"
                  target="_blank"
                  rel="noopener"
                >
                  <span
                    class="block text-[10px] uppercase tracking-wide text-muted"
                    >WhatsApp</span
                  >
                  {{ normalizePhone(request.phone) }}
                </a>
              </div>

              <div class="mt-4 flex flex-wrap gap-2 border-t border-soft pt-4">
                @if (request.status === "nuova") {
                  <button
                    [disabled]="updatingRequestId() === request.id"
                    class="rounded-lg bg-ink px-4 py-2 text-xs font-bold uppercase text-white disabled:cursor-not-allowed disabled:opacity-60"
                    (click)="setStatus(request, 'in_gestione')"
                  >
                    Accetta
                  </button>
                }
                @if (request.status !== "contattata") {
                  <button
                    [disabled]="updatingRequestId() === request.id"
                    class="state-success rounded-lg border px-4 py-2 text-xs font-bold uppercase disabled:cursor-not-allowed disabled:opacity-60"
                    (click)="setStatus(request, 'contattata')"
                  >
                    Segna contattata
                  </button>
                }
                @if (request.status !== "archiviata") {
                  <button
                    [disabled]="updatingRequestId() === request.id"
                    class="state-neutral rounded-lg border px-4 py-2 text-xs font-bold uppercase disabled:cursor-not-allowed disabled:opacity-60"
                    (click)="setStatus(request, 'archiviata')"
                  >
                    Archivia
                  </button>
                }
                @if (request.status !== "nuova") {
                  <button
                    [disabled]="updatingRequestId() === request.id"
                    class="state-warning rounded-lg border px-4 py-2 text-xs font-bold uppercase disabled:cursor-not-allowed disabled:opacity-60"
                    (click)="setStatus(request, 'nuova')"
                  >
                    Riapri
                  </button>
                }
              </div>

              <div
                class="mt-4 grid gap-3 lg:grid-cols-[1fr_auto_auto] lg:items-end"
              >
                <label class="grid gap-1 text-sm font-bold">
                  Nuova nota admin
                  <input
                    [disabled]="savingNoteId() === request.id"
                    class="rounded-lg border border-soft bg-surface-muted px-3 py-3 font-normal disabled:cursor-not-allowed disabled:opacity-70"
                    [ngModel]="noteDrafts()[request.id] || ''"
                    (ngModelChange)="setNoteDraft(request.id, $event)"
                  />
                </label>
                <button
                  [disabled]="savingNoteId() === request.id"
                  class="rounded-lg bg-ink px-4 py-3 text-sm font-bold uppercase text-white disabled:opacity-60"
                  (click)="addNote(request)"
                >
                  {{
                    savingNoteId() === request.id
                      ? "Salvataggio…"
                      : "Aggiungi nota"
                  }}
                </button>
                <button
                  class="state-danger rounded-lg border px-4 py-3 text-sm font-bold uppercase"
                  (click)="askRemove(request)"
                >
                  Elimina
                </button>
              </div>

              @if (request.participation_request_notes.length) {
                <div class="mt-4 border-t border-soft pt-4">
                  <p
                    class="text-xs font-bold uppercase tracking-[0.16em] text-muted"
                  >
                    Timeline note
                  </p>
                  <div class="mt-3 space-y-3">
                    @for (
                      note of request.participation_request_notes;
                      track note.id
                    ) {
                      <div
                        class="rounded-lg border border-soft bg-surface-muted px-3 py-3"
                      >
                        <div
                          class="flex flex-wrap items-center justify-between gap-2"
                        >
                          <p class="text-sm font-black">
                            {{ noteAuthor(note) }}
                          </p>
                          <time class="text-xs font-semibold text-muted">{{
                            formatDateTime(note.created_at)
                          }}</time>
                        </div>
                        <p
                          class="mt-2 whitespace-pre-line text-sm leading-6 text-muted"
                        >
                          {{ note.note }}
                        </p>
                      </div>
                    }
                  </div>
                </div>
              }
            </article>
          }
        </div>
      }
    </section>

    <lfg-confirm
      [open]="!!confirmPending()"
      [message]="confirmMessage()"
      (confirm)="doConfirm()"
      (cancel)="confirmPending.set(null)"
    />
  `,
})
export class ParticipationRequestsComponent implements OnInit {
  requests = signal<ParticipationRequestWithTournament[]>([]);
  noteDrafts = signal<Record<string, string>>({});
  loading = signal(false);
  error = signal("");
  savingNoteId = signal<string | null>(null);
  updatingRequestId = signal<string | null>(null);
  confirmPending = signal<(() => Promise<void>) | null>(null);
  confirmMessage = signal("");
  private readonly snackbar = inject(SnackbarService);

  constructor(
    private readonly service: ParticipationRequestsService,
    private readonly badges: RequestBadgesService,
  ) {}

  ngOnInit(): void {
    void this.load();
  }

  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set("");
    try {
      const requests = await this.service.list();
      this.requests.set(requests);
      // Preserve existing drafts — only initialize keys that don't exist yet
      const existing = this.noteDrafts();
      this.noteDrafts.set(
        Object.fromEntries(requests.map((r) => [r.id, existing[r.id] ?? ""])),
      );
      await this.badges.refresh();
    } catch (error) {
      this.setError(this.message(error));
    } finally {
      this.loading.set(false);
    }
  }

  async setStatus(
    request: ParticipationRequestWithTournament,
    status: RequestStatus,
  ): Promise<void> {
    if (this.updatingRequestId()) return;
    this.updatingRequestId.set(request.id);
    try {
      await this.service.updateStatus(request.id, status);
      this.requests.update((requests) =>
        requests.map((item) =>
          item.id === request.id ? { ...item, status } : item,
        ),
      );
      await this.badges.refresh();
    } catch (error) {
      this.setError(this.message(error));
    } finally {
      this.updatingRequestId.set(null);
    }
  }

  setNoteDraft(id: string, notes: string): void {
    this.noteDrafts.update((drafts) => ({ ...drafts, [id]: notes }));
  }

  async addNote(request: ParticipationRequestWithTournament): Promise<void> {
    const notes = this.noteDrafts()[request.id] ?? "";
    const normalizedNotes = notes.trim();
    if (!normalizedNotes || this.savingNoteId() === request.id) return;
    this.savingNoteId.set(request.id);
    try {
      await this.service.addNote(request.id, normalizedNotes);
      this.setNoteDraft(request.id, "");
      await this.load();
    } catch (error) {
      this.setError(this.message(error));
    } finally {
      this.savingNoteId.set(null);
    }
  }

  askRemove(request: ParticipationRequestWithTournament): void {
    this.confirmMessage.set(
      `Eliminare la richiesta di ${request.first_name} ${request.last_name}?`,
    );
    this.confirmPending.set(async () => {
      try {
        await this.service.remove(request.id);
        this.requests.update((requests) =>
          requests.filter((item) => item.id !== request.id),
        );
        await this.badges.refresh();
      } catch (error) {
        this.setError(this.message(error));
      }
    });
  }

  async doConfirm(): Promise<void> {
    const fn = this.confirmPending();
    this.confirmPending.set(null);
    if (fn) await fn();
  }

  whatsappUrl(phone: string): string {
    const cleaned = phone.trim().replace(/\s+/g, "");
    const digits = cleaned.startsWith("+")
      ? cleaned.slice(1).replace(/\D/g, "")
      : `39${cleaned.replace(/\D/g, "")}`;
    return `https://wa.me/${digits}`;
  }

  normalizePhone(phone: string): string {
    return phone.trim().replace(/\s+/g, "");
  }

  statusLabel(status: RequestStatus): string {
    return {
      nuova: "Nuova",
      in_gestione: "In gestione",
      contattata: "Contattata",
      archiviata: "Archiviata",
    }[status];
  }

  statusClass(status: RequestStatus): string {
    return {
      nuova: "state-warning",
      in_gestione: "state-info",
      contattata: "state-success",
      archiviata: "state-neutral",
    }[status];
  }

  newCount(): number {
    return this.requests().filter((r) => r.status === "nuova").length;
  }
  managingCount(): number {
    return this.requests().filter((r) => r.status === "in_gestione").length;
  }
  contactedCount(): number {
    return this.requests().filter((r) => r.status === "contattata").length;
  }
  archivedCount(): number {
    return this.requests().filter((r) => r.status === "archiviata").length;
  }

  formatDateTime(value: string): string {
    return new Intl.DateTimeFormat("it-IT", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(value));
  }

  noteAuthor(note: ParticipationRequestNoteWithProfile): string {
    return note.profiles?.full_name || note.profiles?.email || "Admin";
  }

  private message(error: unknown): string {
    return error instanceof Error ? error.message : "Operazione non riuscita.";
  }

  private setError(message: string): void {
    this.error.set(message);
    this.snackbar.error(message);
  }

  protected readonly String = String;
}

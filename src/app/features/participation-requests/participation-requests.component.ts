import { Component, OnInit, computed, inject, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import {
  ParticipationRequestTransferPayload,
  ParticipationRequestsService,
} from "../../core/services/participation-requests.service";
import { RequestBadgesService } from "../../core/services/request-badges.service";
import { SnackbarService } from "../../core/services/snackbar.service";
import {
  ParticipationRequest,
  ParticipationRequestNoteWithProfile,
  ParticipationRequestWithTournament,
} from "../../core/types/models";
import {
  DIRECT_TOURNAMENT_CODES,
  DUO_TOURNAMENT_CODES,
  FILTER_ALL,
  PARTICIPANT_GENDER,
  PARTICIPATION_REQUEST_STATUS,
  PARTICIPATION_REQUEST_STATUSES,
  TOURNAMENT_SPORT,
} from "../../core/types/constants";
import {
  ConfirmModalComponent,
  EmptyStateComponent,
  KpiPanelComponent,
  ModalComponent,
  StatusBadgeComponent,
  SummaryCardComponent,
} from "../../shared/components/ui.component";
import {
  FilterOption,
  StatusFilterPillsComponent,
} from "../../shared/components/status-filter-pills.component";

type RequestStatus = ParticipationRequest["status"];
type TransferPerson = {
  first_name: string;
  last_name: string;
  contact: string;
};
type TransferForm = {
  team_name: string;
  paid: boolean;
  captain_name: string;
  captain_contact: string;
  vice_captain_name: string;
  vice_captain_contact: string;
  participant_registered: boolean;
  person2: TransferPerson;
  notes: string;
};

@Component({
  standalone: true,
  imports: [
    FormsModule,
    EmptyStateComponent,
    KpiPanelComponent,
    StatusBadgeComponent,
    SummaryCardComponent,
    ModalComponent,
    ConfirmModalComponent,
    StatusFilterPillsComponent,
  ],
  template: `
    <section class="space-y-5">
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

      <div class="relative">
        <input
          type="search"
          placeholder="Cerca per nome o email…"
          class="w-full rounded-lg border border-soft bg-surface px-4 py-2.5 text-sm outline-none placeholder:text-muted"
          [value]="searchQuery()"
          (input)="searchQuery.set($any($event.target).value)"
        />
      </div>
      <lfg-status-filter-pills
        [options]="statusFilterOptions"
        (filterChange)="setStatusFilter($event)"
      />

      @if (error()) {
        <p class="state-danger rounded-lg border p-3 text-sm">
          {{ error() }}
        </p>
      }

      @if (!filteredRequests().length && !loading()) {
        <lfg-empty-state
          [title]="
            requests().length
              ? 'Nessuna richiesta per questo stato'
              : 'Nessuna richiesta'
          "
          [text]="
            requests().length
              ? 'Cambia filtro per vedere altre richieste.'
              : 'Le richieste inviate dal sito pubblico compariranno qui.'
          "
        />
      } @else {
        <div class="grid gap-3">
          @for (request of filteredRequests(); track request.id) {
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

              <div class="mt-4 flex flex-wrap items-center gap-2 border-t border-soft pt-4">
                <!-- Accetta / Trasferisci — sempre visibile -->
                <button
                  [disabled]="updatingRequestId() === request.id"
                  class="bg-strong text-on-strong rounded-lg px-4 py-2 text-xs font-bold uppercase disabled:cursor-not-allowed disabled:opacity-60"
                  (click)="openTransferModal(request)"
                >
                  {{ request.status === requestStatus.New ? "Accetta" : "Trasferisci" }}
                </button>

                <!-- Azioni secondarie desktop: sempre visibili -->
                <div class="hidden flex-wrap gap-2 sm:flex">
                  @if (request.status !== requestStatus.Contacted) {
                    <button
                      [disabled]="updatingRequestId() === request.id"
                      class="state-success rounded-lg border px-4 py-2 text-xs font-bold uppercase disabled:cursor-not-allowed disabled:opacity-60"
                    (click)="setStatus(request, requestStatus.Contacted)"
                    >
                      Segna contattata
                    </button>
                  }
                  @if (request.status !== requestStatus.Archived) {
                    <button
                      [disabled]="updatingRequestId() === request.id"
                      class="state-neutral rounded-lg border px-4 py-2 text-xs font-bold uppercase disabled:cursor-not-allowed disabled:opacity-60"
                    (click)="setStatus(request, requestStatus.Archived)"
                    >
                      Archivia
                    </button>
                  }
                  @if (request.status !== requestStatus.New) {
                    <button
                      [disabled]="updatingRequestId() === request.id"
                      class="state-warning rounded-lg border px-4 py-2 text-xs font-bold uppercase disabled:cursor-not-allowed disabled:opacity-60"
                    (click)="setStatus(request, requestStatus.New)"
                    >
                      Riapri
                    </button>
                  }
                </div>

                <!-- Azioni secondarie mobile: dropdown ⋯ -->
                <div class="relative sm:hidden">
                  <button
                    class="rounded-lg border border-soft px-3 py-2 text-base font-black leading-none"
                    (click)="openActionsId.set(openActionsId() === request.id ? null : request.id)"
                  >⋯</button>
                  @if (openActionsId() === request.id) {
                    <div
                      class="absolute left-0 top-full z-20 mt-1 flex min-w-[10rem] flex-col rounded-xl border border-soft bg-surface shadow-lg"
                      (click)="openActionsId.set(null)"
                    >
                      @if (request.status !== requestStatus.Contacted) {
                        <button
                          [disabled]="updatingRequestId() === request.id"
                          class="px-4 py-3 text-left text-sm font-bold text-green-700 disabled:opacity-60"
                          (click)="setStatus(request, requestStatus.Contacted)"
                        >Segna contattata</button>
                      }
                      @if (request.status !== requestStatus.Archived) {
                        <button
                          [disabled]="updatingRequestId() === request.id"
                          class="px-4 py-3 text-left text-sm font-bold disabled:opacity-60"
                          (click)="setStatus(request, requestStatus.Archived)"
                        >Archivia</button>
                      }
                      @if (request.status !== requestStatus.New) {
                        <button
                          [disabled]="updatingRequestId() === request.id"
                          class="px-4 py-3 text-left text-sm font-bold text-amber-700 disabled:opacity-60"
                          (click)="setStatus(request, requestStatus.New)"
                        >Riapri</button>
                      }
                    </div>
                  }
                </div>
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
                  class="bg-strong text-on-strong rounded-lg px-4 py-3 text-sm font-bold uppercase disabled:opacity-60"
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

    <lfg-modal
      [open]="!!transferRequest()"
      [title]="transferModalTitle()"
      (close)="closeTransferModal()"
    >
      @if (transferRequest(); as request) {
        <form class="grid gap-4" (ngSubmit)="transferRequestToTournament()">
          <fieldset
            [disabled]="!!updatingRequestId()"
            class="grid gap-4 disabled:opacity-70"
          >
            <div class="rounded-lg border border-soft bg-surface-muted p-3">
              <p
                class="text-[10px] font-bold uppercase tracking-wide text-muted"
              >
                Torneo
              </p>
              <p class="text-sm font-black">
                {{ request.tournaments?.name || "Torneo non disponibile" }}
              </p>
            </div>

            @if (requiresTeamName(request)) {
              <label class="grid gap-1 text-sm font-bold"
                >Squadra
                <input
                  required
                  name="transferTeamName"
                  [(ngModel)]="transferForm.team_name"
                  class="rounded-lg border border-soft bg-surface-muted px-3 py-3 font-normal disabled:cursor-not-allowed disabled:opacity-70"
              /></label>
            }

            @if (isFootballRequest(request)) {
              <div class="grid gap-3 sm:grid-cols-2">
                <label class="grid gap-1 text-sm font-bold"
                  >Capitano
                  <input
                    required
                    name="transferCaptainName"
                    [(ngModel)]="transferForm.captain_name"
                    class="rounded-lg border border-soft bg-surface-muted px-3 py-3 font-normal disabled:cursor-not-allowed disabled:opacity-70"
                /></label>
                <label class="grid gap-1 text-sm font-bold"
                  >Contatto capitano
                  <input
                    name="transferCaptainContact"
                    [(ngModel)]="transferForm.captain_contact"
                    class="rounded-lg border border-soft bg-surface-muted px-3 py-3 font-normal disabled:cursor-not-allowed disabled:opacity-70"
                /></label>
              </div>
              <div class="grid gap-3 sm:grid-cols-2">
                <label class="grid gap-1 text-sm font-bold"
                  >Vicecapitano
                  <input
                    required
                    name="transferViceCaptainName"
                    [(ngModel)]="transferForm.vice_captain_name"
                    class="rounded-lg border border-soft bg-surface-muted px-3 py-3 font-normal disabled:cursor-not-allowed disabled:opacity-70"
                /></label>
                <label class="grid gap-1 text-sm font-bold"
                  >Contatto vicecapitano
                  <input
                    name="transferViceCaptainContact"
                    [(ngModel)]="transferForm.vice_captain_contact"
                    class="rounded-lg border border-soft bg-surface-muted px-3 py-3 font-normal disabled:cursor-not-allowed disabled:opacity-70"
                /></label>
              </div>
            }

            @if (isDuoRequest(request)) {
              <fieldset class="grid gap-3 rounded-lg border border-soft p-4">
                <legend
                  class="px-1 text-xs font-black uppercase tracking-[0.16em] text-muted"
                >
                  Seconda persona
                </legend>
                <div class="grid gap-3 sm:grid-cols-2">
                  <label class="grid gap-1 text-sm font-bold"
                    >Nome
                    <input
                      required
                      name="transferPerson2FirstName"
                      [(ngModel)]="transferForm.person2.first_name"
                      class="rounded-lg border border-soft bg-surface-muted px-3 py-3 font-normal disabled:cursor-not-allowed disabled:opacity-70"
                  /></label>
                  <label class="grid gap-1 text-sm font-bold"
                    >Cognome
                    <input
                      required
                      name="transferPerson2LastName"
                      [(ngModel)]="transferForm.person2.last_name"
                      class="rounded-lg border border-soft bg-surface-muted px-3 py-3 font-normal disabled:cursor-not-allowed disabled:opacity-70"
                  /></label>
                </div>
                <label class="grid gap-1 text-sm font-bold"
                  >Contatto
                  <input
                    name="transferPerson2Contact"
                    [(ngModel)]="transferForm.person2.contact"
                    class="rounded-lg border border-soft bg-surface-muted px-3 py-3 font-normal disabled:cursor-not-allowed disabled:opacity-70"
                /></label>
              </fieldset>
            }

            @if (isVolleyballRequest(request)) {
              <label
                class="flex items-center gap-3 rounded-lg bg-surface-muted p-3 text-sm font-bold"
              >
                <input
                  type="checkbox"
                  name="transferParticipantRegistered"
                  [(ngModel)]="transferForm.participant_registered"
                  class="h-5 w-5 disabled:cursor-not-allowed disabled:opacity-70"
                />
                Richiedente tesserato FIPAV
              </label>
            }

            <label
              class="flex items-center gap-3 rounded-lg bg-surface-muted p-3 text-sm font-bold"
            >
              <input
                type="checkbox"
                name="transferPaid"
                [(ngModel)]="transferForm.paid"
                class="h-5 w-5 disabled:cursor-not-allowed disabled:opacity-70"
              />
              Iscrizione pagata
            </label>

            <label class="grid gap-1 text-sm font-bold"
              >Note iscrizione
              <textarea
                rows="3"
                name="transferNotes"
                [(ngModel)]="transferForm.notes"
                class="rounded-lg border border-soft bg-surface-muted px-3 py-3 font-normal disabled:cursor-not-allowed disabled:opacity-70"
              ></textarea>
            </label>

            <button
              class="bg-strong text-on-strong rounded-lg px-4 py-3 text-sm font-bold uppercase disabled:opacity-60"
            >
              {{
                updatingRequestId() === request.id
                  ? "Trasferimento…"
                  : "Trasferisci nel torneo"
              }}
            </button>
          </fieldset>
        </form>
      }
    </lfg-modal>

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
  searchQuery = signal("");
  statusFilter = signal<RequestStatus | typeof FILTER_ALL>(FILTER_ALL);
  openActionsId = signal<string | null>(null);
  transferRequest = signal<ParticipationRequestWithTournament | null>(null);
  confirmPending = signal<(() => Promise<void>) | null>(null);
  confirmMessage = signal("");
  private readonly snackbar = inject(SnackbarService);
  transferForm: TransferForm = this.emptyTransferForm();
  requestStatuses = PARTICIPATION_REQUEST_STATUSES;
  statusFilterOptions = computed<FilterOption[]>(() => [
    { label: "Tutte", value: FILTER_ALL, active: this.statusFilter() === FILTER_ALL },
    ...this.requestStatuses.map((status) => ({
      label: status.label,
      value: status.id,
      active: this.statusFilter() === status.id,
    })),
  ]);
  filteredRequests = computed(() => {
    const status = this.statusFilter();
    const q = this.searchQuery().toLowerCase().trim();
    let items = status === FILTER_ALL
      ? this.requests()
      : this.requests().filter((r) => r.status === status);
    if (q) {
      items = items.filter(
        (r) =>
          `${r.first_name} ${r.last_name}`.toLowerCase().includes(q) ||
          (r.email ?? "").toLowerCase().includes(q),
      );
    }
    return items;
  });

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
    } catch (error) {
      this.setError(this.message(error));
    } finally {
      this.updatingRequestId.set(null);
    }
  }

  setStatusFilter(value: string): void {
    this.statusFilter.set(value as RequestStatus | typeof FILTER_ALL);
  }

  openTransferModal(request: ParticipationRequestWithTournament): void {
    this.transferRequest.set(request);
    const fullName = this.personName(request.first_name, request.last_name);
    this.transferForm = {
      ...this.emptyTransferForm(),
      team_name: this.defaultTeamName(request),
      captain_name: fullName,
      captain_contact: this.normalizePhone(request.phone),
      person2: { first_name: "", last_name: "", contact: "" },
      notes: `Richiesta del ${this.formatDateTime(request.created_at)}`,
    };
  }

  closeTransferModal(): void {
    if (this.updatingRequestId()) return;
    this.transferRequest.set(null);
  }

  async transferRequestToTournament(): Promise<void> {
    const request = this.transferRequest();
    if (!request || this.updatingRequestId()) return;
    this.updatingRequestId.set(request.id);
    try {
      await this.service.transferToTournament(
        request,
        this.transferPayload(request),
      );
      this.transferRequest.set(null);
      await this.load();
      this.snackbar.success("Richiesta trasferita nel torneo.");
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
    return this.requestStatuses.find((item) => item.id === status)?.label ?? status;
  }

  statusClass(status: RequestStatus): string {
    return this.requestStatuses.find((item) => item.id === status)?.className ?? "state-neutral";
  }

  newCount(): number {
    return this.requests().filter((r) => r.status === PARTICIPATION_REQUEST_STATUS.New).length;
  }
  managingCount(): number {
    return this.requests().filter((r) => r.status === PARTICIPATION_REQUEST_STATUS.Managing).length;
  }
  contactedCount(): number {
    return this.requests().filter((r) => r.status === PARTICIPATION_REQUEST_STATUS.Contacted).length;
  }
  archivedCount(): number {
    return this.requests().filter((r) => r.status === PARTICIPATION_REQUEST_STATUS.Archived).length;
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

  transferModalTitle(): string {
    const request = this.transferRequest();
    return request?.tournaments?.name
      ? `Trasferisci in ${request.tournaments.name}`
      : "Trasferisci nel torneo";
  }

  requiresTeamName(request: ParticipationRequestWithTournament): boolean {
    return !this.isDirectRequest(request);
  }

  isFootballRequest(request: ParticipationRequestWithTournament): boolean {
    return request.tournaments?.sport === TOURNAMENT_SPORT.Football;
  }

  isVolleyballRequest(request: ParticipationRequestWithTournament): boolean {
    return request.tournaments?.sport === TOURNAMENT_SPORT.Volleyball;
  }

  isDirectRequest(request: ParticipationRequestWithTournament): boolean {
    return DIRECT_TOURNAMENT_CODES.includes(request.tournaments?.code ?? "");
  }

  isDuoRequest(request: ParticipationRequestWithTournament): boolean {
    return DUO_TOURNAMENT_CODES.includes(request.tournaments?.code ?? "");
  }

  private transferPayload(
    request: ParticipationRequestWithTournament,
  ): ParticipationRequestTransferPayload {
    const requester = {
      first_name: this.namePart(request.first_name),
      last_name: this.namePart(request.last_name),
      contact: this.normalizePhone(request.phone) || null,
      gender: PARTICIPANT_GENDER.Male,
      registered: this.isVolleyballRequest(request)
        ? this.transferForm.participant_registered
        : false,
    };
    const person2 = this.normalizedTransferPerson(this.transferForm.person2);
    const participants = this.isFootballRequest(request)
      ? []
      : [
          requester,
          ...(this.isDuoRequest(request)
            ? [
                {
                  ...person2,
                  contact: person2.contact || null,
                  gender: PARTICIPANT_GENDER.Male,
                  registered: false,
                },
              ]
            : []),
        ];

    return {
      team_name: this.normalizedTeamName(request),
      captain_name: this.isFootballRequest(request)
        ? this.namePart(this.transferForm.captain_name) || null
        : null,
      captain_contact: this.isFootballRequest(request)
        ? this.transferForm.captain_contact.trim() || null
        : null,
      vice_captain_name: this.isFootballRequest(request)
        ? this.namePart(this.transferForm.vice_captain_name) || null
        : null,
      vice_captain_contact: this.isFootballRequest(request)
        ? this.transferForm.vice_captain_contact.trim() || null
        : null,
      paid: this.transferForm.paid,
      notes: this.transferForm.notes.trim() || null,
      participants,
    };
  }

  private normalizedTeamName(
    request: ParticipationRequestWithTournament,
  ): string {
    if (!this.isDirectRequest(request)) {
      return this.namePart(this.transferForm.team_name);
    }

    if (this.isDuoRequest(request)) {
      const person2 = this.normalizedTransferPerson(this.transferForm.person2);
      return `${this.namePart(request.first_name)} / ${person2.first_name}`;
    }

    return this.personName(request.first_name, request.last_name);
  }

  private defaultTeamName(request: ParticipationRequestWithTournament): string {
    if (this.isDirectRequest(request)) {
      return this.personName(request.first_name, request.last_name);
    }
    return `Squadra ${this.personName(request.first_name, request.last_name)}`;
  }

  private normalizedTransferPerson(person: TransferPerson): TransferPerson {
    return {
      first_name: this.namePart(person.first_name),
      last_name: this.namePart(person.last_name),
      contact: person.contact.trim(),
    };
  }

  private personName(firstName: string, lastName: string): string {
    return [this.namePart(firstName), this.namePart(lastName)]
      .filter(Boolean)
      .join(" ");
  }

  private namePart(value: string | null | undefined): string {
    return (value ?? "")
      .trim()
      .toLocaleLowerCase("it-IT")
      .replace(
        /(^|[\s'-])(\p{L})/gu,
        (_match, prefix: string, letter: string) =>
          `${prefix}${letter.toLocaleUpperCase("it-IT")}`,
      );
  }

  private emptyTransferForm(): TransferForm {
    return {
      team_name: "",
      paid: false,
      captain_name: "",
      captain_contact: "",
      vice_captain_name: "",
      vice_captain_contact: "",
      participant_registered: false,
      person2: { first_name: "", last_name: "", contact: "" },
      notes: "",
    };
  }

  private message(error: unknown): string {
    return error instanceof Error ? error.message : "Operazione non riuscita.";
  }

  private setError(message: string): void {
    this.error.set(message);
    this.snackbar.error(message);
  }

  protected readonly String = String;
  protected readonly requestStatus = PARTICIPATION_REQUEST_STATUS;
}

import { Component, OnInit, computed, inject, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { AuthService } from "../../core/services/auth.service";
import { ExportService } from "../../core/services/export.service";
import { ProfileService } from "../../core/services/profile.service";
import { RequestBadgesService } from "../../core/services/request-badges.service";
import { SnackbarService } from "../../core/services/snackbar.service";
import { SponsorsService } from "../../core/services/sponsors.service";
import {
  FILTER_ALL,
  PAGE_SIZE,
  PAYMENT_METHODS,
  SPONSOR_CATEGORY,
  SPONSOR_CATEGORIES,
  SPONSOR_STATUS,
  SPONSOR_STATUSES,
} from "../../core/types/constants";
import {
  InsertSponsor,
  Profile,
  Sponsor,
  SponsorCategory,
  SponsorStatus,
  SponsorsSummary,
} from "../../core/types/models";
import {
  CrudFormField,
  CrudFormModalComponent,
} from "../../shared/components/crud-form-modal.component";
import { PaginationComponent } from "../../shared/components/pagination.component";
import {
  FilterOption,
  StatusFilterPillsComponent,
} from "../../shared/components/status-filter-pills.component";
import {
  ConfirmModalComponent,
  EmptyStateComponent,
  KpiPanelComponent,
  StatusBadgeComponent,
  SummaryCardComponent,
} from "../../shared/components/ui.component";

type SponsorForm = InsertSponsor & { withoutPromisedAmount: boolean };

@Component({
  standalone: true,
  imports: [
    FormsModule,
    EmptyStateComponent,
    KpiPanelComponent,
    StatusBadgeComponent,
    SummaryCardComponent,
    ConfirmModalComponent,
    StatusFilterPillsComponent,
    CrudFormModalComponent,
    PaginationComponent,
  ],
  template: `
    <section class="space-y-5">
      <div class="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p class="text-xs font-bold uppercase tracking-[0.18em] text-muted">
            Modulo sponsor
          </p>
          <h1 class="font-display text-3xl uppercase">Sponsor</h1>
          @if (!auth.isAdmin()) {
            <p
              class="mt-2 max-w-2xl text-sm font-semibold leading-6 text-muted"
            >
              Vedi solo gli sponsor inseriti da te o assegnati a te.
            </p>
          }
        </div>
        <div class="flex gap-2">
          <button
            class="rounded-lg bg-surface px-4 py-2 text-sm font-bold ring-1 ring-black/15"
            (click)="export()"
          >
            CSV
          </button>
          <button
            class="bg-strong text-on-strong rounded-lg px-4 py-2 text-sm font-bold"
            (click)="newItem()"
          >
            Nuovo
          </button>
        </div>
      </div>
      <div class="relative">
        <input
          type="search"
          placeholder="Cerca per azienda o referente…"
          class="w-full rounded-lg border border-soft bg-surface px-4 py-2.5 text-sm outline-none placeholder:text-muted"
          [value]="searchQuery()"
          (input)="onSearchInput($any($event.target).value)"
        />
      </div>
      <lfg-status-filter-pills
        [options]="statusFilterOptions"
        (filterChange)="setStatusFilter($event)"
      />
      <lfg-kpi-panel
        [title]="auth.isAdmin() ? 'KPI sponsor' : 'KPI sponsor personali'"
        storageKey="sponsors"
      >
        <section class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <lfg-summary-card
            label="Da contattare"
            [value]="String(contactTotal())"
            tone="warning"
            hint="Lead senza conferma"
          />
          <lfg-summary-card
            label="In trattativa"
            [value]="String(negotiatingTotal())"
            tone="warning"
            hint="Sponsor da seguire"
          />
          <lfg-summary-card
            label="Promesso"
            [value]="eur(promisedTotal())"
            tone="income"
            [hint]="confirmedPaidCount() + ' sponsor confermati/pagati'"
          />
          <lfg-summary-card
            label="Incassato"
            [value]="eur(receivedTotal())"
            tone="income"
            hint="Importi già ricevuti"
          />
        </section>
      </lfg-kpi-panel>
      <div class="flex justify-end">
        <label
          class="flex items-center gap-3 rounded-lg bg-surface px-3 py-2 text-sm font-bold ring-1 ring-black/15"
        >
          <span>Vista compatta</span>
          <input
            type="checkbox"
            class="peer sr-only"
            [ngModel]="compactView()"
            (ngModelChange)="compactView.set($event)"
          />
          <span
            class="h-5 w-9 rounded-full bg-neutral-200 p-0.5 transition peer-checked:[background:var(--color-surface-strong)]"
          >
            <span
              class="block h-4 w-4 rounded-full bg-white shadow-sm transition"
              [class.translate-x-4]="compactView()"
            ></span>
          </span>
        </label>
      </div>
      @if (error()) {
        <p class="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {{ error() }}
        </p>
      }
      @if (!items().length) {
        <lfg-empty-state
          [title]="
            auth.isAdmin() ? 'Nessuno sponsor' : 'Nessuno sponsor assegnato'
          "
          [text]="
            auth.isAdmin()
              ? 'Aggiungi aziende, contatti e stato della trattativa anche senza importo.'
              : 'Aggiungi un nuovo sponsor o chiedi a un admin di assegnarti un contatto esistente.'
          "
          actionLabel="Nuovo sponsor"
          icon="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
          (action)="newItem()"
        />
      } @else if (!items().length) {
        <lfg-empty-state
          title="Nessuno sponsor per questo stato"
          text="Cambia filtro per vedere altri sponsor."
          icon="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
        />
      } @else {
        <div
          [class]="
            compactView()
              ? 'grid gap-2 xl:grid-cols-3'
              : 'grid gap-3 xl:grid-cols-2'
          "
        >
          @for (item of items(); track item.id) {
            @if (compactView()) {
              <!-- COMPACT VIEW -->
              <article class="flex items-center justify-between gap-3 rounded-lg border border-soft bg-surface px-3 py-2">
                <div class="flex min-w-0 flex-1 items-center gap-2">
                  <lfg-status-badge [label]="statusLabel(item.status)" [className]="statusClass(item.status)" />
                  <h2 class="truncate text-sm font-bold">{{ item.company_name }}</h2>
                </div>
                <div class="flex flex-shrink-0 items-center gap-2">
                  <span class="text-sm font-black">{{ promisedAmountLabel(item) }}</span>
                  <button class="rounded-md bg-surface-muted px-2 py-1 text-[10px] font-bold uppercase" (click)="edit(item)">Modifica</button>
                  @if (auth.isAdmin()) {
                    <button class="rounded-md bg-red-50 px-2 py-1 text-[10px] font-bold uppercase text-red-600" (click)="askRemove(item)">Elimina</button>
                  }
                </div>
              </article>
            } @else {
              <!-- FULL VIEW -->
              <article class="overflow-hidden rounded-xl border border-soft bg-surface">
                <!-- Body -->
                <div class="p-4">
                  <div class="flex items-start justify-between gap-4">
                    <!-- Left: identity -->
                    <div class="min-w-0 flex-1">
                      <div class="flex flex-wrap items-center gap-2">
                        <h2 class="text-base font-bold leading-tight">{{ item.company_name }}</h2>
                        <lfg-status-badge [label]="statusLabel(item.status)" [className]="statusClass(item.status)" />
                      </div>
                      <p class="mt-1.5 text-xs text-muted">
                        {{ item.contact_name || "Referente non indicato" }}
                        @if (item.contact_info) { · {{ item.contact_info }} }
                      </p>
                      <p class="mt-0.5 text-[11px] text-muted">{{ insertMeta(item) }}</p>
                      <p class="mt-0.5 text-[11px] text-muted">{{ assignmentMeta(item) }}</p>
                    </div>
                    <!-- Right: amount block -->
                    <div class="flex-shrink-0 rounded-lg bg-surface-muted px-3 py-2 text-right">
                      @if (item.received_amount > 0) {
                        <p class="text-[10px] font-bold uppercase tracking-wide text-muted">Incassato</p>
                        <p class="text-positive mt-0.5 text-lg font-black leading-tight">{{ eur(item.received_amount) }}</p>
                        @if (item.promised_amount > item.received_amount) {
                          <p class="mt-1 text-[11px] text-muted">Promesso {{ eur(item.promised_amount) }}</p>
                        }
                      } @else if (item.promised_amount > 0) {
                        <p class="text-[10px] font-bold uppercase tracking-wide text-muted">Promesso</p>
                        <p class="mt-0.5 text-lg font-black leading-tight">{{ eur(item.promised_amount) }}</p>
                      } @else {
                        <p class="text-[10px] font-bold uppercase tracking-wide text-muted">Importo assente</p>
                        <p class="mt-0.5 text-base font-black leading-tight text-muted">Nessun importo</p>
                      }
                    </div>
                  </div>
                  <!-- Tags -->
                  <div class="mt-3 flex flex-wrap gap-1.5">
                    <span class="rounded-full bg-surface-muted px-2.5 py-1 text-[10px] font-bold uppercase">{{ categoryLabel(item.category) }}</span>
                    <span class="rounded-full bg-surface-muted px-2.5 py-1 text-[10px] font-bold uppercase">{{ item.payment_method }}</span>
                    @if (item.da_fatturare) {
                      <span class="rounded-full bg-orange-50 px-2.5 py-1 text-[10px] font-bold uppercase text-orange-700">
                        {{ item.fattura_emessa ? "Fattura emessa" : "Da fatturare" }}
                      </span>
                    }
                  </div>
                  @if (item.notes) {
                    <p class="mt-2.5 text-sm italic text-muted">{{ item.notes }}</p>
                  }
                </div>
                <!-- Footer -->
                <div class="flex flex-wrap items-center justify-between gap-2 border-t border-soft bg-surface-muted/50 px-4 py-2.5">
                  <!-- Status transitions -->
                  <div class="flex flex-wrap gap-1.5">
                    @for (status of statuses; track status.id) {
                      @if (status.id !== item.status) {
                        <button
                          [disabled]="updatingSponsorId() === item.id"
                          class="rounded-md border border-soft bg-surface px-2.5 py-1.5 text-[10px] font-bold uppercase transition hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-50"
                          (click)="setStatus(item, status.id)"
                        >
                          {{ status.label }}
                        </button>
                      }
                    }
                  </div>
                  <!-- Actions -->
                  <div class="flex gap-2">
                    <button
                      class="rounded-md bg-surface px-3 py-1.5 text-xs font-bold uppercase ring-1 ring-black/10 transition hover:bg-surface-muted"
                      (click)="edit(item)"
                    >
                      Modifica
                    </button>
                    @if (auth.isAdmin()) {
                      <button
                        class="rounded-md bg-red-50 px-3 py-1.5 text-xs font-bold uppercase text-red-600 transition hover:bg-red-100"
                        (click)="askRemove(item)"
                      >
                        Elimina
                      </button>
                    }
                  </div>
                </div>
              </article>
            }
          }
        </div>
        <lfg-pagination
          [page]="page()"
          [pageSize]="pageSize"
          [total]="totalItems()"
          (pageChange)="onPageChange($event)"
        />
      }
    </section>

    <lfg-crud-form-modal
      [open]="modalOpen()"
      [title]="editing() ? 'Modifica sponsor' : 'Nuovo sponsor'"
      [fields]="formFields"
      [form]="form"
      [loading]="saving"
      [error]="error"
      (close)="modalOpen.set(false)"
      (formUpdated)="updateForm($event)"
      (save)="save()"
    />

    <lfg-confirm
      [open]="!!confirmPending()"
      [message]="confirmMessage()"
      (confirm)="doConfirm()"
      (cancel)="confirmPending.set(null)"
    />
  `,
})
export class SponsorsComponent implements OnInit {
  items = signal<Sponsor[]>([]);
  totalItems = signal(0);
  page = signal(1);
  readonly pageSize = PAGE_SIZE;
  sponsorSummary = signal<SponsorsSummary | null>(null);
  assignableProfiles = signal<Profile[]>([]);
  userNames = signal<Record<string, string>>({});
  error = signal("");
  modalOpen = signal(false);
  editing = signal<Sponsor | null>(null);
  saving = signal(false);
  updatingSponsorId = signal<string | null>(null);
  statusFilter = signal<SponsorStatus | typeof FILTER_ALL>(FILTER_ALL);
  searchQuery = signal("");
  compactView = signal(false);
  confirmPending = signal<(() => Promise<void>) | null>(null);
  confirmMessage = signal("");
  private searchTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly snackbar = inject(SnackbarService);
  statuses = SPONSOR_STATUSES;
  statusFilterOptions = computed<FilterOption[]>(() => [
    { label: "Tutti", value: FILTER_ALL, active: this.statusFilter() === FILTER_ALL },
    ...this.statuses.map((status) => ({
      label: status.label,
      value: status.id,
      active: this.statusFilter() === status.id,
    })),
  ]);
  form: SponsorForm = this.emptyForm();
  formFields = computed<CrudFormField[]>(() => {
    const fields: CrudFormField[] = [
      {
        name: "company_name",
        label: "Nome azienda",
        type: "text",
        required: true,
      },
      { name: "contact_name", label: "Referente", type: "text" },
      { name: "contact_info", label: "Contatto", type: "text" },
    ];

    if (this.auth.isAdmin()) {
      fields.push({
        name: "responsible_user_id",
        label: "Assegnato a",
        type: "select",
        options: this.assignableProfiles().map((profile) => ({
          label: this.profileOptionLabel(profile),
          value: profile.id,
        })),
        help: "Lo sponsor sara visibile allo staff assegnato e comparira come suo contatto da seguire.",
      });
    }

    fields.push(
      {
        name: "category",
        label: "Categoria",
        type: "select",
        options: SPONSOR_CATEGORIES.map((category) => ({
          label: category.label,
          value: category.id,
        })),
      },
      {
        name: "promised_amount",
        label: "Importo promesso",
        type: "number",
        min: 0,
        step: 0.01,
        disabled: () => this.form.withoutPromisedAmount,
      },
      {
        name: "received_amount",
        label: "Importo ricevuto",
        type: "number",
        min: 0,
        step: 0.01,
      },
      {
        name: "payment_method",
        label: "Metodo pagamento",
        type: "select",
        options: PAYMENT_METHODS.map((method) => ({
          label: method,
          value: method,
        })),
      },
      {
        name: "status",
        label: "Stato",
        type: "select",
        options: this.statuses.map((status) => ({
          label: status.label,
          value: status.id,
        })),
      },
      {
        name: "withoutPromisedAmount",
        label: "Sponsor senza importo per ora",
        type: "checkbox",
        help: "Usalo per contatti, lead e trattative da richiamare: resta tracciato ma non entra nei totali economici.",
      },
      {
        name: "da_fatturare",
        label: "Da fatturare",
        type: "checkbox",
        help: "Spunta se per questo sponsor deve essere emessa una fattura.",
      },
      { name: "notes", label: "Note", type: "textarea", rows: 3 },
    );

    return fields;
  });

  constructor(
    readonly auth: AuthService,
    private readonly sponsorService: SponsorsService,
    private readonly exporter: ExportService,
    private readonly profiles: ProfileService,
    private readonly badges: RequestBadgesService,
  ) {}

  ngOnInit(): void {
    void Promise.all([this.load(), this.loadSummary(), this.loadProfiles()]);
  }

  async load(): Promise<void> {
    try {
      const userId = this.nonAdminUserId();
      const result = await this.sponsorService.listPaged({
        search: this.searchQuery(),
        status: this.statusFilter(),
        page: this.page(),
        pageSize: this.pageSize,
        userId,
      });
      this.items.set(result.data);
      this.totalItems.set(result.total);
      const ids = result.data.flatMap((i) => [i.created_by, i.responsible_user_id]);
      const names = await this.profiles.displayNames(ids);
      this.userNames.update((prev) => ({ ...prev, ...names }));
    } catch (e) {
      this.setError(this.message(e));
    }
  }

  async loadSummary(): Promise<void> {
    try {
      const userId = this.nonAdminUserId();
      this.sponsorSummary.set(await this.sponsorService.summary(userId));
    } catch {
      // non-critical
    }
  }

  async loadProfiles(): Promise<void> {
    try {
      const assignableProfiles = await this.loadAssignableProfiles();
      this.assignableProfiles.set(assignableProfiles);
      this.userNames.set(
        await this.profiles.displayNames(
          assignableProfiles.map((profile) => profile.id),
        ),
      );
    } catch (e) {
      this.setError(this.message(e));
    }
  }

  onSearchInput(q: string): void {
    this.searchQuery.set(q);
    if (this.searchTimer !== null) clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => {
      this.searchTimer = null;
      this.page.set(1);
      void this.load();
    }, 300);
  }

  onPageChange(p: number): void {
    this.page.set(p);
    void this.load();
  }

  newItem(): void {
    this.error.set("");
    this.editing.set(null);
    this.form = this.emptyForm();
    this.form.withoutPromisedAmount = false;
    this.modalOpen.set(true);
  }

  edit(item: Sponsor): void {
    this.error.set("");
    this.editing.set(item);
    this.form = {
      company_name: item.company_name,
      category: item.category ?? SPONSOR_CATEGORY.Bronzo,
      contact_name: item.contact_name,
      contact_info: item.contact_info,
      promised_amount: Number(item.promised_amount ?? 0),
      received_amount: Number(
        item.received_amount ?? (item.status === SPONSOR_STATUS.Paid ? item.promised_amount : 0),
      ),
      payment_method: item.payment_method,
      responsible_user_id: item.responsible_user_id,
      status: item.status,
      deliverables: item.deliverables,
      notes: item.notes,
      da_fatturare: item.da_fatturare ?? false,
      fattura_emessa: item.fattura_emessa ?? false,
      withoutPromisedAmount: Number(item.promised_amount ?? 0) === 0,
    };
    this.modalOpen.set(true);
  }

  async save(): Promise<void> {
    if (this.saving()) return;
    this.saving.set(true);
    this.error.set("");
    try {
      const { withoutPromisedAmount, ...form } = this.form;
      const promisedAmount = withoutPromisedAmount
        ? 0
        : Number(form.promised_amount || 0);
      const receivedAmount = Number(form.received_amount || 0);
      const payload = {
        ...form,
        promised_amount: promisedAmount,
        received_amount: receivedAmount,
        responsible_user_id: this.auth.isAdmin()
          ? form.responsible_user_id || null
          : this.auth.profile()?.id || null,
      };
      const current = this.editing();
      if (current) await this.sponsorService.update(current.id, payload);
      else await this.sponsorService.create(payload);
      this.modalOpen.set(false);
      await Promise.all([this.load(), this.loadSummary()]);
    } catch (e) {
      this.setError(this.message(e));
    } finally {
      this.saving.set(false);
    }
  }

  async setStatus(item: Sponsor, status: SponsorStatus): Promise<void> {
    if (this.updatingSponsorId()) return;
    this.updatingSponsorId.set(item.id);
    try {
      const payload: Partial<InsertSponsor> = { status };
      if (status === SPONSOR_STATUS.Paid && Number(item.received_amount || 0) === 0) {
        payload.received_amount = Number(item.promised_amount || 0);
      }
      await this.sponsorService.update(item.id, payload);
      await Promise.all([this.load(), this.loadSummary()]);
    } catch (e) {
      this.setError(this.message(e));
    } finally {
      this.updatingSponsorId.set(null);
    }
  }

  askRemove(item: Sponsor): void {
    this.confirmMessage.set(`Eliminare lo sponsor "${item.company_name}"?`);
    this.confirmPending.set(async () => {
      try {
        await this.sponsorService.remove(item.id);
        await Promise.all([this.load(), this.loadSummary()]);
      } catch (e) {
        this.setError(this.message(e));
      }
    });
  }

  async doConfirm(): Promise<void> {
    const fn = this.confirmPending();
    this.confirmPending.set(null);
    if (fn) await fn();
  }

  async export(): Promise<void> {
    try {
      const userId = this.nonAdminUserId();
      const { data } = await this.sponsorService.listPaged({
        search: this.searchQuery(),
        status: this.statusFilter(),
        pageSize: 10_000,
        userId,
      });
      this.exporter.downloadCsv(
        "sponsor-la-fossa-games.csv",
        data as unknown as Record<string, unknown>[],
      );
    } catch (e) {
      this.setError(this.message(e));
    }
  }
  contactTotal(): number {
    return this.sponsorSummary()?.contactedCount ?? 0;
  }
  negotiatingTotal(): number {
    return this.sponsorSummary()?.negotiatingCount ?? 0;
  }
  promisedTotal(): number {
    return this.sponsorSummary()?.promisedTotal ?? 0;
  }
  receivedTotal(): number {
    return this.sponsorSummary()?.receivedTotal ?? 0;
  }
  confirmedPaidCount(): number {
    return this.sponsorSummary()?.confirmedPaidCount ?? 0;
  }
  setStatusFilter(value: string): void {
    this.statusFilter.set(value as SponsorStatus | typeof FILTER_ALL);
    this.page.set(1);
    void this.load();
  }
  updateForm(patch: Record<string, unknown>): void {
    this.form = { ...this.form, ...patch };
    this.syncValueMode();
    const received = Number(this.form.received_amount || 0);
    const promised = Number(this.form.promised_amount || 0);
    if (received > promised) {
      this.form.promised_amount = received;
    }
    if (received > 0) {
      this.form.status = SPONSOR_STATUS.Paid;
    }
  }
  statusLabel(status: SponsorStatus): string {
    return this.statuses.find((item) => item.id === status)?.label ?? status;
  }
  statusClass(status: SponsorStatus): string {
    return this.statuses.find((item) => item.id === status)?.className ?? "";
  }
  categoryLabel(category: SponsorCategory): string {
    return (
      SPONSOR_CATEGORIES.find((item) => item.id === category)?.label ?? category
    );
  }
  promisedAmountLabel(item: Sponsor): string {
    const amount = Number(item.promised_amount ?? 0);
    return amount > 0 ? this.eur(amount) : "Nessun importo";
  }
  eur(value: number): string {
    return new Intl.NumberFormat("it-IT", {
      style: "currency",
      currency: "EUR",
    }).format(value);
  }
  formatDateTime(value: string): string {
    return new Intl.DateTimeFormat("it-IT", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(value));
  }
  insertMeta(item: Sponsor): string {
    return `Inserito da ${this.userNames()[item.created_by ?? ""] ?? "Utente non disponibile"} · ${this.formatDateTime(item.created_at)}`;
  }
  assignmentMeta(item: Sponsor): string {
    const responsible = item.responsible_user_id
      ? this.userNames()[item.responsible_user_id]
      : "";
    return responsible ? `Assegnato a ${responsible}` : "Non assegnato";
  }
  emptyForm(): SponsorForm {
    return {
      company_name: "",
      category: SPONSOR_CATEGORY.Bronzo,
      contact_name: "",
      contact_info: "",
      promised_amount: 0,
      received_amount: 0,
      payment_method: PAYMENT_METHODS[0],
      responsible_user_id: null,
      status: SPONSOR_STATUS.Contacted,
      deliverables: "",
      notes: "",
      da_fatturare: false,
      fattura_emessa: false,
      withoutPromisedAmount: true,
    };
  }
  syncValueMode(): void {
    if (this.form.withoutPromisedAmount) {
      this.form.promised_amount = 0;
    }
  }

  private nonAdminUserId(): string | undefined {
    if (this.auth.isAdmin()) return undefined;
    return this.auth.profile()?.id ?? this.auth.user()?.id;
  }

  private async loadAssignableProfiles(): Promise<Profile[]> {
    if (!this.auth.isAdmin()) return [];
    const profiles = await this.profiles.list();
    return profiles.filter((profile) => profile.active);
  }

  private profileOptionLabel(profile: Profile): string {
    const name =
      profile.full_name || profile.username || profile.email || profile.id;
    return `${name} · ${profile.roles?.join(', ')}`;
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

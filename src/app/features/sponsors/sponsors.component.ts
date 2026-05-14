import { Component, OnInit, computed, inject, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { AuthService } from "../../core/services/auth.service";
import { ExportService } from "../../core/services/export.service";
import { ProfileService } from "../../core/services/profile.service";
import { RequestBadgesService } from "../../core/services/request-badges.service";
import { SnackbarService } from "../../core/services/snackbar.service";
import { SponsorsService } from "../../core/services/sponsors.service";
import { SPONSOR_STATUSES } from "../../core/types/constants";
import {
  InsertSponsor,
  Sponsor,
  SponsorStatus,
  SponsorType,
} from "../../core/types/models";
import {
  ConfirmModalComponent,
  EmptyStateComponent,
  KpiPanelComponent,
  StatusBadgeComponent,
  SummaryCardComponent,
} from "../../shared/components/ui.component";
import {
  CrudFormField,
  CrudFormModalComponent,
} from "../../shared/components/crud-form-modal.component";
import {
  FilterOption,
  StatusFilterPillsComponent,
} from "../../shared/components/status-filter-pills.component";

type SponsorForm = InsertSponsor & { withoutValue: boolean };

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
  ],
  template: `
    <section class="space-y-5">
      <div class="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p class="text-xs font-bold uppercase tracking-[0.18em] text-muted">
            Modulo sponsor
          </p>
          <h1 class="font-display text-3xl uppercase">Sponsor</h1>
        </div>
        <div class="flex gap-2">
          <button
            class="rounded-lg bg-surface px-4 py-2 text-sm font-bold ring-1 ring-black/15"
            (click)="export()"
          >
            CSV
          </button>
          <button
            class="rounded-lg bg-surface px-4 py-2 text-sm font-bold ring-1 ring-black/15"
            (click)="newLead()"
          >
            Nuovo lead
          </button>
          <button
            class="rounded-lg bg-ink px-4 py-2 text-sm font-bold text-white"
            (click)="newItem()"
          >
            Nuovo
          </button>
        </div>
      </div>
      <lfg-status-filter-pills
        [options]="statusFilterOptions"
        (filterChange)="setStatusFilter($event)"
      />
      <lfg-kpi-panel title="KPI sponsor" storageKey="sponsors">
        <section class="grid gap-3 sm:grid-cols-3">
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
            label="Confermato/pagato"
            [value]="eur(confirmedTotal())"
            tone="income"
            [hint]="confirmedPaidCount() + ' sponsor'"
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
            class="h-5 w-9 rounded-full bg-neutral-200 p-0.5 transition peer-checked:bg-ink"
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
          title="Nessuno sponsor"
          text="Aggiungi aziende, contatti e stato della trattativa anche senza importo."
          actionLabel="Nuovo sponsor"
          (action)="newItem()"
        />
      } @else if (!filteredItems().length) {
        <lfg-empty-state
          title="Nessuno sponsor per questo stato"
          text="Cambia filtro per vedere altri sponsor."
        />
      } @else {
        <div
          [class]="
            compactView()
              ? 'grid gap-2 xl:grid-cols-3'
              : 'grid gap-3 xl:grid-cols-2'
          "
        >
          @for (item of filteredItems(); track item.id) {
            <article
              class="rounded-lg border border-soft bg-surface"
              [class.p-2]="compactView()"
              [class.p-4]="!compactView()"
            >
              <div
                class="flex flex-wrap items-start justify-between"
                [class.gap-2]="compactView()"
                [class.gap-3]="!compactView()"
              >
                <div class="min-w-0">
                  <h2
                    class="truncate font-bold"
                    [class.text-sm]="compactView()"
                    [class.text-base]="!compactView()"
                  >
                    {{ item.company_name }}
                  </h2>
                  @if (!compactView()) {
                    <p class="mt-1 text-xs text-muted">
                      {{ item.contact_name || "Referente non indicato" }}
                      @if (item.contact_info) {
                        · {{ item.contact_info }}
                      }
                    </p>
                    <p class="mt-1 text-xs font-semibold text-muted">
                      {{ insertMeta(item) }}
                    </p>
                  }
                </div>
                <div class="text-right">
                  @if (!compactView()) {
                    <p class="text-[10px] font-bold uppercase text-muted">
                      {{ item.value > 0 ? "Valore" : "Importo assente" }}
                    </p>
                  }
                  <p class="font-black" [class.text-sm]="compactView()">
                    {{ sponsorValueLabel(item) }}
                  </p>
                </div>
              </div>
              <div
                class="flex flex-wrap gap-2"
                [class.mt-2]="compactView()"
                [class.mt-3]="!compactView()"
              >
                <lfg-status-badge
                  [label]="statusLabel(item.status)"
                  [className]="statusClass(item.status)"
                />
                @if (!compactView()) {
                  <span
                    class="rounded-full bg-surface-muted px-2.5 py-1 text-[10px] font-bold uppercase"
                    >{{ sponsorTypeLabel(item.type) }}</span
                  >
                }
              </div>
              @if (!compactView() && item.notes) {
                <p class="mt-2 text-sm text-muted">{{ item.notes }}</p>
              }
              <div
                class="flex flex-wrap justify-between gap-2 border-t border-soft"
                [class.mt-2]="compactView()"
                [class.pt-2]="compactView()"
                [class.mt-4]="!compactView()"
                [class.pt-3]="!compactView()"
              >
                @if (!compactView()) {
                  <div class="flex flex-wrap gap-2">
                    @for (status of statuses; track status.id) {
                      @if (status.id !== item.status) {
                        <button
                          [disabled]="updatingSponsorId() === item.id"
                          class="rounded-md bg-surface-muted px-2.5 py-1.5 text-[10px] font-bold uppercase disabled:cursor-not-allowed disabled:opacity-60"
                          (click)="setStatus(item, status.id)"
                        >
                          {{ status.label }}
                        </button>
                      }
                    }
                  </div>
                }
                <div class="flex gap-2">
                  <button
                    class="rounded-md bg-surface-muted px-3 py-1.5 text-xs font-bold uppercase"
                    [class.px-2]="compactView()"
                    [class.py-1]="compactView()"
                    (click)="edit(item)"
                  >
                    Modifica
                  </button>
                  @if (auth.isAdmin()) {
                    <button
                      class="rounded-md bg-red-50 px-3 py-1.5 text-xs font-bold uppercase text-red-700"
                      [class.px-2]="compactView()"
                      [class.py-1]="compactView()"
                      (click)="askRemove(item)"
                    >
                      Elimina
                    </button>
                  }
                </div>
              </div>
            </article>
          }
        </div>
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
  userNames = signal<Record<string, string>>({});
  error = signal("");
  modalOpen = signal(false);
  editing = signal<Sponsor | null>(null);
  saving = signal(false);
  updatingSponsorId = signal<string | null>(null);
  statusFilter = signal<SponsorStatus | "all">("all");
  compactView = signal(false);
  confirmPending = signal<(() => Promise<void>) | null>(null);
  confirmMessage = signal("");
  private readonly snackbar = inject(SnackbarService);
  statuses = SPONSOR_STATUSES;
  statusFilterOptions = computed<FilterOption[]>(() => [
    { label: "Tutti", value: "all", active: this.statusFilter() === "all" },
    ...this.statuses.map((status) => ({
      label: status.label,
      value: status.id,
      active: this.statusFilter() === status.id,
    })),
  ]);
  form: SponsorForm = this.emptyForm();
  formFields = computed<CrudFormField[]>(() => [
    {
      name: "company_name",
      label: "Nome azienda",
      type: "text",
      required: true,
    },
    { name: "contact_name", label: "Referente", type: "text" },
    { name: "contact_info", label: "Contatto", type: "text" },
    {
      name: "value",
      label: "Importo/valore",
      type: "number",
      min: 0,
      step: 0.01,
      disabled: () => this.form.withoutValue,
    },
    {
      name: "type",
      label: "Metodo",
      type: "select",
      options: [
        { label: "Cash", value: "cash" },
        { label: "Bonifico", value: "bonifico" },
      ],
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
      name: "withoutValue",
      label: "Sponsor senza importo per ora",
      type: "checkbox",
      help: "Usalo per contatti, lead e trattative da richiamare: resta tracciato ma non entra nei totali economici.",
    },
    { name: "notes", label: "Note", type: "textarea", rows: 3 },
  ]);

  constructor(
    readonly auth: AuthService,
    private readonly service: SponsorsService,
    private readonly exporter: ExportService,
    private readonly profiles: ProfileService,
    private readonly badges: RequestBadgesService,
  ) {}

  ngOnInit(): void {
    void this.load();
  }

  async load(): Promise<void> {
    try {
      const items = await this.service.list();
      this.items.set(items);
      this.userNames.set(
        await this.profiles.displayNames(items.map((item) => item.created_by)),
      );
      await this.badges.refresh();
    } catch (e) {
      this.setError(this.message(e));
    } finally {
    }
  }

  newItem(): void {
    this.error.set("");
    this.editing.set(null);
    this.form = this.emptyForm();
    this.form.withoutValue = false;
    this.modalOpen.set(true);
  }

  newLead(): void {
    this.newItem();
    this.form.withoutValue = true;
    this.form.value = 0;
    this.form.status = "contattato";
    this.form.notes = "Lead sponsor da ricontattare.";
  }

  edit(item: Sponsor): void {
    this.error.set("");
    this.editing.set(item);
    this.form = {
      company_name: item.company_name,
      contact_name: item.contact_name,
      contact_info: item.contact_info,
      value: item.value,
      type: item.type,
      status: item.status,
      deliverables: item.deliverables,
      notes: item.notes,
      withoutValue: Number(item.value || 0) === 0,
    };
    this.modalOpen.set(true);
  }

  async save(): Promise<void> {
    if (this.saving()) return;
    this.saving.set(true);
    this.error.set("");
    try {
      const { withoutValue, ...form } = this.form;
      const payload = {
        ...form,
        value: withoutValue ? 0 : Number(form.value || 0),
      };
      const current = this.editing();
      if (current) await this.service.update(current.id, payload);
      else await this.service.create(payload);
      this.modalOpen.set(false);
      await this.load();
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
      await this.service.update(item.id, { status });
      await this.load();
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
        await this.service.remove(item.id);
        await this.load();
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

  export(): void {
    this.exporter.downloadCsv(
      "sponsor-la-fossa-games.csv",
      this.filteredItems() as unknown as Record<string, unknown>[],
    );
  }
  contactTotal(): number {
    return this.items().filter((item) => item.status === "contattato").length;
  }
  negotiatingTotal(): number {
    return this.items().filter((item) => item.status === "in_trattativa")
      .length;
  }
  confirmedTotal(): number {
    return this.items()
      .filter((i) => i.status === "confermato" || i.status === "pagato")
      .reduce((s, i) => s + Number(i.value || 0), 0);
  }
  confirmedPaidCount(): number {
    return this.items().filter(
      (i) => i.status === "confermato" || i.status === "pagato",
    ).length;
  }
  filteredItems(): Sponsor[] {
    const status = this.statusFilter();
    return status === "all"
      ? this.items()
      : this.items().filter((item) => item.status === status);
  }
  setStatusFilter(value: string): void {
    this.statusFilter.set(value as SponsorStatus | "all");
  }
  updateForm(patch: Record<string, unknown>): void {
    this.form = { ...this.form, ...patch };
    this.syncValueMode();
  }
  statusLabel(status: SponsorStatus): string {
    return this.statuses.find((item) => item.id === status)?.label ?? status;
  }
  statusClass(status: SponsorStatus): string {
    return this.statuses.find((item) => item.id === status)?.className ?? "";
  }
  sponsorTypeLabel(type: SponsorType): string {
    return type === "bonifico" ? "Bonifico" : "Cash";
  }
  sponsorValueLabel(item: Sponsor): string {
    return Number(item.value || 0) > 0
      ? this.eur(item.value)
      : "Nessun importo";
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
  emptyForm(): SponsorForm {
    return {
      company_name: "",
      contact_name: "",
      contact_info: "",
      type: "cash" as SponsorType,
      value: 0,
      status: "contattato",
      deliverables: "",
      notes: "",
      withoutValue: true,
    };
  }
  syncValueMode(): void {
    if (this.form.withoutValue) this.form.value = 0;
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

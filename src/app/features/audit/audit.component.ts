import { Component, OnInit, computed, inject, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import {
  AuditActionFilter,
  AuditLogService,
} from "../../core/services/audit-log.service";
import { ProfileService } from "../../core/services/profile.service";
import { SnackbarService } from "../../core/services/snackbar.service";
import { AuditLog, Profile } from "../../core/types/models";
import { EmptyStateComponent } from "../../shared/components/ui.component";

@Component({
  standalone: true,
  imports: [FormsModule, EmptyStateComponent],
  template: `
    <section class="space-y-5">
      <div class="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p class="text-xs font-bold uppercase tracking-[0.18em] text-muted">
            Sicurezza e controllo
          </p>
          <h1 class="font-display text-3xl uppercase">Audit log</h1>
        </div>
        <button
          type="button"
          [disabled]="loading()"
          class="rounded-lg bg-surface px-4 py-2 text-sm font-bold uppercase tracking-wide ring-1 ring-black/15 transition hover:bg-surface-muted disabled:opacity-60"
          (click)="load()"
        >
          {{ loading() ? "Aggiorno..." : "Aggiorna" }}
        </button>
      </div>

      <section class="rounded-lg border border-soft bg-surface p-4">
        <div class="grid gap-3 md:grid-cols-[1fr_1fr_auto] md:items-end">
          <label class="block">
            <span class="text-xs font-bold uppercase tracking-wide text-muted">
              Utente
            </span>
            <select
              class="mt-1 w-full rounded-lg px-3 py-2"
              [ngModel]="changedBy()"
              (ngModelChange)="setChangedBy($event)"
            >
              <option value="">Tutti gli utenti</option>
              @for (profile of profiles(); track profile.id) {
                <option [value]="profile.id">
                  {{ profileDisplayName(profile) }}
                </option>
              }
            </select>
          </label>

          <label class="block">
            <span class="text-xs font-bold uppercase tracking-wide text-muted">
              Tipologia
            </span>
            <select
              class="mt-1 w-full rounded-lg px-3 py-2"
              [ngModel]="action()"
              (ngModelChange)="setAction($event)"
            >
              <option value="all">Tutte</option>
              <option value="insert">Inserimenti</option>
              <option value="update">Modifiche</option>
              <option value="delete">Eliminazioni</option>
            </select>
          </label>

          <button
            type="button"
            class="rounded-lg bg-surface-muted px-4 py-2 text-sm font-bold uppercase tracking-wide transition hover:bg-surface"
            (click)="resetFilters()"
          >
            Reset
          </button>
        </div>
      </section>

      @if (error()) {
        <p class="state-danger rounded-lg border p-3 text-sm">
          {{ error() }}
        </p>
      }

      @if (!loading() && !rows().length) {
        <lfg-empty-state
          title="Nessun log trovato"
          text="Cambia filtro o aggiorna la pagina."
        />
      } @else {
        <section class="overflow-hidden rounded-lg border border-soft bg-surface">
          <div class="divide-y divide-black/5">
            @for (log of rows(); track log.id) {
              <article class="grid gap-3 p-4 lg:grid-cols-[1fr_auto]">
                <div class="min-w-0">
                  <p class="text-sm font-bold">
                    {{ actorLabel(log) }} ha {{ actionPhrase(log.action) }}
                    {{ tableLabel(log.table_name) }}
                    <span class="font-normal text-muted">
                      "{{ recordLabel(log) }}"
                    </span>
                  </p>
                  <p class="mt-1 text-xs text-muted">
                    {{ formatDateTime(log.changed_at) }} ·
                    {{ log.table_name }} · {{ log.record_id }}
                  </p>
                  @if (changedFields(log).length) {
                    <p class="mt-2 text-xs text-muted">
                      Campi: {{ changedFields(log).join(", ") }}
                    </p>
                  }
                </div>
                <span [class]="auditBadgeClass(log.action)">
                  {{ actionLabel(log.action) }}
                </span>
              </article>
            }
          </div>
        </section>

        <footer
          class="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-soft bg-surface p-3"
        >
          <p class="text-sm font-semibold text-muted">
            {{ rangeLabel() }} di {{ total() }}
          </p>
          <div class="flex items-center gap-2">
            <button
              type="button"
              [disabled]="page() === 1 || loading()"
              class="rounded-lg bg-surface-muted px-3 py-2 text-xs font-bold uppercase disabled:opacity-50"
              (click)="previousPage()"
            >
              Precedente
            </button>
            <span class="text-sm font-black">
              {{ page() }} / {{ totalPages() }}
            </span>
            <button
              type="button"
              [disabled]="page() >= totalPages() || loading()"
              class="rounded-lg bg-surface-muted px-3 py-2 text-xs font-bold uppercase disabled:opacity-50"
              (click)="nextPage()"
            >
              Successiva
            </button>
          </div>
        </footer>
      }
    </section>
  `,
})
export class AuditComponent implements OnInit {
  rows = signal<AuditLog[]>([]);
  profiles = signal<Profile[]>([]);
  total = signal(0);
  page = signal(1);
  pageSize = signal(20);
  action = signal<AuditActionFilter>("all");
  changedBy = signal("");
  loading = signal(false);
  error = signal("");
  totalPages = computed(() =>
    Math.max(1, Math.ceil(this.total() / this.pageSize())),
  );
  private readonly snackbar = inject(SnackbarService);

  constructor(
    private readonly auditLogs: AuditLogService,
    private readonly profileService: ProfileService,
  ) {}

  ngOnInit(): void {
    void this.loadProfiles();
    void this.load();
  }

  async load(): Promise<void> {
    if (this.loading()) return;
    this.loading.set(true);
    this.error.set("");
    try {
      const result = await this.auditLogs.page({
        page: this.page(),
        pageSize: this.pageSize(),
        action: this.action(),
        changedBy: this.changedBy() || undefined,
      });
      this.rows.set(result.rows);
      this.total.set(result.total);
      if (this.page() > this.totalPages()) {
        this.page.set(this.totalPages());
        await this.load();
      }
    } catch (error) {
      this.setError(
        error instanceof Error ? error.message : "Errore nel caricamento log.",
      );
    } finally {
      this.loading.set(false);
    }
  }

  setAction(value: AuditActionFilter): void {
    this.action.set(value);
    this.page.set(1);
    void this.load();
  }

  setChangedBy(value: string): void {
    this.changedBy.set(value);
    this.page.set(1);
    void this.load();
  }

  resetFilters(): void {
    this.action.set("all");
    this.changedBy.set("");
    this.page.set(1);
    void this.load();
  }

  previousPage(): void {
    if (this.page() <= 1) return;
    this.page.update((value) => value - 1);
    void this.load();
  }

  nextPage(): void {
    if (this.page() >= this.totalPages()) return;
    this.page.update((value) => value + 1);
    void this.load();
  }

  rangeLabel(): string {
    if (!this.total()) return "0";
    const start = (this.page() - 1) * this.pageSize() + 1;
    const end = Math.min(this.page() * this.pageSize(), this.total());
    return `${start}-${end}`;
  }

  actionLabel(action: AuditLog["action"]): string {
    if (action === "insert") return "Aggiunto";
    if (action === "update") return "Modificato";
    return "Eliminato";
  }

  actionPhrase(action: AuditLog["action"]): string {
    if (action === "insert") return "inserito";
    if (action === "update") return "modificato";
    return "eliminato";
  }

  auditBadgeClass(action: AuditLog["action"]): string {
    const base =
      "w-fit rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase";
    if (action === "insert") return `${base} state-success`;
    if (action === "update") return `${base} state-info`;
    return `${base} state-danger`;
  }

  tableLabel(tableName: string): string {
    return (
      {
        expenses: "spesa",
        incomes: "entrata",
        sponsors: "sponsor",
        registrations: "iscrizione",
        tournaments: "torneo",
        tournament_teams: "squadra",
        team_participants: "partecipante",
      }[tableName] ?? tableName
    );
  }

  actorLabel(log: AuditLog): string {
    return log.changed_by_name || "Utente non disponibile";
  }

  recordLabel(log: AuditLog): string {
    const data = log.new_data ?? log.old_data ?? {};
    const value =
      data["company_name"] ??
      data["description"] ??
      data["source"] ??
      data["name"] ??
      [data["first_name"], data["last_name"]].filter(Boolean).join(" ");
    return typeof value === "string" && value.trim()
      ? value
      : String(log.record_id).slice(0, 8);
  }

  changedFields(log: AuditLog): string[] {
    if (log.action !== "update" || !log.old_data || !log.new_data) return [];
    const oldData = log.old_data;
    const newData = log.new_data;
    return Object.keys(newData).filter(
      (key) => JSON.stringify(oldData[key]) !== JSON.stringify(newData[key]),
    );
  }

  formatDateTime(value: string): string {
    return new Intl.DateTimeFormat("it-IT", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(value));
  }

  profileDisplayName(profile: Profile): string {
    return profile.full_name?.trim() || profile.email?.trim() || profile.id;
  }

  private async loadProfiles(): Promise<void> {
    try {
      this.profiles.set(await this.profileService.list());
    } catch {
      this.profiles.set([]);
    }
  }

  private setError(message: string): void {
    this.error.set(message);
    this.snackbar.error(message);
  }
}

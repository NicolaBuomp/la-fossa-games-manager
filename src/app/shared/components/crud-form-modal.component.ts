import { Component, EventEmitter, Input, Output, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ModalComponent } from "./ui.component";

export interface CrudFormField {
  name: string;
  label: string;
  type: "text" | "email" | "number" | "date" | "textarea" | "select";
  required?: boolean;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
  options?: { label: string; value: unknown }[];
  rows?: number;
}

@Component({
  selector: "lfg-crud-form-modal",
  standalone: true,
  imports: [FormsModule, ModalComponent],
  template: `
    <lfg-modal [open]="open()" [title]="title()" (close)="close.emit()">
      <form class="grid gap-4" (ngSubmit)="submit()">
        <fieldset [disabled]="loading()" class="grid gap-4 disabled:opacity-70">
          @for (field of fields(); track field.name) {
            @if (field.type === "textarea") {
              <label class="grid gap-1 text-sm font-bold">
                {{ field.label }}
                @if (field.required) {
                  <span class="text-red-500">*</span>
                }
                <textarea
                  [name]="field.name"
                  [ngModel]="form()[field.name]"
                  (ngModelChange)="updateForm(field.name, $event)"
                  [required]="field.required ?? false"
                  [rows]="field.rows ?? 3"
                  [placeholder]="field.placeholder ?? ''"
                  class="rounded-lg border border-soft bg-surface-muted px-3 py-3 font-normal disabled:cursor-not-allowed disabled:opacity-70"
                />
              </label>
            } @else if (field.type === "select") {
              <label class="grid gap-1 text-sm font-bold">
                {{ field.label }}
                @if (field.required) {
                  <span class="text-red-500">*</span>
                }
                <select
                  [name]="field.name"
                  [ngModel]="form()[field.name]"
                  (ngModelChange)="updateForm(field.name, $event)"
                  [required]="field.required ?? false"
                  class="rounded-lg border border-soft bg-surface-muted px-3 py-3 font-normal disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <option value="">Seleziona...</option>
                  @for (opt of field.options; track opt.value) {
                    <option [value]="opt.value">{{ opt.label }}</option>
                  }
                </select>
              </label>
            } @else {
              <label class="grid gap-1 text-sm font-bold">
                {{ field.label }}
                @if (field.required) {
                  <span class="text-red-500">*</span>
                }
                <input
                  [type]="field.type"
                  [name]="field.name"
                  [ngModel]="form()[field.name]"
                  (ngModelChange)="updateForm(field.name, $event)"
                  [required]="field.required ?? false"
                  [placeholder]="field.placeholder ?? ''"
                  [min]="field.min"
                  [max]="field.max"
                  [step]="field.step"
                  class="rounded-lg border border-soft bg-surface-muted px-3 py-3 font-normal disabled:cursor-not-allowed disabled:opacity-70"
                />
              </label>
            }
          }
          @if (error()) {
            <p
              class="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
            >
              {{ error() }}
            </p>
          }
          <button
            type="submit"
            class="rounded-lg bg-ink px-4 py-3 text-sm font-bold uppercase text-white disabled:opacity-60"
          >
            {{ loading() ? "Salvataggio…" : "Salva" }}
          </button>
        </fieldset>
      </form>
    </lfg-modal>
  `,
})
export class CrudFormModalComponent {
  @Input({ required: true }) open!: () => boolean;
  @Input({ required: true }) title!: () => string;
  @Input({ required: true }) fields!: () => CrudFormField[];
  @Input({ required: true }) form!: () => Record<string, unknown>;
  @Input() loading = signal(false);
  @Input() error = signal("");
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<Record<string, unknown>>();

  updateForm(field: string, value: unknown): void {
    const current = this.form();
    const updated = { ...current, [field]: value };
    // This is a workaround because @Input form is read-only
    // The parent component should update its form signal when this fires
    this.formUpdated.emit({ [field]: value });
  }

  @Output() formUpdated = new EventEmitter<Record<string, unknown>>();

  submit(): void {
    this.save.emit(this.form());
  }
}

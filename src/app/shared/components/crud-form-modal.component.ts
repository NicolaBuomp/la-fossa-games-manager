import { Component, EventEmitter, Input, Output, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ModalComponent } from "./ui.component";

export interface CrudFormField {
  name: string;
  label: string;
  type:
    | "text"
    | "email"
    | "number"
    | "date"
    | "textarea"
    | "select"
    | "checkbox";
  required?: boolean;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
  options?: { label: string; value: unknown }[];
  rows?: number;
  help?: string;
  disabled?: boolean | (() => boolean);
}

@Component({
  selector: "lfg-crud-form-modal",
  standalone: true,
  imports: [FormsModule, ModalComponent],
  template: `
    <lfg-modal [open]="open" [title]="title" (close)="close.emit()">
      <form class="grid gap-4" (ngSubmit)="submit()">
        <fieldset [disabled]="loading()" class="grid gap-4 disabled:opacity-70">
          @for (field of fields(); track field.name) {
            @if (field.type === "checkbox") {
              <label
                class="flex items-start gap-3 rounded-lg border border-soft bg-surface-muted p-3 text-sm font-bold"
              >
                <input
                  type="checkbox"
                  class="mt-1 h-4 w-4 disabled:cursor-not-allowed disabled:opacity-70"
                  [name]="field.name"
                  [ngModel]="form[field.name]"
                  (ngModelChange)="updateForm(field.name, $event)"
                  [disabled]="fieldDisabled(field)"
                />
                <span>
                  {{ field.label }}
                  @if (field.help) {
                    <span
                      class="mt-1 block text-xs font-semibold leading-5 text-muted"
                    >
                      {{ field.help }}
                    </span>
                  }
                </span>
              </label>
            } @else if (field.type === "textarea") {
              <label class="grid gap-1 text-sm font-bold">
                {{ field.label }}
                @if (field.required) {
                  <span class="text-red-500">*</span>
                }
                <textarea
                  [name]="field.name"
                  [ngModel]="form[field.name]"
                  (ngModelChange)="updateForm(field.name, $event)"
                  [required]="field.required ?? false"
                  [rows]="field.rows ?? 3"
                  [placeholder]="field.placeholder ?? ''"
                  [disabled]="fieldDisabled(field)"
                  class="rounded-lg border border-soft bg-surface-muted px-3 py-3 font-normal disabled:cursor-not-allowed disabled:opacity-70"
                ></textarea>
              </label>
            } @else if (field.type === "select") {
              <label class="grid gap-1 text-sm font-bold">
                {{ field.label }}
                @if (field.required) {
                  <span class="text-red-500">*</span>
                }
                <select
                  [name]="field.name"
                  [ngModel]="form[field.name]"
                  (ngModelChange)="updateForm(field.name, $event)"
                  [required]="field.required ?? false"
                  [disabled]="fieldDisabled(field)"
                  class="rounded-lg border border-soft bg-surface-muted px-3 py-3 font-normal disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <option value="">Seleziona...</option>
                  @for (opt of field.options ?? []; track opt.value) {
                    <option [ngValue]="opt.value">{{ opt.label }}</option>
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
                  [ngModel]="form[field.name]"
                  (ngModelChange)="updateForm(field.name, $event)"
                  [required]="field.required ?? false"
                  [placeholder]="field.placeholder ?? ''"
                  [min]="field.min"
                  [max]="field.max"
                  [step]="field.step"
                  [disabled]="fieldDisabled(field)"
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
            class="bg-strong text-on-strong rounded-lg px-4 py-3 text-sm font-bold uppercase disabled:opacity-60"
          >
            {{ loading() ? "Salvataggio…" : "Salva" }}
          </button>
        </fieldset>
      </form>
    </lfg-modal>
  `,
})
export class CrudFormModalComponent {
  @Input({ required: true }) open = false;
  @Input({ required: true }) title = "";
  @Input({ required: true }) fields!: () => CrudFormField[];
  @Input({ required: true }) form!: Record<string, unknown>;
  @Input() loading = signal(false);
  @Input() error = signal("");
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<Record<string, unknown>>();

  updateForm(field: string, value: unknown): void {
    this.formUpdated.emit({ [field]: value });
  }

  @Output() formUpdated = new EventEmitter<Record<string, unknown>>();

  fieldDisabled(field: CrudFormField): boolean {
    return typeof field.disabled === "function"
      ? field.disabled()
      : (field.disabled ?? false);
  }

  submit(): void {
    this.save.emit(this.form);
  }
}

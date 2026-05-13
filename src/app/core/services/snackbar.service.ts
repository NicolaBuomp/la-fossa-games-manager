import { Injectable, signal } from "@angular/core";

export type SnackbarTone = "success" | "error" | "warning" | "info";

export interface SnackbarMessage {
  id: number;
  text: string;
  tone: SnackbarTone;
}

@Injectable({ providedIn: "root" })
export class SnackbarService {
  private readonly messageState = signal<SnackbarMessage | null>(null);
  private timeoutId: ReturnType<typeof setTimeout> | null = null;

  readonly message = this.messageState.asReadonly();

  show(text: string, tone: SnackbarTone = "info", durationMs = 3600): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }

    this.messageState.set({ id: Date.now(), text, tone });

    this.timeoutId = setTimeout(() => {
      this.dismiss();
    }, durationMs);
  }

  success(text: string, durationMs?: number): void {
    this.show(text, "success", durationMs);
  }

  error(text: string, durationMs?: number): void {
    this.show(text, "error", durationMs);
  }

  warning(text: string, durationMs?: number): void {
    this.show(text, "warning", durationMs);
  }

  info(text: string, durationMs?: number): void {
    this.show(text, "info", durationMs);
  }

  dismiss(): void {
    this.messageState.set(null);
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }
}

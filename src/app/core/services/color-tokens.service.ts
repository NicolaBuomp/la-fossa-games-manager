import { Injectable } from "@angular/core";

export type ColorTone =
  | "default"
  | "primary"
  | "income"
  | "expense"
  | "warning";
export type ColorVariant = "text" | "bg" | "border";

@Injectable({ providedIn: "root" })
export class ColorTokensService {
  getClass(tone: ColorTone, variant: ColorVariant): string {
    const map: Record<ColorTone, Record<ColorVariant, string>> = {
      default: {
        text: "text-primary",
        bg: "bg-surface",
        border: "border-soft",
      },
      primary: {
        text: "text-accent",
        bg: "bg-accent",
        border: "border-accent",
      },
      income: {
        text: "text-positive",
        bg: "state-success",
        border: "state-success",
      },
      expense: {
        text: "text-negative",
        bg: "state-danger",
        border: "state-danger",
      },
      warning: {
        text: "text-warning",
        bg: "state-warning",
        border: "state-warning",
      },
    };

    return map[tone][variant];
  }
}

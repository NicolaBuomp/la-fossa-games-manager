import { Injectable, signal } from "@angular/core";

export type ThemeMode = "system" | "light" | "dark";
type ResolvedTheme = "light" | "dark";

const THEME_MODE_KEY = "lfg-theme-mode";

@Injectable({ providedIn: "root" })
export class ThemeService {
  private readonly modeState = signal<ThemeMode>("system");
  private readonly resolvedThemeState = signal<ResolvedTheme>("light");
  private readonly mediaQuery = window.matchMedia(
    "(prefers-color-scheme: dark)",
  );

  readonly mode = this.modeState.asReadonly();
  readonly resolvedTheme = this.resolvedThemeState.asReadonly();

  constructor() {
    const storedMode = this.readStoredMode();
    this.modeState.set(storedMode);
    this.syncResolvedTheme();
    this.mediaQuery.addEventListener("change", this.onSystemThemeChange);
  }

  ensureApplied(): void {
    // This no-op method allows eager initialization from AppComponent.
  }

  setMode(mode: ThemeMode): void {
    this.modeState.set(mode);
    localStorage.setItem(THEME_MODE_KEY, mode);
    this.syncResolvedTheme();
  }

  private readStoredMode(): ThemeMode {
    const storedMode = localStorage.getItem(THEME_MODE_KEY);
    if (
      storedMode === "light" ||
      storedMode === "dark" ||
      storedMode === "system"
    ) {
      return storedMode;
    }
    return "system";
  }

  private readonly onSystemThemeChange = (event: MediaQueryListEvent): void => {
    if (this.modeState() !== "system") {
      return;
    }
    this.applyTheme(event.matches ? "dark" : "light");
  };

  private syncResolvedTheme(): void {
    const mode = this.modeState();
    const resolvedTheme: ResolvedTheme =
      mode === "system" ? (this.mediaQuery.matches ? "dark" : "light") : mode;
    this.applyTheme(resolvedTheme);
  }

  private applyTheme(theme: ResolvedTheme): void {
    this.resolvedThemeState.set(theme);
    const root = document.documentElement;
    root.setAttribute("data-theme", theme);
    root.style.colorScheme = theme;
    root.classList.toggle("dark", theme === "dark");
  }
}

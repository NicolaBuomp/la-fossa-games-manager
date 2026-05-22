import { Injectable, signal } from "@angular/core";
import {
  ResolvedThemeValue,
  THEME_MODE,
  ThemeModeValue,
} from "../types/constants";

export type ThemeMode = ThemeModeValue;
type ResolvedTheme = ResolvedThemeValue;

const THEME_MODE_KEY = "lfg-theme-mode";

@Injectable({ providedIn: "root" })
export class ThemeService {
  private readonly modeState = signal<ThemeMode>(THEME_MODE.System);
  private readonly resolvedThemeState = signal<ResolvedTheme>(THEME_MODE.Light);
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
      storedMode === THEME_MODE.Light ||
      storedMode === THEME_MODE.Dark ||
      storedMode === THEME_MODE.System
    ) {
      return storedMode;
    }
    return THEME_MODE.System;
  }

  private readonly onSystemThemeChange = (event: MediaQueryListEvent): void => {
    if (this.modeState() !== THEME_MODE.System) {
      return;
    }
    this.applyTheme(event.matches ? THEME_MODE.Dark : THEME_MODE.Light);
  };

  private syncResolvedTheme(): void {
    const mode = this.modeState();
    const resolvedTheme: ResolvedTheme =
      mode === THEME_MODE.System ? (this.mediaQuery.matches ? THEME_MODE.Dark : THEME_MODE.Light) : mode;
    this.applyTheme(resolvedTheme);
  }

  private applyTheme(theme: ResolvedTheme): void {
    this.resolvedThemeState.set(theme);
    const root = document.documentElement;
    root.setAttribute("data-theme", theme);
    root.style.colorScheme = theme;
    root.classList.toggle("dark", theme === THEME_MODE.Dark);
  }
}

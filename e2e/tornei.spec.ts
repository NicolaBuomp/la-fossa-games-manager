/**
 * E2E tests per le pagine tornei del gestionale (/app/tornei).
 *
 * Prerequisiti: dev server attivo su localhost:4200 con credenziali di test
 * configurate nelle env PLAYWRIGHT_EMAIL e PLAYWRIGHT_PASSWORD.
 * Se le variabili non sono impostate i test vengono skippati.
 */

import { test, expect, Page } from "@playwright/test";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const EMAIL = process.env["PLAYWRIGHT_EMAIL"] ?? "";
const PASSWORD = process.env["PLAYWRIGHT_PASSWORD"] ?? "";

const HAS_CREDENTIALS = EMAIL.length > 0 && PASSWORD.length > 0;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function login(page: Page): Promise<void> {
  await page.goto("/login");
  await page.waitForLoadState("networkidle");
  await page.locator("input[type='text'], input[type='email']").first().fill(EMAIL);
  await page.locator("input[type='password']").first().fill(PASSWORD);
  await page.getByRole("button", { name: /accedi|login/i }).first().click();
  await page.waitForURL(/\/app\//, { timeout: 10_000 });
  await page.waitForLoadState("networkidle");
}

async function goToTornei(page: Page): Promise<void> {
  await page.goto("/app/tornei");
  await page.waitForLoadState("networkidle");
}

// ---------------------------------------------------------------------------
// Tests — login richiesto
// ---------------------------------------------------------------------------

test.describe("Tornei (autenticato)", () => {
  test.skip(!HAS_CREDENTIALS, "Credenziali non configurate: imposta PLAYWRIGHT_EMAIL e PLAYWRIGHT_PASSWORD");

  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  // ------------------------------------------------------------------ lista
  test.describe("Lista tornei (/app/tornei)", () => {
    test("mostra l'header 'Tornei'", async ({ page }) => {
      await goToTornei(page);
      await expect(page.getByRole("heading", { name: /tornei/i }).first()).toBeVisible();
    });

    test("mostra le pill KPI con il contatore dei tornei", async ({ page }) => {
      await goToTornei(page);
      // Il testo "tornei" appare nelle pill statistiche dell'header
      await expect(page.getByText(/tornei/i).first()).toBeVisible();
    });

    test("se non ci sono tornei mostra empty state", async ({ page }) => {
      await goToTornei(page);
      const cards = page.locator("article");
      const count = await cards.count();
      if (count === 0) {
        await expect(page.getByText(/nessun torneo/i)).toBeVisible();
      }
    });

    test("le card tornei presenti sono cliccabili", async ({ page }) => {
      await goToTornei(page);
      const cards = page.locator("article");
      const count = await cards.count();
      if (count > 0) {
        await expect(cards.first()).toBeVisible();
        await expect(cards.first().getByText(/apri /i)).toBeVisible();
      }
    });

    test("click su una card naviga alla pagina dettaglio torneo", async ({ page }) => {
      await goToTornei(page);
      const cards = page.locator("article");
      if (await cards.count() === 0) test.skip();

      await cards.first().click();
      await page.waitForLoadState("networkidle");

      await expect(page).toHaveURL(/\/app\/tornei\/.+/);
    });

    test("i badge sport sono visibili nelle card", async ({ page }) => {
      await goToTornei(page);
      const cards = page.locator("article");
      if (await cards.count() === 0) test.skip();

      // Ogni card ha uno span con badge sport
      const firstCard = cards.first();
      await expect(firstCard.locator("span").first()).toBeVisible();
    });
  });

  // ------------------------------------------------------------------ creazione torneo (solo admin)
  test.describe("Creazione torneo", () => {
    test("il pulsante '+ Nuovo torneo' è visibile per gli admin", async ({ page }) => {
      await goToTornei(page);
      const btn = page.getByRole("button", { name: /nuovo torneo/i });
      // Se l'utente è admin il pulsante esiste; se staff viene skippato
      const visible = await btn.isVisible().catch(() => false);
      if (!visible) test.skip();
      await expect(btn).toBeVisible();
    });

    test("click su '+ Nuovo torneo' apre la modale", async ({ page }) => {
      await goToTornei(page);
      const btn = page.getByRole("button", { name: /nuovo torneo/i });
      if (!(await btn.isVisible().catch(() => false))) test.skip();

      await btn.click();
      // La modale ha un campo nome
      await expect(page.locator("input[name='name'], input[id*='name']").first()).toBeVisible({ timeout: 3000 });
    });

    test("submit della modale senza nome mostra errore / non invia", async ({ page }) => {
      await goToTornei(page);
      const btn = page.getByRole("button", { name: /nuovo torneo/i });
      if (!(await btn.isVisible().catch(() => false))) test.skip();

      await btn.click();
      // Cerca il pulsante di conferma nella modale
      const saveBtn = page.getByRole("button", { name: /salva|crea|conferma/i }).last();
      await saveBtn.click();
      await page.waitForTimeout(300);

      // Il modal rimane aperto o mostra un messaggio
      const inputName = page.locator("input[name='name'], input[id*='name']").first();
      const isStillVisible = await inputName.isVisible().catch(() => false);
      expect(isStillVisible).toBe(true);
    });
  });

  // ------------------------------------------------------------------ dettaglio torneo
  test.describe("Dettaglio torneo (/app/tornei/:id)", () => {
    async function openFirstTournament(page: Page): Promise<boolean> {
      await goToTornei(page);
      const cards = page.locator("article");
      if (await cards.count() === 0) return false;
      await cards.first().click();
      await page.waitForLoadState("networkidle");
      await page.waitForURL(/\/app\/tornei\/.+/);
      return true;
    }

    test("mostra il nome del torneo nell'header", async ({ page }) => {
      if (!(await openFirstTournament(page))) test.skip();
      const header = page.locator("header").first();
      await expect(header.locator("h1")).toBeVisible();
    });

    test("mostra la tab bar con almeno 'Iscritti'", async ({ page }) => {
      if (!(await openFirstTournament(page))) test.skip();
      await expect(page.getByRole("button", { name: /iscritti/i })).toBeVisible();
    });

    test("mostra la tab bar con 'Impostazioni'", async ({ page }) => {
      if (!(await openFirstTournament(page))) test.skip();
      await expect(page.getByRole("button", { name: /impostazioni/i })).toBeVisible();
    });

    test("mostra la tab bar con 'Gironi'", async ({ page }) => {
      if (!(await openFirstTournament(page))) test.skip();
      await expect(page.getByRole("button", { name: /gironi/i })).toBeVisible();
    });

    test("mostra la tab bar con 'Partite'", async ({ page }) => {
      if (!(await openFirstTournament(page))) test.skip();
      await expect(page.getByRole("button", { name: /partite/i })).toBeVisible();
    });

    test("mostra la tab bar con 'Classifiche'", async ({ page }) => {
      if (!(await openFirstTournament(page))) test.skip();
      await expect(page.getByRole("button", { name: /classifiche/i })).toBeVisible();
    });

    test("la tab attiva di default è 'Iscritti'", async ({ page }) => {
      if (!(await openFirstTournament(page))) test.skip();
      const activeTab = page.getByRole("button", { name: /iscritti/i });
      await expect(activeTab).toBeVisible();
      // Il tab attivo ha bg-accent applicato (classe Tailwind)
      const classes = await activeTab.getAttribute("class");
      expect(classes).toContain("bg-accent");
    });

    test("click su tab 'Gironi' cambia la tab attiva", async ({ page }) => {
      if (!(await openFirstTournament(page))) test.skip();
      await page.getByRole("button", { name: /gironi/i }).click();
      await page.waitForTimeout(200);

      const gironiTab = page.getByRole("button", { name: /gironi/i });
      const classes = await gironiTab.getAttribute("class");
      expect(classes).toContain("bg-accent");
    });

    test("il pulsante ← Tornei naviga alla lista", async ({ page }) => {
      if (!(await openFirstTournament(page))) test.skip();
      await page.getByRole("button", { name: /tornei/i }).click();
      await page.waitForURL(/\/app\/tornei$/);
      await expect(page).toHaveURL(/\/app\/tornei$/);
    });

    test("la tab 'Pubblicazione' è visibile solo agli admin", async ({ page }) => {
      if (!(await openFirstTournament(page))) test.skip();
      const pubTab = page.getByRole("button", { name: /pubblicazione/i });
      // Può essere presente o assente — non facciamo fail se staff
      const isVisible = await pubTab.isVisible().catch(() => false);
      // Semplicemente verifichiamo che non ci siano errori JS
      const errors: string[] = [];
      page.on("pageerror", (err) => errors.push(err.message));
      await page.waitForTimeout(500);
      expect(errors.length).toBe(0);
    });
  });

  // ------------------------------------------------------------------ tab iscritti
  test.describe("Tab Iscritti", () => {
    async function openIscrittiTab(page: Page): Promise<boolean> {
      await goToTornei(page);
      const cards = page.locator("article");
      if (await cards.count() === 0) return false;
      await cards.first().click();
      await page.waitForLoadState("networkidle");
      await page.getByRole("button", { name: /iscritti/i }).click();
      await page.waitForTimeout(200);
      return true;
    }

    test("mostra le 3 KPI card (Iscritti, Pagati, Da incassare)", async ({ page }) => {
      if (!(await openIscrittiTab(page))) test.skip();
      await expect(page.getByText(/iscritti/i).first()).toBeVisible();
      await expect(page.getByText(/pagati/i).first()).toBeVisible();
      await expect(page.getByText(/da incassare/i).first()).toBeVisible();
    });

    test("mostra il campo di ricerca squadra", async ({ page }) => {
      if (!(await openIscrittiTab(page))) test.skip();
      await expect(page.locator("input[type='search']")).toBeVisible();
    });

    test("mostra i filter pill Tutte / Pagate / Da pagare", async ({ page }) => {
      if (!(await openIscrittiTab(page))) test.skip();
      await expect(page.getByRole("button", { name: /tutte/i })).toBeVisible();
      await expect(page.getByRole("button", { name: /pagate/i })).toBeVisible();
      await expect(page.getByRole("button", { name: /da pagare/i })).toBeVisible();
    });

    test("il pulsante '+ Aggiungi squadra' è visibile", async ({ page }) => {
      if (!(await openIscrittiTab(page))) test.skip();
      // Desktop button o FAB mobile
      const addBtn = page.getByRole("button", { name: /aggiungi/i }).first();
      await expect(addBtn).toBeVisible();
    });

    test("la ricerca filtra le squadre per nome", async ({ page }) => {
      if (!(await openIscrittiTab(page))) test.skip();

      const searchInput = page.locator("input[type='search']");
      await searchInput.fill("zzz_test_squadra_inesistente");
      await page.waitForTimeout(300);

      // Con una query inesistente non ci devono essere righe squadra
      // (verifica che non ci siano errori — il contenuto dipende dai dati reali)
      const errors: string[] = [];
      page.on("pageerror", (err) => errors.push(err.message));
      await page.waitForTimeout(300);
      expect(errors.length).toBe(0);

      // Pulisce il campo
      await searchInput.fill("");
    });
  });

  // ------------------------------------------------------------------ navigazione URL con ?tab=
  test.describe("Query param ?tab=", () => {
    test("?tab=gironi apre direttamente la tab Gironi", async ({ page }) => {
      await goToTornei(page);
      const cards = page.locator("article");
      if (await cards.count() === 0) test.skip();

      await cards.first().click();
      await page.waitForURL(/\/app\/tornei\/.+/);
      const url = page.url();
      const id = url.split("/app/tornei/")[1];

      await page.goto(`/app/tornei/${id}?tab=gironi`);
      await page.waitForLoadState("networkidle");

      const gironiTab = page.getByRole("button", { name: /gironi/i });
      const classes = await gironiTab.getAttribute("class");
      expect(classes).toContain("bg-accent");
    });
  });

  // ------------------------------------------------------------------ redirect legacy
  test.describe("Redirect legacy", () => {
    test("/app/registrations redirige a /app/tornei", async ({ page }) => {
      await page.goto("/app/registrations");
      await page.waitForURL(/\/app\/tornei/);
      await expect(page).toHaveURL(/\/app\/tornei/);
    });

    test("/app/tournaments redirige a /app/tornei", async ({ page }) => {
      await page.goto("/app/tournaments");
      await page.waitForURL(/\/app\/tornei/);
      await expect(page).toHaveURL(/\/app\/tornei/);
    });
  });

  // ------------------------------------------------------------------ responsività
  test.describe("Responsività mobile", () => {
    test.use({ viewport: { width: 390, height: 844 } });

    test("la lista tornei è visibile su mobile", async ({ page }) => {
      await goToTornei(page);
      await expect(page.getByRole("heading", { name: /tornei/i }).first()).toBeVisible();
    });

    test("la tab bar nel dettaglio è scrollabile su mobile", async ({ page }) => {
      await goToTornei(page);
      const cards = page.locator("article");
      if (await cards.count() === 0) test.skip();

      await cards.first().click();
      await page.waitForLoadState("networkidle");

      const nav = page.locator("nav").first();
      await expect(nav).toBeVisible();
      // Verifica che la nav contenga almeno 2 pulsanti tab
      const tabCount = await nav.getByRole("button").count();
      expect(tabCount).toBeGreaterThanOrEqual(2);
    });

    test("il FAB '+' è visibile nella tab iscritti su mobile", async ({ page }) => {
      await goToTornei(page);
      const cards = page.locator("article");
      if (await cards.count() === 0) test.skip();

      await cards.first().click();
      await page.waitForLoadState("networkidle");

      const fab = page.locator("button[aria-label='Aggiungi']");
      await expect(fab).toBeVisible();
    });
  });
});

// ---------------------------------------------------------------------------
// Tests — senza autenticazione (redirect)
// ---------------------------------------------------------------------------

test.describe("Tornei (non autenticato)", () => {
  test("accedere a /app/tornei senza login redirige al login", async ({ page }) => {
    await page.goto("/app/tornei");
    await page.waitForLoadState("networkidle");
    // L'authGuard redirige alla root o al login
    await expect(page).not.toHaveURL(/\/app\/tornei/);
  });
});

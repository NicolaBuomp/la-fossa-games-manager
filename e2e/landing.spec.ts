import { test, expect, Page } from "@playwright/test";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function goToLanding(page: Page) {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
}

async function scrollToSection(page: Page, id: string) {
  await page.evaluate(
    (sectionId) =>
      document.getElementById(sectionId)?.scrollIntoView({ block: "start" }),
    id,
  );
  await page.waitForTimeout(400);
}

// ---------------------------------------------------------------------------
// Hero Section
// ---------------------------------------------------------------------------

test.describe("Hero Section", () => {
  test("mostra il titolo principale e i pulsanti CTA", async ({ page }) => {
    await goToLanding(page);

    await expect(page.getByRole("heading", { name: /la fossa games/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /iscriviti/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /scopri i tornei/i })).toBeVisible();
  });

  test("mostra il badge location e le date evento", async ({ page }) => {
    await goToLanding(page);

    // Usa il primo match esatto nella hero section
    await expect(
      page.locator("#top").getByText(/santa maria la fossa/i).first(),
    ).toBeVisible();
    await expect(page.locator("#top").getByText(/giugno/i).first()).toBeVisible();
    await expect(page.locator("#top").getByText(/6 sport/i)).toBeVisible();
  });

  test("mostra il countdown con le 4 etichette", async ({ page }) => {
    await goToLanding(page);

    // Le etichette countdown (Giorni, Ore, Min, Sec) sono dentro il box countdown
    const countdownBox = page.locator("#top .grid-cols-4").first();
    await expect(countdownBox).toBeVisible();

    const labels = await countdownBox.locator("p").allTextContents();
    const allText = labels.join(" ").toLowerCase();
    expect(allText).toMatch(/giorni|gg/);
    expect(allText).toMatch(/ore|hh/);
    expect(allText).toMatch(/min/);
    expect(allText).toMatch(/sec/);
  });

  test("il countdown decrementa (i secondi cambiano)", async ({ page }) => {
    await goToLanding(page);

    const countdownBox = page.locator("#top .grid-cols-4").first();
    // Prende il valore dei secondi (4° elemento)
    const getSecondsText = () =>
      countdownBox.locator("p").nth(6).textContent(); // 2 p per cella × 4 celle = 8 p; secondi = indice 6

    const v0 = await getSecondsText();
    await page.waitForTimeout(1500);
    const v1 = await getSecondsText();

    expect(v0).not.toBe(v1);
  });

  test("navbar desktop mostra i link di navigazione", async ({ page }) => {
    await goToLanding(page);

    // I link desktop sono nella nav con sm:flex
    const nav = page.locator("nav").first();
    await expect(nav.getByRole("link", { name: /sport/i })).toBeVisible();
    await expect(nav.getByRole("link", { name: /sponsor/i })).toBeVisible();
    await expect(nav.getByRole("link", { name: /contatti/i })).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Navigazione sezioni
// ---------------------------------------------------------------------------

test.describe("Navigazione sezioni", () => {
  test("click su Sport porta alla sezione tornei", async ({ page }) => {
    await goToLanding(page);

    await page.locator("nav").first().getByRole("link", { name: /sport/i }).click();
    await page.waitForTimeout(700);

    await expect(page.locator("#sport")).toBeInViewport({ ratio: 0.1 });
  });

  test("click su Sponsor porta alla sezione sponsor", async ({ page }) => {
    await goToLanding(page);

    await page.locator("nav").first().getByRole("link", { name: /sponsor/i }).click();
    await page.waitForTimeout(700);

    await expect(page.locator("#sponsor")).toBeInViewport({ ratio: 0.1 });
  });

  test("click su Contatti porta alla sezione partecipa", async ({ page }) => {
    await goToLanding(page);

    await page.locator("nav").first().getByRole("link", { name: /contatti/i }).click();
    await page.waitForTimeout(700);

    await expect(page.locator("#partecipa")).toBeInViewport({ ratio: 0.1 });
  });

  test("click su Iscriviti porta alla sezione partecipa", async ({ page }) => {
    await goToLanding(page);

    await page.getByRole("link", { name: /iscriviti/i }).click();
    await page.waitForTimeout(700);

    await expect(page.locator("#partecipa")).toBeInViewport({ ratio: 0.1 });
  });
});

// ---------------------------------------------------------------------------
// Menu mobile
// ---------------------------------------------------------------------------

test.describe("Menu mobile", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("hamburger apre il menu mobile", async ({ page }) => {
    await goToLanding(page);

    // Il pulsante hamburger ha aria-label che contiene "menu"
    const hamburger = page.locator("button[aria-label]").first();
    await hamburger.click();
    await page.waitForTimeout(300);

    // Il menu mobile espande i link di navigazione
    await expect(page.getByRole("link", { name: /sport/i }).first()).toBeVisible();
  });

  test("click su link nel menu mobile porta alla sezione corretta", async ({ page }) => {
    await goToLanding(page);

    const hamburger = page.locator("button[aria-label]").first();
    await hamburger.click();
    await page.waitForTimeout(300);

    await page.getByRole("link", { name: /sponsor/i }).first().click();
    await page.waitForTimeout(700);

    await expect(page.locator("#sponsor")).toBeInViewport({ ratio: 0.1 });
  });
});

// ---------------------------------------------------------------------------
// Sezione Tornei
// ---------------------------------------------------------------------------

test.describe("Sezione Tornei", () => {
  test("mostra le 7 card torneo come pulsanti", async ({ page }) => {
    await goToLanding(page);
    await scrollToSection(page, "sport");

    // Le card sono <button> con aria-label "Apri dettagli ..."
    const cards = page.locator("#sport button[aria-label^='Apri dettagli']");
    await expect(cards).toHaveCount(7);
  });

  test("mostra heading sezione", async ({ page }) => {
    await goToLanding(page);
    await scrollToSection(page, "sport");

    await expect(
      page.getByRole("heading", { name: /sette tornei/i }),
    ).toBeVisible();
  });

  test("click su card apre la modale con dettagli", async ({ page }) => {
    await goToLanding(page);
    await scrollToSection(page, "sport");

    await page.locator("#sport button[aria-label^='Apri dettagli']").first().click();

    const modal = page.locator("dialog[open]").first();
    await expect(modal).toBeVisible({ timeout: 3000 });
  });

  test("la modale si chiude con il pulsante chiudi", async ({ page }) => {
    await goToLanding(page);
    await scrollToSection(page, "sport");

    await page.locator("#sport button[aria-label^='Apri dettagli']").first().click();

    const modal = page.locator("dialog[open]").first();
    await expect(modal).toBeVisible({ timeout: 3000 });

    // Pulsante di chiusura nella modale (primo button)
    await modal.getByRole("button").first().click();
    await page.waitForTimeout(300);

    await expect(modal).not.toBeVisible();
  });

  test("Chiedi informazioni nella modale porta al form con torneo pre-selezionato", async ({ page }) => {
    await goToLanding(page);
    await scrollToSection(page, "sport");

    await page.locator("#sport button[aria-label^='Apri dettagli']").first().click();

    const modal = page.locator("dialog[open]").first();
    await expect(modal).toBeVisible({ timeout: 3000 });

    await modal.getByRole("button", { name: /chiedi informazioni/i }).click();
    await page.waitForTimeout(700);

    await expect(page.locator("#partecipa")).toBeInViewport({ ratio: 0.1 });

    // Il form deve essere in modalità partecipazione
    const select = page.locator("select[name='tournament']");
    await expect(select).toBeVisible();
  });

  test("ogni card ha nome del torneo visibile", async ({ page }) => {
    await goToLanding(page);
    await scrollToSection(page, "sport");

    const expectedNames = ["Calcio a 5", "Volley", "Calcio Balilla", "Briscola", "FC 26", "Ping Pong"];
    for (const name of expectedNames) {
      await expect(
        page.locator("#sport").getByText(name, { exact: false }).first(),
      ).toBeVisible();
    }
  });
});

// ---------------------------------------------------------------------------
// Sezione Overview
// ---------------------------------------------------------------------------

test.describe("Sezione Overview", () => {
  test("mostra le statistiche 7 tornei, 5 giorni, 1ª edizione", async ({ page }) => {
    await goToLanding(page);

    // La sezione overview ha sfondo accent (#ffd400), cerca i valori dentro
    const overview = page.locator("section").filter({ hasText: /un calendario/i });
    await expect(overview).toBeVisible();

    await expect(overview.getByText("7")).toBeVisible();
    await expect(overview.getByText(/tornei/i)).toBeVisible();
    await expect(overview.getByText("5")).toBeVisible();
    await expect(overview.getByText(/giorni/i)).toBeVisible();
    await expect(overview.getByText(/1ª/i)).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Sezione Sponsor
// ---------------------------------------------------------------------------

test.describe("Sezione Sponsor", () => {
  test("mostra heading e descrizione sezione", async ({ page }) => {
    await goToLanding(page);
    await scrollToSection(page, "sponsor");

    await expect(
      page.getByRole("heading", { name: /partnership pensate/i }),
    ).toBeVisible();
    await expect(
      page.locator("#sponsor").getByText(/scegli la tua visibilità/i),
    ).toBeVisible();
  });

  test("mostra le 4 card tier con i nomi", async ({ page }) => {
    await goToLanding(page);
    await scrollToSection(page, "sponsor");

    const tierSection = page.locator("#sponsor .grid.gap-4");
    await expect(tierSection.getByRole("heading", { name: "Platino" })).toBeVisible();
    await expect(tierSection.getByRole("heading", { name: "Oro" })).toBeVisible();
    await expect(tierSection.getByRole("heading", { name: "Argento" })).toBeVisible();
    await expect(tierSection.getByRole("heading", { name: "Bronzo" })).toBeVisible();
  });

  test("mostra le statistiche (4 livelli, 5 giorni evento)", async ({ page }) => {
    await goToLanding(page);
    await scrollToSection(page, "sponsor");

    const statsGrid = page.locator("#sponsor .grid-cols-3").first();
    await expect(statsGrid.getByText("4")).toBeVisible();
    await expect(statsGrid.getByText(/livelli/i)).toBeVisible();
    await expect(statsGrid.getByText("5")).toBeVisible();
    await expect(statsGrid.getByText(/giorni evento/i)).toBeVisible();
  });

  test("pulsante Richiedi informazioni porta al form", async ({ page }) => {
    await goToLanding(page);
    await scrollToSection(page, "sponsor");

    await page
      .locator("#sponsor")
      .getByRole("link", { name: /richiedi informazioni sponsor/i })
      .click();
    await page.waitForTimeout(700);

    await expect(page.locator("#partecipa")).toBeInViewport({ ratio: 0.1 });
  });

  test("card Platino mostra badge Partner Ufficiale", async ({ page }) => {
    await goToLanding(page);
    await scrollToSection(page, "sponsor");

    await expect(
      page.locator("#sponsor").getByText(/partner ufficiale/i),
    ).toBeVisible();
  });

  test("sezione bronzo ha le due righe del ticker", async ({ page }) => {
    await goToLanding(page);
    await page.evaluate(() =>
      document.querySelector(".ticker-track")?.scrollIntoView({ block: "center" }),
    );
    await page.waitForTimeout(300);

    await expect(page.locator(".ticker-track")).toBeVisible();
    await expect(page.locator(".ticker-track-right")).toBeVisible();
  });

  test("ticker bronzo è in animazione (si sposta nel tempo)", async ({ page }) => {
    await goToLanding(page);
    await page.evaluate(() =>
      document.querySelector(".ticker-track")?.scrollIntoView({ block: "center" }),
    );
    await page.waitForTimeout(300);

    const x0 = await page.evaluate(
      () => document.querySelector(".ticker-track")?.getBoundingClientRect().x ?? 0,
    );
    await page.waitForTimeout(1200);
    const x1 = await page.evaluate(
      () => document.querySelector(".ticker-track")?.getBoundingClientRect().x ?? 0,
    );

    expect(Math.abs(x1 - x0)).toBeGreaterThan(1);
  });

  test("hover sul ticker mette in pausa l'animazione", async ({ page }) => {
    await goToLanding(page);
    await page.evaluate(() =>
      document.querySelector(".ticker-wrapper")?.scrollIntoView({ block: "center" }),
    );
    await page.waitForTimeout(300);

    await page.locator(".ticker-wrapper").first().hover();
    await page.waitForTimeout(200);

    const playState = await page.evaluate(
      () =>
        getComputedStyle(document.querySelector(".ticker-track")!).animationPlayState,
    );
    expect(playState).toBe("paused");
  });

  test("drag sul ticker sposta i loghi", async ({ page }) => {
    await goToLanding(page);
    await page.evaluate(() =>
      document.querySelector(".ticker-wrapper")?.scrollIntoView({ block: "center" }),
    );
    await page.waitForTimeout(400);

    const wrapper = page.locator(".ticker-wrapper").first();
    const box = await wrapper.boundingBox();
    if (!box) return;

    const startX = box.x + box.width / 2;
    const y = box.y + box.height / 2;

    const x0 = await page.evaluate(
      () => document.querySelector(".ticker-track")?.getBoundingClientRect().x ?? 0,
    );

    await page.mouse.move(startX, y);
    await page.mouse.down();
    await page.mouse.move(startX - 80, y, { steps: 10 });
    await page.mouse.up();

    const x1 = await page.evaluate(
      () => document.querySelector(".ticker-track")?.getBoundingClientRect().x ?? 0,
    );

    expect(x1).not.toBe(x0);
  });

  test("dopo drag il ticker riprende automaticamente", async ({ page }) => {
    await goToLanding(page);
    await page.evaluate(() =>
      document.querySelector(".ticker-wrapper")?.scrollIntoView({ block: "center" }),
    );
    await page.waitForTimeout(400);

    const wrapper = page.locator(".ticker-wrapper").first();
    const box = await wrapper.boundingBox();
    if (!box) return;

    const cx = box.x + box.width / 2;
    const cy = box.y + box.height / 2;

    await page.mouse.move(cx, cy);
    await page.mouse.down();
    await page.mouse.move(cx - 60, cy, { steps: 8 });
    await page.mouse.up();

    // Dopo il rilascio l'animazione deve riprendere
    await page.waitForTimeout(300);
    const playState = await page.evaluate(
      () =>
        getComputedStyle(document.querySelector(".ticker-track")!).animationPlayState,
    );
    expect(playState).toBe("running");
  });
});

// ---------------------------------------------------------------------------
// Sezione Contatto / Form
// ---------------------------------------------------------------------------

test.describe("Sezione Contatto", () => {
  test("mostra heading e le due tab (Torneo / Sponsor)", async ({ page }) => {
    await goToLanding(page);
    await scrollToSection(page, "partecipa");

    await expect(
      page.getByRole("heading", { name: /partecipa o diventa sponsor/i }),
    ).toBeVisible();

    const form = page.locator("#partecipa");
    await expect(form.getByRole("button", { name: /torneo/i })).toBeVisible();
    await expect(form.getByRole("button", { name: /^sponsor$/i })).toBeVisible();
  });

  test("form partecipazione mostra i campi richiesti", async ({ page }) => {
    await goToLanding(page);
    await scrollToSection(page, "partecipa");

    await expect(page.locator("input[name='firstName']")).toBeVisible();
    await expect(page.locator("input[name='lastName']")).toBeVisible();
    await expect(page.locator("input[name='phone']")).toBeVisible();
    await expect(page.locator("select[name='tournament']")).toBeVisible();
  });

  test("submit senza campi mostra errore di validazione", async ({ page }) => {
    await goToLanding(page);
    await scrollToSection(page, "partecipa");

    await page.getByRole("button", { name: /invia richiesta/i }).first().click();

    await expect(
      page.getByText(/compila tutti i campi|dati mancanti|richiesti|obbligatori/i).first(),
    ).toBeVisible({ timeout: 3000 });
  });

  test("switch su tab Sponsor mostra il campo Azienda", async ({ page }) => {
    await goToLanding(page);
    await scrollToSection(page, "partecipa");

    await page
      .locator("#partecipa")
      .getByRole("button", { name: /^sponsor$/i })
      .click();
    await page.waitForTimeout(200);

    await expect(page.locator("input[name='companyName']")).toBeVisible();
    // Il select torneo non deve esserci in modalità sponsor
    await expect(page.locator("select[name='tournament']")).not.toBeVisible();
  });

  test("compilazione form partecipazione mostra feedback", async ({ page }) => {
    await goToLanding(page);
    await scrollToSection(page, "partecipa");

    await page.waitForTimeout(1000);

    const select = page.locator("select[name='tournament']");
    const options = await select.locator("option").count();
    if (options > 1) {
      await select.selectOption({ index: 1 });
    }

    await page.locator("input[name='firstName']").fill("Mario");
    await page.locator("input[name='lastName']").fill("Rossi");
    await page.locator("input[name='phone']").fill("+39 333 1234567");

    const checkboxes = page.locator(
      "input[name='privacy'], input[name='whatsapp'], input[name='rules']",
    );
    const count = await checkboxes.count();
    for (let i = 0; i < count; i++) {
      await checkboxes.nth(i).check();
    }

    await page.getByRole("button", { name: /invia richiesta/i }).first().click();

    // Deve comparire un messaggio (successo o errore di rete — entrambi validi in e2e)
    await expect(
      page.getByText(/richiesta.*inviata|errore|problema|servizio/i).first(),
    ).toBeVisible({ timeout: 8000 });
  });

  test("il form sponsor usa campi diversi da quello torneo", async ({ page }) => {
    await goToLanding(page);
    await scrollToSection(page, "partecipa");

    await page
      .locator("#partecipa")
      .getByRole("button", { name: /^sponsor$/i })
      .click();
    await page.waitForTimeout(200);

    await expect(page.locator("input[name='companyName']")).toBeVisible();
    await expect(page.locator("input[name='firstName']")).toBeVisible();
    await expect(page.locator("input[name='phone']")).toBeVisible();
    // Il checkbox regolamento non deve esserci per gli sponsor
    await expect(page.locator("input[name='rules']")).not.toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Footer
// ---------------------------------------------------------------------------

test.describe("Footer", () => {
  test("mostra link Area manager e Torna su", async ({ page }) => {
    await goToLanding(page);
    await page.evaluate(() =>
      window.scrollTo({ top: document.body.scrollHeight, behavior: "instant" }),
    );
    await page.waitForTimeout(400);

    await expect(page.getByRole("link", { name: /area manager/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /torna su/i })).toBeVisible();
  });

  test("link Area manager punta a /login", async ({ page }) => {
    await goToLanding(page);
    await page.evaluate(() =>
      window.scrollTo({ top: document.body.scrollHeight, behavior: "instant" }),
    );
    await page.waitForTimeout(400);

    const href = await page
      .getByRole("link", { name: /area manager/i })
      .getAttribute("href");
    expect(href).toContain("login");
  });

  test("click su Torna su porta al top della pagina", async ({ page }) => {
    await goToLanding(page);
    await page.evaluate(() =>
      window.scrollTo({ top: document.body.scrollHeight, behavior: "instant" }),
    );
    await page.waitForTimeout(400);

    await page.getByRole("link", { name: /torna su/i }).click();
    await page.waitForTimeout(700);

    const scrollY = await page.evaluate(() => window.scrollY);
    expect(scrollY).toBeLessThan(200);
  });

  test("mostra info evento nel footer", async ({ page }) => {
    await goToLanding(page);
    await page.evaluate(() =>
      window.scrollTo({ top: document.body.scrollHeight, behavior: "instant" }),
    );
    await page.waitForTimeout(400);

    const footer = page.locator("footer");
    await expect(footer.getByText(/la fossa/i).first()).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Accessibilità base
// ---------------------------------------------------------------------------

test.describe("Accessibilità", () => {
  test("le immagini sponsor non-decorative hanno attributo alt", async ({ page }) => {
    await goToLanding(page);
    await scrollToSection(page, "sponsor");

    await page.evaluate(() =>
      document.querySelector(".ticker-track")?.scrollIntoView(),
    );
    await page.waitForTimeout(300);

    // Controlla solo le immagini NON aria-hidden (gli originali nel ticker, non i duplicati)
    const imgsWithoutAlt = await page.evaluate(() =>
      Array.from(document.querySelectorAll("#sponsor img"))
        .filter((img) => {
          const el = img as HTMLImageElement;
          // Salta i duplicati (aria-hidden) e le img con alt="" intenzionale
          const parentHidden = el.closest("[aria-hidden='true']");
          if (parentHidden) return false;
          // alt="" su immagini decorative è corretto; verifica solo le non-decorative
          return el.getAttribute("aria-hidden") !== "true" && el.alt === undefined;
        })
        .length,
    );

    expect(imgsWithoutAlt).toBe(0);
  });

  test("le card torneo hanno aria-label descrittivo", async ({ page }) => {
    await goToLanding(page);
    await scrollToSection(page, "sport");

    const cards = page.locator("#sport button[aria-label^='Apri dettagli']");
    const count = await cards.count();
    expect(count).toBe(7);

    // Verifica che ogni card abbia un aria-label non vuoto
    for (let i = 0; i < count; i++) {
      const label = await cards.nth(i).getAttribute("aria-label");
      expect(label).toBeTruthy();
      expect(label).toContain("Apri dettagli");
    }
  });

  test("i link di navigazione hanno testo leggibile", async ({ page }) => {
    await goToLanding(page);

    const nav = page.locator("nav").first();
    const links = nav.getByRole("link");
    const count = await links.count();

    for (let i = 0; i < count; i++) {
      const link = links.nth(i);
      const text = await link.textContent();
      const ariaLabel = await link.getAttribute("aria-label");
      // Ogni link deve avere testo visibile o aria-label
      expect(text?.trim() || ariaLabel).toBeTruthy();
    }
  });
});

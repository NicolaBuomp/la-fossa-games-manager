const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const sponsorDir = path.join(root, "public", "assets", "sponsor");
const outputDir = path.join(root, "src", "app", "core", "generated");
const outputFile = path.join(outputDir, "sponsor-assets.ts");
const imageExtensions = new Set([
  ".avif",
  ".gif",
  ".jpeg",
  ".jpg",
  ".png",
  ".svg",
  ".webp",
]);

function sponsorName(fileName) {
  return path
    .basename(fileName, path.extname(fileName))
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

const files = fs.existsSync(sponsorDir)
  ? fs
      .readdirSync(sponsorDir, { withFileTypes: true })
      .filter((entry) => entry.isFile())
      .map((entry) => entry.name)
      .filter((fileName) =>
        imageExtensions.has(path.extname(fileName).toLowerCase()),
      )
      .sort((a, b) => a.localeCompare(b, "it"))
  : [];

const sponsors = files.map((fileName) => ({
  name: sponsorName(fileName),
  src: `/assets/sponsor/${fileName}`,
}));

fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(
  outputFile,
  `export type SponsorAsset = {\n  name: string;\n  src: string;\n};\n\nexport const SPONSOR_ASSETS: SponsorAsset[] = ${JSON.stringify(
    sponsors,
    null,
    2,
  )};\n`,
);

console.log(`Generated ${sponsors.length} sponsor asset(s).`);

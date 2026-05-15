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

/** @type {Array<'gold' | 'silver' | 'bronzo'>} */
const CATEGORIES = ["gold", "silver", "bronzo"];

function sponsorName(fileName) {
  return path
    .basename(fileName, path.extname(fileName))
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

const sponsors = [];

for (const category of CATEGORIES) {
  const categoryDir = path.join(sponsorDir, category);
  if (!fs.existsSync(categoryDir)) continue;

  const files = fs
    .readdirSync(categoryDir, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter((fileName) =>
      imageExtensions.has(path.extname(fileName).toLowerCase()),
    )
    .sort((a, b) => a.localeCompare(b, "it"));

  for (const fileName of files) {
    sponsors.push({
      name: sponsorName(fileName),
      src: `/assets/sponsor/${category}/${fileName}`,
      category,
    });
  }
}

fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(
  outputFile,
  `export type SponsorCategory = 'gold' | 'silver' | 'bronzo';

export type SponsorAsset = {
  name: string;
  src: string;
  category: SponsorCategory;
};

export const SPONSOR_ASSETS: SponsorAsset[] = ${JSON.stringify(
    sponsors,
    null,
    2,
  )};
`,
);

console.log(`Generated ${sponsors.length} sponsor asset(s).`);

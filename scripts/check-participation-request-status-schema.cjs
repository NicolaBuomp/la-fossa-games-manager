const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const files = [
  path.join(root, "supabase", "full_schema.sql"),
  path.join(root, "supabase", "sql", "2026-05-14_participation_requests_transferred_status.sql"),
];

const missing = files.filter((file) => {
  const contents = fs.readFileSync(file, "utf8");
  const hasConstraint = contents.includes("participation_requests_status_check");
  const hasTransferredStatus = contents.includes("'trasferita'::text");
  return !hasConstraint || !hasTransferredStatus;
});

if (missing.length) {
  console.error(
    `Missing transferred participation request status in:\n${missing.join("\n")}`,
  );
  process.exit(1);
}

console.log("Participation request status schema includes trasferita.");

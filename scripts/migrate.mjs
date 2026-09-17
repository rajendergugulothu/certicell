// Applies the generated Drizzle SQL migrations to the configured Turso/libSQL
// database, in journal order, recording what has already run.
import { readFileSync, readdirSync } from "node:fs";
import { createClient } from "@libsql/client";

const url = process.env.TURSO_DATABASE_URL;
if (!url) {
  console.error("TURSO_DATABASE_URL is not set.");
  process.exit(1);
}

const client = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN });

await client.execute(
  "CREATE TABLE IF NOT EXISTS _migrations (name TEXT PRIMARY KEY, applied_at TEXT NOT NULL)"
);

const applied = new Set(
  (await client.execute("SELECT name FROM _migrations")).rows.map((r) => r.name)
);

const files = readdirSync("drizzle")
  .filter((f) => f.endsWith(".sql"))
  .sort();

let count = 0;
for (const file of files) {
  if (applied.has(file)) continue;

  // drizzle-kit separates logical statements with this breakpoint marker.
  const statements = readFileSync(`drizzle/${file}`, "utf8")
    .split("--> statement-breakpoint")
    .map((s) => s.trim())
    .filter(Boolean);

  await client.batch(
    [
      ...statements,
      {
        sql: "INSERT INTO _migrations (name, applied_at) VALUES (?, ?)",
        args: [file, new Date().toISOString()],
      },
    ],
    "write"
  );

  console.log(`applied ${file}`);
  count += 1;
}

console.log(count ? `${count} migration(s) applied.` : "Database already up to date.");
client.close();

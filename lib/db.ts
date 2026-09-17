import { createClient, type Client, type InArgs } from "@libsql/client";

/**
 * Turso/libSQL adapter exposing the small slice of the Cloudflare D1 API that
 * the API routes use: prepare().bind().first()/.all()/.run(), plus an atomic
 * batch(). Keeping this shape means the route handlers are storage-agnostic and
 * the test suite's in-memory stub stays valid.
 */

export type Row = Record<string, unknown>;

export interface Prepared {
  bind(...values: unknown[]): Prepared;
  first<T = Row>(): Promise<T | null>;
  all<T = Row>(): Promise<{ results: T[] }>;
  run(): Promise<{ meta: { changes: number } }>;
  /** Consumed by batch() to build an atomic transaction. */
  readonly statement: { sql: string; args: InArgs };
}

export interface Database {
  prepare(sql: string): Prepared;
  batch(statements: Prepared[]): Promise<{ meta: { changes: number } }[]>;
}

let client: Client | null = null;

function getClient(): Client {
  if (client) return client;

  const url = process.env.TURSO_DATABASE_URL;
  if (!url) {
    throw new Error(
      "TURSO_DATABASE_URL is not set. Point it at your Turso database (or a local file: URL) before using the database."
    );
  }

  client = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN });
  return client;
}

/** libSQL rejects `undefined`; D1 accepted it as SQL NULL. */
function toArgs(values: unknown[]): InArgs {
  return values.map((value) => (value === undefined ? null : value)) as InArgs;
}

function prepare(sql: string): Prepared {
  let args: InArgs = [];

  const prepared: Prepared = {
    bind(...values: unknown[]) {
      args = toArgs(values);
      return prepared;
    },
    async first<T = Row>() {
      const { rows } = await getClient().execute({ sql, args });
      return (rows[0] as T | undefined) ?? null;
    },
    async all<T = Row>() {
      const { rows } = await getClient().execute({ sql, args });
      return { results: rows as unknown as T[] };
    },
    async run() {
      const result = await getClient().execute({ sql, args });
      return { meta: { changes: Number(result.rowsAffected) } };
    },
    get statement() {
      return { sql, args };
    },
  };

  return prepared;
}

export function db(): Database {
  return {
    prepare,
    async batch(statements: Prepared[]) {
      // libSQL "write" batches run in a single transaction and roll back as a
      // unit, matching D1 batch semantics that intake and issuance rely on.
      const results = await getClient().batch(
        statements.map((s) => s.statement),
        "write"
      );
      return results.map((r) => ({ meta: { changes: Number(r.rowsAffected) } }));
    },
  };
}

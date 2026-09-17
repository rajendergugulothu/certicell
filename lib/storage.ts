import { put, del, head } from "@vercel/blob";

/**
 * Vercel Blob adapter exposing the slice of the Cloudflare R2 binding API that
 * app/api/reports/route.ts uses: get/put/delete keyed by object key.
 *
 * Blob URLs are unguessable but publicly reachable, so report bytes are never
 * handed to the browser directly. The route authorizes the owner and then
 * streams the object through itself, which is the same posture the R2 binding
 * had.
 */

export interface StoredObject {
  body: ReadableStream<Uint8Array>;
}

export interface Bucket {
  get(key: string): Promise<StoredObject | null>;
  put(
    key: string,
    bytes: Uint8Array,
    options?: { httpMetadata?: { contentType?: string } }
  ): Promise<void>;
  delete(key: string): Promise<void>;
}

function blobUrl(key: string): string {
  const base = process.env.BLOB_PUBLIC_BASE_URL;
  if (!base) {
    throw new Error(
      "BLOB_PUBLIC_BASE_URL is not set. Copy it from your Vercel Blob store settings."
    );
  }
  return `${base.replace(/\/+$/, "")}/${key}`;
}

export function bucket(): Bucket {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error("Report storage unavailable");
  }

  return {
    async get(key: string) {
      const url = blobUrl(key);
      try {
        // head() confirms the object exists before we spend a fetch on it.
        await head(url);
      } catch {
        return null;
      }
      const response = await fetch(url);
      if (!response.ok || !response.body) return null;
      return { body: response.body };
    },

    async put(key, bytes, options) {
      await put(key, Buffer.from(bytes), {
        access: "public",
        addRandomSuffix: false,
        contentType: options?.httpMetadata?.contentType ?? "application/pdf",
      });
    },

    async delete(key) {
      await del(blobUrl(key));
    },
  };
}

export async function readLimited(request: Request, limit: number) {
  if (Number(request.headers.get("content-length") || 0) > limit)
    throw new Error("File exceeds 10 MB.");
  const reader = request.body?.getReader();
  if (!reader) throw new Error("File is empty.");
  let length = 0;
  const parts: Uint8Array[] = [];
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    length += value.length;
    if (length > limit) {
      await reader.cancel();
      throw new Error("File exceeds 10 MB.");
    }
    parts.push(value);
  }
  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const p of parts) {
    bytes.set(p, offset);
    offset += p.length;
  }
  return bytes;
}

import { getGenAI, waitForUpload } from "@/lib/gemini";
import type { CustomMetadata } from "@google/genai";

export const runtime = "nodejs";
export const maxDuration = 300;

interface ParsedMetadata {
  customMetadata: CustomMetadata[];
  errors: string[];
}

function parseMetadata(raw: string | null): ParsedMetadata {
  if (!raw) return { customMetadata: [], errors: [] };
  const errors: string[] = [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { customMetadata: [], errors: ["metadata must be a JSON array"] };
  }
  if (!Array.isArray(parsed)) {
    return { customMetadata: [], errors: ["metadata must be a JSON array"] };
  }
  const customMetadata: CustomMetadata[] = [];
  for (const entry of parsed) {
    if (!entry || typeof entry !== "object") continue;
    const key = (entry as { key?: unknown }).key;
    const value = (entry as { value?: unknown }).value;
    if (typeof key !== "string" || !key.trim()) continue;
    if (typeof value === "number") {
      customMetadata.push({ key: key.trim(), numericValue: value });
    } else if (typeof value === "string" && value.length > 0) {
      customMetadata.push({ key: key.trim(), stringValue: value });
    } else {
      errors.push(`Skipped metadata "${key}" — value must be a non-empty string or number.`);
    }
  }
  return { customMetadata, errors };
}

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get("file");
    const storeName = form.get("storeName");
    const displayName = form.get("displayName");
    const metadataRaw = form.get("metadata");
    const maxTokens = form.get("maxTokensPerChunk");
    const maxOverlap = form.get("maxOverlapTokens");

    if (!(file instanceof Blob)) {
      return Response.json({ error: "file is required" }, { status: 400 });
    }
    if (typeof storeName !== "string" || !storeName.trim()) {
      return Response.json({ error: "storeName is required" }, { status: 400 });
    }

    const { customMetadata, errors } = parseMetadata(typeof metadataRaw === "string" ? metadataRaw : null);

    const ai = getGenAI();
    const op = await ai.fileSearchStores.uploadToFileSearchStore({
      file,
      fileSearchStoreName: storeName,
      config: {
        displayName: typeof displayName === "string" && displayName ? displayName : (file as File).name,
        mimeType: file.type || undefined,
        customMetadata: customMetadata.length > 0 ? customMetadata : undefined,
        chunkingConfig:
          maxTokens || maxOverlap
            ? {
                whiteSpaceConfig: {
                  maxTokensPerChunk: maxTokens ? Number(maxTokens) : undefined,
                  maxOverlapTokens: maxOverlap ? Number(maxOverlap) : undefined,
                },
              }
            : undefined,
      },
    });

    const done = await waitForUpload(op);
    return Response.json({ ok: true, document: done.response, warnings: errors });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}

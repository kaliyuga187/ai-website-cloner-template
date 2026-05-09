import { GoogleGenAI, type FileSearchStore, type UploadToFileSearchStoreOperation } from "@google/genai";

let cached: GoogleGenAI | null = null;

export function getGenAI(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set. Add it to .env.local.");
  }
  if (!cached) {
    cached = new GoogleGenAI({ apiKey });
  }
  return cached;
}

export async function listFileSearchStores(): Promise<FileSearchStore[]> {
  const ai = getGenAI();
  const pager = await ai.fileSearchStores.list({ config: { pageSize: 50 } });
  const stores: FileSearchStore[] = [];
  for await (const store of pager) {
    stores.push(store);
  }
  return stores;
}

export async function createFileSearchStore(displayName: string): Promise<FileSearchStore> {
  const ai = getGenAI();
  return ai.fileSearchStores.create({ config: { displayName } });
}

export async function waitForUpload(
  op: UploadToFileSearchStoreOperation,
  { intervalMs = 1500, timeoutMs = 120_000 }: { intervalMs?: number; timeoutMs?: number } = {},
): Promise<UploadToFileSearchStoreOperation> {
  const ai = getGenAI();
  const start = Date.now();
  let current = op;
  while (!current.done) {
    if (Date.now() - start > timeoutMs) {
      throw new Error("Timed out waiting for file import to complete.");
    }
    await new Promise((r) => setTimeout(r, intervalMs));
    current = (await ai.operations.get({ operation: current })) as UploadToFileSearchStoreOperation;
  }
  if (current.error) {
    throw new Error(`File import failed: ${JSON.stringify(current.error)}`);
  }
  return current;
}

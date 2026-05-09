import { createFileSearchStore, listFileSearchStores } from "@/lib/gemini";
import type { StoreSummary } from "@/types/file-search";

export const runtime = "nodejs";

function summarize(store: Awaited<ReturnType<typeof listFileSearchStores>>[number]): StoreSummary {
  return {
    name: store.name ?? "",
    displayName: store.displayName ?? store.name ?? "",
    activeDocumentsCount: store.activeDocumentsCount,
    pendingDocumentsCount: store.pendingDocumentsCount,
    failedDocumentsCount: store.failedDocumentsCount,
    createTime: store.createTime,
  };
}

export async function GET() {
  try {
    const stores = await listFileSearchStores();
    return Response.json({ stores: stores.map(summarize) });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { displayName } = (await request.json()) as { displayName?: string };
    if (!displayName?.trim()) {
      return Response.json({ error: "displayName is required" }, { status: 400 });
    }
    const store = await createFileSearchStore(displayName.trim());
    return Response.json({ store: summarize(store) });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}

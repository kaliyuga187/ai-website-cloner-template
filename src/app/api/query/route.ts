import { getGenAI } from "@/lib/gemini";
import type { CitationSource, CitationSpan, MetadataKV, QueryResult } from "@/types/file-search";
import type { GroundingChunkCustomMetadata } from "@google/genai";

export const runtime = "nodejs";
export const maxDuration = 60;

interface QueryBody {
  question?: string;
  storeNames?: string[];
  metadataFilter?: string;
  topK?: number;
  model?: string;
}

function metadataToKV(items?: GroundingChunkCustomMetadata[]): MetadataKV[] | undefined {
  if (!items || items.length === 0) return undefined;
  return items
    .filter((m) => typeof m.key === "string" && m.key.length > 0)
    .map((m) => {
      const value =
        m.stringValue ??
        (typeof m.numericValue === "number" ? String(m.numericValue) : m.stringListValue?.values?.join(", ") ?? "");
      return { key: m.key as string, value };
    });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as QueryBody;
    const question = body.question?.trim();
    const storeNames = (body.storeNames ?? []).filter((n): n is string => typeof n === "string" && n.length > 0);
    if (!question) return Response.json({ error: "question is required" }, { status: 400 });
    if (storeNames.length === 0) return Response.json({ error: "at least one storeName is required" }, { status: 400 });

    const ai = getGenAI();
    const response = await ai.models.generateContent({
      model: body.model ?? "gemini-2.5-flash",
      contents: question,
      config: {
        tools: [
          {
            fileSearch: {
              fileSearchStoreNames: storeNames,
              metadataFilter: body.metadataFilter?.trim() || undefined,
              topK: body.topK && body.topK > 0 ? body.topK : undefined,
            },
          },
        ],
      },
    });

    const candidate = response.candidates?.[0];
    const grounding = candidate?.groundingMetadata;
    const sources: CitationSource[] = (grounding?.groundingChunks ?? []).map((chunk, index) => {
      const ctx = chunk.retrievedContext;
      return {
        index,
        title: ctx?.title,
        uri: ctx?.uri,
        text: ctx?.text,
        pageNumber: ctx?.pageNumber,
        fileSearchStore: ctx?.fileSearchStore,
        customMetadata: metadataToKV(ctx?.customMetadata),
      };
    });
    const spans: CitationSpan[] = (grounding?.groundingSupports ?? [])
      .filter((s) => s.segment && (s.groundingChunkIndices?.length ?? 0) > 0)
      .map((s) => ({
        startIndex: s.segment?.startIndex ?? 0,
        endIndex: s.segment?.endIndex ?? 0,
        chunkIndices: s.groundingChunkIndices ?? [],
        confidenceScores: s.confidenceScores,
      }));

    const result: QueryResult = {
      answer: response.text ?? "",
      sources,
      spans,
    };
    return Response.json(result);
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}

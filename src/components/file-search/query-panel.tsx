"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { CitationSpan, QueryResult } from "@/types/file-search";

interface Props {
  storeName: string | null;
}

interface AnnotatedToken {
  text: string;
  citations: number[];
}

function annotateAnswer(answer: string, spans: CitationSpan[]): AnnotatedToken[] {
  if (!answer) return [];
  if (spans.length === 0) return [{ text: answer, citations: [] }];
  // Byte offsets approximate char offsets for ASCII; clamp to string length.
  const max = answer.length;
  const events = spans
    .map((s) => ({
      end: Math.min(Math.max(s.endIndex, 0), max),
      indices: s.chunkIndices,
    }))
    .filter((e) => e.end > 0)
    .sort((a, b) => a.end - b.end);

  const tokens: AnnotatedToken[] = [];
  let cursor = 0;
  for (const e of events) {
    if (e.end <= cursor) continue;
    tokens.push({ text: answer.slice(cursor, e.end), citations: e.indices });
    cursor = e.end;
  }
  if (cursor < max) tokens.push({ text: answer.slice(cursor), citations: [] });
  return tokens;
}

export function QueryPanel({ storeName }: Props) {
  const [question, setQuestion] = useState("");
  const [metadataFilter, setMetadataFilter] = useState("");
  const [topK, setTopK] = useState("");
  const [model, setModel] = useState("gemini-2.5-flash");
  const [result, setResult] = useState<QueryResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!storeName || !question.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: question.trim(),
          storeNames: [storeName],
          metadataFilter: metadataFilter.trim() || undefined,
          topK: topK ? Number(topK) : undefined,
          model,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Query failed");
      setResult(data as QueryResult);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  const tokens = result ? annotateAnswer(result.answer, result.spans) : [];

  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <h2 className="text-base font-semibold">Ask a question</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Gemini retrieves the top-k chunks from the selected store, optionally filtered by metadata, and returns a
        grounded answer with page citations.
      </p>

      <form onSubmit={submit} className="mt-4 grid gap-3">
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          rows={3}
          required
          disabled={!storeName || loading}
          placeholder="e.g. How do I reset the device?"
          className="w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Metadata filter <span className="font-mono">e.g. doc_type=&quot;manual&quot;</span>
            </label>
            <input
              type="text"
              value={metadataFilter}
              onChange={(e) => setMetadataFilter(e.target.value)}
              disabled={!storeName || loading}
              className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder='Optional, e.g. doc_type="manual"'
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">topK</label>
            <input
              type="number"
              min={1}
              max={20}
              value={topK}
              onChange={(e) => setTopK(e.target.value)}
              disabled={!storeName || loading}
              placeholder="default"
              className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            disabled={loading}
            className="rounded-md border border-input bg-background px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="gemini-2.5-flash">gemini-2.5-flash</option>
            <option value="gemini-2.5-pro">gemini-2.5-pro</option>
            <option value="gemini-2.0-flash">gemini-2.0-flash</option>
          </select>
          <Button type="submit" disabled={!storeName || !question.trim() || loading} size="sm">
            {loading ? "Thinking…" : "Ask"}
          </Button>
        </div>
      </form>

      {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

      {result && (
        <div className="mt-6 grid gap-5">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Answer</h3>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6">
              {tokens.length === 0 && <span className="text-muted-foreground">No answer returned.</span>}
              {tokens.map((t, i) => (
                <span key={i}>
                  {t.text}
                  {t.citations.length > 0 && (
                    <sup className="ml-0.5 font-mono text-[10px] text-primary">
                      [{t.citations.map((c) => c + 1).join(",")}]
                    </sup>
                  )}
                </span>
              ))}
            </p>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Sources ({result.sources.length})
            </h3>
            {result.sources.length === 0 ? (
              <p className="mt-2 text-xs text-muted-foreground">No grounding chunks were used.</p>
            ) : (
              <ol className="mt-2 grid gap-2.5">
                {result.sources.map((s) => (
                  <li
                    key={s.index}
                    className="rounded-md border border-border bg-background px-3 py-2.5 text-sm"
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="font-medium">
                        <span className="font-mono text-xs text-primary">[{s.index + 1}]</span>{" "}
                        {s.title ?? "Untitled chunk"}
                      </span>
                      {typeof s.pageNumber === "number" && (
                        <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                          page {s.pageNumber}
                        </span>
                      )}
                    </div>
                    {s.text && (
                      <p className="mt-1 line-clamp-4 text-xs text-muted-foreground">{s.text}</p>
                    )}
                    {s.customMetadata && s.customMetadata.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {s.customMetadata.map((m, i) => (
                          <span
                            key={`${m.key}-${i}`}
                            className="rounded bg-secondary px-1.5 py-0.5 font-mono text-[10px] text-secondary-foreground"
                          >
                            {m.key}={m.value}
                          </span>
                        ))}
                      </div>
                    )}
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

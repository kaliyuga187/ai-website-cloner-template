"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

interface MetadataRow {
  key: string;
  value: string;
}

interface Props {
  storeName: string | null;
  onUploaded: () => void;
}

export function UploadForm({ storeName, onUploaded }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [metadata, setMetadata] = useState<MetadataRow[]>([{ key: "", value: "" }]);
  const [maxTokens, setMaxTokens] = useState("");
  const [maxOverlap, setMaxOverlap] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  function setRow(i: number, patch: Partial<MetadataRow>) {
    setMetadata((rows) => rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }

  function addRow() {
    setMetadata((rows) => [...rows, { key: "", value: "" }]);
  }

  function removeRow(i: number) {
    setMetadata((rows) => (rows.length === 1 ? rows : rows.filter((_, idx) => idx !== i)));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !storeName) return;
    setSubmitting(true);
    setStatus(null);
    try {
      const cleaned = metadata.filter((m) => m.key.trim() && m.value.trim()).map((m) => ({ key: m.key.trim(), value: m.value.trim() }));
      const form = new FormData();
      form.set("file", file);
      form.set("storeName", storeName);
      if (displayName.trim()) form.set("displayName", displayName.trim());
      if (cleaned.length > 0) form.set("metadata", JSON.stringify(cleaned));
      if (maxTokens) form.set("maxTokensPerChunk", maxTokens);
      if (maxOverlap) form.set("maxOverlapTokens", maxOverlap);

      const res = await fetch("/api/upload", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      setStatus({ kind: "ok", text: `Imported ${file.name}.` });
      setFile(null);
      setDisplayName("");
      setMetadata([{ key: "", value: "" }]);
      setMaxTokens("");
      setMaxOverlap("");
      onUploaded();
    } catch (err) {
      setStatus({ kind: "err", text: (err as Error).message });
    } finally {
      setSubmitting(false);
    }
  }

  const disabled = !storeName || !file || submitting;

  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <h2 className="text-base font-semibold">Import a document</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        PDFs, images, audio, video, text, or code. Custom metadata becomes filterable at query time.
      </p>

      <form onSubmit={submit} className="mt-4 grid gap-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">File</label>
          <input
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            disabled={!storeName || submitting}
            className="block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-sm file:font-medium hover:file:bg-secondary/80"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Display name (optional)</label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            disabled={submitting}
            className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder={file?.name ?? "Defaults to file name"}
          />
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between">
            <label className="block text-xs font-medium text-muted-foreground">Custom metadata</label>
            <Button type="button" variant="ghost" size="xs" onClick={addRow} disabled={submitting}>
              + Add row
            </Button>
          </div>
          <div className="grid gap-2">
            {metadata.map((row, i) => (
              <div key={i} className="flex gap-2">
                <input
                  type="text"
                  value={row.key}
                  onChange={(e) => setRow(i, { key: e.target.value })}
                  disabled={submitting}
                  placeholder="key (e.g. doc_type)"
                  className="flex-1 rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <input
                  type="text"
                  value={row.value}
                  onChange={(e) => setRow(i, { value: e.target.value })}
                  disabled={submitting}
                  placeholder="value"
                  className="flex-1 rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => removeRow(i)}
                  disabled={submitting || metadata.length === 1}
                  aria-label="Remove row"
                >
                  ×
                </Button>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Max tokens / chunk</label>
            <input
              type="number"
              value={maxTokens}
              onChange={(e) => setMaxTokens(e.target.value)}
              disabled={submitting}
              placeholder="default"
              className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Max overlap tokens</label>
            <input
              type="number"
              value={maxOverlap}
              onChange={(e) => setMaxOverlap(e.target.value)}
              disabled={submitting}
              placeholder="default"
              className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <Button type="submit" disabled={disabled} size="sm">
            {submitting ? "Importing…" : "Import"}
          </Button>
          {status && (
            <span className={`text-xs ${status.kind === "ok" ? "text-foreground" : "text-destructive"}`}>
              {status.text}
            </span>
          )}
        </div>
      </form>
    </section>
  );
}

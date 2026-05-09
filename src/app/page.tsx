"use client";

import { useState } from "react";
import { StoreSelector } from "@/components/file-search/store-selector";
import { UploadForm } from "@/components/file-search/upload-form";
import { QueryPanel } from "@/components/file-search/query-panel";

export default function Home() {
  const [selectedStore, setSelectedStore] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
      <header className="mb-8">
        <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
          Gemini File Search · Multimodal RAG
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
          Upload, filter by metadata, and ask grounded questions.
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          A minimal demo of Gemini&apos;s managed File Search tool: create a store, import documents with custom
          metadata and chunking config, then query with optional metadata filters and inspect page-level citations.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <div className="grid gap-6">
          <StoreSelector selected={selectedStore} onSelect={setSelectedStore} />
          <UploadForm
            key={refreshKey}
            storeName={selectedStore}
            onUploaded={() => setRefreshKey((k) => k + 1)}
          />
        </div>
        <QueryPanel storeName={selectedStore} />
      </div>

      <footer className="mt-12 border-t border-border pt-4 text-xs text-muted-foreground">
        Requires <code className="font-mono">GEMINI_API_KEY</code> in <code className="font-mono">.env.local</code>.
        Files imported into a store persist until deleted; raw uploads in the Files API expire after 48 hours.
      </footer>
    </main>
  );
}

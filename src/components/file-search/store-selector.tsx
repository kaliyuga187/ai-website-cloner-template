"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import type { StoreSummary } from "@/types/file-search";

interface Props {
  selected: string | null;
  onSelect: (storeName: string) => void;
}

export function StoreSelector({ selected, onSelect }: Props) {
  const [stores, setStores] = useState<StoreSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stores");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load stores");
      setStores(data.stores);
      if (!selected && data.stores.length > 0) {
        onSelect(data.stores[0].name);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function createStore() {
    if (!newName.trim()) return;
    setCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/stores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName: newName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create store");
      setNewName("");
      await refresh();
      onSelect(data.store.name);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setCreating(false);
    }
  }

  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <header className="flex items-baseline justify-between">
        <h2 className="text-base font-semibold">Stores</h2>
        <Button variant="ghost" size="xs" onClick={refresh} disabled={loading}>
          {loading ? "Refreshing…" : "Refresh"}
        </Button>
      </header>

      <div className="mt-3 flex flex-col gap-1.5">
        {stores.length === 0 && !loading && (
          <p className="text-xs text-muted-foreground">No stores yet — create one below.</p>
        )}
        {stores.map((s) => {
          const isSelected = s.name === selected;
          return (
            <button
              key={s.name}
              type="button"
              onClick={() => onSelect(s.name)}
              className={`flex items-center justify-between rounded-md border px-3 py-2 text-left text-sm transition-colors ${
                isSelected
                  ? "border-primary bg-primary/5"
                  : "border-border hover:bg-muted"
              }`}
            >
              <span>
                <span className="font-medium">{s.displayName}</span>
                <span className="ml-2 text-xs text-muted-foreground">{s.name}</span>
              </span>
              <span className="text-xs text-muted-foreground">
                {s.activeDocumentsCount ?? "0"} active
                {Number(s.pendingDocumentsCount ?? 0) > 0 ? ` · ${s.pendingDocumentsCount} pending` : ""}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex gap-2">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New store display name"
          className="flex-1 rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          disabled={creating}
        />
        <Button onClick={createStore} disabled={creating || !newName.trim()} size="sm">
          {creating ? "Creating…" : "Create"}
        </Button>
      </div>

      {error && <p className="mt-3 text-xs text-destructive">{error}</p>}
    </section>
  );
}

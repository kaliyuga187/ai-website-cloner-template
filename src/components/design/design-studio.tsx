"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import type { DesignMessage } from "@/types/design";

const HTML_FENCE = /```html\s*\n([\s\S]*?)\n```/i;
const PARTIAL_HTML_FENCE = /```html\s*\n([\s\S]*)$/i;

function extractHtml(text: string): { html: string | null; partial: boolean } {
  const complete = text.match(HTML_FENCE);
  if (complete) return { html: complete[1], partial: false };
  const partial = text.match(PARTIAL_HTML_FENCE);
  if (partial) return { html: partial[1], partial: true };
  return { html: null, partial: false };
}

function extractCommentary(text: string): string {
  const idx = text.indexOf("```html");
  if (idx === -1) return text.trim();
  return text.slice(0, idx).trim();
}

export function DesignStudio() {
  const [messages, setMessages] = useState<DesignMessage[]>([]);
  const [input, setInput] = useState("");
  const [streamingText, setStreamingText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<"preview" | "code">("preview");
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  const lastAssistant = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === "assistant") return messages[i].content;
    }
    return "";
  }, [messages]);

  const renderedSource = streamingText || lastAssistant;
  const { html, partial } = useMemo(() => extractHtml(renderedSource), [renderedSource]);
  const commentary = useMemo(() => extractCommentary(renderedSource), [renderedSource]);

  async function send() {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const next: DesignMessage[] = [...messages, { role: "user", content: trimmed }];
    setMessages(next);
    setInput("");
    setStreamingText("");
    setError(null);
    setLoading(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/design", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
        signal: controller.signal,
      });
      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setStreamingText(acc);
      }
      acc += decoder.decode();
      setStreamingText("");
      setMessages([...next, { role: "assistant", content: acc }]);
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      setError((err as Error).message);
      setStreamingText("");
      setMessages(messages);
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  }

  function reset() {
    abortRef.current?.abort();
    setMessages([]);
    setStreamingText("");
    setError(null);
    setInput("");
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      send();
    }
  }

  return (
    <div className="grid h-full grid-rows-[1fr_auto] gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] lg:grid-rows-1">
      <aside className="flex min-h-0 flex-col rounded-xl border border-border bg-card">
        <header className="flex items-baseline justify-between border-b border-border px-5 py-3">
          <h2 className="text-sm font-semibold">Conversation</h2>
          <Button variant="ghost" size="xs" onClick={reset} disabled={loading || messages.length === 0}>
            New
          </Button>
        </header>
        <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
          {messages.length === 0 && !loading && (
            <p className="text-sm text-muted-foreground">
              Describe what you want to build below. If you don&apos;t pin a direction, Claude will propose four
              before committing.
            </p>
          )}
          {messages.map((m, i) => {
            if (m.role === "user") {
              return (
                <div key={i} className="rounded-lg border border-border bg-background px-3 py-2">
                  <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">You</p>
                  <p className="mt-1 whitespace-pre-wrap text-sm">{m.content}</p>
                </div>
              );
            }
            return (
              <div key={i} className="rounded-lg bg-muted px-3 py-2">
                <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Claude</p>
                <p className="mt-1 whitespace-pre-wrap text-sm">{extractCommentary(m.content) || "(designed prototype)"}</p>
              </div>
            );
          })}
          {loading && streamingText && (
            <div className="rounded-lg bg-muted px-3 py-2">
              <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Claude</p>
              <p className="mt-1 whitespace-pre-wrap text-sm">
                {commentary || <span className="text-muted-foreground">Thinking…</span>}
              </p>
            </div>
          )}
        </div>
        {error && <p className="border-t border-border px-5 py-2 text-xs text-destructive">{error}</p>}
        <div className="border-t border-border p-3">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            disabled={loading}
            rows={3}
            placeholder={
              messages.length === 0
                ? "e.g. Landing page for a third-wave coffee roaster in Oslo."
                : "Refine the prototype…"
            }
            className="w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <div className="mt-2 flex items-center justify-between">
            <p className="text-[10px] text-muted-foreground">⌘/Ctrl + Enter to send</p>
            <Button onClick={send} disabled={loading || !input.trim()} size="sm">
              {loading ? "Designing…" : "Send"}
            </Button>
          </div>
        </div>
      </aside>

      <section className="flex min-h-0 flex-col rounded-xl border border-border bg-card">
        <header className="flex items-center justify-between border-b border-border px-5 py-3">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-semibold">Prototype</h2>
            {partial && loading && (
              <span className="rounded bg-muted px-2 py-0.5 font-mono text-[10px] uppercase text-muted-foreground">
                streaming
              </span>
            )}
          </div>
          <div className="flex gap-1">
            <Button
              variant={view === "preview" ? "secondary" : "ghost"}
              size="xs"
              onClick={() => setView("preview")}
            >
              Preview
            </Button>
            <Button
              variant={view === "code" ? "secondary" : "ghost"}
              size="xs"
              onClick={() => setView("code")}
              disabled={!html}
            >
              Code
            </Button>
          </div>
        </header>
        <div className="flex-1 overflow-hidden">
          {!html && !loading && (
            <div className="flex h-full items-center justify-center p-10 text-center text-sm text-muted-foreground">
              Your generated prototype will appear here.
            </div>
          )}
          {!html && loading && (
            <div className="flex h-full items-center justify-center p-10 text-center text-sm text-muted-foreground">
              Waiting for HTML…
            </div>
          )}
          {html && view === "preview" && (
            <iframe
              key={html.length}
              title="Prototype preview"
              srcDoc={html}
              sandbox="allow-scripts"
              className="h-full w-full bg-white"
            />
          )}
          {html && view === "code" && (
            <pre className="h-full overflow-auto bg-background p-4 font-mono text-xs leading-5">
              <code>{html}</code>
            </pre>
          )}
        </div>
      </section>
    </div>
  );
}

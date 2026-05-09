import { DesignStudio } from "@/components/design/design-studio";

export const metadata = {
  title: "Claude Design Studio",
  description: "Brief Claude, get a live HTML prototype, iterate via chat.",
};

export default function DesignPage() {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-6 py-6">
      <header className="mb-4">
        <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
          Claude Design Studio
        </p>
        <h1 className="mt-1 text-xl font-semibold tracking-tight">
          Brief, preview, iterate.
        </h1>
        <p className="mt-1 max-w-2xl text-xs text-muted-foreground">
          A minimal take on Anthropic&apos;s Claude Design — describe what you want, Claude returns a self-contained
          Tailwind prototype that previews live in the iframe. Refine via follow-up turns.
        </p>
      </header>

      <div className="flex-1 min-h-[60vh] lg:min-h-[calc(100vh-12rem)]">
        <DesignStudio />
      </div>
    </main>
  );
}

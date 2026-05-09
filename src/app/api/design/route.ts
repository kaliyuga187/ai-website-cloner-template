import Anthropic from "@anthropic-ai/sdk";
import { DESIGN_SYSTEM_PROMPT, getAnthropic } from "@/lib/anthropic";
import type { DesignMessage } from "@/types/design";

export const runtime = "nodejs";
export const maxDuration = 300;

interface DesignBody {
  messages?: DesignMessage[];
}

function isValidMessages(messages: unknown): messages is DesignMessage[] {
  if (!Array.isArray(messages) || messages.length === 0) return false;
  return messages.every(
    (m): m is DesignMessage =>
      m !== null &&
      typeof m === "object" &&
      (m as DesignMessage).role !== undefined &&
      ((m as DesignMessage).role === "user" || (m as DesignMessage).role === "assistant") &&
      typeof (m as DesignMessage).content === "string" &&
      (m as DesignMessage).content.length > 0,
  );
}

export async function POST(request: Request) {
  let body: DesignBody;
  try {
    body = (await request.json()) as DesignBody;
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (!isValidMessages(body.messages)) {
    return Response.json({ error: "messages must be a non-empty array of {role, content}" }, { status: 400 });
  }
  if (body.messages[0].role !== "user") {
    return Response.json({ error: "first message must have role 'user'" }, { status: 400 });
  }

  let client: Anthropic;
  try {
    client = getAnthropic();
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }

  const apiMessages: Anthropic.MessageParam[] = body.messages.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const messageStream = client.messages.stream({
          model: "claude-opus-4-7",
          max_tokens: 32000,
          thinking: { type: "adaptive" },
          output_config: { effort: "xhigh" },
          system: [
            {
              type: "text",
              text: DESIGN_SYSTEM_PROMPT,
              cache_control: { type: "ephemeral" },
            },
          ],
          messages: apiMessages,
        });

        messageStream.on("text", (delta) => {
          controller.enqueue(encoder.encode(delta));
        });

        await messageStream.finalMessage();
        controller.close();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Stream failed";
        controller.enqueue(encoder.encode(`\n\n[ERROR] ${message}`));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Accel-Buffering": "no",
    },
  });
}

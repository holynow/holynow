import Anthropic from "@anthropic-ai/sdk";

export const MODEL = process.env.CLAUDE_MODEL || "claude-opus-5-5";

let client: Anthropic | null = null;
function getClient(): Anthropic {
  client ??= new Anthropic();
  return client;
}

export class AiError extends Error {
  constructor(message: string, public status = 500) {
    super(message);
  }
}

type Content = Anthropic.Beta.BetaContentBlockParam[] | string;

interface AskOptions {
  system: string;
  content: Content;
  schema?: Record<string, unknown>;
  effort?: "low" | "medium" | "high";
  maxTokens?: number;
}

// Claude 호출 공통 함수. schema가 있으면 JSON 구조화 출력으로 받는다.
export async function ask({ system, content, schema, effort = "medium", maxTokens = 16000 }: AskOptions): Promise<string> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new AiError("서버에 ANTHROPIC_API_KEY가 설정되지 않았습니다.", 503);
  }
  try {
    const response = await getClient().beta.messages.create({
      model: MODEL,
      max_tokens: maxTokens,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system,
      output_config: {
        effort,
        ...(schema ? { format: { type: "json_schema", schema } } : {}),
      },
      messages: [{ role: "user", content }],
    });
    if (response.stop_reason === "refusal") {
      throw new AiError("AI가 이 요청을 처리하지 못했습니다. 내용을 바꿔 다시 시도해 주세요.", 422);
    }
    const text = response.content
      .flatMap((b) => (b.type === "text" ? [b.text] : []))
      .join("");
    if (!text) throw new AiError("AI 응답이 비어 있습니다.", 502);
    return text;
  } catch (error) {
    if (error instanceof AiError) throw error;
    if (error instanceof Anthropic.RateLimitError) {
      throw new AiError("요청이 많아 잠시 후 다시 시도해 주세요.", 429);
    }
    if (error instanceof Anthropic.AuthenticationError) {
      throw new AiError("서버의 Claude API 키가 올바르지 않습니다.", 503);
    }
    if (error instanceof Anthropic.APIError) {
      throw new AiError(`AI 요청 실패 (${error.status ?? "?"})`, 502);
    }
    throw new AiError("AI 서버에 연결하지 못했습니다.", 502);
  }
}

export function aiErrorResponse(error: unknown): Response {
  const e = error instanceof AiError ? error : new AiError("알 수 없는 오류가 발생했습니다.");
  return new Response(JSON.stringify({ error: e.message }), {
    status: e.status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

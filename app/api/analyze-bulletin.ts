import type Anthropic from "@anthropic-ai/sdk";
import { ask, aiErrorResponse } from "./_lib/claude.js";
import { errorResponse, json, readJson, requireUser } from "./_lib/http.js";
import type { AnalyzeBulletinRequest, SermonAnalysis } from "../shared/types.js";

const SYSTEM = `당신은 한국 교회의 소그룹(목장) 리더를 돕는 사역 도우미입니다.
사용자가 주일예배 주보 사진을 보내면, 주보에 실린 설교 말씀 내용과 나눔 질문을 정확히 읽어 정리하고,
이번 주 목장 모임에서 무엇을 중심으로 나누면 좋을지 제안합니다.

원칙:
- 주보에 실제로 적힌 내용(제목, 본문, 설교자, 요약, 질문)은 사진에 있는 그대로 옮깁니다. 읽을 수 없거나 없는 항목은 빈 문자열 또는 빈 배열로 둡니다. 지어내지 않습니다.
- discussionGuide는 주보 내용을 바탕으로 당신이 제안하는 부분입니다. 목원들이 삶을 솔직하게 나눌 수 있도록, 정답을 묻기보다 경험과 적용을 묻는 질문 3~5개를 만듭니다. 각 질문에는 리더가 참고할 짧은 의도(intent)를 적습니다.
- 주보 질문이 있으면 그것을 존중해 우선 활용하고, 보완 질문을 더합니다.
- 따뜻하고 자연스러운 한국어 존댓말로 씁니다. 교단 색이 강한 표현은 피합니다.`;

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["title", "passage", "preacher", "summary", "keyPoints", "bulletinQuestions", "discussionGuide"],
  properties: {
    title: { type: "string" },
    passage: { type: "string" },
    preacher: { type: "string" },
    summary: { type: "string" },
    keyPoints: { type: "array", items: { type: "string" } },
    bulletinQuestions: { type: "array", items: { type: "string" } },
    discussionGuide: {
      type: "object",
      additionalProperties: false,
      required: ["focus", "questions", "application"],
      properties: {
        focus: { type: "string" },
        questions: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: ["question", "intent"],
            properties: { question: { type: "string" }, intent: { type: "string" } },
          },
        },
        application: { type: "string" },
      },
    },
  },
};

const MEDIA_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function POST(req: Request): Promise<Response> {
  const denied = await requireUser(req);
  if (denied) return denied;

  const body = await readJson<AnalyzeBulletinRequest>(req);
  const images = body?.images ?? [];
  if (images.length === 0 && !body?.extraText?.trim()) {
    return errorResponse("주보 사진을 한 장 이상 올려 주세요.");
  }
  if (images.length > 4) return errorResponse("사진은 최대 4장까지 올릴 수 있습니다.");
  if (images.some((img) => !MEDIA_TYPES.has(img.mediaType) || !img.data)) {
    return errorResponse("지원하지 않는 이미지 형식입니다.");
  }

  const content: Anthropic.Beta.BetaContentBlockParam[] = [
    ...images.map(
      (img): Anthropic.Beta.BetaContentBlockParam => ({
        type: "image",
        source: { type: "base64", media_type: img.mediaType, data: img.data },
      }),
    ),
    {
      type: "text",
      text:
        "이번 주 주일예배 주보입니다. 설교 말씀과 나눔 질문을 정리하고 목장 나눔 가이드를 만들어 주세요." +
        (body?.extraText?.trim() ? `\n\n리더의 추가 메모:\n${body.extraText.trim()}` : ""),
    },
  ];

  try {
    const text = await ask({ system: SYSTEM, content, schema: SCHEMA, effort: "medium" });
    return json(JSON.parse(text) as SermonAnalysis);
  } catch (error) {
    if (error instanceof SyntaxError) return errorResponse("AI 응답을 해석하지 못했습니다.", 502);
    return aiErrorResponse(error);
  }
}

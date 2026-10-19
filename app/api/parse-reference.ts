import { ask, aiErrorResponse } from "./_lib/claude.js";
import { errorResponse, json, readJson, requireUser } from "./_lib/http.js";
import { BIBLE_BOOKS, parseBibleRef, type BibleRef } from "../shared/bible.js";
import type { ParseRefRequest } from "../shared/types.js";

// 앱에서 규칙 기반 파서가 실패했을 때만 호출된다. (발음이 뭉개진 음성 인식 결과 등)
const SYSTEM = `사용자가 말한 문장에서 성경 구절을 찾아 JSON으로 돌려줍니다.
bookId는 개신교 성경 66권 순서 번호(1=창세기 … 40=마태복음 … 66=요한계시록)입니다.
권 목록: ${BIBLE_BOOKS.map((b) => `${b.id}=${b.name}`).join(", ")}
음성 인식 오류(예: "요한 복음" → 요한복음, "고린도 전서" → 고린도전서, "시편 이십삼 편" → 시편 23편)를 고려해 가장 그럴듯한 구절을 고릅니다.
절이 없으면 verseStart, verseEnd는 0으로 둡니다. 구절을 전혀 찾을 수 없으면 bookId를 0으로 둡니다.`;

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["bookId", "chapter", "verseStart", "verseEnd"],
  properties: {
    bookId: { type: "integer" },
    chapter: { type: "integer" },
    verseStart: { type: "integer" },
    verseEnd: { type: "integer" },
  },
};

export async function POST(req: Request): Promise<Response> {
  const denied = await requireUser(req);
  if (denied) return denied;

  const body = await readJson<ParseRefRequest>(req);
  const text = body?.text?.trim();
  if (!text) return errorResponse("구절을 말하거나 입력해 주세요.");

  const local = parseBibleRef(text);
  if (local) return json({ ref: local });

  try {
    const raw = JSON.parse(await ask({ system: SYSTEM, content: text, schema: SCHEMA, effort: "low", maxTokens: 2000 }));
    const book = BIBLE_BOOKS.find((b) => b.id === raw.bookId);
    if (!book || raw.chapter < 1 || raw.chapter > book.chapters) return json({ ref: null });
    const ref: BibleRef = { bookId: book.id, chapter: raw.chapter };
    if (raw.verseStart > 0) {
      ref.verseStart = raw.verseStart;
      ref.verseEnd = Math.max(raw.verseStart, raw.verseEnd || raw.verseStart);
    }
    return json({ ref });
  } catch (error) {
    if (error instanceof SyntaxError) return json({ ref: null });
    return aiErrorResponse(error);
  }
}

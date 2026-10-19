import { ask, aiErrorResponse } from "./_lib/claude.js";
import { errorResponse, json, readJson, requireUser } from "./_lib/http.js";
import type { GeneratePrayerRequest } from "../shared/types.js";

const SYSTEM = `당신은 한국 교회 목장(소그룹) 모임의 대표기도문 작성을 돕습니다.
목원들의 한 주간 기도제목을 받아, 모임에서 리더나 목원이 소리 내어 드릴 수 있는 대표기도문을 씁니다.

원칙:
- 하나님께 드리는 기도의 형식(하나님 아버지께 부르는 말 → 감사와 찬양 → 말씀 묵상 → 목원들의 기도제목 → 목장 공동체를 위한 기도 → "예수님의 이름으로 기도드립니다. 아멘.")을 따릅니다.
- 모든 목원의 기도제목을 빠짐없이 담되, 각 사람의 이름을 넣어 구체적으로 기도합니다.
- 질병, 가정 문제 등 민감한 내용은 사람들 앞에서 읽어도 당사자가 곤란하지 않도록 정중하고 절제된 표현으로 씁니다.
- 설교 말씀 정보가 있으면 그 말씀의 핵심을 기도 앞부분에 자연스럽게 녹여냅니다.
- 따뜻하고 진솔한 한국어 존댓말 기도체(~하옵소서, ~원합니다, ~감사드립니다)로 씁니다. 과장되거나 상투적인 표현을 반복하지 않습니다.
- 기도문 본문만 출력합니다. 제목, 설명, 마크다운 기호는 쓰지 않습니다.`;

const LENGTH_GUIDE = {
  short: "1분 안에 읽을 수 있는 분량(400자 내외)으로 써 주세요.",
  normal: "2~3분 분량(800~1000자)으로 써 주세요.",
  long: "4~5분 분량(1500자 내외)으로 써 주세요.",
};

export async function POST(req: Request): Promise<Response> {
  const denied = await requireUser(req);
  if (denied) return denied;

  const body = await readJson<GeneratePrayerRequest>(req);
  const members = (body?.members ?? []).filter((m) => m.name?.trim() && m.requests?.trim());
  if (members.length === 0) return errorResponse("기도제목이 입력된 목원이 없습니다.");

  const lines = [
    `목장 이름: ${body?.groupName || "우리 목장"}`,
    body?.sermon?.title || body?.sermon?.passage
      ? `이번 주 설교: ${body.sermon.title ?? ""} (${body.sermon.passage ?? ""})\n${body.sermon.summary ?? ""}`
      : "",
    "목원별 기도제목:",
    ...members.map((m) => `- ${m.name.trim()}: ${m.requests.trim()}`),
    "",
    LENGTH_GUIDE[body?.length ?? "normal"] ?? LENGTH_GUIDE.normal,
  ].filter(Boolean);

  try {
    const prayer = await ask({ system: SYSTEM, content: lines.join("\n"), effort: "low" });
    return json({ prayer: prayer.trim() });
  } catch (error) {
    return aiErrorResponse(error);
  }
}

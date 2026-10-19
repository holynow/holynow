import { createRemoteJWKSet, jwtVerify } from "jose";

export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

export function errorResponse(message: string, status = 400): Response {
  return json({ error: message }, status);
}

const GOOGLE_JWKS = createRemoteJWKSet(
  new URL("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com"),
);

// FIREBASE_PROJECT_ID가 설정돼 있으면 Firebase 로그인 사용자만 AI 기능을 쓸 수 있게 한다.
// (API 키 남용 방지) 설정이 없으면 로컬 개발/데모용으로 통과시킨다.
export async function requireUser(req: Request): Promise<Response | null> {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  if (!projectId) return null;
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return errorResponse("로그인이 필요합니다.", 401);
  try {
    await jwtVerify(token, GOOGLE_JWKS, {
      issuer: `https://securetoken.google.com/${projectId}`,
      audience: projectId,
    });
    return null;
  } catch {
    return errorResponse("로그인 정보가 유효하지 않습니다. 다시 로그인해 주세요.", 401);
  }
}

export async function readJson<T>(req: Request): Promise<T | null> {
  try {
    return (await req.json()) as T;
  } catch {
    return null;
  }
}

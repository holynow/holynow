import { getBackend } from "../data/backend";
import type { BibleRef, BibleVerse } from "../../shared/bible";
import type { AnalyzeBulletinRequest, GeneratePrayerRequest, SermonAnalysis } from "../../shared/types";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = await (await getBackend()).getIdToken();
  const res = await fetch(path, {
    ...init,
    headers: {
      ...(init?.body ? { "content-type": "application/json" } : {}),
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error ?? `요청 실패 (${res.status})`);
  return data as T;
}

export const analyzeBulletin = (body: AnalyzeBulletinRequest) =>
  request<SermonAnalysis>("/api/analyze-bulletin", { method: "POST", body: JSON.stringify(body) });

export const generatePrayer = (body: GeneratePrayerRequest) =>
  request<{ prayer: string }>("/api/prayer", { method: "POST", body: JSON.stringify(body) });

export const parseReferenceWithAi = (text: string) =>
  request<{ ref: BibleRef | null }>("/api/parse-reference", { method: "POST", body: JSON.stringify({ text }) });

const chapterCache = new Map<string, Promise<BibleVerse[]>>();

export function fetchChapter(bookId: number, chapter: number): Promise<BibleVerse[]> {
  const key = `${bookId}:${chapter}`;
  let p = chapterCache.get(key);
  if (!p) {
    p = request<{ verses: BibleVerse[] }>(`/api/bible?book=${bookId}&chapter=${chapter}`).then((r) => r.verses);
    p.catch(() => chapterCache.delete(key));
    chapterCache.set(key, p);
  }
  return p;
}

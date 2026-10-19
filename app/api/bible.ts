import { getBook, type BibleVerse } from "../shared/bible.js";
import { errorResponse } from "./_lib/http.js";

// 개역한글(1961, 저작권 만료) 본문을 공개 성경 API에서 장 단위로 가져온다.
// 첫 번째 소스가 실패하면 다음 소스를 시도한다. 결과는 CDN에 오래 캐시된다.
const SOURCES: { name: string; fetchChapter: (book: number, chapter: number) => Promise<BibleVerse[]> }[] = [
  {
    name: "bolls.life",
    async fetchChapter(book, chapter) {
      const res = await fetch(`https://bolls.life/get-chapter/KRV/${book}/${chapter}/`);
      if (!res.ok) throw new Error(`bolls ${res.status}`);
      const data = (await res.json()) as { verse: number; text: string }[];
      return data.map((v) => ({ verse: v.verse, text: cleanText(v.text) }));
    },
  },
  {
    name: "getbible.net",
    async fetchChapter(book, chapter) {
      const res = await fetch(`https://api.getbible.net/v2/korean/${book}/${chapter}.json`);
      if (!res.ok) throw new Error(`getbible ${res.status}`);
      const data = (await res.json()) as { verses: Record<string, { verse: number | string; text: string }> | { verse: number | string; text: string }[] };
      return Object.values(data.verses ?? {}).map((v) => ({ verse: Number(v.verse), text: cleanText(v.text) }));
    },
  },
];

function cleanText(text: string): string {
  return text.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}

export async function GET(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const bookId = Number(url.searchParams.get("book"));
  const chapter = Number(url.searchParams.get("chapter"));
  const book = getBook(bookId);
  if (!book || !Number.isInteger(chapter) || chapter < 1 || chapter > book.chapters) {
    return errorResponse("존재하지 않는 성경 구절입니다.");
  }

  for (const source of SOURCES) {
    try {
      const verses = (await source.fetchChapter(bookId, chapter)).filter((v) => v.text);
      if (verses.length === 0) continue;
      return new Response(JSON.stringify({ bookId, chapter, translation: "개역한글", verses }), {
        headers: {
          "content-type": "application/json; charset=utf-8",
          "cache-control": "public, max-age=86400, s-maxage=31536000, immutable",
        },
      });
    } catch {
      // 다음 소스로
    }
  }
  return errorResponse("성경 본문을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.", 502);
}

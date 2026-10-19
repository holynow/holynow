// 성경 66권 목록과 "요한복음 3장 16절" 같은 구절 표현 파서.
// 서버 함수(api/)와 프론트엔드(src/)가 함께 사용한다.

export interface BibleBook {
  id: number; // 1 = 창세기 ... 66 = 요한계시록
  name: string;
  abbr: string;
  chapters: number;
  aliases?: string[];
}

export const BIBLE_BOOKS: BibleBook[] = [
  { id: 1, name: "창세기", abbr: "창", chapters: 50 },
  { id: 2, name: "출애굽기", abbr: "출", chapters: 40 },
  { id: 3, name: "레위기", abbr: "레", chapters: 27 },
  { id: 4, name: "민수기", abbr: "민", chapters: 36 },
  { id: 5, name: "신명기", abbr: "신", chapters: 34 },
  { id: 6, name: "여호수아", abbr: "수", chapters: 24 },
  { id: 7, name: "사사기", abbr: "삿", chapters: 21 },
  { id: 8, name: "룻기", abbr: "룻", chapters: 4 },
  { id: 9, name: "사무엘상", abbr: "삼상", chapters: 31 },
  { id: 10, name: "사무엘하", abbr: "삼하", chapters: 24 },
  { id: 11, name: "열왕기상", abbr: "왕상", chapters: 22 },
  { id: 12, name: "열왕기하", abbr: "왕하", chapters: 25 },
  { id: 13, name: "역대상", abbr: "대상", chapters: 29 },
  { id: 14, name: "역대하", abbr: "대하", chapters: 36 },
  { id: 15, name: "에스라", abbr: "스", chapters: 10 },
  { id: 16, name: "느헤미야", abbr: "느", chapters: 13 },
  { id: 17, name: "에스더", abbr: "에", chapters: 10 },
  { id: 18, name: "욥기", abbr: "욥", chapters: 42 },
  { id: 19, name: "시편", abbr: "시", chapters: 150 },
  { id: 20, name: "잠언", abbr: "잠", chapters: 31 },
  { id: 21, name: "전도서", abbr: "전", chapters: 12 },
  { id: 22, name: "아가", abbr: "아", chapters: 8 },
  { id: 23, name: "이사야", abbr: "사", chapters: 66 },
  { id: 24, name: "예레미야", abbr: "렘", chapters: 52 },
  { id: 25, name: "예레미야애가", abbr: "애", chapters: 5 },
  { id: 26, name: "에스겔", abbr: "겔", chapters: 48 },
  { id: 27, name: "다니엘", abbr: "단", chapters: 12 },
  { id: 28, name: "호세아", abbr: "호", chapters: 14 },
  { id: 29, name: "요엘", abbr: "욜", chapters: 3 },
  { id: 30, name: "아모스", abbr: "암", chapters: 9 },
  { id: 31, name: "오바댜", abbr: "옵", chapters: 1 },
  { id: 32, name: "요나", abbr: "욘", chapters: 4 },
  { id: 33, name: "미가", abbr: "미", chapters: 7 },
  { id: 34, name: "나훔", abbr: "나", chapters: 3 },
  { id: 35, name: "하박국", abbr: "합", chapters: 3 },
  { id: 36, name: "스바냐", abbr: "습", chapters: 3 },
  { id: 37, name: "학개", abbr: "학", chapters: 2 },
  { id: 38, name: "스가랴", abbr: "슥", chapters: 14 },
  { id: 39, name: "말라기", abbr: "말", chapters: 4 },
  { id: 40, name: "마태복음", abbr: "마", chapters: 28, aliases: ["마태"] },
  { id: 41, name: "마가복음", abbr: "막", chapters: 16, aliases: ["마가"] },
  { id: 42, name: "누가복음", abbr: "눅", chapters: 24, aliases: ["누가"] },
  { id: 43, name: "요한복음", abbr: "요", chapters: 21 },
  { id: 44, name: "사도행전", abbr: "행", chapters: 28, aliases: ["행전"] },
  { id: 45, name: "로마서", abbr: "롬", chapters: 16 },
  { id: 46, name: "고린도전서", abbr: "고전", chapters: 16 },
  { id: 47, name: "고린도후서", abbr: "고후", chapters: 13 },
  { id: 48, name: "갈라디아서", abbr: "갈", chapters: 6 },
  { id: 49, name: "에베소서", abbr: "엡", chapters: 6 },
  { id: 50, name: "빌립보서", abbr: "빌", chapters: 4 },
  { id: 51, name: "골로새서", abbr: "골", chapters: 4 },
  { id: 52, name: "데살로니가전서", abbr: "살전", chapters: 5 },
  { id: 53, name: "데살로니가후서", abbr: "살후", chapters: 3 },
  { id: 54, name: "디모데전서", abbr: "딤전", chapters: 6 },
  { id: 55, name: "디모데후서", abbr: "딤후", chapters: 4 },
  { id: 56, name: "디도서", abbr: "딛", chapters: 3 },
  { id: 57, name: "빌레몬서", abbr: "몬", chapters: 1 },
  { id: 58, name: "히브리서", abbr: "히", chapters: 13 },
  { id: 59, name: "야고보서", abbr: "약", chapters: 5 },
  { id: 60, name: "베드로전서", abbr: "벧전", chapters: 5 },
  { id: 61, name: "베드로후서", abbr: "벧후", chapters: 3 },
  { id: 62, name: "요한일서", abbr: "요일", chapters: 5, aliases: ["요한1서"] },
  { id: 63, name: "요한이서", abbr: "요이", chapters: 1, aliases: ["요한2서"] },
  { id: 64, name: "요한삼서", abbr: "요삼", chapters: 1, aliases: ["요한3서"] },
  { id: 65, name: "유다서", abbr: "유", chapters: 1 },
  { id: 66, name: "요한계시록", abbr: "계", chapters: 22, aliases: ["계시록"] },
];

export interface BibleRef {
  bookId: number;
  chapter: number;
  verseStart?: number;
  verseEnd?: number;
}

export interface BibleVerse {
  verse: number;
  text: string;
}

export function getBook(id: number): BibleBook | undefined {
  return BIBLE_BOOKS.find((b) => b.id === id);
}

export function formatRef(ref: BibleRef): string {
  const book = getBook(ref.bookId);
  let s = `${book?.name ?? "?"} ${ref.chapter}${ref.bookId === 19 ? "편" : "장"}`;
  if (ref.verseStart) {
    s += ` ${ref.verseStart}`;
    if (ref.verseEnd && ref.verseEnd !== ref.verseStart) s += `-${ref.verseEnd}`;
    s += "절";
  }
  return s;
}

// 이름 후보: 정식 이름, 별칭, 약어. 긴 것부터 매칭해야 "요한일서"가 "요한"/"요"보다 먼저 잡힌다.
const NAME_TABLE: { key: string; bookId: number }[] = BIBLE_BOOKS.flatMap((b) =>
  [b.name, b.abbr, ...(b.aliases ?? [])].map((key) => ({ key, bookId: b.id })),
).sort((a, b) => b.key.length - a.key.length);

const DIGITS: Record<string, number> = {
  일: 1, 이: 2, 삼: 3, 사: 4, 오: 5, 육: 6, 륙: 6, 칠: 7, 팔: 8, 구: 9,
};

// "삼십육" -> 36, "백오십" -> 150. 숫자 아닌 글자가 섞이면 null.
export function koreanNumberToInt(s: string): number | null {
  if (!s) return null;
  let total = 0;
  let current = 0;
  for (const ch of s) {
    if (ch in DIGITS) {
      current = DIGITS[ch];
    } else if (ch === "십" || ch === "백") {
      const unit = ch === "십" ? 10 : 100;
      total += (current || 1) * unit;
      current = 0;
    } else {
      return null;
    }
  }
  return total + current;
}

const KOR_NUM = "[일이삼사오육륙칠팔구십백]+";

// 음성 인식 결과는 "삼 장", "3 장 16 절", "십육절" 처럼 다양하게 나오므로
// 한글 숫자를 아라비아 숫자로 바꾸고 공백을 정리한 뒤 파싱한다.
function normalize(input: string): string {
  let s = input
    .replace(/[.,!?]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  s = s.replace(new RegExp(`(${KOR_NUM})\\s*(장|절|편)`, "g"), (m, num: string, unit: string) => {
    const n = koreanNumberToInt(num);
    return n === null ? m : `${n}${unit}`;
  });
  // "16절에서 18절까지", "16절부터 18절" -> "16-18절"
  s = s.replace(/(\d+)\s*절?\s*(?:에서|부터|~|-|–)\s*(\d+)\s*절?(?:\s*까지)?/g, "$1-$2절");
  return s;
}

export function parseBibleRef(input: string): BibleRef | null {
  const s = normalize(input);
  const compact = s.replace(/\s+/g, "");

  let bookId: number | undefined;
  let rest = "";
  for (const { key, bookId: id } of NAME_TABLE) {
    const idx = compact.indexOf(key);
    if (idx !== -1) {
      const after = compact.slice(idx + key.length);
      // 약어(한 글자)는 바로 뒤에 숫자가 와야 인정: "요3:16" O, "요한이..." X
      if (key.length <= 2 && !/^\d/.test(after)) continue;
      bookId = id;
      rest = after;
      break;
    }
  }
  if (!bookId) return null;

  // 3:16, 3:16-18, 3장16절, 3장16-18절, 3장, 23편
  const m =
    rest.match(/^(\d+)[:장편](?:(\d+)(?:-(\d+))?절?)?/) ?? rest.match(/^(\d+)/);
  if (!m) return null;

  const book = getBook(bookId)!;
  const chapter = Number(m[1]);
  if (chapter < 1 || chapter > book.chapters) return null;

  const ref: BibleRef = { bookId, chapter };
  if (m[2]) {
    ref.verseStart = Number(m[2]);
    ref.verseEnd = m[3] ? Number(m[3]) : ref.verseStart;
    if (ref.verseEnd < ref.verseStart) ref.verseEnd = ref.verseStart;
  }
  return ref;
}

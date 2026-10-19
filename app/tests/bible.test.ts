import { describe, expect, it } from "vitest";
import { formatRef, koreanNumberToInt, parseBibleRef } from "../shared/bible";

describe("koreanNumberToInt", () => {
  it.each([
    ["삼", 3],
    ["십", 10],
    ["십육", 16],
    ["이십삼", 23],
    ["백오십", 150],
    ["백십구", 119],
  ])("%s -> %d", (s, n) => expect(koreanNumberToInt(s)).toBe(n));
});

describe("parseBibleRef", () => {
  it.each([
    ["요한복음 3장 16절", { bookId: 43, chapter: 3, verseStart: 16, verseEnd: 16 }],
    ["요한 복음 삼 장 십육 절", { bookId: 43, chapter: 3, verseStart: 16, verseEnd: 16 }],
    ["요 3:16", { bookId: 43, chapter: 3, verseStart: 16, verseEnd: 16 }],
    ["고린도전서 13장 4절에서 7절까지", { bookId: 46, chapter: 13, verseStart: 4, verseEnd: 7 }],
    ["고전 13:4-7", { bookId: 46, chapter: 13, verseStart: 4, verseEnd: 7 }],
    ["시편 23편", { bookId: 19, chapter: 23 }],
    ["시편 이십삼편 일절", { bookId: 19, chapter: 23, verseStart: 1, verseEnd: 1 }],
    ["로마서 8장", { bookId: 45, chapter: 8 }],
    ["요한일서 4장 8절", { bookId: 62, chapter: 4, verseStart: 8, verseEnd: 8 }],
    ["요한계시록 21장 1절", { bookId: 66, chapter: 21, verseStart: 1, verseEnd: 1 }],
    ["오늘 본문은 마태복음 5장 3절부터 10절입니다", { bookId: 40, chapter: 5, verseStart: 3, verseEnd: 10 }],
    ["이사야 오십삼장 오절", { bookId: 23, chapter: 53, verseStart: 5, verseEnd: 5 }],
    ["빌립보서 4장 13절", { bookId: 50, chapter: 4, verseStart: 13, verseEnd: 13 }],
    ["창세기 1장 1절", { bookId: 1, chapter: 1, verseStart: 1, verseEnd: 1 }],
    ["사도행전 2장", { bookId: 44, chapter: 2 }],
  ])("%s", (input, expected) => expect(parseBibleRef(input)).toEqual(expected));

  it.each(["안녕하세요", "요한복음", "요한복음 99장", ""])("구절이 아니면 null: %s", (input) => {
    expect(parseBibleRef(input)).toBeNull();
  });
});

describe("formatRef", () => {
  it("범위를 표시한다", () => {
    expect(formatRef({ bookId: 46, chapter: 13, verseStart: 4, verseEnd: 7 })).toBe("고린도전서 13장 4-7절");
    expect(formatRef({ bookId: 19, chapter: 23 })).toBe("시편 23편");
  });
});

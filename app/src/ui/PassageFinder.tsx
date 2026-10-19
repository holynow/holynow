import { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { BIBLE_BOOKS, formatRef, getBook, parseBibleRef, type BibleRef, type BibleVerse } from "../../shared/bible";
import { fetchChapter, parseReferenceWithAi } from "../lib/api";
import { Button, Card, ErrorText, Input, MicButton, Muted, Row, Select, Spinner, Stack, TextArea } from "./components";

export interface FoundPassage {
  ref: BibleRef;
  label: string;
  text: string;
}

const VerseList = styled.div`
  max-height: 55vh;
  overflow-y: auto;
  margin-top: 8px;
  border-top: 1px solid var(--border);
  padding-top: 8px;
`;

const VerseLine = styled.p<{ $on: boolean }>`
  margin: 0;
  padding: 6px 8px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 17px;
  line-height: 1.75;
  background: ${(p) => (p.$on ? "var(--primary-soft)" : "transparent")};
  sup { color: var(--primary); font-weight: 700; margin-right: 6px; font-size: 12px; }
`;

const LAST_KEY = "mokjang:lastRef";

export function PassageFinder({ onSave, saveLabel = "노트에 저장" }: {
  onSave: (p: FoundPassage, memo: string) => Promise<void>;
  saveLabel?: string;
}) {
  const [query, setQuery] = useState("");
  const [ref, setRef] = useState<BibleRef | null>(() => {
    try {
      return JSON.parse(localStorage.getItem(LAST_KEY) ?? "null") as BibleRef | null;
    } catch {
      return null;
    }
  });
  const [verses, setVerses] = useState<BibleVerse[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [memo, setMemo] = useState("");
  const [saving, setSaving] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  // 장이 바뀌면 본문을 불러온다
  useEffect(() => {
    if (!ref) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchChapter(ref.bookId, ref.chapter)
      .then((v) => !cancelled && setVerses(v))
      .catch((e) => !cancelled && setError(e instanceof Error ? e.message : "본문을 불러오지 못했어요."))
      .finally(() => !cancelled && setLoading(false));
    try {
      localStorage.setItem(LAST_KEY, JSON.stringify(ref));
    } catch {
      // 무시
    }
    return () => {
      cancelled = true;
    };
  }, [ref?.bookId, ref?.chapter]); // eslint-disable-line react-hooks/exhaustive-deps

  // 찾은 절로 스크롤
  useEffect(() => {
    if (!verses || !ref?.verseStart) return;
    listRef.current?.querySelector(`[data-verse="${ref.verseStart}"]`)?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [verses, ref?.verseStart]);

  const resolve = async (text: string) => {
    if (!text.trim()) return;
    setError(null);
    let found = parseBibleRef(text);
    if (!found) {
      setLoading(true);
      try {
        found = (await parseReferenceWithAi(text)).ref;
      } catch (e) {
        setError(e instanceof Error ? e.message : "구절을 찾지 못했어요.");
        setLoading(false);
        return;
      }
      setLoading(false);
    }
    if (!found) setError(`"${text}"에서 성경 구절을 찾지 못했어요. 예: 요한복음 3장 16절`);
    else setRef(found);
  };

  const tapVerse = (v: number) => {
    if (!ref) return;
    const { verseStart: s, verseEnd: e } = ref;
    if (s && e === s && v > s) setRef({ ...ref, verseEnd: v });
    else if (s === v && e === v) setRef({ bookId: ref.bookId, chapter: ref.chapter });
    else setRef({ ...ref, verseStart: v, verseEnd: v });
  };

  const book = ref ? getBook(ref.bookId) : undefined;
  const selected = verses && ref?.verseStart ? verses.filter((v) => v.verse >= ref.verseStart! && v.verse <= (ref.verseEnd ?? ref.verseStart!)) : [];

  const save = async () => {
    if (!ref || !verses) return;
    const chosen = selected.length ? selected : verses;
    setSaving(true);
    try {
      await onSave({ ref, label: formatRef(ref), text: chosen.map((v) => `${v.verse} ${v.text}`).join("\n") }, memo);
      setMemo("");
    } finally {
      setSaving(false);
    }
  };

  const goChapter = (delta: number) => {
    if (!ref || !book) return;
    const ch = ref.chapter + delta;
    if (ch >= 1 && ch <= book.chapters) setRef({ bookId: ref.bookId, chapter: ch });
  };

  return (
    <>
      <Card>
        <Stack $gap={12} style={{ alignItems: "center" }}>
          <MicButton big label="구절을 말해 주세요" onText={(t) => { setQuery(t); resolve(t); }} />
          <Muted style={{ textAlign: "center" }}>🎤를 누르고 “요한복음 3장 16절”처럼 말해 보세요</Muted>
        </Stack>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            resolve(query);
          }}
        >
          <Row style={{ marginTop: 12 }}>
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="또는 입력: 요 3:16, 시편 23편" enterKeyHint="search" />
            <Button type="submit" disabled={!query.trim()}>찾기</Button>
          </Row>
        </form>
        <Row style={{ marginTop: 8 }}>
          <Select
            aria-label="성경"
            value={ref?.bookId ?? ""}
            onChange={(e) => setRef({ bookId: Number(e.target.value), chapter: 1 })}
            style={{ flex: 2 }}
          >
            <option value="" disabled>성경 선택</option>
            {BIBLE_BOOKS.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </Select>
          <Select
            aria-label="장"
            value={ref?.chapter ?? ""}
            disabled={!book}
            onChange={(e) => ref && setRef({ bookId: ref.bookId, chapter: Number(e.target.value) })}
            style={{ flex: 1 }}
          >
            {book && Array.from({ length: book.chapters }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1}장</option>)}
          </Select>
        </Row>
        {error && <ErrorText>{error}</ErrorText>}
      </Card>

      {ref && (
        <Card>
          <Row>
            <Button $variant="ghost" $small onClick={() => goChapter(-1)} disabled={ref.chapter <= 1} aria-label="이전 장">‹</Button>
            <h2 style={{ flex: 1, textAlign: "center", margin: 0 }}>{formatRef(ref)}</h2>
            <Button $variant="ghost" $small onClick={() => goChapter(1)} disabled={!book || ref.chapter >= book.chapters} aria-label="다음 장">›</Button>
          </Row>
          {loading && <Row style={{ justifyContent: "center", padding: 16 }}><Spinner /></Row>}
          {verses && !loading && (
            <>
              <VerseList ref={listRef}>
                {verses.map((v) => (
                  <VerseLine
                    key={v.verse}
                    data-verse={v.verse}
                    $on={!!ref.verseStart && v.verse >= ref.verseStart && v.verse <= (ref.verseEnd ?? ref.verseStart)}
                    onClick={() => tapVerse(v.verse)}
                  >
                    <sup>{v.verse}</sup>
                    {v.text}
                  </VerseLine>
                ))}
              </VerseList>
              <Muted style={{ fontSize: 12 }}>개역한글 · 절을 누르면 선택, 뒤쪽 절을 한 번 더 누르면 범위로 선택돼요.</Muted>
              <Stack style={{ marginTop: 8 }}>
                <TextArea value={memo} onChange={(e) => setMemo(e.target.value)} rows={2} placeholder={`${selected.length ? formatRef(ref) : "이 장"}에 대한 메모 (선택)`} />
                <Button $block onClick={save} disabled={saving}>
                  {saving ? "저장 중…" : `${selected.length ? formatRef(ref) : `${book?.name} ${ref.chapter}장 전체`} ${saveLabel}`}
                </Button>
              </Stack>
            </>
          )}
        </Card>
      )}
    </>
  );
}

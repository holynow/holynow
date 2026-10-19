import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getBackend } from "../data/backend";
import { useUser } from "../data/hooks";
import { deleteNote, newNoteId, saveNote } from "../data/repo";
import type { WorshipNote } from "../data/models";
import { shareText, todayStr } from "../lib/format";
import { Button, Card, Header, IconButton, Input, Loading, MicButton, Muted, Page, Row, Stack, TextArea, toast } from "../ui/components";
import { PassageFinder } from "../ui/PassageFinder";

export function NoteEditorPage() {
  const { noteId = "" } = useParams();
  const user = useUser();
  const navigate = useNavigate();
  const [note, setNote] = useState<WorshipNote | null>(null);
  const [finding, setFinding] = useState(false);
  const [saved, setSaved] = useState(true);
  const timer = useRef<number | undefined>(undefined);
  const latest = useRef<WorshipNote | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (noteId === "new") {
        const id = await newNoteId();
        const [, m, d] = todayStr().split("-").map(Number);
        const fresh: WorshipNote = { id, title: `${m}월 ${d}일 예배 노트`, date: todayStr(), body: "", passages: [], createdAt: Date.now(), updatedAt: Date.now() };
        await saveNote(user.uid, fresh);
        if (!cancelled) navigate(`/notes/${id}`, { replace: true });
        return;
      }
      const loaded = await (await getBackend()).getDoc<WorshipNote>(`users/${user.uid}/notes/${noteId}`);
      if (cancelled) return;
      if (!loaded) navigate("/notes", { replace: true });
      else setNote(loaded);
    })();
    return () => {
      cancelled = true;
    };
  }, [noteId, user.uid, navigate]);

  // 입력이 멈추고 0.8초 뒤 자동 저장, 화면을 떠날 때도 저장
  const flush = () => {
    window.clearTimeout(timer.current);
    timer.current = undefined;
    if (latest.current) saveNote(user.uid, latest.current).then(() => setSaved(true));
  };
  useEffect(() => () => { if (timer.current) flush(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const update = (fn: (n: WorshipNote) => WorshipNote) => {
    setNote((n) => {
      if (!n) return n;
      const next = fn(n);
      latest.current = next;
      return next;
    });
    setSaved(false);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(flush, 800);
  };

  if (!note) return <Loading />;

  const share = async () => {
    const text = [
      note.title,
      "",
      ...note.passages.flatMap((p) => [`📖 ${p.label}`, p.text, ...(p.memo ? [`✏️ ${p.memo}`] : []), ""]),
      note.body,
    ].join("\n").trim();
    if ((await shareText(note.title, text)) === "copied") toast("노트를 복사했어요.");
  };

  return (
    <Page>
      <Header>
        <IconButton aria-label="뒤로" onClick={() => { flush(); navigate("/notes"); }}>‹</IconButton>
        <h1>{note.title || "예배 노트"}</h1>
        <Muted style={{ margin: 0, fontSize: 12 }}>{saved ? "저장됨" : "저장 중…"}</Muted>
        <Button $variant="soft" $small onClick={share}>공유</Button>
      </Header>

      <Card>
        <Stack>
          <Input value={note.title} onChange={(e) => update((n) => ({ ...n, title: e.target.value }))} placeholder="제목" aria-label="제목" />
          <Input type="date" value={note.date} onChange={(e) => update((n) => ({ ...n, date: e.target.value }))} aria-label="날짜" />
        </Stack>
      </Card>

      {note.passages.map((p, i) => (
        <Card key={i}>
          <Row>
            <h2 style={{ flex: 1, margin: 0 }}>📖 {p.label}</h2>
            <Button $small $variant="danger" onClick={() => confirm(`${p.label}을(를) 노트에서 뺄까요?`) && update((n) => ({ ...n, passages: n.passages.filter((_, j) => j !== i) }))}>빼기</Button>
          </Row>
          <p style={{ whiteSpace: "pre-wrap", fontSize: 16, lineHeight: 1.75, color: "var(--text-2)", margin: "8px 0" }}>{p.text}</p>
          <TextArea
            value={p.memo}
            onChange={(e) => update((n) => ({ ...n, passages: n.passages.map((q, j) => (j === i ? { ...q, memo: e.target.value } : q)) }))}
            placeholder="이 말씀에 대한 메모"
            rows={2}
          />
        </Card>
      ))}

      {finding ? (
        <>
          <PassageFinder
            saveLabel="이 노트에 추가"
            onSave={async (p, memo) => {
              update((n) => ({ ...n, passages: [...n.passages, { ...p, memo }] }));
              setFinding(false);
              toast(`${p.label}을(를) 추가했어요.`);
            }}
          />
          <Button $variant="ghost" $block onClick={() => setFinding(false)} style={{ marginBottom: 12 }}>닫기</Button>
        </>
      ) : (
        <Button $variant="soft" $block onClick={() => setFinding(true)} style={{ marginBottom: 12 }}>+ 성경 구절 추가 (음성 가능)</Button>
      )}

      <Card>
        <Row style={{ justifyContent: "space-between", marginBottom: 6 }}>
          <h2 style={{ margin: 0 }}>설교 필기</h2>
          <MicButton continuous label="받아쓰기" onText={(t) => update((n) => ({ ...n, body: (n.body ? n.body.trimEnd() + "\n" : "") + t }))} />
        </Row>
        <TextArea
          value={note.body}
          onChange={(e) => update((n) => ({ ...n, body: e.target.value }))}
          placeholder="말씀을 들으며 자유롭게 적어 보세요."
          rows={12}
        />
      </Card>

      <Button
        $variant="danger"
        $block
        onClick={async () => {
          if (!confirm("이 노트를 삭제할까요?")) return;
          window.clearTimeout(timer.current);
          timer.current = undefined;
          latest.current = null;
          await deleteNote(user.uid, note.id);
          navigate("/notes", { replace: true });
        }}
      >
        노트 삭제
      </Button>
    </Page>
  );
}

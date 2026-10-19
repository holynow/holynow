import { useNavigate } from "react-router-dom";
import { useUser } from "../data/hooks";
import { findNotesByDate, newNoteId, saveNote } from "../data/repo";
import type { WorshipNote } from "../data/models";
import { todayStr } from "../lib/format";
import { Button, Header, Page, toast } from "../ui/components";
import { PassageFinder, type FoundPassage } from "../ui/PassageFinder";

// 오늘 날짜의 예배 노트가 있으면 거기에 구절을 덧붙이고, 없으면 새로 만든다.
async function appendToTodayNote(uid: string, passage: FoundPassage, memo: string): Promise<string> {
  const today = todayStr();
  const notes = await findNotesByDate(uid, today);
  const existing = notes.sort((a, b) => b.updatedAt - a.updatedAt)[0];
  const [, m, d] = today.split("-").map(Number);
  const note: WorshipNote = existing ?? {
    id: await newNoteId(),
    title: `${m}월 ${d}일 예배 노트`,
    date: today,
    body: "",
    passages: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  await saveNote(uid, { ...note, passages: [...note.passages, { ...passage, memo }] });
  return note.id;
}

export function BiblePage() {
  const user = useUser();
  const navigate = useNavigate();
  return (
    <Page>
      <Header>
        <h1>성경 찾기</h1>
        <Button $variant="ghost" $small onClick={() => navigate("/notes")}>예배 노트</Button>
      </Header>
      <PassageFinder
        saveLabel="오늘 노트에 저장"
        onSave={async (p, memo) => {
          await appendToTodayNote(user.uid, p, memo);
          toast(`${p.label}을(를) 오늘 예배 노트에 저장했어요.`);
        }}
      />
    </Page>
  );
}

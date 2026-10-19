import { Link, useNavigate } from "react-router-dom";
import { useUser, useWatch } from "../data/hooks";
import { watchNotes } from "../data/repo";
import type { WorshipNote } from "../data/models";
import { formatDate } from "../lib/format";
import { Badge, Button, Card, EmptyState, Header, Loading, Muted, Page, Row } from "../ui/components";

export function NotesPage() {
  const user = useUser();
  const navigate = useNavigate();
  const notes = useWatch<WorshipNote[]>((cb) => watchNotes(user.uid, cb), [user.uid]);

  return (
    <Page>
      <Header>
        <h1>예배 노트</h1>
        <Button $small onClick={() => navigate("/notes/new")}>+ 새 노트</Button>
      </Header>
      <Muted style={{ marginBottom: 12 }}>예배 중 찾은 말씀과 메모, 설교 필기를 모아두는 나만의 노트예요.</Muted>
      {notes === undefined ? (
        <Loading />
      ) : notes.length === 0 ? (
        <EmptyState icon="✏️" title="아직 노트가 없어요">
          <Muted>‘성경 찾기’에서 구절을 저장하거나 새 노트를 만들어 필기해 보세요.</Muted>
        </EmptyState>
      ) : (
        notes.map((n) => (
          <Link key={n.id} to={`/notes/${n.id}`}>
            <Card>
              <Row>
                <strong style={{ flex: 1 }}>{n.title || "제목 없음"}</strong>
                {n.passages.length > 0 && <Badge>말씀 {n.passages.length}</Badge>}
              </Row>
              <Muted>{formatDate(n.date)}</Muted>
              {n.passages.length > 0 && <Muted>📖 {n.passages.map((p) => p.label).join(", ")}</Muted>}
              {n.body && <Muted style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{n.body}</Muted>}
            </Card>
          </Link>
        ))
      )}
    </Page>
  );
}

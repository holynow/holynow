import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { LAST_GROUP_KEY } from "../App";
import { useWatch } from "../data/hooks";
import { createReport, watchGroup, watchMembers, watchReports } from "../data/repo";
import type { Group, Member, Report } from "../data/models";
import { formatDate, reportStats, todayStr } from "../lib/format";
import { Badge, Button, Card, EmptyState, ErrorText, Header, IconButton, Input, Loading, Muted, Page, Row } from "../ui/components";

export function ReportsPage() {
  const { groupId = "" } = useParams();
  const navigate = useNavigate();
  const group = useWatch<Group | null>((cb) => watchGroup(groupId, cb), [groupId]);
  const members = useWatch<Member[]>((cb) => watchMembers(groupId, cb), [groupId]);
  const reports = useWatch<Report[]>((cb) => watchReports(groupId, cb), [groupId]);
  const [date, setDate] = useState(todayStr());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      if (group) localStorage.setItem(LAST_GROUP_KEY, groupId);
      if (group === null) localStorage.removeItem(LAST_GROUP_KEY);
    } catch {
      // 무시
    }
  }, [group, groupId]);

  if (group === null) {
    return (
      <Page>
        <EmptyState icon="🔍" title="목장을 찾을 수 없어요">
          <Link to="/groups">
            <Button style={{ marginTop: 12 }}>내 목장 목록</Button>
          </Link>
        </EmptyState>
      </Page>
    );
  }
  if (!group || !members || !reports) return <Loading />;

  const start = async () => {
    setError(null);
    try {
      navigate(`/g/${groupId}/r/${await createReport(groupId, date, members)}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "보고서를 만들지 못했어요.");
    }
  };

  return (
    <Page>
      <Header>
        <IconButton aria-label="목장 목록" onClick={() => navigate("/groups")}>
          ☰
        </IconButton>
        <h1>{group.name}</h1>
        <IconButton aria-label="목장 설정" onClick={() => navigate(`/g/${groupId}/settings`)}>
          ⚙️
        </IconButton>
      </Header>

      <Card>
        <h2>이번 주 목장 보고서</h2>
        <Row>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ flex: 1 }} />
          <Button onClick={start} disabled={!date}>
            {reports.some((r) => r.id === date) ? "열기" : "작성하기"}
          </Button>
        </Row>
        {members.length <= 1 && (
          <Muted style={{ marginTop: 8 }}>
            ⚙️ 설정에서 목원 명단을 먼저 추가하면 보고서에 자동으로 들어가요.
          </Muted>
        )}
        {error && <ErrorText>{error}</ErrorText>}
      </Card>

      {reports.length === 0 ? (
        <EmptyState icon="📝" title="아직 보고서가 없어요">
          <Muted>모임 날짜를 고르고 ‘작성하기’를 눌러 주세요.</Muted>
        </EmptyState>
      ) : (
        reports.map((r) => {
          const s = reportStats(r, members);
          return (
            <Link key={r.id} to={`/g/${groupId}/r/${r.id}`}>
              <Card>
                <Row>
                  <strong style={{ flex: 1 }}>{formatDate(r.date)}</strong>
                  {r.sermon && <Badge $tone="accent">주보</Badge>}
                  {r.representativePrayer && <Badge>기도문</Badge>}
                </Row>
                {r.sermon?.title && <Muted>🎤 {r.sermon.title}</Muted>}
                <Muted>
                  출석 {s.attended}/{s.total} · 성경 {s.bibleChapters}장 · 새벽기도 {s.dawnPrayerDays}회 · 평균 기도 {s.avgPrayerMinutes}분
                </Muted>
              </Card>
            </Link>
          );
        })
      )}
    </Page>
  );
}

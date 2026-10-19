import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import styled from "styled-components";
import { useUser, useWatch } from "../data/hooks";
import { deleteReport, saveEntry, updateReport, watchGroup, watchMembers, watchReport } from "../data/repo";
import { emptyEntry, type Entry, type Group, type Member, type Report } from "../data/models";
import { formatDate, reportStats, reportToText, shareText } from "../lib/format";
import { Badge, Button, Card, Header, IconButton, Loading, MicButton, Muted, Page, Row, Stack, Stepper, TextArea, toast } from "../ui/components";
import { SermonPanel } from "./SermonPanel";
import { PrayerPanel } from "./PrayerPanel";

const Tabs = styled.div`
  display: flex;
  gap: 4px;
  background: var(--surface-2);
  padding: 4px;
  border-radius: 12px;
  margin-bottom: 12px;
  button {
    flex: 1;
    border: none;
    background: transparent;
    padding: 8px 4px;
    border-radius: 9px;
    font-weight: 600;
    font-size: 14px;
    color: var(--text-2);
    cursor: pointer;
  }
  button[aria-selected="true"] { background: var(--surface); color: var(--text); box-shadow: var(--shadow); }
`;

const StatGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  text-align: center;
  div { background: var(--surface-2); border-radius: 10px; padding: 8px 4px; }
  strong { display: block; font-size: 19px; }
  span { font-size: 12px; color: var(--text-2); }
`;

type Tab = "entries" | "sermon" | "prayer";

export function ReportPage() {
  const { groupId = "", reportId = "" } = useParams();
  const navigate = useNavigate();
  const group = useWatch<Group | null>((cb) => watchGroup(groupId, cb), [groupId]);
  const members = useWatch<Member[]>((cb) => watchMembers(groupId, cb), [groupId]);
  const report = useWatch<Report | null>((cb) => watchReport(groupId, reportId, cb), [groupId, reportId]);
  const [tab, setTab] = useState<Tab>("entries");

  if (report === null) {
    navigate(`/g/${groupId}`, { replace: true });
    return null;
  }
  if (!group || !members || !report) return <Loading />;

  // 보고서 작성 후 추가된 목원도 보여주고, 명단에서 빠진(비활성) 목원은 기록이 있을 때만 보여준다.
  const shown = members.filter((m) => m.active || report.entries[m.id]);
  const stats = reportStats(report, shown);

  const share = async () => {
    const result = await shareText(`${group.name} 목장 보고서`, reportToText(group.name, report, shown));
    if (result === "copied") toast("보고서를 복사했어요. 카톡에 붙여넣기 하세요.");
  };

  const remove = async () => {
    if (!confirm(`${formatDate(report.date)} 보고서를 삭제할까요?`)) return;
    await deleteReport(groupId, reportId);
    navigate(`/g/${groupId}`, { replace: true });
  };

  return (
    <Page>
      <Header>
        <IconButton aria-label="뒤로" onClick={() => navigate(`/g/${groupId}`)}>
          ‹
        </IconButton>
        <h1>{formatDate(report.date)}</h1>
        <Button $variant="soft" $small onClick={share}>
          공유
        </Button>
      </Header>

      <Tabs role="tablist">
        {(
          [
            ["entries", "📝 기록"],
            ["sermon", "📷 주보 분석"],
            ["prayer", "🙏 대표기도"],
          ] as const
        ).map(([key, label]) => (
          <button key={key} role="tab" aria-selected={tab === key} onClick={() => setTab(key)}>
            {label}
          </button>
        ))}
      </Tabs>

      {tab === "entries" && (
        <>
          <Card>
            <StatGrid>
              <div><strong>{stats.attended}/{stats.total}</strong><span>출석</span></div>
              <div><strong>{stats.bibleChapters}</strong><span>성경(장)</span></div>
              <div><strong>{stats.dawnPrayerDays}</strong><span>새벽기도</span></div>
              <div><strong>{stats.avgPrayerMinutes}분</strong><span>평균 기도</span></div>
            </StatGrid>
          </Card>
          {shown.map((m) => (
            <EntryCard key={m.id} groupId={groupId} reportId={reportId} member={m} entry={report.entries[m.id]} />
          ))}
          <MeetingNote groupId={groupId} report={report} />
          <Button $variant="danger" $block onClick={remove} style={{ marginTop: 8 }}>
            이 보고서 삭제
          </Button>
        </>
      )}
      {tab === "sermon" && <SermonPanel groupId={groupId} report={report} />}
      {tab === "prayer" && <PrayerPanel group={group} report={report} members={shown} />}
    </Page>
  );
}

function EntryCard({ groupId, reportId, member, entry }: { groupId: string; reportId: string; member: Member; entry?: Entry }) {
  const user = useUser();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Entry>(entry ?? emptyEntry());
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  // 다른 사람이 수정한 내용은 내가 편집 중이 아닐 때만 반영
  useEffect(() => {
    if (!dirty) setDraft(entry ?? emptyEntry());
  }, [entry, dirty]);

  const set = <K extends keyof Entry>(key: K, value: Entry[K]) => {
    setDraft((d) => ({ ...d, [key]: value }));
    setDirty(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      await saveEntry(groupId, reportId, member.id, draft, user);
      setDirty(false);
      toast(`${member.name}님 기록을 저장했어요.`);
    } catch (e) {
      toast(e instanceof Error ? e.message : "저장하지 못했어요.");
    } finally {
      setSaving(false);
    }
  };

  const isMe = member.uid === user.uid;
  const e = draft;

  return (
    <Card>
      <Row onClick={() => setOpen((o) => !o)} style={{ cursor: "pointer" }}>
        <strong style={{ fontSize: 17 }}>{member.name}</strong>
        {isMe && <Badge>나</Badge>}
        {!e.attended && <Badge $tone="muted">결석</Badge>}
        {dirty && <Badge $tone="accent">저장 안 됨</Badge>}
        <span style={{ flex: 1 }} />
        <span style={{ color: "var(--text-3)" }}>{open ? "접기 ▲" : "작성 ▼"}</span>
      </Row>
      {!open && (
        <>
          <Muted>
            성경 {e.bibleChapters}장 · 새벽 {e.dawnPrayerDays}회 · 큐티 {e.qtDays}회 · 기도 하루 {e.prayerMinutes}분
          </Muted>
          {e.prayer && <p style={{ whiteSpace: "pre-wrap", margin: "6px 0 0" }}>🙏 {e.prayer}</p>}
        </>
      )}
      {open && (
        <Stack style={{ marginTop: 12 }}>
          <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input type="checkbox" checked={e.attended} onChange={(ev) => set("attended", ev.target.checked)} style={{ width: 20, height: 20 }} />
            목장 모임 출석
          </label>
          <div>
            <Row style={{ justifyContent: "space-between", marginBottom: 6 }}>
              <strong style={{ fontSize: 15 }}>한 주간 기도제목</strong>
              <MicButton
                continuous
                label="기도제목 음성 입력"
                onText={(t) => {
                  setDraft((d) => ({ ...d, prayer: (d.prayer ? d.prayer.trimEnd() + "\n" : "") + t }));
                  setDirty(true);
                }}
              />
            </Row>
            <TextArea
              value={e.prayer}
              onChange={(ev) => set("prayer", ev.target.value)}
              placeholder="🎤를 눌러 말하거나 직접 적어 주세요. 여러 개면 줄을 바꿔 적어요."
              rows={4}
            />
          </div>
          <div>
            <strong style={{ fontSize: 15 }}>한 주간 경건생활</strong>
            <Stepper label="성경 읽기" hint="이번 주 읽은 장 수" value={e.bibleChapters} onChange={(v) => set("bibleChapters", v)} unit="장" />
            <Stepper label="새벽기도" hint="참석한 날 (월~토)" value={e.dawnPrayerDays} onChange={(v) => set("dawnPrayerDays", v)} max={6} unit="회" />
            <Stepper label="큐티(말씀 묵상)" value={e.qtDays} onChange={(v) => set("qtDays", v)} max={7} unit="회" />
            <Stepper label="기도 시간" hint="하루 평균" value={e.prayerMinutes} onChange={(v) => set("prayerMinutes", v)} step={5} max={600} unit="분" />
          </div>
          <TextArea value={e.note} onChange={(ev) => set("note", ev.target.value)} placeholder="나눔 메모 (선택)" rows={2} style={{ minHeight: 56 }} />
          <Row>
            <Button $block onClick={save} disabled={!dirty || saving}>
              {saving ? "저장 중…" : "저장"}
            </Button>
          </Row>
          {entry?.updatedBy && <Muted>마지막 수정: {entry.updatedBy}</Muted>}
        </Stack>
      )}
    </Card>
  );
}

function MeetingNote({ groupId, report }: { groupId: string; report: Report }) {
  const [text, setText] = useState(report.meetingNote ?? "");
  const [dirty, setDirty] = useState(false);
  useEffect(() => {
    if (!dirty) setText(report.meetingNote ?? "");
  }, [report.meetingNote, dirty]);

  return (
    <Card>
      <Row style={{ justifyContent: "space-between", marginBottom: 6 }}>
        <h2 style={{ margin: 0 }}>모임 나눔 기록</h2>
        <MicButton continuous onText={(t) => { setText((s) => (s ? s.trimEnd() + "\n" : "") + t); setDirty(true); }} />
      </Row>
      <TextArea
        value={text}
        onChange={(e) => { setText(e.target.value); setDirty(true); }}
        placeholder="오늘 모임에서 나눈 내용, 광고, 심방 필요 등"
      />
      <Button
        $block
        style={{ marginTop: 8 }}
        disabled={!dirty}
        onClick={async () => {
          await updateReport(groupId, report.id, { meetingNote: text });
          setDirty(false);
          toast("저장했어요.");
        }}
      >
        저장
      </Button>
    </Card>
  );
}

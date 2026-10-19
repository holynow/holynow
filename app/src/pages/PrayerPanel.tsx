import { useEffect, useState } from "react";
import { updateReport } from "../data/repo";
import type { Group, Member, Report } from "../data/models";
import { generatePrayer } from "../lib/api";
import { shareText } from "../lib/format";
import { Button, Card, ErrorText, Muted, Row, Select, Spinner, Stack, TextArea, toast } from "../ui/components";

export function PrayerPanel({ group, report, members }: { group: Group; report: Report; members: Member[] }) {
  const [length, setLength] = useState<"short" | "normal" | "long">("normal");
  const [text, setText] = useState(report.representativePrayer ?? "");
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!dirty) setText(report.representativePrayer ?? "");
  }, [report.representativePrayer, dirty]);

  const withRequests = members
    .map((m) => ({ name: m.name, requests: report.entries[m.id]?.prayer ?? "" }))
    .filter((m) => m.requests.trim());

  const generate = async () => {
    setBusy(true);
    setError(null);
    try {
      const { prayer } = await generatePrayer({
        groupName: group.name,
        sermon: report.sermon && { title: report.sermon.title, passage: report.sermon.passage, summary: report.sermon.summary },
        members: withRequests,
        length,
      });
      await updateReport(group.id, report.id, { representativePrayer: prayer });
      setDirty(false);
      setText(prayer);
    } catch (e) {
      setError(e instanceof Error ? e.message : "기도문을 만들지 못했어요.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Card>
        <h2>대표기도문 만들기</h2>
        <Muted>
          기도제목이 적힌 목원 {withRequests.length}명{report.sermon?.title ? "과 이번 주 말씀" : ""}을 바탕으로 기도문을 만들어요.
        </Muted>
        <Row style={{ marginTop: 12 }}>
          <Select value={length} onChange={(e) => setLength(e.target.value as typeof length)} style={{ flex: 1 }} aria-label="기도문 길이">
            <option value="short">짧게 (1분)</option>
            <option value="normal">보통 (2~3분)</option>
            <option value="long">길게 (4~5분)</option>
          </Select>
          <Button onClick={generate} disabled={busy || withRequests.length === 0}>
            {busy ? <><Spinner /> 작성 중…</> : text ? "다시 만들기" : "만들기"}
          </Button>
        </Row>
        {withRequests.length === 0 && <Muted style={{ marginTop: 8 }}>‘기록’ 탭에서 기도제목을 먼저 적어 주세요.</Muted>}
        {error && <ErrorText>{error}</ErrorText>}
      </Card>

      {text && (
        <Card>
          <Stack>
            <TextArea
              value={text}
              onChange={(e) => { setText(e.target.value); setDirty(true); }}
              rows={14}
              style={{ fontSize: 17, lineHeight: 1.8 }}
              aria-label="대표기도문"
            />
            <Row>
              <Button
                $variant="ghost"
                style={{ flex: 1 }}
                onClick={async () => {
                  if ((await shareText("대표기도문", text)) === "copied") toast("기도문을 복사했어요.");
                }}
              >
                공유 / 복사
              </Button>
              <Button
                style={{ flex: 1 }}
                disabled={!dirty}
                onClick={async () => {
                  await updateReport(group.id, report.id, { representativePrayer: text });
                  setDirty(false);
                  toast("기도문을 저장했어요.");
                }}
              >
                수정 저장
              </Button>
            </Row>
          </Stack>
        </Card>
      )}
    </>
  );
}

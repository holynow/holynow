import { useState } from "react";
import { updateReport } from "../data/repo";
import type { Report } from "../data/models";
import { analyzeBulletin } from "../lib/api";
import { resizeImage } from "../lib/image";
import { Button, Card, ErrorText, Label, Muted, Row, Spinner, Stack, TextArea, toast } from "../ui/components";

interface Photo {
  mediaType: "image/jpeg";
  data: string;
  preview: string;
}

export function SermonPanel({ groupId, report }: { groupId: string; report: Report }) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [memo, setMemo] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [redo, setRedo] = useState(false);
  const sermon = report.sermon;

  const addFiles = async (files: FileList | null) => {
    if (!files) return;
    try {
      const resized = await Promise.all(Array.from(files).slice(0, 4 - photos.length).map((f) => resizeImage(f)));
      setPhotos((p) => [...p, ...resized].slice(0, 4));
    } catch {
      setError("사진을 읽지 못했어요. 다른 사진으로 시도해 주세요.");
    }
  };

  const analyze = async () => {
    setBusy(true);
    setError(null);
    try {
      const result = await analyzeBulletin({
        images: photos.map(({ mediaType, data }) => ({ mediaType, data })),
        extraText: memo,
      });
      await updateReport(groupId, report.id, { sermon: result });
      setPhotos([]);
      setMemo("");
      setRedo(false);
      toast("주보 분석을 보고서에 저장했어요.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "분석에 실패했어요.");
    } finally {
      setBusy(false);
    }
  };

  if (sermon && !redo) {
    return (
      <>
        <Card>
          <h2>🎤 {sermon.title || "주일 말씀"}</h2>
          {(sermon.passage || sermon.preacher) && (
            <Muted>
              {sermon.passage}
              {sermon.passage && sermon.preacher && " · "}
              {sermon.preacher}
            </Muted>
          )}
          {sermon.summary && <p style={{ whiteSpace: "pre-wrap" }}>{sermon.summary}</p>}
          {sermon.keyPoints.length > 0 && (
            <>
              <h3>핵심 메시지</h3>
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                {sermon.keyPoints.map((k, i) => <li key={i}>{k}</li>)}
              </ul>
            </>
          )}
          {sermon.bulletinQuestions.length > 0 && (
            <>
              <h3>주보 나눔 질문</h3>
              <ol style={{ margin: 0, paddingLeft: 20 }}>
                {sermon.bulletinQuestions.map((q, i) => <li key={i}>{q}</li>)}
              </ol>
            </>
          )}
        </Card>
        <Card style={{ borderColor: "var(--primary)" }}>
          <h2>💬 이번 주 목장 나눔 가이드</h2>
          <p style={{ fontWeight: 600 }}>{sermon.discussionGuide.focus}</p>
          <Stack $gap={12}>
            {sermon.discussionGuide.questions.map((q, i) => (
              <div key={i}>
                <strong>Q{i + 1}. {q.question}</strong>
                <Muted>💡 {q.intent}</Muted>
              </div>
            ))}
          </Stack>
          {sermon.discussionGuide.application && (
            <>
              <h3>한 주간 삶의 적용</h3>
              <p style={{ margin: 0 }}>{sermon.discussionGuide.application}</p>
            </>
          )}
        </Card>
        <Button $variant="ghost" $block onClick={() => setRedo(true)}>
          주보 다시 분석하기
        </Button>
      </>
    );
  }

  return (
    <Card>
      <h2>주보 사진으로 말씀 정리하기</h2>
      <Muted>설교 요약과 나눔 질문이 있는 면을 찍어 주세요. 최대 4장까지 올릴 수 있어요.</Muted>
      <Stack style={{ marginTop: 12 }}>
        <Row $wrap>
          {photos.map((p, i) => (
            <div key={i} style={{ position: "relative" }}>
              <img src={p.preview} alt={`주보 사진 ${i + 1}`} style={{ width: 96, height: 128, objectFit: "cover", borderRadius: 10 }} />
              <button
                aria-label="사진 빼기"
                onClick={() => setPhotos((ps) => ps.filter((_, j) => j !== i))}
                style={{ position: "absolute", top: 4, right: 4, border: "none", borderRadius: 999, width: 24, height: 24, background: "rgba(0,0,0,.6)", color: "#fff", cursor: "pointer" }}
              >
                ×
              </button>
            </div>
          ))}
          {photos.length < 4 && (
            <label
              style={{ width: 96, height: 128, borderRadius: 10, border: "2px dashed var(--border)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--text-2)", fontSize: 13 }}
            >
              <span style={{ fontSize: 28 }}>📷</span>
              사진 추가
              <input type="file" accept="image/*" multiple hidden onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} />
            </label>
          )}
        </Row>
        <div>
          <Label htmlFor="memo">추가 메모 (선택)</Label>
          <TextArea id="memo" value={memo} onChange={(e) => setMemo(e.target.value)} rows={2} placeholder="예: 목사님이 특히 강조하신 부분, 우리 목장 상황 등" />
        </div>
        <Button $block onClick={analyze} disabled={busy || photos.length === 0}>
          {busy ? <><Spinner /> AI가 주보를 읽고 있어요…</> : "AI로 분석하기"}
        </Button>
        {redo && <Button $variant="ghost" $block onClick={() => setRedo(false)}>취소</Button>}
        {error && <ErrorText>{error}</ErrorText>}
      </Stack>
    </Card>
  );
}

import { useState } from "react";
import { useAuth } from "../data/hooks";
import { Button, Card, ErrorText, Input, Label, Muted, Page, Stack } from "../ui/components";

const FEATURES = [
  ["📝", "목장 보고서", "기도제목과 경건생활(성경·새벽기도·기도시간)을 목원들과 함께 작성하고 공유해요."],
  ["📷", "주보 AI 분석", "주보 사진을 찍으면 말씀 요약과 목장 나눔 질문을 정리해 드려요."],
  ["🙏", "대표기도문", "목원들의 기도제목으로 모임 대표기도문을 만들어 드려요."],
  ["🎤", "음성 성경 찾기", "\"요한복음 3장 16절\" 하고 말하면 바로 본문을 찾아 드려요."],
  ["✏️", "예배 노트", "찾은 말씀에 메모하고 설교를 필기해요."],
];

export function LoginPage() {
  const { backend } = useAuth();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const local = backend?.mode === "local";

  const signIn = async () => {
    setBusy(true);
    setError(null);
    try {
      await backend?.signIn(name);
    } catch (e) {
      setError(e instanceof Error ? e.message : "로그인에 실패했습니다.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Page style={{ paddingBottom: 32 }}>
      <div style={{ textAlign: "center", margin: "32px 0 24px" }}>
        <div style={{ fontSize: 52 }}>⛪</div>
        <h1 style={{ margin: "8px 0 4px", fontSize: 28 }}>목장노트</h1>
        <Muted>매주 손으로 쓰던 목장 보고서, 이제 함께 써요</Muted>
      </div>

      <Card>
        <Stack $gap={12}>
          {FEATURES.map(([icon, title, desc]) => (
            <div key={title} style={{ display: "flex", gap: 12 }}>
              <div style={{ fontSize: 24 }}>{icon}</div>
              <div>
                <strong>{title}</strong>
                <Muted style={{ margin: 0 }}>{desc}</Muted>
              </div>
            </div>
          ))}
        </Stack>
      </Card>

      <Card>
        {local ? (
          <Stack>
            <div>
              <Label htmlFor="name">이름</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="예: 홍길동" />
            </div>
            <Button $block onClick={signIn} disabled={busy || !name.trim()}>
              시작하기
            </Button>
            <Muted>
              지금은 <strong>데모 모드</strong>예요. 기록이 이 기기에만 저장돼요. 목원들과 공유하려면 Firebase를 설정해 주세요(README 참고).
            </Muted>
          </Stack>
        ) : (
          <Stack>
            <Button $block onClick={signIn} disabled={busy}>
              Google 계정으로 시작하기
            </Button>
            <Muted>카카오톡 안에서 열었다면 오른쪽 위 메뉴에서 ‘다른 브라우저로 열기’를 눌러 주세요.</Muted>
          </Stack>
        )}
        {error && <ErrorText>{error}</ErrorText>}
      </Card>
    </Page>
  );
}

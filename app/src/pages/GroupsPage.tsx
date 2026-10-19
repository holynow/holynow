import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth, useUser, useWatch } from "../data/hooks";
import { createGroup, joinGroup, watchMyGroups } from "../data/repo";
import type { Group } from "../data/models";
import { Badge, Button, Card, ErrorText, Header, Input, Label, Loading, Muted, Page, Row, Stack } from "../ui/components";

export function GroupsPage() {
  const user = useUser();
  const { backend } = useAuth();
  const navigate = useNavigate();
  const groups = useWatch<Group[]>((cb) => watchMyGroups(user.uid, cb), [user.uid]);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const run = async (fn: () => Promise<string>) => {
    setBusy(true);
    setError(null);
    try {
      navigate(`/g/${await fn()}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "문제가 생겼어요.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Page>
      <Header>
        <h1>내 목장</h1>
        <Button $variant="ghost" $small onClick={() => backend?.signOut()}>
          로그아웃
        </Button>
      </Header>
      <Muted style={{ marginBottom: 12 }}>{user.name}님, 평안하세요 🙂</Muted>

      {groups === undefined ? (
        <Loading />
      ) : (
        groups.map((g) => (
          <Link key={g.id} to={`/g/${g.id}`}>
            <Card>
              <Row>
                <strong style={{ flex: 1 }}>{g.name}</strong>
                {g.leaderUid === user.uid && <Badge>리더</Badge>}
                <span style={{ color: "var(--text-3)" }}>›</span>
              </Row>
            </Card>
          </Link>
        ))
      )}

      <Card>
        <h2>새 목장 만들기 (리더)</h2>
        <Stack>
          <div>
            <Label htmlFor="gname">목장 이름</Label>
            <Input id="gname" value={name} onChange={(e) => setName(e.target.value)} placeholder="예: 사랑목장" />
          </div>
          <Button onClick={() => run(() => createGroup(user, name))} disabled={busy || !name.trim()}>
            만들기
          </Button>
        </Stack>
      </Card>

      <Card>
        <h2>초대코드로 들어가기 (목원)</h2>
        <Stack>
          <div>
            <Label htmlFor="code">초대코드 6자리</Label>
            <Input
              id="code"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="예: K7P2QX"
              maxLength={6}
              autoCapitalize="characters"
            />
          </div>
          <Button $variant="soft" onClick={() => run(() => joinGroup(user, code))} disabled={busy || code.trim().length !== 6}>
            들어가기
          </Button>
        </Stack>
      </Card>
      {error && <ErrorText>{error}</ErrorText>}
    </Page>
  );
}

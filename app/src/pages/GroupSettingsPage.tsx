import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useUser, useWatch } from "../data/hooks";
import { addMember, removeMember, renameGroup, updateMember, watchGroup, watchMembers } from "../data/repo";
import type { Group, Member } from "../data/models";
import { shareText } from "../lib/format";
import { Badge, Button, Card, Header, IconButton, Input, Loading, Muted, Page, Row, Stack, toast } from "../ui/components";

export function GroupSettingsPage() {
  const { groupId = "" } = useParams();
  const navigate = useNavigate();
  const user = useUser();
  const group = useWatch<Group | null>((cb) => watchGroup(groupId, cb), [groupId]);
  const members = useWatch<Member[]>((cb) => watchMembers(groupId, cb), [groupId]);
  const [newName, setNewName] = useState("");
  const [groupName, setGroupName] = useState<string | null>(null);

  if (!group || !members) return <Loading />;

  const isLeader = group.leaderUid === user.uid;
  const myMember = members.find((m) => m.uid === user.uid);
  const inviteUrl = `${location.origin}/join/${group.inviteCode}`;

  const add = async () => {
    const names = newName.split(/[,\n]/).map((n) => n.trim()).filter(Boolean);
    const base = members.reduce((max, m) => Math.max(max, m.order), 0);
    await Promise.all(names.map((n, i) => addMember(groupId, n, base + i + 1)));
    setNewName("");
  };

  const move = async (index: number, dir: -1 | 1) => {
    const a = members[index];
    const b = members[index + dir];
    if (!a || !b) return;
    await Promise.all([updateMember(groupId, a.id, { order: b.order }), updateMember(groupId, b.id, { order: a.order })]);
  };

  return (
    <Page>
      <Header>
        <IconButton aria-label="뒤로" onClick={() => navigate(`/g/${groupId}`)}>‹</IconButton>
        <h1>목장 설정</h1>
      </Header>

      <Card>
        <h2>목원 초대</h2>
        <Muted>초대코드나 링크를 목원들에게 보내 주세요. 들어온 목원은 보고서를 함께 보고 자기 기록을 직접 쓸 수 있어요.</Muted>
        <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: 6, textAlign: "center", margin: "12px 0" }}>{group.inviteCode}</div>
        <Button
          $block
          onClick={async () => {
            const r = await shareText(`${group.name} 초대`, `[목장노트] ${group.name}에 초대합니다 🙏\n초대코드: ${group.inviteCode}\n${inviteUrl}`);
            if (r === "copied") toast("초대 메시지를 복사했어요.");
          }}
        >
          초대 링크 보내기
        </Button>
      </Card>

      <Card>
        <h2>목원 명단</h2>
        <Muted>앱을 쓰지 않는 목원도 이름만 추가하면 리더가 대신 기록할 수 있어요.</Muted>
        <Stack $gap={0} style={{ marginTop: 8 }}>
          {members.map((m, i) => (
            <MemberRow
              key={m.id}
              member={m}
              isMine={m.uid === user.uid}
              canLink={!myMember && !m.uid}
              onUp={i > 0 ? () => move(i, -1) : undefined}
              onDown={i < members.length - 1 ? () => move(i, 1) : undefined}
              onRename={(name) => updateMember(groupId, m.id, { name })}
              onToggle={() => updateMember(groupId, m.id, { active: !m.active })}
              onLink={() => updateMember(groupId, m.id, { uid: user.uid })}
              onRemove={async () => {
                if (confirm(`${m.name}님을 명단에서 삭제할까요? 지난 보고서의 기록은 이름 없이 남아요. 잠시 쉬는 목원이라면 ‘쉼’을 눌러 주세요.`)) {
                  await removeMember(groupId, m.id);
                }
              }}
            />
          ))}
        </Stack>
        <Row style={{ marginTop: 12 }}>
          <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="이름 (쉼표로 여러 명)" onKeyDown={(e) => e.key === "Enter" && newName.trim() && add()} />
          <Button onClick={add} disabled={!newName.trim()}>추가</Button>
        </Row>
        {!myMember && (
          <Muted style={{ marginTop: 8 }}>명단에서 내 이름 옆의 ‘나예요’를 누르면 내 기록에 ‘나’ 표시가 붙어요.</Muted>
        )}
      </Card>

      <Card>
        <h2>목장 이름</h2>
        <Row>
          <Input value={groupName ?? group.name} onChange={(e) => setGroupName(e.target.value)} />
          <Button
            disabled={!groupName?.trim() || groupName === group.name}
            onClick={async () => {
              await renameGroup(groupId, groupName!);
              setGroupName(null);
              toast("저장했어요.");
            }}
          >
            저장
          </Button>
        </Row>
        {isLeader && <Muted style={{ marginTop: 8 }}>내가 이 목장의 리더예요.</Muted>}
      </Card>
    </Page>
  );
}

function MemberRow(props: {
  member: Member;
  isMine: boolean;
  canLink: boolean;
  onUp?: () => void;
  onDown?: () => void;
  onRename: (name: string) => void;
  onToggle: () => void;
  onLink: () => void;
  onRemove: () => void;
}) {
  const { member: m } = props;
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(m.name);

  return (
    <Row style={{ padding: "8px 0", borderBottom: "1px solid var(--border)" }} $wrap>
      {editing ? (
        <>
          <Input value={name} onChange={(e) => setName(e.target.value)} style={{ flex: 1, minWidth: 120 }} autoFocus />
          <Button $small onClick={() => { if (name.trim()) props.onRename(name.trim()); setEditing(false); }}>확인</Button>
        </>
      ) : (
        <>
          <span style={{ flex: 1, minWidth: 80, opacity: m.active ? 1 : 0.5 }} onClick={() => setEditing(true)}>
            {m.name}
          </span>
          {props.isMine && <Badge>나</Badge>}
          {m.uid && !props.isMine && <Badge $tone="muted">앱 사용</Badge>}
          {!m.active && <Badge $tone="muted">쉼</Badge>}
          {props.canLink && <Button $small $variant="soft" onClick={props.onLink}>나예요</Button>}
          <IconButton aria-label="위로" disabled={!props.onUp} onClick={props.onUp} style={{ width: 32, height: 32, fontSize: 14 }}>▲</IconButton>
          <IconButton aria-label="아래로" disabled={!props.onDown} onClick={props.onDown} style={{ width: 32, height: 32, fontSize: 14 }}>▼</IconButton>
          <Button $small $variant="ghost" onClick={props.onToggle}>{m.active ? "쉼" : "복귀"}</Button>
          <Button $small $variant="danger" onClick={props.onRemove}>삭제</Button>
        </>
      )}
    </Row>
  );
}

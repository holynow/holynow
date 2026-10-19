import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useUser } from "../data/hooks";
import { joinGroup } from "../data/repo";
import { Button, EmptyState, Loading, Muted, Page } from "../ui/components";

export function JoinPage() {
  const { code = "" } = useParams();
  const user = useUser();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    joinGroup(user, code)
      .then((gid) => navigate(`/g/${gid}`, { replace: true }))
      .catch((e) => setError(e instanceof Error ? e.message : "들어가지 못했어요."));
  }, [code, user, navigate]);

  if (!error) return <Loading text="목장에 들어가는 중…" />;
  return (
    <Page>
      <EmptyState icon="😢" title="목장에 들어가지 못했어요">
        <Muted>{error}</Muted>
        <Link to="/groups"><Button style={{ marginTop: 12 }}>내 목장 목록</Button></Link>
      </EmptyState>
    </Page>
  );
}

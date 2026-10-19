import { BrowserRouter, Navigate, NavLink, Route, Routes, useLocation } from "react-router-dom";
import styled from "styled-components";
import { AuthProvider, useAuth } from "./data/hooks";
import { GlobalStyle } from "./ui/theme";
import { Loading, ToastHost } from "./ui/components";
import { LoginPage } from "./pages/LoginPage";
import { GroupsPage } from "./pages/GroupsPage";
import { ReportsPage } from "./pages/ReportsPage";
import { ReportPage } from "./pages/ReportPage";
import { GroupSettingsPage } from "./pages/GroupSettingsPage";
import { BiblePage } from "./pages/BiblePage";
import { NotesPage } from "./pages/NotesPage";
import { NoteEditorPage } from "./pages/NoteEditorPage";
import { JoinPage } from "./pages/JoinPage";

export const LAST_GROUP_KEY = "mokjang:lastGroup";

const Nav = styled.nav`
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  justify-content: center;
  background: var(--surface);
  border-top: 1px solid var(--border);
  padding-bottom: env(safe-area-inset-bottom);
  z-index: 50;
  a {
    flex: 1;
    max-width: 180px;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 8px 0 10px;
    font-size: 12px;
    color: var(--text-3);
    gap: 2px;
  }
  a span { font-size: 22px; line-height: 1.2; }
  a.active { color: var(--primary); font-weight: 700; }
`;

function BottomNav() {
  const { pathname } = useLocation();
  let lastGroup: string | null = null;
  try {
    lastGroup = localStorage.getItem(LAST_GROUP_KEY);
  } catch {
    // 저장소 접근 불가 환경
  }
  const groupHref = lastGroup ? `/g/${lastGroup}` : "/groups";
  return (
    <Nav>
      <NavLink to={groupHref} className={pathname.startsWith("/g") ? "active" : ""}>
        <span>👥</span>목장
      </NavLink>
      <NavLink to="/bible">
        <span>📖</span>성경 찾기
      </NavLink>
      <NavLink to="/notes">
        <span>✏️</span>예배 노트
      </NavLink>
    </Nav>
  );
}

function AppRoutes() {
  const { user, ready } = useAuth();
  if (!ready) return <Loading />;
  if (!user) return <LoginPage />;
  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/groups" element={<GroupsPage />} />
        <Route path="/join/:code" element={<JoinPage />} />
        <Route path="/g/:groupId" element={<ReportsPage />} />
        <Route path="/g/:groupId/r/:reportId" element={<ReportPage />} />
        <Route path="/g/:groupId/settings" element={<GroupSettingsPage />} />
        <Route path="/bible" element={<BiblePage />} />
        <Route path="/notes" element={<NotesPage />} />
        <Route path="/notes/:noteId" element={<NoteEditorPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <BottomNav />
    </>
  );
}

function Home() {
  let last: string | null = null;
  try {
    last = localStorage.getItem(LAST_GROUP_KEY);
  } catch {
    // 무시
  }
  return <Navigate to={last ? `/g/${last}` : "/groups"} replace />;
}

export function App() {
  return (
    <AuthProvider>
      <GlobalStyle />
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
      <ToastHost />
    </AuthProvider>
  );
}

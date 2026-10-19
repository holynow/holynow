import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { getBackend, type AppUser, type Backend } from "./backend";

interface AuthState {
  user: AppUser | null;
  backend: Backend | null;
  ready: boolean;
}

const AuthContext = createContext<AuthState>({ user: null, backend: null, ready: false });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ user: null, backend: null, ready: false });
  useEffect(() => {
    let unsub: (() => void) | undefined;
    getBackend().then((backend) => {
      unsub = backend.onAuthChanged((user) => setState({ user, backend, ready: true }));
    });
    return () => unsub?.();
  }, []);
  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);

export function useUser(): AppUser {
  const { user } = useAuth();
  if (!user) throw new Error("로그인이 필요합니다.");
  return user;
}

// repo.ts의 watch* 함수(구독 해제 함수를 Promise로 돌려줌)를 React 상태로 연결.
// 값이 아직 없으면 undefined, 문서가 없으면 null.
export function useWatch<T>(
  watch: ((cb: (value: T) => void) => Promise<() => void>) | null,
  deps: unknown[],
): T | undefined {
  const [value, setValue] = useState<T | undefined>(undefined);
  useEffect(() => {
    if (!watch) return;
    setValue(undefined);
    let cancelled = false;
    let unsub: (() => void) | undefined;
    watch((v) => !cancelled && setValue(v)).then((u) => {
      if (cancelled) u();
      else unsub = u;
    });
    return () => {
      cancelled = true;
      unsub?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return value;
}

// 저장소 추상화: Firebase가 설정돼 있으면 Firestore(목원 간 실시간 공유),
// 아니면 이 브라우저에만 저장되는 데모 모드(localStorage)로 동작한다.

export interface AppUser {
  uid: string;
  name: string;
  email?: string;
}

export type Where = [field: string, op: "==" | "array-contains", value: unknown];

// updateDoc에서 배열에 값을 추가할 때 쓰는 표식
export interface ArrayUnion {
  __arrayUnion: unknown[];
}
export const arrayUnion = (...values: unknown[]): ArrayUnion => ({ __arrayUnion: values });

export interface Backend {
  mode: "firebase" | "local";
  onAuthChanged(cb: (user: AppUser | null) => void): () => void;
  signIn(displayName?: string): Promise<void>;
  signOut(): Promise<void>;
  getIdToken(): Promise<string | null>;
  newId(): string;
  getDoc<T>(path: string): Promise<T | null>;
  getCollection<T>(path: string, where?: Where): Promise<T[]>;
  watchDoc<T>(path: string, cb: (doc: T | null) => void): () => void;
  watchCollection<T>(path: string, cb: (docs: T[]) => void, where?: Where): () => void;
  setDoc(path: string, data: object): Promise<void>;
  // 점 표기 경로("entries.abc")로 일부 필드만 갱신
  updateDoc(path: string, fields: Record<string, unknown>): Promise<void>;
  deleteDoc(path: string): Promise<void>;
}

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string | undefined,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined,
  appId: import.meta.env.VITE_FIREBASE_APP_ID as string | undefined,
};

let backendPromise: Promise<Backend> | null = null;

export function getBackend(): Promise<Backend> {
  backendPromise ??= firebaseConfig.apiKey && firebaseConfig.projectId
    ? import("./firebaseBackend").then((m) => m.createFirebaseBackend())
    : import("./localBackend").then((m) => m.createLocalBackend());
  return backendPromise;
}

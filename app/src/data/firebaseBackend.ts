import { initializeApp } from "firebase/app";
import {
  GoogleAuthProvider,
  getAuth,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signOut,
} from "firebase/auth";
import {
  arrayUnion as fsArrayUnion,
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  getDocs,
  initializeFirestore,
  onSnapshot,
  persistentLocalCache,
  query,
  setDoc,
  updateDoc,
  where as fsWhere,
} from "firebase/firestore";
import { firebaseConfig, type AppUser, type ArrayUnion, type Backend } from "./backend";

function toFirestoreValue(value: unknown) {
  if (typeof value === "object" && value !== null && "__arrayUnion" in value) {
    return fsArrayUnion(...(value as ArrayUnion).__arrayUnion);
  }
  return value === undefined ? deleteField() : value;
}

// Firestore는 undefined 값을 거부하므로 저장 전에 제거
function stripUndefined<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export function createFirebaseBackend(): Backend {
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  // 오프라인 캐시: 예배당처럼 신호가 약한 곳에서도 쓰고, 연결되면 동기화
  const db = initializeFirestore(app, { localCache: persistentLocalCache() });

  return {
    mode: "firebase",
    onAuthChanged(cb) {
      return onAuthStateChanged(auth, (u) =>
        cb(u ? ({ uid: u.uid, name: u.displayName ?? u.email ?? "목원", email: u.email ?? undefined } satisfies AppUser) : null),
      );
    },
    async signIn() {
      const provider = new GoogleAuthProvider();
      try {
        await signInWithPopup(auth, provider);
      } catch (e) {
        // 인앱 브라우저 등 팝업이 막힌 환경에서는 리다이렉트 방식으로
        if ((e as { code?: string }).code === "auth/popup-blocked") await signInWithRedirect(auth, provider);
        else throw e;
      }
    },
    signOut: () => signOut(auth),
    async getIdToken() {
      return (await auth.currentUser?.getIdToken()) ?? null;
    },
    newId: () => doc(collection(db, "_")).id,
    async getDoc<T>(path: string) {
      const snap = await getDoc(doc(db, path));
      return snap.exists() ? ({ ...snap.data(), id: snap.id } as T) : null;
    },
    async getCollection<T>(path: string, where?: [string, "==" | "array-contains", unknown]) {
      const ref = collection(db, path);
      const snap = await getDocs(where ? query(ref, fsWhere(...where)) : ref);
      return snap.docs.map((d) => ({ ...d.data(), id: d.id }) as T);
    },
    watchDoc<T>(path: string, cb: (doc: T | null) => void) {
      return onSnapshot(doc(db, path), (snap) => cb(snap.exists() ? ({ ...snap.data(), id: snap.id } as T) : null));
    },
    watchCollection<T>(path: string, cb: (docs: T[]) => void, where?: [string, "==" | "array-contains", unknown]) {
      const ref = collection(db, path);
      const q = where ? query(ref, fsWhere(...where)) : ref;
      return onSnapshot(q, (snap) => cb(snap.docs.map((d) => ({ ...d.data(), id: d.id }) as T)));
    },
    async setDoc(path, data) {
      await setDoc(doc(db, path), stripUndefined(data));
    },
    async updateDoc(path, fields) {
      const converted = Object.fromEntries(
        Object.entries(fields).map(([k, v]) => [
          k,
          typeof v === "object" && v !== null && !("__arrayUnion" in v) ? stripUndefined(v) : toFirestoreValue(v),
        ]),
      );
      await updateDoc(doc(db, path), converted);
    },
    async deleteDoc(path) {
      await deleteDoc(doc(db, path));
    },
  };
}

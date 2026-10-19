import type { AppUser, ArrayUnion, Backend, Where } from "./backend";

const DB_KEY = "mokjang:db";
const USER_KEY = "mokjang:user";

type Db = Record<string, Record<string, unknown>>; // 문서 경로 -> 데이터

function load(): Db {
  try {
    return JSON.parse(localStorage.getItem(DB_KEY) ?? "{}") as Db;
  } catch {
    return {};
  }
}

function isArrayUnion(v: unknown): v is ArrayUnion {
  return typeof v === "object" && v !== null && "__arrayUnion" in v;
}

export function applyFieldUpdates(doc: Record<string, unknown>, fields: Record<string, unknown>) {
  const next = structuredClone(doc);
  for (const [path, value] of Object.entries(fields)) {
    const keys = path.split(".");
    let target = next;
    for (const key of keys.slice(0, -1)) {
      if (typeof target[key] !== "object" || target[key] === null) target[key] = {};
      target = target[key] as Record<string, unknown>;
    }
    const last = keys[keys.length - 1];
    if (isArrayUnion(value)) {
      const current = Array.isArray(target[last]) ? (target[last] as unknown[]) : [];
      target[last] = [...current, ...value.__arrayUnion.filter((v) => !current.includes(v))];
    } else if (value === undefined) {
      delete target[last];
    } else {
      target[last] = value;
    }
  }
  return next;
}

function matches(doc: Record<string, unknown>, where?: Where) {
  if (!where) return true;
  const [field, op, value] = where;
  const v = doc[field];
  return op === "==" ? v === value : Array.isArray(v) && v.includes(value);
}

export function createLocalBackend(): Backend {
  let db = load();
  const listeners = new Set<() => void>();
  const authListeners = new Set<(u: AppUser | null) => void>();

  const readUser = (): AppUser | null => {
    try {
      return JSON.parse(localStorage.getItem(USER_KEY) ?? "null") as AppUser | null;
    } catch {
      return null;
    }
  };

  const commit = () => {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
    listeners.forEach((l) => l());
  };

  // 다른 탭에서 바뀐 내용도 반영
  window.addEventListener("storage", (e) => {
    if (e.key === DB_KEY) {
      db = load();
      listeners.forEach((l) => l());
    }
  });

  const getOne = <T,>(path: string): T | null => {
    const data = db[path];
    return data ? ({ ...structuredClone(data), id: path.split("/").pop() } as T) : null;
  };

  const getMany = <T,>(collection: string, where?: Where): T[] => {
    const depth = collection.split("/").length + 1;
    return Object.keys(db)
      .filter((p) => p.startsWith(collection + "/") && p.split("/").length === depth)
      .filter((p) => matches(db[p], where))
      .map((p) => getOne<T>(p)!);
  };

  const subscribe = (fn: () => void) => {
    fn();
    listeners.add(fn);
    return () => void listeners.delete(fn);
  };

  return {
    mode: "local",
    onAuthChanged(cb) {
      cb(readUser());
      authListeners.add(cb);
      return () => void authListeners.delete(cb);
    },
    async signIn(displayName) {
      const user: AppUser = { uid: readUser()?.uid ?? "local-" + crypto.randomUUID().slice(0, 8), name: displayName?.trim() || "나" };
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      authListeners.forEach((l) => l(user));
    },
    async signOut() {
      localStorage.removeItem(USER_KEY);
      authListeners.forEach((l) => l(null));
    },
    async getIdToken() {
      return null;
    },
    newId: () => crypto.randomUUID().replace(/-/g, "").slice(0, 20),
    async getDoc(path) {
      return getOne(path);
    },
    async getCollection(path, where) {
      return getMany(path, where);
    },
    watchDoc(path, cb) {
      return subscribe(() => cb(getOne(path)));
    },
    watchCollection(path, cb, where) {
      return subscribe(() => cb(getMany(path, where)));
    },
    async setDoc(path, data) {
      db[path] = applyFieldUpdates({}, data as Record<string, unknown>);
      commit();
    },
    async updateDoc(path, fields) {
      if (!db[path]) throw new Error(`문서가 없습니다: ${path}`);
      db[path] = applyFieldUpdates(db[path], fields);
      commit();
    },
    async deleteDoc(path) {
      for (const p of Object.keys(db)) if (p === path || p.startsWith(path + "/")) delete db[p];
      commit();
    },
  };
}

import { arrayUnion, getBackend, type AppUser } from "./backend";
import { emptyEntry, type Entry, type Group, type Member, type Report, type WorshipNote } from "./models";

const INVITE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // 헷갈리는 0/O, 1/I 제외

function makeInviteCode() {
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  return Array.from(bytes, (b) => INVITE_ALPHABET[b % INVITE_ALPHABET.length]).join("");
}

export async function createGroup(user: AppUser, name: string): Promise<string> {
  const be = await getBackend();
  const id = be.newId();
  const inviteCode = makeInviteCode();
  await be.setDoc(`groups/${id}`, {
    name: name.trim(),
    inviteCode,
    leaderUid: user.uid,
    memberUids: [user.uid],
    createdAt: Date.now(),
  } satisfies Omit<Group, "id">);
  await be.setDoc(`invites/${inviteCode}`, { groupId: id });
  await addMember(id, user.name, 0, user.uid);
  return id;
}

export async function joinGroup(user: AppUser, code: string): Promise<string> {
  const be = await getBackend();
  const invite = await be.getDoc<{ groupId: string }>(`invites/${code.trim().toUpperCase()}`);
  if (!invite) throw new Error("초대코드를 찾을 수 없습니다. 다시 확인해 주세요.");
  await be.updateDoc(`groups/${invite.groupId}`, { memberUids: arrayUnion(user.uid) });
  return invite.groupId;
}

export async function watchMyGroups(uid: string, cb: (groups: Group[]) => void) {
  const be = await getBackend();
  return be.watchCollection<Group>("groups", (gs) => cb(gs.sort((a, b) => a.createdAt - b.createdAt)), [
    "memberUids",
    "array-contains",
    uid,
  ]);
}

export async function watchGroup(groupId: string, cb: (g: Group | null) => void) {
  return (await getBackend()).watchDoc<Group>(`groups/${groupId}`, cb);
}

export async function renameGroup(groupId: string, name: string) {
  await (await getBackend()).updateDoc(`groups/${groupId}`, { name: name.trim() });
}

// ── 목원 ──

export async function watchMembers(groupId: string, cb: (m: Member[]) => void) {
  return (await getBackend()).watchCollection<Member>(`groups/${groupId}/members`, (ms) =>
    cb(ms.sort((a, b) => a.order - b.order)),
  );
}

export async function addMember(groupId: string, name: string, order: number, uid?: string) {
  const be = await getBackend();
  await be.setDoc(`groups/${groupId}/members/${be.newId()}`, {
    name: name.trim(),
    order,
    active: true,
    ...(uid ? { uid } : {}),
  } satisfies Omit<Member, "id">);
}

export async function updateMember(groupId: string, memberId: string, fields: Partial<Omit<Member, "id">>) {
  await (await getBackend()).updateDoc(`groups/${groupId}/members/${memberId}`, fields);
}

export async function removeMember(groupId: string, memberId: string) {
  await (await getBackend()).deleteDoc(`groups/${groupId}/members/${memberId}`);
}

// ── 주간 보고서 ──

export async function watchReports(groupId: string, cb: (r: Report[]) => void) {
  return (await getBackend()).watchCollection<Report>(`groups/${groupId}/reports`, (rs) =>
    cb(rs.sort((a, b) => b.date.localeCompare(a.date))),
  );
}

export async function watchReport(groupId: string, reportId: string, cb: (r: Report | null) => void) {
  return (await getBackend()).watchDoc<Report>(`groups/${groupId}/reports/${reportId}`, cb);
}

export async function createReport(groupId: string, date: string, members: Member[]): Promise<string> {
  const be = await getBackend();
  const path = `groups/${groupId}/reports/${date}`;
  if (await be.getDoc(path)) return date;
  const now = Date.now();
  await be.setDoc(path, {
    date,
    entries: Object.fromEntries(members.filter((m) => m.active).map((m) => [m.id, emptyEntry()])),
    createdAt: now,
    updatedAt: now,
  } satisfies Omit<Report, "id">);
  return date;
}

export async function saveEntry(groupId: string, reportId: string, memberId: string, entry: Entry, by: AppUser) {
  // 목원별로 필드를 따로 갱신해서 여러 명이 동시에 작성해도 서로 덮어쓰지 않게 한다.
  await (await getBackend()).updateDoc(`groups/${groupId}/reports/${reportId}`, {
    [`entries.${memberId}`]: { ...entry, updatedBy: by.name, updatedAt: Date.now() },
    updatedAt: Date.now(),
  });
}

export async function updateReport(groupId: string, reportId: string, fields: Partial<Omit<Report, "id" | "entries">>) {
  await (await getBackend()).updateDoc(`groups/${groupId}/reports/${reportId}`, { ...fields, updatedAt: Date.now() });
}

export async function deleteReport(groupId: string, reportId: string) {
  await (await getBackend()).deleteDoc(`groups/${groupId}/reports/${reportId}`);
}

// ── 예배 노트 (개인) ──

export async function watchNotes(uid: string, cb: (n: WorshipNote[]) => void) {
  return (await getBackend()).watchCollection<WorshipNote>(`users/${uid}/notes`, (ns) =>
    cb(ns.sort((a, b) => b.updatedAt - a.updatedAt)),
  );
}

export async function findNotesByDate(uid: string, date: string) {
  return (await getBackend()).getCollection<WorshipNote>(`users/${uid}/notes`, ["date", "==", date]);
}

export async function watchNote(uid: string, noteId: string, cb: (n: WorshipNote | null) => void) {
  return (await getBackend()).watchDoc<WorshipNote>(`users/${uid}/notes/${noteId}`, cb);
}

export async function newNoteId() {
  return (await getBackend()).newId();
}

export async function saveNote(uid: string, note: WorshipNote) {
  const { id, ...data } = note;
  await (await getBackend()).setDoc(`users/${uid}/notes/${id}`, { ...data, updatedAt: Date.now() });
}

export async function deleteNote(uid: string, noteId: string) {
  await (await getBackend()).deleteDoc(`users/${uid}/notes/${noteId}`);
}

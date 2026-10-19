import type { Entry, Member, Report } from "../data/models";

export function todayStr(d = new Date()): string {
  const off = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - off).toISOString().slice(0, 10);
}

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

export function formatDate(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  const wd = WEEKDAYS[new Date(y, m - 1, d).getDay()];
  return `${y}년 ${m}월 ${d}일 (${wd})`;
}

export interface ReportStats {
  attended: number;
  total: number;
  bibleChapters: number;
  dawnPrayerDays: number;
  avgPrayerMinutes: number;
}

export function reportStats(report: Report, members: Member[]): ReportStats {
  const entries = members.map((m) => report.entries[m.id]).filter((e): e is Entry => !!e);
  const sum = (f: (e: Entry) => number) => entries.reduce((acc, e) => acc + (f(e) || 0), 0);
  return {
    attended: entries.filter((e) => e.attended).length,
    total: entries.length,
    bibleChapters: sum((e) => e.bibleChapters),
    dawnPrayerDays: sum((e) => e.dawnPrayerDays),
    avgPrayerMinutes: entries.length ? Math.round(sum((e) => e.prayerMinutes) / entries.length) : 0,
  };
}

// 카카오톡 등에 붙여넣기 좋은 텍스트 보고서
export function reportToText(groupName: string, report: Report, members: Member[]): string {
  const s = reportStats(report, members);
  const lines = [
    `📖 ${groupName} 목장 보고서`,
    `📅 ${formatDate(report.date)}`,
    `👥 출석 ${s.attended}/${s.total}명 · 성경 ${s.bibleChapters}장 · 새벽기도 ${s.dawnPrayerDays}회`,
  ];
  if (report.sermon?.title) lines.push("", `🎤 말씀: ${report.sermon.title}${report.sermon.passage ? ` (${report.sermon.passage})` : ""}`);
  lines.push("", "━━━━━━━━━━");
  for (const m of members) {
    const e = report.entries[m.id];
    if (!e) continue;
    lines.push(
      "",
      `▪ ${m.name}${e.attended ? "" : " (결석)"}`,
      `  성경 ${e.bibleChapters}장 · 새벽 ${e.dawnPrayerDays}회 · 큐티 ${e.qtDays}회 · 기도 하루 ${e.prayerMinutes}분`,
    );
    if (e.prayer.trim()) lines.push(...e.prayer.trim().split("\n").map((l) => `  🙏 ${l}`));
    if (e.note.trim()) lines.push(`  📝 ${e.note.trim()}`);
  }
  if (report.meetingNote?.trim()) lines.push("", "━━━━━━━━━━", "", "📝 모임 나눔", report.meetingNote.trim());
  return lines.join("\n");
}

export async function shareText(title: string, text: string): Promise<"shared" | "copied"> {
  if (navigator.share) {
    try {
      await navigator.share({ title, text });
      return "shared";
    } catch (e) {
      if ((e as DOMException).name === "AbortError") return "shared";
    }
  }
  await navigator.clipboard.writeText(text);
  return "copied";
}

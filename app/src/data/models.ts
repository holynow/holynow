import type { SermonAnalysis } from "../../shared/types";
import type { BibleRef } from "../../shared/bible";

export interface Group {
  id: string;
  name: string;
  inviteCode: string;
  leaderUid: string;
  memberUids: string[];
  createdAt: number;
}

// 목장 명단의 한 사람. 앱을 쓰지 않는 목원도 리더가 이름으로 추가할 수 있고,
// 앱을 쓰는 목원은 자기 계정(uid)을 연결해 직접 작성할 수 있다.
export interface Member {
  id: string;
  name: string;
  uid?: string;
  order: number;
  active: boolean;
}

export interface Entry {
  prayer: string; // 한 주간 기도제목
  bibleChapters: number; // 성경 읽은 장 수
  dawnPrayerDays: number; // 새벽기도 참석 일수 (0~6)
  prayerMinutes: number; // 하루 평균 기도 시간(분)
  qtDays: number; // 큐티(말씀 묵상) 일수 (0~7)
  attended: boolean; // 목장 모임 출석
  note: string;
  updatedBy?: string;
  updatedAt?: number;
}

export interface Report {
  id: string; // 모임 날짜 YYYY-MM-DD
  date: string;
  entries: Record<string, Entry>; // memberId -> 기록
  sermon?: SermonAnalysis;
  representativePrayer?: string;
  meetingNote?: string;
  createdAt: number;
  updatedAt: number;
}

// 예배 노트: 성경 구절 메모 또는 설교 필기
export interface WorshipNote {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  body: string;
  passages: { ref: BibleRef; label: string; text: string; memo: string }[];
  createdAt: number;
  updatedAt: number;
}

export const emptyEntry = (): Entry => ({
  prayer: "",
  bibleChapters: 0,
  dawnPrayerDays: 0,
  prayerMinutes: 0,
  qtDays: 0,
  attended: true,
  note: "",
});

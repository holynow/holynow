// 서버 함수와 프론트엔드가 주고받는 데이터 형태

export interface SermonAnalysis {
  title: string;
  passage: string; // 본문 구절 (예: "요한복음 15:1-8")
  preacher: string;
  summary: string; // 설교 요약
  keyPoints: string[]; // 핵심 메시지
  bulletinQuestions: string[]; // 주보에 실린 나눔 질문 (원문 그대로)
  discussionGuide: {
    focus: string; // 이번 주 목장 나눔의 중심 주제
    questions: { question: string; intent: string }[]; // 추천 나눔 질문과 의도
    application: string; // 한 주간 삶의 적용
  };
}

export interface AnalyzeBulletinRequest {
  images: { mediaType: "image/jpeg" | "image/png" | "image/webp"; data: string }[]; // base64
  extraText?: string;
}

export interface PrayerRequestInput {
  name: string;
  requests: string;
}

export interface GeneratePrayerRequest {
  groupName: string;
  sermon?: Pick<SermonAnalysis, "title" | "passage" | "summary">;
  members: PrayerRequestInput[];
  length: "short" | "normal" | "long";
}

export interface ParseRefRequest {
  text: string;
}

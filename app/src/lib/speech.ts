import { useCallback, useEffect, useRef, useState } from "react";

// Web Speech API (Chrome, Android, iOS Safari 14.5+ 지원)
interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  onresult: ((e: { resultIndex: number; results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
}

function getRecognitionCtor(): (new () => SpeechRecognitionLike) | null {
  const w = window as unknown as Record<string, unknown>;
  return (w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null) as (new () => SpeechRecognitionLike) | null;
}

export const speechSupported = () => getRecognitionCtor() !== null;

const ERROR_MESSAGES: Record<string, string> = {
  "not-allowed": "마이크 권한을 허용해 주세요.",
  "service-not-allowed": "마이크 권한을 허용해 주세요.",
  "no-speech": "음성이 들리지 않았어요. 다시 말씀해 주세요.",
  network: "음성 인식에 인터넷 연결이 필요합니다.",
};

interface Options {
  continuous?: boolean;
  onFinal: (text: string) => void;
}

// continuous=true: 기도제목처럼 길게 받아쓰기, false: 성경 구절처럼 한 문장
export function useSpeech({ continuous = false, onFinal }: Options) {
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [error, setError] = useState<string | null>(null);
  const recRef = useRef<SpeechRecognitionLike | null>(null);
  const onFinalRef = useRef(onFinal);
  onFinalRef.current = onFinal;

  useEffect(() => () => recRef.current?.stop(), []);

  const start = useCallback(() => {
    const Ctor = getRecognitionCtor();
    if (!Ctor) {
      setError("이 브라우저는 음성 입력을 지원하지 않아요. Chrome 또는 Safari를 사용해 주세요.");
      return;
    }
    setError(null);
    const rec = new Ctor();
    rec.lang = "ko-KR";
    rec.continuous = continuous;
    rec.interimResults = true;
    rec.onresult = (e) => {
      let interimText = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) onFinalRef.current(r[0].transcript.trim());
        else interimText += r[0].transcript;
      }
      setInterim(interimText);
    };
    rec.onerror = (e) => {
      if (e.error !== "aborted") setError(ERROR_MESSAGES[e.error] ?? "음성 인식 중 문제가 생겼어요.");
    };
    rec.onend = () => {
      setListening(false);
      setInterim("");
    };
    recRef.current = rec;
    rec.start();
    setListening(true);
  }, [continuous]);

  const stop = useCallback(() => recRef.current?.stop(), []);

  return { listening, interim, error, start, stop, toggle: listening ? stop : start };
}

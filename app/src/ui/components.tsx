import { useEffect, useState, type ReactNode } from "react";
import styled, { css, keyframes } from "styled-components";
import { useSpeech } from "../lib/speech";

export const Page = styled.main`
  max-width: 720px;
  margin: 0 auto;
  padding: 16px 16px calc(96px + env(safe-area-inset-bottom));
`;

export const Header = styled.header`
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 48px;
  margin-bottom: 12px;
  h1 {
    font-size: 21px;
    margin: 0;
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;

export const Card = styled.section`
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  padding: 16px;
  margin-bottom: 12px;
  h2 { font-size: 17px; margin: 0 0 10px; }
  h3 { font-size: 15px; margin: 14px 0 6px; color: var(--text-2); }
`;

export const Muted = styled.p`
  color: var(--text-2);
  font-size: 14px;
  margin: 4px 0;
`;

export const Row = styled.div<{ $gap?: number; $wrap?: boolean }>`
  display: flex;
  align-items: center;
  gap: ${(p) => p.$gap ?? 8}px;
  ${(p) => p.$wrap && "flex-wrap: wrap;"}
`;

export const Stack = styled.div<{ $gap?: number }>`
  display: flex;
  flex-direction: column;
  gap: ${(p) => p.$gap ?? 10}px;
`;

export const Button = styled.button<{ $variant?: "primary" | "ghost" | "danger" | "soft"; $block?: boolean; $small?: boolean }>`
  border: 1px solid transparent;
  border-radius: 12px;
  padding: ${(p) => (p.$small ? "6px 12px" : "11px 16px")};
  font-size: ${(p) => (p.$small ? "14px" : "15px")};
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  white-space: nowrap;
  ${(p) => p.$block && "width: 100%;"}
  ${(p) => {
    switch (p.$variant ?? "primary") {
      case "primary":
        return css`background: var(--primary); color: var(--primary-text);`;
      case "soft":
        return css`background: var(--primary-soft); color: var(--primary);`;
      case "danger":
        return css`background: transparent; color: var(--danger); border-color: var(--border);`;
      default:
        return css`background: var(--surface); color: var(--text); border-color: var(--border);`;
    }
  }}
  &:disabled { opacity: 0.5; cursor: default; }
  &:active:not(:disabled) { transform: scale(0.98); }
`;

export const IconButton = styled.button`
  border: none;
  background: transparent;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  font-size: 20px;
  cursor: pointer;
  flex-shrink: 0;
  &:hover { background: var(--surface-2); }
`;

const fieldCss = css`
  width: 100%;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: var(--surface);
  padding: 10px 12px;
  font-size: 16px; /* iOS 확대 방지 */
  outline: none;
  &:focus { border-color: var(--primary); }
`;

export const Input = styled.input`${fieldCss}`;
export const Select = styled.select`${fieldCss}`;
export const TextArea = styled.textarea`
  ${fieldCss}
  resize: vertical;
  min-height: 84px;
  line-height: 1.6;
`;

export const Label = styled.label`
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-2);
  margin-bottom: 6px;
`;

export const Badge = styled.span<{ $tone?: "primary" | "muted" | "accent" }>`
  display: inline-block;
  font-size: 12px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 999px;
  ${(p) =>
    p.$tone === "accent"
      ? css`background: rgba(245, 165, 36, 0.15); color: var(--accent);`
      : p.$tone === "muted"
        ? css`background: var(--surface-2); color: var(--text-2);`
        : css`background: var(--primary-soft); color: var(--primary);`}
`;

export const ErrorText = styled.p`
  color: var(--danger);
  font-size: 14px;
  margin: 6px 0;
`;

const spin = keyframes`to { transform: rotate(360deg); }`;
export const Spinner = styled.span`
  width: 16px;
  height: 16px;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  display: inline-block;
  animation: ${spin} 0.7s linear infinite;
`;

export function Loading({ text = "불러오는 중…" }: { text?: string }) {
  return (
    <Row style={{ justifyContent: "center", padding: 32, color: "var(--text-2)" }}>
      <Spinner /> {text}
    </Row>
  );
}

// 숫자 입력: 휴대폰에서 누르기 쉽게 −/+ 버튼
const StepperBox = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 0;
  border-bottom: 1px solid var(--border);
  &:last-child { border-bottom: none; }
  .label { flex: 1; font-size: 15px; }
  .label small { display: block; color: var(--text-3); font-size: 12px; }
  .ctrl { display: flex; align-items: center; gap: 4px; }
  .ctrl button {
    width: 36px; height: 36px; border-radius: 10px;
    border: 1px solid var(--border); background: var(--surface-2);
    font-size: 18px; cursor: pointer;
  }
  .ctrl input {
    width: 56px; text-align: center; border: none; background: transparent;
    font-size: 17px; font-weight: 700; outline: none;
  }
`;

export function Stepper(props: {
  label: string;
  hint?: string;
  value: number;
  onChange: (v: number) => void;
  step?: number;
  min?: number;
  max?: number;
  unit?: string;
}) {
  const { label, hint, value, onChange, step = 1, min = 0, max = 9999, unit } = props;
  const clamp = (v: number) => Math.max(min, Math.min(max, v));
  return (
    <StepperBox>
      <div className="label">
        {label}
        {hint && <small>{hint}</small>}
      </div>
      <div className="ctrl">
        <button type="button" aria-label={`${label} 줄이기`} onClick={() => onChange(clamp(value - step))}>−</button>
        <input
          inputMode="numeric"
          value={value}
          aria-label={label}
          onChange={(e) => onChange(clamp(Number(e.target.value.replace(/\D/g, "")) || 0))}
        />
        <button type="button" aria-label={`${label} 늘리기`} onClick={() => onChange(clamp(value + step))}>+</button>
        {unit && <span style={{ width: 20, fontSize: 14, color: "var(--text-2)" }}>{unit}</span>}
      </div>
    </StepperBox>
  );
}

const pulse = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(229, 72, 77, 0.45); }
  100% { box-shadow: 0 0 0 14px rgba(229, 72, 77, 0); }
`;

const MicBtn = styled.button<{ $on: boolean; $big?: boolean }>`
  border: none;
  border-radius: 999px;
  cursor: pointer;
  flex-shrink: 0;
  width: ${(p) => (p.$big ? 84 : 40)}px;
  height: ${(p) => (p.$big ? 84 : 40)}px;
  font-size: ${(p) => (p.$big ? 34 : 18)}px;
  background: ${(p) => (p.$on ? "var(--danger)" : "var(--primary-soft)")};
  color: ${(p) => (p.$on ? "#fff" : "var(--primary)")};
  ${(p) => p.$on && css`animation: ${pulse} 1.2s infinite;`}
`;

// 음성으로 받아쓰기. 인식된 문장을 onText로 넘긴다.
export function MicButton({ onText, continuous, big, label = "음성 입력" }: {
  onText: (text: string) => void;
  continuous?: boolean;
  big?: boolean;
  label?: string;
}) {
  const speech = useSpeech({ continuous, onFinal: onText });
  return (
    <Stack $gap={4} style={{ alignItems: big ? "center" : "flex-start" }}>
      <MicBtn type="button" $on={speech.listening} $big={big} onClick={speech.toggle} aria-label={speech.listening ? "음성 입력 멈추기" : label}>
        {speech.listening ? "■" : "🎤"}
      </MicBtn>
      {speech.listening && <Muted>{speech.interim || "듣고 있어요…"}</Muted>}
      {speech.error && <ErrorText>{speech.error}</ErrorText>}
    </Stack>
  );
}

const ToastBox = styled.div`
  position: fixed;
  left: 50%;
  bottom: calc(84px + env(safe-area-inset-bottom));
  transform: translateX(-50%);
  background: rgba(20, 24, 36, 0.92);
  color: #fff;
  padding: 10px 18px;
  border-radius: 999px;
  font-size: 14px;
  z-index: 100;
  max-width: calc(100vw - 32px);
`;

let pushToast: ((msg: string) => void) | null = null;
export const toast = (msg: string) => pushToast?.(msg);

export function ToastHost() {
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => {
    let timer: number | undefined;
    pushToast = (m) => {
      setMsg(m);
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setMsg(null), 2400);
    };
    return () => {
      pushToast = null;
      window.clearTimeout(timer);
    };
  }, []);
  return msg ? <ToastBox role="status">{msg}</ToastBox> : null;
}

export const EmptyState = ({ icon, title, children }: { icon: string; title: string; children?: ReactNode }) => (
  <Card style={{ textAlign: "center", padding: "32px 16px" }}>
    <div style={{ fontSize: 40 }}>{icon}</div>
    <h2 style={{ margin: "8px 0 4px" }}>{title}</h2>
    {children}
  </Card>
);

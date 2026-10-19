import { createGlobalStyle } from "styled-components";

export const GlobalStyle = createGlobalStyle`
  :root {
    --bg: #f6f7fb;
    --surface: #ffffff;
    --surface-2: #f0f2f8;
    --text: #1d2233;
    --text-2: #5d6478;
    --text-3: #8d93a5;
    --border: #e3e6ef;
    --primary: #4f7cff;
    --primary-soft: #e8eeff;
    --primary-text: #ffffff;
    --accent: #f5a524;
    --danger: #e5484d;
    --success: #30a46c;
    --radius: 14px;
    --shadow: 0 1px 2px rgba(20, 30, 60, 0.06), 0 4px 16px rgba(20, 30, 60, 0.05);
    color-scheme: light;
  }
  @media (prefers-color-scheme: dark) {
    :root {
      --bg: #12141b;
      --surface: #1b1e28;
      --surface-2: #242835;
      --text: #eceef5;
      --text-2: #a9afc0;
      --text-3: #7a8094;
      --border: #2e3343;
      --primary: #7096ff;
      --primary-soft: #232c48;
      --shadow: none;
      color-scheme: dark;
    }
  }
  * { box-sizing: border-box; }
  html, body { margin: 0; }
  body {
    background: var(--bg);
    color: var(--text);
    font-family: "Pretendard", -apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", sans-serif;
    font-size: 16px;
    line-height: 1.55;
    -webkit-font-smoothing: antialiased;
    word-break: keep-all;
    overflow-wrap: anywhere;
  }
  button, input, textarea, select { font: inherit; color: inherit; }
  a { color: inherit; text-decoration: none; }
`;

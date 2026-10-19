import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import type { IncomingMessage } from "node:http";

// 로컬 개발 시 api/*.ts 서버 함수를 Vercel과 같은 방식(Web Request -> Response)으로 실행한다.
function devApi(): Plugin {
  return {
    name: "dev-api",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url ?? "/", "http://localhost");
        const match = url.pathname.match(/^\/api\/([\w-]+)$/);
        if (!match) return next();
        try {
          const mod = await server.ssrLoadModule(`/api/${match[1]}.ts`);
          const handler = mod[req.method ?? "GET"];
          if (typeof handler !== "function") {
            res.statusCode = 405;
            return res.end();
          }
          const body = req.method === "GET" || req.method === "HEAD" ? undefined : await readBody(req);
          const request = new Request(new URL(req.url ?? "/", `http://${req.headers.host}`), {
            method: req.method,
            headers: req.headers as Record<string, string>,
            body: body ? new Uint8Array(body) : undefined,
          });
          const response: Response = await handler(request);
          res.statusCode = response.status;
          response.headers.forEach((value, key) => res.setHeader(key, value));
          res.end(Buffer.from(await response.arrayBuffer()));
        } catch (error) {
          server.config.logger.error(String(error));
          res.statusCode = 500;
          res.end(JSON.stringify({ error: "서버 함수 실행 중 오류가 발생했습니다." }));
        }
      });
    },
  };
}

function readBody(req: IncomingMessage): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (c: Buffer) => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

export default defineConfig(({ mode }) => {
  // 서버 함수가 process.env로 ANTHROPIC_API_KEY 등을 읽을 수 있게 .env를 주입
  Object.assign(process.env, loadEnv(mode, process.cwd(), ""));
  return { plugins: [react(), devApi()], build: { chunkSizeWarningLimit: 800 } };
});

import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import { createProxyMiddleware } from "http-proxy-middleware";

const app = express();
const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

(async () => {
  // 1. Setup logging to ensure all requests (including proxied ones) are logged
  app.use((req, res, next) => {
    const start = Date.now();
    const path = req.path;
    let capturedJsonResponse: Record<string, any> | undefined = undefined;

    const originalResJson = res.json;
    res.json = function (bodyJson, ...args) {
      capturedJsonResponse = bodyJson;
      return originalResJson.apply(res, [bodyJson, ...args]);
    };

    res.on("finish", () => {
      const duration = Date.now() - start;
      if (path.startsWith("/api")) {
        let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
        if (capturedJsonResponse) {
          logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
        }

        log(logLine);
      }
    });

    next();
  });

  // 2. Setup the Proxy in production IF it's an /api request
  const backendUrl = process.env.BACKEND_URL;

  if (backendUrl) {
    log(`Raw BACKEND_URL: "${backendUrl}"`, "proxy");
    // Ensure the target has a protocol
    let target = backendUrl.trim();
    if (!target.startsWith("http")) {
      target = `http://${target}`;
      if (!target.includes(":")) {
        target = `${target}:5001`; // Default to 5001 for internal hosts
      }
    }

    log(`Proxying /api to ${target}`, "proxy");
    app.use(
      createProxyMiddleware({
        pathFilter: "/api",
        target,
        changeOrigin: true,
        secure: false,
        on: {
          error: (err, _req, res) => {
            log(`Proxy Error (${target}): ${err.message}`, "proxy");
            (res as Response).status(504).json({
              message: "Backend Connection Error: Service might be starting up or sleeping",
              target: target,
              error: err.message
            });
          }
        }
      })
    );
  }

  // 3. Setup Vite Middleware (Dev only) for Proxying
  // In development, the proxy is handled by Vite's middleware
  let vite: any;
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const viteConfig = (await import("../vite.config")).default;
    vite = await createViteServer({
      ...viteConfig,
      server: { middlewareMode: true, hmr: { server: httpServer } },
      appType: "custom",
    });
    app.use(vite.middlewares);
  }

  // 4. Body parsers for local routes (Node)
  app.use(
    express.json({
      verify: (req, _res, buf) => {
        (req as any).rawBody = buf;
      },
    }),
  );
  app.use(express.urlencoded({ extended: false }));

  // 5. Register local backend routes
  await registerRoutes(httpServer, app);

  // 6. Error handling for API routes
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
  });

  // 7. Last Fallback: Serve Static index.html or Vite Template
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const path = await import("path");
    const fs = await import("fs");
    const { nanoid } = await import("nanoid");

    app.use("*", async (req, res, next) => {
      const url = req.originalUrl;
      try {
        const clientTemplate = path.resolve(import.meta.dirname, "..", "client", "index.html");
        let template = await fs.promises.readFile(clientTemplate, "utf-8");
        template = template.replace(`src="/src/main.tsx"`, `src="/src/main.tsx?v=${nanoid()}"`);
        const page = await vite.transformIndexHtml(url, template);
        res.status(200).set({ "Content-Type": "text/html" }).end(page);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen(
    {
      port,
      host: "0.0.0.0",
    },
    () => {
      log(`serving on port ${port}`);
    },
  );
})();

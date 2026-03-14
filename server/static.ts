import express, { type Express } from "express";
import path from "path";
import { fileURLToPath } from "url";

export function serveStatic(app: Express) {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const publicPath = path.resolve(__dirname, "public");

  app.use(express.static(publicPath));
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(publicPath, "index.html"));
  });
}

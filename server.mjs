import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, resolve, sep } from "node:path";

const root = join(process.cwd(), "src");
const types = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".png": "image/png", ".webp": "image/webp", ".glb": "model/gltf-binary" };

createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
    if (pathname.includes('\\') || pathname.includes('\0') || pathname.split('/').some(part => part.startsWith('.'))) throw new Error('Invalid path');
    const route = pathname === '/' ? 'index.html' : pathname.slice(1);
    let filePath = resolve(root, route);
    if (!filePath.startsWith(root + sep)) throw new Error('Outside public directory');
    if (!extname(filePath)) filePath += '.html';
    if ((await stat(filePath)).isDirectory()) filePath = join(filePath, "index.html");
    response.writeHead(200, { "Content-Type": types[extname(filePath)] || "application/octet-stream", "Cache-Control": "no-store" });
    response.end(await readFile(filePath));
  } catch {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
  }
}).listen(Number(process.env.PORT || 4173), "127.0.0.1", () => console.log(`Local: http://127.0.0.1:${process.env.PORT || 4173}`));

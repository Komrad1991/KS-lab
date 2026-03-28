import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const outputDir = path.resolve(__dirname, '../.output');
const port = 4173;

const CONTENT_TYPES = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.webp': 'image/webp',
};

const resolveFilePath = requestedPath => {
  const normalizedPath = requestedPath === '/' ? '/index.html' : requestedPath;
  const safeRelativePath = normalizedPath.replace(/^\/+/, '');
  const candidate = path.resolve(outputDir, safeRelativePath);

  if (!candidate.startsWith(outputDir)) {
    return null;
  }

  return candidate;
};

const serveFile = async (filePath, response) => {
  const extension = path.extname(filePath);
  const body = await readFile(filePath);
  response.writeHead(200, {
    'Content-Type':
      CONTENT_TYPES[extension] ?? 'application/octet-stream',
    'Cache-Control': 'no-store',
  });
  response.end(body);
};

const server = createServer(async (request, response) => {
  try {
    const requestUrl = new URL(request.url ?? '/', `http://127.0.0.1:${port}`);
    const decodedPath = decodeURIComponent(requestUrl.pathname);
    const filePath = resolveFilePath(decodedPath);

    if (!filePath) {
      response.writeHead(403);
      response.end('Forbidden');
      return;
    }

    try {
      await serveFile(filePath, response);
      return;
    } catch (error) {
      const fallbackPath = path.resolve(outputDir, 'index.html');

      if (filePath !== fallbackPath) {
        await serveFile(fallbackPath, response);
        return;
      }

      throw error;
    }
  } catch (error) {
    response.writeHead(500);
    response.end(
      error instanceof Error ? error.message : 'Failed to serve output.'
    );
  }
});

server.listen(port, '127.0.0.1', () => {
  console.log(`Serving demo output from ${outputDir} at http://127.0.0.1:${port}`);
});

const shutdown = () => {
  server.close(() => process.exit(0));
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

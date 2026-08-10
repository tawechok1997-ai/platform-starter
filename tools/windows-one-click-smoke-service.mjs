import { createServer } from 'node:http';

const port = Number.parseInt(process.argv[2] ?? '', 10);
const name = process.argv[3] ?? 'service';

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  console.error(`Invalid port: ${process.argv[2] ?? '<missing>'}`);
  process.exit(2);
}

const server = createServer((request, response) => {
  response.writeHead(200, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
  });
  response.end(JSON.stringify({
    ok: true,
    name,
    path: request.url ?? '/',
    pid: process.pid,
  }));
});

server.on('error', (error) => {
  console.error(`${name} smoke service failed:`, error);
  process.exit(1);
});

server.listen(port, '127.0.0.1', () => {
  console.log(`${name} smoke service listening on http://127.0.0.1:${port}`);
});

const shutdown = () => {
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 3_000).unref();
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

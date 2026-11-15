import http from 'node:http';
import { env } from '../config/env.js';

export function startHttpServer(): http.Server {
  const server = http.createServer((req, res) => {
    if (req.url === '/health' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok', service: 'vexis-backend' }));
      return;
    }

    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not Found' }));
  });

  server.listen(env.BACKEND_PORT, () => {
    console.log(`[HTTP] Healthcheck server listening on port ${env.BACKEND_PORT}`);
  });

  return server;
}

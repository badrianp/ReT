import http from 'http';
import { router } from './utils/router.js';
import fs from 'fs';

const BASE_PORT = 3000;
let currentPort = BASE_PORT;

function startServer(port) {
  const server = http.createServer((req, res) => {
    if (req.url.startsWith('/public/')) {
      const filePath = '.' + req.url;
      fs.readFile(filePath, (err, data) => {
        if (err) {
          res.writeHead(404);
          res.end('Fisier inexistent');
        } else {
          res.writeHead(200);
          res.end(data);
        }
      });
    } else {
      router(req, res);
    }
  });

  server.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`⚠️  Port ${port} is in use, trying ${port + 1}...`);
      startServer(port + 1);
    } else {
      console.error('❌ Server error:\n', err);
    }
  });
}

startServer(currentPort);
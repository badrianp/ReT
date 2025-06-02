import http from 'http';
import { router } from './utils/router.js';
import fs from 'fs';

const PORT = 3000;

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

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
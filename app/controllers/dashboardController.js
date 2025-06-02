import { readFile } from 'fs';
import { join } from 'path';

export function showDashboard(req, res) {
  const filePath = join(process.cwd(), 'app', 'views', 'dashboard.html');
  readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('error loading dashboard');
    } else {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(data);
    }
  });
}
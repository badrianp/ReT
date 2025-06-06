import { handleLoginPost, handleRegisterPost, handleLogout } from '../app/controllers/authController.js';
import { showDashboard } from '../app/controllers/dashboardController.js';
import { handleDeleteFeed, handleAddFeed, getAllTopics, getCustomRssFeed } from '../app/controllers/rssController.js';

export function router(req, res) {
  const { url, method } = req;

  if (method === 'GET' && (url === '/' || url === '/dashboard')) {
    return showDashboard(req, res);
  }

  if (method === 'POST' && url === '/login') {
    return handleLoginPost(req, res);
  }

  if (method === 'POST' && url === '/register') {
    return handleRegisterPost(req, res);
  }

  if (method === 'GET' && url === '/logout') {
    return handleLogout(req, res);
  }

  if (method === 'GET' && url === '/rss-categories') {
    return getAllTopics(req, res);
  }

  if (method === 'POST' && url === '/custom-rss') {
    return getCustomRssFeed(req, res);
  }
  
  if (method === 'POST' && url === '/add-feed') {
    return handleAddFeed(req, res);
  }

  if (method === 'POST' && url === '/delete-feed') {
    return handleDeleteFeed(req, res);
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('404 Not Found');
}

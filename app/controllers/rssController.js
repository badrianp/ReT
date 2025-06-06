import Parser from 'rss-parser';
import { pool as db } from '../../config/db.js'
import { parseRequestBody } from '../../utils/bodyParser.js';
import { deleteFeedById, getFeedById, addFeed, isValidRssUrl, getAllFeeds } from '../models/feedsModel.js';

// const parser = new Parser();
const parser = new Parser({
  headers: { 'User-Agent': 'ReT RSS Reader - contact@ret.com' }
});

export async function getAllTopics(req, res) {
  try {
    const feeds = await getAllFeeds();

    const results = await Promise.all(
      feeds.map(async ({ id, title, url, added_by }) => {
        try {
          const feed = await parser.parseURL(url);
          const items = feed.items.slice(0, 8).map(item => ({
            id: item.id,
            title: item.title,
            url: item.link,
            pubDate: item.pubDate || null,
            content: item.content
          }));
          if (!items.length) return null;
          return { id, title, url, added_by, items };
        } catch (err) {
          if (err.code === 'ETIMEDOUT' || err.statusCode === 429) {
            console.warn(`Rate limited: ${title}`);
          }
          console.warn(`Could not load feed: ${title}`, err.message);
          return null;
        }
      })
    );
    
    const validResults = results.filter(feed => feed !== null);
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(validResults));
  } catch (err) {
    res.writeHead(500).end(JSON.stringify({ error: 'DB load error' }));
  }
}

export async function getCustomRssFeed(req, res) {
  try {
    const { url } = await parseRequestBody(req);
    const feed = await parser.parseURL(url);

    const items = feed.items.slice(0, 10).map(item => ({
      title: item.title,
      url: item.link,
      content: item.content
    }));

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(items));
  } catch (error) {
    console.error('Eroare feed custom:', error);
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Could not load custom RSS feed' }));
  }
}

export async function handleAddFeed(req, res) {
  if (req.method !== 'POST') return;

  try {
    const { title, url, username } = await parseRequestBody(req);

    if (!title || !url || !username) {
      return res.writeHead(400).end(JSON.stringify({ error: 'Missing fields:' + title + url + username }));
    }

    const [existing] = await db.query('SELECT * FROM feeds WHERE url = ?', [url]);
    if (existing.length > 0) {
      return res.writeHead(400).end(JSON.stringify({ error: 'Feed already exists' }));
    }

    const valid = await isValidRssUrl(url);
    if (!valid) {
      return res.writeHead(400).end(JSON.stringify({ error: 'Invalid RSS URL' }));
    }

    await addFeed({ title, url, added_by: username });

    res.writeHead(200).end(JSON.stringify({ success: true }));
  } catch (err) {
    res.writeHead(500).end(JSON.stringify({ error: 'Failed to add feed:' + err }));
  }
}

export async function handleDeleteFeed(req, res) {
  if (req.method !== 'POST') return;

  try {
    const { id, username } = await parseRequestBody(req);
    // const username = req.body.username;

    if (!username || !id) {
      return res.writeHead(403).end(JSON.stringify({ error: 'Unauthorized or missing data' }));
    }

    const [feed] = await getFeedById(id);
    if (!feed) {
      return res.writeHead(404).end(JSON.stringify({ error: 'Feed not found' }));
    }

    const [user] = await db.query('SELECT * FROM users WHERE username = ?', [username]);
    if (!user.length) return res.writeHead(403).end(JSON.stringify({ error: 'User not found' }));

    const isAdmin = user[0].is_admin === 1;
    const isOwner = feed.added_by === username;

    if (!isAdmin && !isOwner) {
      return res.writeHead(403).end(JSON.stringify({ error: 'Not allowed to delete this feed' }));
    }

    await deleteFeedById(id);
    res.writeHead(200).end(JSON.stringify({ success: true }));
  } catch (err) {
    console.error(err);
    res.writeHead(500).end(JSON.stringify({ error: 'Server error' }));
  }
}
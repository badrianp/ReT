import Parser from 'rss-parser';
import { parseRequestBody } from '../../utils/bodyParser.js';
import { addFeed, isValidRssUrl, getAllFeeds } from '../models/feedsModel.js';

const parser = new Parser();

export async function getAllTopics(req, res) {
  try {
    const feeds = await getAllFeeds();

    const results = await Promise.all(
      feeds.map(async ({ title, url, added_by }) => {
        try {
          const feed = await parser.parseURL(url);
          const items = feed.items.slice(0, 8).map(item => ({
            title: item.title,
            url: item.link,
            pubDate: item.pubDate || null,
            content: item.content
          }));
          return { title, items };
        } catch (err) {
          return { title, items: [] };
        }
      })
    );

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(results));
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
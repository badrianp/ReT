import Parser from 'rss-parser';
import { parseRequestBody } from '../../utils/bodyParser.js';
import fs from 'fs/promises';
import path from 'path';

const parser = new Parser();

export async function getAllTopics(req, res) {
  try {
    const filePath = path.resolve('data/categories.json');
    const jsonData = await fs.readFile(filePath, 'utf-8');
    const categories = JSON.parse(jsonData);

    const results = await Promise.all(
      categories.map(async ({ title, url }) => {
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
  } catch (error) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Could not load topics' }));
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
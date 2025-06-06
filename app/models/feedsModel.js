import { pool as db } from '../../config/db.js';
import Parser from 'rss-parser';

const parser = new Parser();

export async function addFeed({ title, url, added_by }) {
  await db.query(
    'INSERT INTO feeds (title, url, added_by) VALUES (?, ?, ?)',
    [title, url, added_by]
  );
}

export async function getAllFeeds() {
  const [rows] = await db.query(
    `SELECT f.id, f.title, f.url, f.added_by FROM feeds f`
  );
  return rows;
}

export async function isValidRssUrl(url) {
  try {
    const feed = await parser.parseURL(url);
    return feed.items && feed.items.length > 0;
  } catch {
    return false;
  }
}

export async function deleteFeedById(id) {
  await db.query('DELETE FROM feeds WHERE id = ?', [id]);
}

export async function getFeedById(id) {
  const [rows] = await db.query('SELECT * FROM feeds WHERE id = ?', [id]);
  return rows;
}
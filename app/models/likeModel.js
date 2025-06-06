import { pool as db } from '../../config/db.js';

export async function likeTopic({ username, topicId }) {
  await db.query(
    `INSERT IGNORE INTO likes (username, topic_id) VALUES (?, ?)`,
    [username, topicId]
  );
}

export async function unlikeTopic({ username, topicId }) {
  await db.query(
    `DELETE FROM likes WHERE username = ? AND topic_id = ?`,
    [username, topicId]
  );
}

export async function isTopicLiked(username, topicId) {
  const [rows] = await db.query(
    `SELECT 1 FROM likes WHERE username = ? AND topic_id = ? LIMIT 1`,
    [username, topicId]
  );
  return rows.length > 0;
}

export async function getLikesCount(topicId) {
  const [rows] = await db.query(
    `SELECT COUNT(*) AS count FROM likes WHERE topic_id = ?`,
    [topicId]
  );
  return rows[0].count || 0;
}
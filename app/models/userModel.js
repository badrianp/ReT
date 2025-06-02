import { pool as db } from '../../config/db.js';

export async function validateUser(username, password) {
  const [rows] = await db.execute(
    'SELECT * FROM users WHERE username = ? AND password = ?',
    [username, password]
  );
  return rows.length > 0;
}

export async function createUser(username, password) {
  try {
    const [result] = await db.execute(
      'INSERT INTO users (username, password) VALUES (?, ?)',
      [username, password]
    );
    return result.affectedRows === 1;
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      console.warn('username already exists.');
    } else {
      console.error('user register error:', error);
    }
    return false;
  }
}
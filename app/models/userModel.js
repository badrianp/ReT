import { pool as db } from '../../config/db.js';
import bcrypt from 'bcrypt';

export async function validateUser(username, password) {
  const [rows] = await db.execute(
    'SELECT * FROM users WHERE username = ?',
    [username]
  );

  if (rows.length === 0) return false;

  const match = await bcrypt.compare(password, rows[0].password);
  return match;
}

export async function createUser(username, password) {
  try {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const [result] = await db.execute(
      'INSERT INTO users (username, password) VALUES (?, ?)',
      [username, hashedPassword]
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
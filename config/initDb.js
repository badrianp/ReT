import mysql from 'mysql2/promise';
import fs from 'fs/promises';
import bcrypt from 'bcrypt'
import path from 'path';

async function loadInitialFeedsIfEmpty(connection) {
  const [rows] = await connection.query('SELECT COUNT(*) as count FROM feeds');
  if (rows[0].count === 0) {
    const filePath = path.resolve('data/categories.json');
    const raw = await fs.readFile(filePath, 'utf-8');
    const categories = JSON.parse(raw);

    for (const { title, url } of categories) {
      await connection.query(
        'INSERT INTO feeds (title, url, added_by) VALUES (?, ?, ?)',
        [title, url, 'admin']
      );
    }
    console.log('Feeds loaded from categories.json');
  }
}

const config = {
  host: 'localhost',
  user: 'root',
  password: ''
};

const dbName = 'ret';

async function tableNeedsReset(connection, tableName, requiredColumns) {
  const [columns] = await connection.query(`SHOW COLUMNS FROM \`${tableName}\``);
  const existing = columns.map(col => col.Field);
  return !requiredColumns.every(col => existing.includes(col));
}

async function initDatabase() {
  try {
    const connection = await mysql.createConnection(config);

    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    await connection.query(`USE \`${dbName}\``);

    // === USERS ===
    const [userTables] = await connection.query("SHOW TABLES LIKE 'users'");
    if (userTables.length > 0) {
      const needsReset = await tableNeedsReset(connection, 'users', ['id', 'username', 'password', 'is_admin']);
      if (needsReset) {
        await connection.query('DROP TABLE users');
        console.log('Table `users` dropped for re-creation.');
      }
    }

    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(100) NOT NULL,
        is_admin TINYINT(1) DEFAULT 0
      );
    `);
    console.log(`'users' table checked.`);

    const [existingUsers] = await connection.query(
      'SELECT * FROM users WHERE username = ?',
      ['admin']
    );
    if (existingUsers.length === 0) {
      const hashed = await bcrypt.hash("admin", 10);
      await connection.query(
        'INSERT INTO users (username, password, is_admin) VALUES (?, ?, ?)',
        ['admin', hashed, 1]
      );
      console.log(`'admin' user created.`);
    }

    // === FEEDS ===
    const [feedTables] = await connection.query("SHOW TABLES LIKE 'feeds'");
    if (feedTables.length > 0) {
      const needsReset = await tableNeedsReset(connection, 'feeds', ['id', 'title', 'url', 'added_by']);
      if (needsReset) {
        await connection.query('DROP TABLE feeds');
        console.log('Table `feeds` dropped for re-creation.');
      }
    }

    await connection.query(`
      CREATE TABLE IF NOT EXISTS feeds (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        url TEXT NOT NULL UNIQUE,
        added_by VARCHAR(100) DEFAULT 'admin',
        FOREIGN KEY (added_by) REFERENCES users(username) ON DELETE SET NULL
      );
    `);
    await loadInitialFeedsIfEmpty(connection);
    console.log(`'feeds' table checked.`);

    // === LIKES ===
    const [likeTables] = await connection.query("SHOW TABLES LIKE 'likes'");
    if (likeTables.length > 0) {
      const needsReset = await tableNeedsReset(connection, 'likes', ['id', 'username', 'topic_id', 'liked_at']);
      if (needsReset) {
        await connection.query('DROP TABLE likes');
        console.log('Table `likes` dropped for re-creation.');
      }
    }

    await connection.query(`
      CREATE TABLE IF NOT EXISTS likes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(100) NOT NULL,
        topic_id INT NOT NULL,
        liked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (username) REFERENCES users(username) ON DELETE CASCADE,
        FOREIGN KEY (topic_id) REFERENCES feeds(id) ON DELETE CASCADE
      );
    `);
    console.log(`'likes' table checked.`);
    
    await connection.end();
    console.log('Init success.');
  } catch (err) {
    console.error('Init error:', err);
  }
}

initDatabase();
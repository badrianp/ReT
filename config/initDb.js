import mysql from 'mysql2/promise';

const config = {
  host: 'localhost',
  user: 'root',
  password: '',
};

const dbName = 'ret';

const schema = `
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(100) NOT NULL
);
`;

const demoUser = {
  username: 'admin',
  password: 'admin'
};

async function initDatabase() {
  try {
    const connection = await mysql.createConnection(config);

    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    console.log(`'${dbName}' database checked.`);

    await connection.query(`USE \`${dbName}\``);
    await connection.query(schema);
    console.log(`'users' table checked.`);

    const [rows] = await connection.query(
      'SELECT * FROM users WHERE username = ?',
      [demoUser.username]
    );

    if (rows.length === 0) {
      await connection.query(
        'INSERT INTO users (username, password) VALUES (?, ?)',
        [demoUser.username, demoUser.password]
      );
      console.log(`'${demoUser.username}' demo user created.`);
    } else {
      console.log(`'${demoUser.username}' demo user already exists.`);
    }

    await connection.end();
    console.log('Init success.');
  } catch (err) {
    console.error('Init error:', err);
  }
}

initDatabase();
import mysql from 'mysql2/promise';

const config = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'ret'
};

async function dropTables() {
  const conn = await mysql.createConnection(config);

  await conn.query('DROP TABLE IF EXISTS likes');
  await conn.query('DROP TABLE IF EXISTS feeds');
  await conn.query('DROP TABLE IF EXISTS users');
  await conn.query('DROP DATABASE IF EXISTS ret');

  console.log('database dropped.');
  await conn.end();
}

dropTables();
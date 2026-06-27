import mysql from 'mysql2/promise';
import { config } from '../config.js';

async function checkDatabase() {
  const { host, port, user, password, database } = config.db;

  const connection = await mysql.createConnection({
    host,
    port,
    user,
    password,
  });

  await connection.query('SELECT 1');
  const [rows] = await connection.query('SHOW DATABASES LIKE ?', [database]);

  if (rows.length > 0) {
    console.log(`Database "${database}" is reachable.`);
  } else {
    console.log(`Database "${database}" was not found. Run npm run db:init to create it.`);
  }

  await connection.end();
}

checkDatabase().catch((err) => {
  console.error('Database check failed:', err.message);
  process.exit(1);
});

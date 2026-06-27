import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
import { config } from '../config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function initDatabase() {
  const { host, port, user, password, database } = config.db;

  const connection = await mysql.createConnection({
    host,
    port,
    user,
    password,
    multipleStatements: true,
  });

  await connection.query(`CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  await connection.query(`USE \`${database}\``);

  const schemaPath = path.join(__dirname, 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');
  const statements = schema
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean);

  for (const statement of statements) {
    await connection.query(statement);
  }

  await connection.end();
  console.log(`Database "${database}" initialized successfully.`);
}

initDatabase().catch((err) => {
  console.error('Database initialization failed:', err.message);
  process.exit(1);
});

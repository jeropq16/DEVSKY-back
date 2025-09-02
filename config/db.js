// backend/db.js
import mysql from 'mysql2/promise';

const db = mysql.createPool({
  host: process.env.DB_HOST || '34.123.42.113',
  database: process.env.DB_NAME || 'gmap1',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'Superdev123456?',
  port: process.env.DB_PORT || 3306
});

export default db;

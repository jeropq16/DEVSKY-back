// backend/db.js
import mysql from 'mysql2/promise';

const db = mysql.createPool({
  host:  '34.123.42.113',
  database:  'gmap1',
  user:  'root',
  password:  'Superdev123456?',
  port:  3306
});

export default db;

const { Pool } = require('pg');
require('dotenv').config();

const db = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const messages = async () => {
  try {
    const result = await db.query('SELECT * FROM messages');
    return result.rows;
  } catch (err) {
    console.error('Error executing query', err.stack);
    throw err;
  }
};

module.exports = { db, messages };

const { Pool } = require('pg');

require('dotenv').config();

const pool = new Pool({
  connectionString: 'postgresql://postgres:password@localhost:5432/members',
});

module.exports = pool;

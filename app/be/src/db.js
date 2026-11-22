const { Pool } = require('pg');
const crypto = require('crypto');
const config = require('./config');

const md5 = (value) => crypto.createHash('md5').update(value).digest('hex');

const createPool = () => new Pool({ ...config.db });

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// The DB is provisioned separately (e.g. in K8s), so wait for it instead of crashing on start.
async function waitForDb(pool, retries = config.dbConnectRetries, delayMs = config.dbConnectDelayMs) {
  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      await pool.query('SELECT 1');
      return;
    } catch (err) {
      console.log(`DB not ready (${attempt}/${retries}): ${err.message}`);
      if (attempt === retries) throw err;
      await sleep(delayMs);
    }
  }
}

async function initSchema(pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(50) UNIQUE NOT NULL,
      password_hash VARCHAR(64) NOT NULL,
      role VARCHAR(20) NOT NULL DEFAULT 'user'
    )`);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS items (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      description TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )`);

  const { seedUsers } = config;
  await pool.query(
    `INSERT INTO users (username, password_hash, role) VALUES
       ($1, $2, 'admin'), ($3, $4, 'user')
     ON CONFLICT (username) DO NOTHING`,
    [
      seedUsers.adminUsername, md5(seedUsers.adminPassword),
      seedUsers.traineeUsername, md5(seedUsers.traineePassword),
    ]
  );
  const { rows } = await pool.query('SELECT COUNT(*)::int AS count FROM items');
  if (rows[0].count === 0) {
    await pool.query(
      `INSERT INTO items (name, description) VALUES
         ('Laptop', 'Developer laptop'),
         ('Keyboard', 'Mechanical keyboard'),
         ('Monitor', '27 inch display')`
    );
  }
}

module.exports = { createPool, waitForDb, initSchema, md5 };

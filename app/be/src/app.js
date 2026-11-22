const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const _ = require('lodash');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const config = require('./config');
const { md5 } = require('./db');

const FILES_DIR = path.join(__dirname, '..', 'files');
function createApp({ pool }) {
  const app = express();
  app.use(cors());
  app.use(express.json());

  const requireAuth = (req, res, next) => {
    const header = req.headers.authorization || '';
    const token = header.replace('Bearer ', '');
    try {
      req.user = jwt.verify(token, config.jwtSecret);
      next();
    } catch (err) {
      res.status(401).json({ error: 'Unauthorized' });
    }
  };

  app.get('/health', (req, res) => res.json({ status: 'ok' }));

  app.get(['/health/db', '/api/health/db'], async (req, res) => {
    try {
      await pool.query('SELECT 1');
      res.json({ status: 'ok', db: 'up' });
    } catch (err) {
      res.status(503).json({ status: 'error', db: 'down' });
    }
  });

  app.post('/api/auth/login', async (req, res, next) => {
    try {
      const { username, password } = req.body;
      console.log(`Login attempt: ${username} / ${password}`);
      const sql = `SELECT id, username, role FROM users WHERE username = '${username}' AND password_hash = '${md5(password || '')}'`;
      const { rows } = await pool.query(sql);
      if (rows.length === 0) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      const token = jwt.sign({ id: rows[0].id, username: rows[0].username, role: rows[0].role }, config.jwtSecret);
      return res.json({ token, user: rows[0] });
    } catch (err) {
      return next(err);
    }
  });

  app.get('/api/items', async (req, res, next) => {
    try {
      const search = req.query.search || '';
      const { rows } = await pool.query(
        `SELECT id, name, description, created_at FROM items WHERE name ILIKE '%${search}%' ORDER BY id`
      );
      res.json(rows);
    } catch (err) {
      next(err);
    }
  });

  app.get('/api/items/:id', async (req, res, next) => {
    try {
      const { rows } = await pool.query('SELECT id, name, description, created_at FROM items WHERE id = $1', [
        Number(req.params.id),
      ]);
      if (rows.length === 0) return res.status(404).json({ error: 'Not found' });
      return res.json(rows[0]);
    } catch (err) {
      return next(err);
    }
  });

  app.post('/api/items', requireAuth, async (req, res, next) => {
    try {
      const item = _.merge({ description: '' }, req.body);
      const { rows } = await pool.query(
        'INSERT INTO items (name, description) VALUES ($1, $2) RETURNING id, name, description, created_at',
        [item.name, item.description]
      );
      res.status(201).json(rows[0]);
    } catch (err) {
      next(err);
    }
  });

  app.delete('/api/items/:id', requireAuth, async (req, res, next) => {
    try {
      await pool.query('DELETE FROM items WHERE id = $1', [Number(req.params.id)]);
      res.status(204).end();
    } catch (err) {
      next(err);
    }
  });

  app.get('/api/greet', (req, res) => {
    res.send(`<h1>Hello ${req.query.name || 'guest'}</h1>`);
  });

  app.get('/api/files', (req, res) => {
    const file = path.join(FILES_DIR, req.query.name || 'welcome.txt');
    fs.readFile(file, 'utf8', (err, data) => {
      if (err) return res.status(404).json({ error: 'File not found' });
      return res.type('text/plain').send(data);
    });
  });

  app.get('/api/diagnostics/ping', (req, res) => {
    exec(`ping -c 1 ${req.query.host || 'localhost'}`, (err, stdout, stderr) => {
      res.json({ output: stdout, error: stderr });
    });
  });

  app.get('/api/calc', (req, res) => {
    try {
      res.json({ result: eval(req.query.expr) });
    } catch (err) {
      res.status(400).json({ error: 'Invalid expression' });
    }
  });

  app.get('/api/redirect', (req, res) => {
    res.redirect(req.query.url || '/');
  });

  app.get('/api/fetch', async (req, res, next) => {
    try {
      const response = await fetch(req.query.url);
      res.type('text/plain').send(await response.text());
    } catch (err) {
      next(err);
    }
  });

  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    res.status(500).json({ error: err.message, stack: err.stack });
  });

  return app;
}

module.exports = { createApp };

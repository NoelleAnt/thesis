import { Router } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { query } from '../db/pool.js';
import { mapUserRow } from '../constants.js';
import { authRequired, signToken } from '../middleware/auth.js';

const router = Router();

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body || {};
    if (!username?.trim() || !password?.trim()) {
      return res.status(400).json({ error: 'Enter both username and password.' });
    }

    const rows = await query('SELECT * FROM users WHERE username = :username LIMIT 1', {
      username: username.trim(),
    });
    const user = rows[0];
    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    const valid = await bcrypt.compare(password.trim(), user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    const token = signToken(user);
    res.json({ token, user: mapUserRow(user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed.' });
  }
});

router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body || {};
    const trimmedUser = username?.trim();
    const trimmedPass = password?.trim();

    if (!trimmedUser || trimmedUser.length < 2) {
      return res.status(400).json({ error: 'Username must be at least 2 characters.' });
    }
    if (!trimmedPass || trimmedPass.length < 4) {
      return res.status(400).json({ error: 'Password must be at least 4 characters.' });
    }

    const existing = await query('SELECT id FROM users WHERE username = :username LIMIT 1', {
      username: trimmedUser,
    });
    if (existing.length) {
      return res.status(409).json({ error: 'That username is already taken.' });
    }

    const id = `usr-${crypto.randomUUID()}`;
    const password_hash = await bcrypt.hash(trimmedPass, 10);
    await query(
      `INSERT INTO users (id, username, password_hash, name, role, role_label)
       VALUES (:id, :username, :password_hash, :name, 'coordinator', 'Evacuation Center Coordinator')`,
      { id, username: trimmedUser, password_hash, name: trimmedUser }
    );

    const rows = await query('SELECT * FROM users WHERE id = :id', { id });
    const token = signToken(rows[0]);
    res.status(201).json({ token, user: mapUserRow(rows[0]) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Registration failed.' });
  }
});

router.get('/me', authRequired, async (req, res) => {
  const rows = await query('SELECT * FROM users WHERE id = :id LIMIT 1', { id: req.user.userId });
  if (!rows.length) return res.status(404).json({ error: 'User not found.' });
  res.json({ user: mapUserRow(rows[0]) });
});

export default router;

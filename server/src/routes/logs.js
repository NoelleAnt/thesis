import { Router } from 'express';
import { query } from '../db/pool.js';
import { mapLogRow } from '../constants.js';
import { authRequired } from '../middleware/auth.js';

const router = Router();

router.use(authRequired);

router.get('/', async (req, res) => {
  try {
    let sql = 'SELECT * FROM activity_logs WHERE 1=1';
    const params = {};

    if (req.query.action && req.query.action !== 'all') {
      sql += ' AND action = :action';
      params.action = req.query.action;
    }

    sql += ' ORDER BY timestamp DESC LIMIT 200';
    const rows = await query(sql, params);
    res.json({ logs: rows.map(mapLogRow) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load activity logs.' });
  }
});

export default router;

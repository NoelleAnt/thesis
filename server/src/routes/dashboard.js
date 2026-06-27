import { Router } from 'express';
import { query } from '../db/pool.js';
import { mapCenterRow, mapLogRow, mapRequestRow } from '../constants.js';
import { authRequired, requireRole } from '../middleware/auth.js';
import {
  getCriticalAlerts,
  getSummaryStats,
  rankCenters,
} from '../services/priority.js';

const router = Router();

router.use(authRequired, requireRole('ldrrmo'));

router.get('/', async (req, res) => {
  try {
    const centerRows = await query("SELECT * FROM evacuation_centers WHERE status = 'active'");
    const requestRows = await query(
      `SELECT r.*, c.name AS center_name FROM resource_requests r
       JOIN evacuation_centers c ON c.id = r.center_id ORDER BY r.date_submitted DESC`
    );

    const centers = centerRows.map(mapCenterRow);
    const requests = requestRows.map((r) => mapRequestRow(r, r.center_name));

    res.json({
      stats: getSummaryStats(centers, requests),
      rankings: rankCenters(centers, requests),
      criticalAlerts: getCriticalAlerts(centers),
      pendingRequests: requests.filter((r) => ['pending', 'under_review'].includes(r.status)),
      requestHistory: requests.slice(0, 20),
      resourceOverview: centers,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load dashboard.' });
  }
});

export default router;

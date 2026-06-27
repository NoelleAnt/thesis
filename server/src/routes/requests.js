import { Router } from 'express';
import { query } from '../db/pool.js';
import { mapCenterRow, mapRequestRow } from '../constants.js';
import { authRequired, isLDRRMO, canAccessCenter } from '../middleware/auth.js';
import { addLog, getNextCounter } from '../services/logger.js';

const router = Router();

router.use(authRequired);

router.get('/', async (req, res) => {
  try {
    let sql = `SELECT r.*, c.name AS center_name FROM resource_requests r
               JOIN evacuation_centers c ON c.id = r.center_id WHERE 1=1`;
    const params = {};

    if (!isLDRRMO(req.user)) {
      sql += ' AND r.center_id = :centerId';
      params.centerId = req.user.centerId;
    }

    if (req.query.status && req.query.status !== 'all') {
      sql += ' AND r.status = :status';
      params.status = req.query.status;
    }

    sql += ' ORDER BY r.date_submitted DESC';
    const rows = await query(sql, params);
    res.json({ requests: rows.map((r) => mapRequestRow(r, r.center_name)) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load requests.' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { centerId, resource, priority, reason } = req.body || {};
    if (!centerId || !resource || !priority || !reason?.trim()) {
      return res.status(400).json({ error: 'All request fields are required.' });
    }
    if (!canAccessCenter(req.user, centerId)) {
      return res.status(403).json({ error: 'You cannot submit requests for this center.' });
    }

    const centerRows = await query('SELECT name FROM evacuation_centers WHERE id = :id', { id: centerId });
    if (!centerRows.length) return res.status(404).json({ error: 'Center not found.' });

    const num = await getNextCounter('next_request_num');
    const id = `REQ-${num}`;

    await query(
      `INSERT INTO resource_requests (id, center_id, resource, priority, reason, status, submitted_by)
       VALUES (:id, :centerId, :resource, :priority, :reason, 'pending', :submittedBy)`,
      {
        id,
        centerId,
        resource,
        priority,
        reason: reason.trim(),
        submittedBy: req.user.name,
      }
    );

    await addLog({
      userId: req.user.userId,
      userName: req.user.name,
      action: 'request_submitted',
      entityType: 'request',
      entityId: id,
      details: `${priority.charAt(0).toUpperCase() + priority.slice(1)} request for ${resource} at ${centerRows[0].name}.`,
    });

    const rows = await query(
      `SELECT r.*, c.name AS center_name FROM resource_requests r
       JOIN evacuation_centers c ON c.id = r.center_id WHERE r.id = :id`,
      { id }
    );
    res.status(201).json({ request: mapRequestRow(rows[0], rows[0].center_name) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to submit request.' });
  }
});

router.patch('/:id/status', async (req, res) => {
  try {
    if (!isLDRRMO(req.user)) {
      return res.status(403).json({ error: 'Only LDRRMO officers can review requests.' });
    }

    const { status, notes } = req.body || {};
    const allowed = ['under_review', 'approved', 'fulfilled', 'denied'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ error: 'Invalid status value.' });
    }

    const rows = await query('SELECT * FROM resource_requests WHERE id = :id', { id: req.params.id });
    if (!rows.length) return res.status(404).json({ error: 'Request not found.' });
    const prev = rows[0].status;

    await query(
      `UPDATE resource_requests SET status = :status, reviewed_by = :reviewedBy, reviewed_at = NOW(), notes = :notes
       WHERE id = :id`,
      { id: req.params.id, status, reviewedBy: req.user.name, notes: notes || '' }
    );

    await addLog({
      userId: req.user.userId,
      userName: req.user.name,
      action: 'request_status_changed',
      entityType: 'request',
      entityId: req.params.id,
      details: `${req.params.id}: ${prev} → ${status}.${notes ? ` Note: ${notes}` : ''}`,
    });

    const updated = await query(
      `SELECT r.*, c.name AS center_name FROM resource_requests r
       JOIN evacuation_centers c ON c.id = r.center_id WHERE r.id = :id`,
      { id: req.params.id }
    );
    res.json({ request: mapRequestRow(updated[0], updated[0].center_name) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update request status.' });
  }
});

export default router;

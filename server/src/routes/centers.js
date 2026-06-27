import { Router } from 'express';
import { query } from '../db/pool.js';
import { emptyResources, mapCenterRow } from '../constants.js';
import { authRequired, isLDRRMO, requireRole, canAccessCenter } from '../middleware/auth.js';
import { addLog, getNextCounter } from '../services/logger.js';

const router = Router();

router.use(authRequired);

async function fetchCentersForUser(user, search = '') {
  let sql = 'SELECT * FROM evacuation_centers WHERE 1=1';
  const params = {};

  if (!isLDRRMO(user)) {
    sql += ' AND id = :centerId';
    params.centerId = user.centerId;
  }

  if (search) {
    sql += ' AND (LOWER(name) LIKE :search OR LOWER(barangay) LIKE :search OR LOWER(id) LIKE :search)';
    params.search = `%${search.toLowerCase()}%`;
  }

  sql += ' ORDER BY name ASC';
  const rows = await query(sql, params);
  return rows.map(mapCenterRow);
}

router.get('/', async (req, res) => {
  try {
    const centers = await fetchCentersForUser(req.user, req.query.search || '');
    res.json({ centers });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load evacuation centers.' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    if (!canAccessCenter(req.user, req.params.id)) {
      return res.status(403).json({ error: 'Access denied for this center.' });
    }
    const rows = await query('SELECT * FROM evacuation_centers WHERE id = :id', { id: req.params.id });
    if (!rows.length) return res.status(404).json({ error: 'Center not found.' });
    res.json({ center: mapCenterRow(rows[0]) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load center.' });
  }
});

router.post('/', requireRole('ldrrmo'), async (req, res) => {
  try {
    const { name, address, barangay, capacity, coordinatorName, contactNumber } = req.body || {};
    if (!name?.trim() || !address?.trim() || !barangay?.trim() || !coordinatorName?.trim() || !contactNumber?.trim()) {
      return res.status(400).json({ error: 'All center fields are required.' });
    }

    const num = await getNextCounter('next_center_num');
    const id = `EC-${String(num).padStart(3, '0')}`;
    const resources = emptyResources();

    await query(
      `INSERT INTO evacuation_centers (
        id, name, address, barangay, capacity, coordinator_name, contact_number,
        resource_food, resource_water, resource_medicines, resource_hygiene_kits, resource_sleeping_kits,
        last_updated, updated_by
      ) VALUES (
        :id, :name, :address, :barangay, :capacity, :coordinatorName, :contactNumber,
        :food, :water, :medicines, :hygiene_kits, :sleeping_kits, NOW(), :updatedBy
      )`,
      {
        id,
        name: name.trim(),
        address: address.trim(),
        barangay: barangay.trim(),
        capacity: Number(capacity) || 0,
        coordinatorName: coordinatorName.trim(),
        contactNumber: contactNumber.trim(),
        food: resources.food,
        water: resources.water,
        medicines: resources.medicines,
        hygiene_kits: resources.hygiene_kits,
        sleeping_kits: resources.sleeping_kits,
        updatedBy: req.user.name,
      }
    );

    await addLog({
      userId: req.user.userId,
      userName: req.user.name,
      action: 'center_created',
      entityType: 'center',
      entityId: id,
      details: `Registered evacuation center: ${name.trim()}.`,
    });

    const rows = await query('SELECT * FROM evacuation_centers WHERE id = :id', { id });
    res.status(201).json({ center: mapCenterRow(rows[0]) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to register center.' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    if (!canAccessCenter(req.user, req.params.id) && !isLDRRMO(req.user)) {
      return res.status(403).json({ error: 'Access denied for this center.' });
    }

    const { name, address, barangay, capacity, coordinatorName, contactNumber, status } = req.body || {};
    const rows = await query('SELECT * FROM evacuation_centers WHERE id = :id', { id: req.params.id });
    if (!rows.length) return res.status(404).json({ error: 'Center not found.' });

    await query(
      `UPDATE evacuation_centers SET
        name = COALESCE(:name, name),
        address = COALESCE(:address, address),
        barangay = COALESCE(:barangay, barangay),
        capacity = COALESCE(:capacity, capacity),
        coordinator_name = COALESCE(:coordinatorName, coordinator_name),
        contact_number = COALESCE(:contactNumber, contact_number),
        status = COALESCE(:status, status),
        last_updated = NOW(),
        updated_by = :updatedBy
       WHERE id = :id`,
      {
        id: req.params.id,
        name: name?.trim(),
        address: address?.trim(),
        barangay: barangay?.trim(),
        capacity: capacity !== undefined ? Number(capacity) : null,
        coordinatorName: coordinatorName?.trim(),
        contactNumber: contactNumber?.trim(),
        status: status || null,
        updatedBy: req.user.name,
      }
    );

    await addLog({
      userId: req.user.userId,
      userName: req.user.name,
      action: 'center_updated',
      entityType: 'center',
      entityId: req.params.id,
      details: `Updated information for ${name?.trim() || rows[0].name}.`,
    });

    const updated = await query('SELECT * FROM evacuation_centers WHERE id = :id', { id: req.params.id });
    res.json({ center: mapCenterRow(updated[0]) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update center.' });
  }
});

router.patch('/:id/evacuees', async (req, res) => {
  try {
    if (!canAccessCenter(req.user, req.params.id)) {
      return res.status(403).json({ error: 'Access denied for this center.' });
    }

    const { total, children, seniors, pregnant, pwd } = req.body || {};
    const evacuees = {
      total: Number(total) || 0,
      children: Number(children) || 0,
      seniors: Number(seniors) || 0,
      pregnant: Number(pregnant) || 0,
      pwd: Number(pwd) || 0,
    };

    await query(
      `UPDATE evacuation_centers SET
        evacuees_total = :total, evacuees_children = :children, evacuees_seniors = :seniors,
        evacuees_pregnant = :pregnant, evacuees_pwd = :pwd, last_updated = NOW(), updated_by = :updatedBy
       WHERE id = :id`,
      { id: req.params.id, ...evacuees, updatedBy: req.user.name }
    );

    const vuln = evacuees.children + evacuees.seniors + evacuees.pregnant + evacuees.pwd;
    await addLog({
      userId: req.user.userId,
      userName: req.user.name,
      action: 'evacuees_updated',
      entityType: 'center',
      entityId: req.params.id,
      details: `Evacuee count: ${evacuees.total} total (${vuln} vulnerable).`,
    });

    const rows = await query('SELECT * FROM evacuation_centers WHERE id = :id', { id: req.params.id });
    res.json({ center: mapCenterRow(rows[0]) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update evacuee count.' });
  }
});

router.patch('/:id/resources', async (req, res) => {
  try {
    if (!canAccessCenter(req.user, req.params.id)) {
      return res.status(403).json({ error: 'Access denied for this center.' });
    }

    const resources = req.body?.resources || req.body || {};
    const allowed = ['food', 'water', 'medicines', 'hygiene_kits', 'sleeping_kits'];
    const updates = {};
    for (const key of allowed) {
      if (resources[key]) updates[key] = resources[key];
    }
    if (!Object.keys(updates).length) {
      return res.status(400).json({ error: 'No valid resource statuses provided.' });
    }

    const rows = await query('SELECT * FROM evacuation_centers WHERE id = :id', { id: req.params.id });
    if (!rows.length) return res.status(404).json({ error: 'Center not found.' });
    const center = rows[0];

    const changes = [];
    const columnMap = {
      food: 'resource_food',
      water: 'resource_water',
      medicines: 'resource_medicines',
      hygiene_kits: 'resource_hygiene_kits',
      sleeping_kits: 'resource_sleeping_kits',
    };

    const setParts = ['last_updated = NOW()', 'updated_by = :updatedBy'];
    const params = { id: req.params.id, updatedBy: req.user.name };

    for (const [key, col] of Object.entries(columnMap)) {
      if (updates[key]) {
        if (center[col] !== updates[key]) changes.push(`${key}: ${center[col]} → ${updates[key]}`);
        setParts.push(`${col} = :${key}`);
        params[key] = updates[key];
      } else {
        params[key] = center[col];
        setParts.push(`${col} = :${key}`);
      }
    }

    await query(`UPDATE evacuation_centers SET ${setParts.join(', ')} WHERE id = :id`, params);

    await addLog({
      userId: req.user.userId,
      userName: req.user.name,
      action: 'resource_updated',
      entityType: 'center',
      entityId: req.params.id,
      details: changes.length ? changes.join('; ') : 'Resource inventory refreshed.',
    });

    const updated = await query('SELECT * FROM evacuation_centers WHERE id = :id', { id: req.params.id });
    res.json({ center: mapCenterRow(updated[0]) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update resources.' });
  }
});

export default router;

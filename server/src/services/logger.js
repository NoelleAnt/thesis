import { query } from '../db/pool.js';
import { generateId } from '../utils/id.js';

export async function addLog({ userId, userName, action, entityType, entityId, details }) {
  const id = generateId('LOG');
  await query(
    `INSERT INTO activity_logs (id, user_id, user_name, action, entity_type, entity_id, details)
     VALUES (:id, :userId, :userName, :action, :entityType, :entityId, :details)`,
    { id, userId, userName, action, entityType, entityId, details }
  );
  return id;
}

export async function getNextCounter(name) {
  const rows = await query('SELECT value FROM system_counters WHERE name = :name', { name });
  if (rows.length === 0) {
    await query('INSERT INTO system_counters (name, value) VALUES (:name, 1)', { name });
    return 1;
  }
  const next = rows[0].value;
  await query('UPDATE system_counters SET value = value + 1 WHERE name = :name', { name });
  return next;
}

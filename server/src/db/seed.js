import bcrypt from 'bcryptjs';
import { query } from './pool.js';

function generateId(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

const DEMO_USERS = [
  {
    id: 'usr-001',
    username: 'ldrrmo',
    password: 'ldrrmo123',
    name: 'Engr. Roberto Cruz',
    role: 'ldrrmo',
    role_label: 'LDRRMO Officer',
    email: 'ldrrmo@municipality.gov.ph',
    office: 'Local DRRM Office',
    center_id: null,
  },
  {
    id: 'usr-002',
    username: 'coordinator1',
    password: 'coord123',
    name: 'Maria Santos',
    role: 'coordinator',
    role_label: 'Evacuation Center Coordinator',
    email: 'maria.santos@barangay.gov.ph',
    office: 'Barangay San Jose',
    center_id: 'EC-001',
  },
  {
    id: 'usr-003',
    username: 'coordinator2',
    password: 'coord123',
    name: 'Ana Villanueva',
    role: 'coordinator',
    role_label: 'Evacuation Center Coordinator',
    email: 'ana.villanueva@barangay.gov.ph',
    office: 'Barangay Sta. Cruz',
    center_id: 'EC-003',
  },
  {
    id: 'usr-004',
    username: 'campmgr',
    password: 'camp123',
    name: 'Juan Reyes',
    role: 'camp_manager',
    role_label: 'Camp Management Personnel',
    email: 'juan.reyes@municipality.gov.ph',
    office: 'Municipal Gymnasium',
    center_id: 'EC-002',
  },
];

const DEMO_CENTERS = [
  {
    id: 'EC-001',
    name: 'Barangay San Jose Covered Court',
    address: 'Purok 3, San Jose',
    barangay: 'San Jose',
    capacity: 350,
    coordinator_name: 'Maria Santos',
    contact_number: '0917-555-0101',
    evacuees_total: 287,
    evacuees_children: 62,
    evacuees_seniors: 48,
    evacuees_pregnant: 5,
    evacuees_pwd: 12,
    resource_food: 'low',
    resource_water: 'sufficient',
    resource_medicines: 'critical',
    resource_hygiene_kits: 'low',
    resource_sleeping_kits: 'sufficient',
    updated_by: 'Maria Santos',
  },
  {
    id: 'EC-002',
    name: 'Municipal Gymnasium',
    address: 'Rizal Street, Poblacion',
    barangay: 'Poblacion',
    capacity: 500,
    coordinator_name: 'Juan Reyes',
    contact_number: '0918-555-0202',
    evacuees_total: 412,
    evacuees_children: 98,
    evacuees_seniors: 71,
    evacuees_pregnant: 8,
    evacuees_pwd: 19,
    resource_food: 'critical',
    resource_water: 'low',
    resource_medicines: 'low',
    resource_hygiene_kits: 'critical',
    resource_sleeping_kits: 'low',
    updated_by: 'Juan Reyes',
  },
  {
    id: 'EC-003',
    name: 'Elementary School Multi-Purpose Hall',
    address: 'Bonifacio Avenue, Sta. Cruz',
    barangay: 'Sta. Cruz',
    capacity: 280,
    coordinator_name: 'Ana Villanueva',
    contact_number: '0920-555-0303',
    evacuees_total: 156,
    evacuees_children: 41,
    evacuees_seniors: 22,
    evacuees_pregnant: 2,
    evacuees_pwd: 7,
    resource_food: 'sufficient',
    resource_water: 'sufficient',
    resource_medicines: 'sufficient',
    resource_hygiene_kits: 'sufficient',
    resource_sleeping_kits: 'low',
    updated_by: 'Ana Villanueva',
  },
  {
    id: 'EC-004',
    name: 'Barangay Hall Annex',
    address: 'Mabini Road, San Pedro',
    barangay: 'San Pedro',
    capacity: 200,
    coordinator_name: 'Carlos Lim',
    contact_number: '0919-555-0404',
    evacuees_total: 89,
    evacuees_children: 18,
    evacuees_seniors: 14,
    evacuees_pregnant: 1,
    evacuees_pwd: 4,
    resource_food: 'sufficient',
    resource_water: 'low',
    resource_medicines: 'low',
    resource_hygiene_kits: 'sufficient',
    resource_sleeping_kits: 'sufficient',
    updated_by: 'Carlos Lim',
  },
];

const DEMO_REQUESTS = [
  {
    id: 'REQ-1001',
    center_id: 'EC-002',
    resource: 'food',
    priority: 'urgent',
    reason: 'Food supplies exhausted; 412 evacuees with only 1 meal remaining for today.',
    status: 'pending',
    submitted_by: 'Juan Reyes',
  },
  {
    id: 'REQ-1002',
    center_id: 'EC-001',
    resource: 'medicines',
    priority: 'urgent',
    reason: 'Critical shortage of maintenance medicines for seniors and PWD evacuees.',
    status: 'under_review',
    submitted_by: 'Maria Santos',
    reviewed_by: 'Engr. Roberto Cruz',
    notes: 'Coordinating with Municipal Health Office.',
  },
  {
    id: 'REQ-1003',
    center_id: 'EC-002',
    resource: 'hygiene_kits',
    priority: 'high',
    reason: 'Hygiene kits depleted; risk of sanitation issues with high occupancy.',
    status: 'approved',
    submitted_by: 'Juan Reyes',
    reviewed_by: 'Engr. Roberto Cruz',
    notes: 'Delivery scheduled for tomorrow AM.',
  },
  {
    id: 'REQ-1004',
    center_id: 'EC-004',
    resource: 'water',
    priority: 'medium',
    reason: 'Water delivery delayed; current stock for 1 day only.',
    status: 'fulfilled',
    submitted_by: 'Carlos Lim',
    reviewed_by: 'Engr. Roberto Cruz',
    notes: '20 containers delivered 26 Jun 2026.',
  },
];

const DEMO_LOGS = [
  {
    id: 'LOG-001',
    user_id: 'usr-003',
    user_name: 'Ana Villanueva',
    action: 'evacuees_updated',
    entity_type: 'center',
    entity_id: 'EC-003',
    details: 'Updated evacuee count to 156 (41 children, 22 seniors).',
  },
  {
    id: 'LOG-002',
    user_id: 'usr-002',
    user_name: 'Maria Santos',
    action: 'resource_updated',
    entity_type: 'center',
    entity_id: 'EC-001',
    details: 'Medicines status changed to Critical; Food to Low Stock.',
  },
  {
    id: 'LOG-003',
    user_id: 'usr-001',
    user_name: 'Engr. Roberto Cruz',
    action: 'request_status_changed',
    entity_type: 'request',
    entity_id: 'REQ-1002',
    details: 'Request REQ-1002 status changed from Pending to Under Review.',
  },
  {
    id: 'LOG-004',
    user_id: 'usr-004',
    user_name: 'Juan Reyes',
    action: 'resource_updated',
    entity_type: 'center',
    entity_id: 'EC-002',
    details: 'Food status changed to Critical; Hygiene Kits to Critical.',
  },
  {
    id: 'LOG-005',
    user_id: 'usr-004',
    user_name: 'Juan Reyes',
    action: 'request_submitted',
    entity_type: 'request',
    entity_id: 'REQ-1001',
    details: 'Submitted urgent request for Food at Municipal Gymnasium.',
  },
];

async function clearTables() {
  await query('SET FOREIGN_KEY_CHECKS = 0');
  await query('TRUNCATE TABLE activity_logs');
  await query('TRUNCATE TABLE resource_requests');
  await query('TRUNCATE TABLE users');
  await query('TRUNCATE TABLE evacuation_centers');
  await query('TRUNCATE TABLE system_counters');
  await query('SET FOREIGN_KEY_CHECKS = 1');
}

async function seedDemoData() {
  await clearTables();

  for (const center of DEMO_CENTERS) {
    await query(
      `INSERT INTO evacuation_centers (
        id, name, address, barangay, capacity, coordinator_name, contact_number,
        evacuees_total, evacuees_children, evacuees_seniors, evacuees_pregnant, evacuees_pwd,
        resource_food, resource_water, resource_medicines, resource_hygiene_kits, resource_sleeping_kits,
        last_updated, updated_by
      ) VALUES (
        :id, :name, :address, :barangay, :capacity, :coordinator_name, :contact_number,
        :evacuees_total, :evacuees_children, :evacuees_seniors, :evacuees_pregnant, :evacuees_pwd,
        :resource_food, :resource_water, :resource_medicines, :resource_hygiene_kits, :resource_sleeping_kits,
        NOW(), :updated_by
      )`,
      center
    );
  }

  for (const user of DEMO_USERS) {
    const password_hash = await bcrypt.hash(user.password, 10);
    await query(
      `INSERT INTO users (id, username, password_hash, name, role, role_label, email, office, center_id)
       VALUES (:id, :username, :password_hash, :name, :role, :role_label, :email, :office, :center_id)`,
      { ...user, password_hash }
    );
  }

  for (const req of DEMO_REQUESTS) {
    await query(
      `INSERT INTO resource_requests (
        id, center_id, resource, priority, reason, status, submitted_by, reviewed_by, reviewed_at, notes, date_submitted
      ) VALUES (
        :id, :center_id, :resource, :priority, :reason, :status, :submitted_by, :reviewed_by,
        CASE WHEN :reviewed_by IS NOT NULL THEN NOW() ELSE NULL END,
        :notes, NOW()
      )`,
      {
        ...req,
        reviewed_by: req.reviewed_by || null,
        notes: req.notes || null,
      }
    );
  }

  for (const log of DEMO_LOGS) {
    await query(
      `INSERT INTO activity_logs (id, user_id, user_name, action, entity_type, entity_id, details, timestamp)
       VALUES (:id, :user_id, :user_name, :action, :entity_type, :entity_id, :details, NOW())`,
      log
    );
  }

  await query(
    `INSERT INTO system_counters (name, value) VALUES ('next_center_num', 5), ('next_request_num', 1005)
     ON DUPLICATE KEY UPDATE value = VALUES(value)`
  );

  console.log('Demo data seeded successfully.');
}

import { pathToFileURL } from 'url';

export default seedDemoData;

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  seedDemoData().catch((err) => {
    console.error('Seeding failed:', err.message);
    process.exit(1);
  });
}

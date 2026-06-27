'use strict';

export const RESOURCE_TYPES = [
  { key: 'food', label: 'Food', icon: 'bi-basket3' },
  { key: 'water', label: 'Drinking Water', icon: 'bi-droplet' },
  { key: 'medicines', label: 'Medicines', icon: 'bi-capsule' },
  { key: 'hygiene_kits', label: 'Hygiene Kits', icon: 'bi-bag-check' },
  { key: 'sleeping_kits', label: 'Sleeping Kits', icon: 'bi-moon-stars' },
];

export const RESOURCE_STATUS = {
  sufficient: { label: 'Sufficient', class: 'status-sufficient', score: 0 },
  low: { label: 'Low Stock', class: 'status-low', score: 1 },
  critical: { label: 'Critical', class: 'status-critical', score: 2 },
};

export const REQUEST_PRIORITIES = {
  low: { label: 'Low', class: 'priority-low', weight: 1 },
  medium: { label: 'Medium', class: 'priority-medium', weight: 2 },
  high: { label: 'High', class: 'priority-high', weight: 3 },
  urgent: { label: 'Urgent', class: 'priority-urgent', weight: 4 },
};

export const REQUEST_STATUSES = {
  pending: { label: 'Pending', class: 'req-pending' },
  under_review: { label: 'Under Review', class: 'req-review' },
  approved: { label: 'Approved', class: 'req-approved' },
  fulfilled: { label: 'Fulfilled', class: 'req-fulfilled' },
  denied: { label: 'Denied', class: 'req-denied' },
};

export const LOG_ACTIONS = {
  center_created: 'Center registered',
  center_updated: 'Center information updated',
  evacuees_updated: 'Evacuee count updated',
  resource_updated: 'Resource status updated',
  request_submitted: 'Resource request submitted',
  request_status_changed: 'Request status changed',
};

export const ROLES = {
  ldrrmo: 'LDRRMO Officer',
  coordinator: 'Evacuation Center Coordinator',
  camp_manager: 'Camp Management Personnel',
};

export function emptyResources() {
  return {
    food: 'sufficient',
    water: 'sufficient',
    medicines: 'sufficient',
    hygiene_kits: 'sufficient',
    sleeping_kits: 'sufficient',
  };
}

export function mapCenterRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    address: row.address,
    barangay: row.barangay,
    capacity: row.capacity,
    status: row.status,
    coordinatorName: row.coordinator_name,
    contactNumber: row.contact_number,
    evacuees: {
      total: row.evacuees_total,
      children: row.evacuees_children,
      seniors: row.evacuees_seniors,
      pregnant: row.evacuees_pregnant,
      pwd: row.evacuees_pwd,
    },
    resources: {
      food: row.resource_food,
      water: row.resource_water,
      medicines: row.resource_medicines,
      hygiene_kits: row.resource_hygiene_kits,
      sleeping_kits: row.resource_sleeping_kits,
    },
    lastUpdated: row.last_updated,
    updatedBy: row.updated_by,
  };
}

export function mapRequestRow(row, centerName) {
  if (!row) return null;
  return {
    id: row.id,
    centerId: row.center_id,
    centerName: centerName || row.center_name,
    resource: row.resource,
    priority: row.priority,
    reason: row.reason,
    dateSubmitted: row.date_submitted,
    status: row.status,
    submittedBy: row.submitted_by,
    reviewedBy: row.reviewed_by,
    reviewedAt: row.reviewed_at,
    notes: row.notes || '',
  };
}

export function mapLogRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    timestamp: row.timestamp,
    userId: row.user_id,
    userName: row.user_name,
    action: row.action,
    entityType: row.entity_type,
    entityId: row.entity_id,
    details: row.details,
  };
}

export function mapUserRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    username: row.username,
    name: row.name,
    role: row.role,
    roleLabel: row.role_label,
    email: row.email,
    office: row.office,
    centerId: row.center_id,
  };
}

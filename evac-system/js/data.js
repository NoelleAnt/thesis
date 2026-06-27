'use strict';

/** Resource types tracked across all evacuation centers */
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

/** Default empty resource map */
export function emptyResources() {
  return {
    food: 'sufficient',
    water: 'sufficient',
    medicines: 'sufficient',
    hygiene_kits: 'sufficient',
    sleeping_kits: 'sufficient',
  };
}

/** Sample LGU evacuation centers for demonstration */
export const DEFAULT_CENTERS = [
  {
    id: 'EC-001',
    name: 'Barangay San Jose Covered Court',
    address: 'Purok 3, San Jose',
    barangay: 'San Jose',
    capacity: 350,
    status: 'active',
    coordinatorName: 'Maria Santos',
    contactNumber: '0917-555-0101',
    evacuees: { total: 287, children: 62, seniors: 48, pregnant: 5, pwd: 12 },
    resources: { food: 'low', water: 'sufficient', medicines: 'critical', hygiene_kits: 'low', sleeping_kits: 'sufficient' },
    lastUpdated: '2026-06-27T08:30:00.000Z',
    updatedBy: 'Maria Santos',
  },
  {
    id: 'EC-002',
    name: 'Municipal Gymnasium',
    address: 'Rizal Street, Poblacion',
    barangay: 'Poblacion',
    capacity: 500,
    status: 'active',
    coordinatorName: 'Juan Reyes',
    contactNumber: '0918-555-0202',
    evacuees: { total: 412, children: 98, seniors: 71, pregnant: 8, pwd: 19 },
    resources: { food: 'critical', water: 'low', medicines: 'low', hygiene_kits: 'critical', sleeping_kits: 'low' },
    lastUpdated: '2026-06-27T07:45:00.000Z',
    updatedBy: 'Juan Reyes',
  },
  {
    id: 'EC-003',
    name: 'Elementary School Multi-Purpose Hall',
    address: 'Bonifacio Avenue, Sta. Cruz',
    barangay: 'Sta. Cruz',
    capacity: 280,
    status: 'active',
    coordinatorName: 'Ana Villanueva',
    contactNumber: '0920-555-0303',
    evacuees: { total: 156, children: 41, seniors: 22, pregnant: 2, pwd: 7 },
    resources: { food: 'sufficient', water: 'sufficient', medicines: 'sufficient', hygiene_kits: 'sufficient', sleeping_kits: 'low' },
    lastUpdated: '2026-06-27T09:00:00.000Z',
    updatedBy: 'Ana Villanueva',
  },
  {
    id: 'EC-004',
    name: 'Barangay Hall Annex',
    address: 'Mabini Road, San Pedro',
    barangay: 'San Pedro',
    capacity: 200,
    status: 'active',
    coordinatorName: 'Carlos Lim',
    contactNumber: '0919-555-0404',
    evacuees: { total: 89, children: 18, seniors: 14, pregnant: 1, pwd: 4 },
    resources: { food: 'sufficient', water: 'low', medicines: 'low', hygiene_kits: 'sufficient', sleeping_kits: 'sufficient' },
    lastUpdated: '2026-06-26T16:20:00.000Z',
    updatedBy: 'Carlos Lim',
  },
];

export const DEFAULT_REQUESTS = [
  {
    id: 'REQ-1001',
    centerId: 'EC-002',
    centerName: 'Municipal Gymnasium',
    resource: 'food',
    priority: 'urgent',
    reason: 'Food supplies exhausted; 412 evacuees with only 1 meal remaining for today.',
    dateSubmitted: '2026-06-27T06:15:00.000Z',
    status: 'pending',
    submittedBy: 'Juan Reyes',
    reviewedBy: null,
    reviewedAt: null,
    notes: '',
  },
  {
    id: 'REQ-1002',
    centerId: 'EC-001',
    centerName: 'Barangay San Jose Covered Court',
    resource: 'medicines',
    priority: 'urgent',
    reason: 'Critical shortage of maintenance medicines for seniors and PWD evacuees.',
    dateSubmitted: '2026-06-27T07:00:00.000Z',
    status: 'under_review',
    submittedBy: 'Maria Santos',
    reviewedBy: 'Engr. Roberto Cruz',
    reviewedAt: '2026-06-27T08:00:00.000Z',
    notes: 'Coordinating with Municipal Health Office.',
  },
  {
    id: 'REQ-1003',
    centerId: 'EC-002',
    centerName: 'Municipal Gymnasium',
    resource: 'hygiene_kits',
    priority: 'high',
    reason: 'Hygiene kits depleted; risk of sanitation issues with high occupancy.',
    dateSubmitted: '2026-06-26T14:30:00.000Z',
    status: 'approved',
    submittedBy: 'Juan Reyes',
    reviewedBy: 'Engr. Roberto Cruz',
    reviewedAt: '2026-06-26T15:00:00.000Z',
    notes: 'Delivery scheduled for tomorrow AM.',
  },
  {
    id: 'REQ-1004',
    centerId: 'EC-004',
    centerName: 'Barangay Hall Annex',
    resource: 'water',
    priority: 'medium',
    reason: 'Water delivery delayed; current stock for 1 day only.',
    dateSubmitted: '2026-06-26T10:00:00.000Z',
    status: 'fulfilled',
    submittedBy: 'Carlos Lim',
    reviewedBy: 'Engr. Roberto Cruz',
    reviewedAt: '2026-06-26T11:30:00.000Z',
    notes: '20 containers delivered 26 Jun 2026.',
  },
];

export const DEFAULT_LOGS = [
  {
    id: 'LOG-001',
    timestamp: '2026-06-27T09:00:00.000Z',
    userId: 'usr-003',
    userName: 'Ana Villanueva',
    action: 'evacuees_updated',
    entityType: 'center',
    entityId: 'EC-003',
    details: 'Updated evacuee count to 156 (41 children, 22 seniors).',
  },
  {
    id: 'LOG-002',
    timestamp: '2026-06-27T08:30:00.000Z',
    userId: 'usr-002',
    userName: 'Maria Santos',
    action: 'resource_updated',
    entityType: 'center',
    entityId: 'EC-001',
    details: 'Medicines status changed to Critical; Food to Low Stock.',
  },
  {
    id: 'LOG-003',
    timestamp: '2026-06-27T08:00:00.000Z',
    userId: 'usr-001',
    userName: 'Engr. Roberto Cruz',
    action: 'request_status_changed',
    entityType: 'request',
    entityId: 'REQ-1002',
    details: 'Request REQ-1002 status changed from Pending to Under Review.',
  },
  {
    id: 'LOG-004',
    timestamp: '2026-06-27T07:45:00.000Z',
    userId: 'usr-004',
    userName: 'Juan Reyes',
    action: 'resource_updated',
    entityType: 'center',
    entityId: 'EC-002',
    details: 'Food status changed to Critical; Hygiene Kits to Critical.',
  },
  {
    id: 'LOG-005',
    timestamp: '2026-06-27T06:15:00.000Z',
    userId: 'usr-004',
    userName: 'Juan Reyes',
    action: 'request_submitted',
    entityType: 'request',
    entityId: 'REQ-1001',
    details: 'Submitted urgent request for Food at Municipal Gymnasium.',
  },
];

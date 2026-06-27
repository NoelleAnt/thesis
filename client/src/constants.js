export const RESOURCE_TYPES = [
  { key: 'food', label: 'Food', icon: 'bi-basket3' },
  { key: 'water', label: 'Drinking Water', icon: 'bi-droplet' },
  { key: 'medicines', label: 'Medicines', icon: 'bi-capsule' },
  { key: 'hygiene_kits', label: 'Hygiene Kits', icon: 'bi-bag-check' },
  { key: 'sleeping_kits', label: 'Sleeping Kits', icon: 'bi-moon-stars' },
];

export const RESOURCE_STATUS = {
  sufficient: { label: 'Sufficient', class: 'status-sufficient' },
  low: { label: 'Low Stock', class: 'status-low' },
  critical: { label: 'Critical', class: 'status-critical' },
};

export const REQUEST_PRIORITIES = {
  low: { label: 'Low', class: 'priority-low' },
  medium: { label: 'Medium', class: 'priority-medium' },
  high: { label: 'High', class: 'priority-high' },
  urgent: { label: 'Urgent', class: 'priority-urgent' },
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

export const APP_NAME = 'Asap-Agap';
export const APP_TAGLINE =
  'Web-Based Decision Support System for Monitoring Emergency Resource Needs and Coordinating Resource Requests among Local Evacuation Centers';

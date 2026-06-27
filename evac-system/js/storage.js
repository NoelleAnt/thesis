'use strict';

import {
  DEFAULT_CENTERS,
  DEFAULT_LOGS,
  DEFAULT_REQUESTS,
  LOG_ACTIONS,
  emptyResources,
} from './data.js';

const STORAGE_KEY = 'evachub-data-v1';

let state = null;

function generateId(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

function deepClone(value) {
  if (typeof structuredClone === 'function') return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
}

function cloneDefaults() {
  return {
    centers: deepClone(DEFAULT_CENTERS),
    requests: deepClone(DEFAULT_REQUESTS),
    logs: deepClone(DEFAULT_LOGS),
    nextRequestNum: 1005,
    nextCenterNum: 5,
  };
}

export function loadData() {
  if (state) return state;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      state = JSON.parse(raw);
      return state;
    }
  } catch {
    /* fall through to defaults */
  }

  state = cloneDefaults();
  saveData();
  return state;
}

export function saveData() {
  if (!state) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function resetData() {
  state = cloneDefaults();
  saveData();
  return state;
}

export function getCenters() {
  return loadData().centers;
}

export function getCenterById(id) {
  return getCenters().find((c) => c.id === id) || null;
}

export function getRequests() {
  return loadData().requests;
}

export function getLogs() {
  return loadData().logs;
}

export function addLog(entry) {
  const data = loadData();
  const log = {
    id: generateId('LOG'),
    timestamp: new Date().toISOString(),
    ...entry,
  };
  data.logs.unshift(log);
  if (data.logs.length > 200) data.logs.length = 200;
  saveData();
  return log;
}

export function logActivity(user, action, entityType, entityId, details) {
  return addLog({
    userId: user.userId,
    userName: user.name,
    action,
    entityType,
    entityId,
    details,
  });
}

export function createCenter(payload, user) {
  const data = loadData();
  const id = `EC-${String(data.nextCenterNum).padStart(3, '0')}`;
  data.nextCenterNum += 1;

  const center = {
    id,
    name: payload.name.trim(),
    address: payload.address.trim(),
    barangay: payload.barangay.trim(),
    capacity: Number(payload.capacity) || 0,
    status: 'active',
    coordinatorName: payload.coordinatorName.trim(),
    contactNumber: payload.contactNumber.trim(),
    evacuees: {
      total: 0,
      children: 0,
      seniors: 0,
      pregnant: 0,
      pwd: 0,
    },
    resources: emptyResources(),
    lastUpdated: new Date().toISOString(),
    updatedBy: user.name,
  };

  data.centers.push(center);
  saveData();
  logActivity(user, 'center_created', 'center', id, `Registered evacuation center: ${center.name}.`);
  return center;
}

export function updateCenter(id, updates, user) {
  const data = loadData();
  const center = data.centers.find((c) => c.id === id);
  if (!center) return null;

  Object.assign(center, updates, {
    lastUpdated: new Date().toISOString(),
    updatedBy: user.name,
  });
  saveData();
  logActivity(user, 'center_updated', 'center', id, `Updated information for ${center.name}.`);
  return center;
}

export function updateEvacuees(id, evacuees, user) {
  const data = loadData();
  const center = data.centers.find((c) => c.id === id);
  if (!center) return null;

  center.evacuees = { ...evacuees };
  center.lastUpdated = new Date().toISOString();
  center.updatedBy = user.name;
  saveData();

  const vuln = evacuees.children + evacuees.seniors + evacuees.pregnant + evacuees.pwd;
  logActivity(
    user,
    'evacuees_updated',
    'center',
    id,
    `Evacuee count: ${evacuees.total} total (${vuln} vulnerable).`
  );
  return center;
}

export function updateResources(id, resources, user) {
  const data = loadData();
  const center = data.centers.find((c) => c.id === id);
  if (!center) return null;

  const changes = [];
  for (const [key, value] of Object.entries(resources)) {
    if (center.resources[key] !== value) {
      changes.push(`${key}: ${center.resources[key]} → ${value}`);
    }
  }

  center.resources = { ...resources };
  center.lastUpdated = new Date().toISOString();
  center.updatedBy = user.name;
  saveData();

  logActivity(
    user,
    'resource_updated',
    'center',
    id,
    changes.length ? changes.join('; ') : 'Resource inventory refreshed.'
  );
  return center;
}

export function createRequest(payload, user) {
  const data = loadData();
  const id = `REQ-${data.nextRequestNum}`;
  data.nextRequestNum += 1;

  const center = getCenterById(payload.centerId);
  const request = {
    id,
    centerId: payload.centerId,
    centerName: center?.name || payload.centerName,
    resource: payload.resource,
    priority: payload.priority,
    reason: payload.reason.trim(),
    dateSubmitted: new Date().toISOString(),
    status: 'pending',
    submittedBy: user.name,
    reviewedBy: null,
    reviewedAt: null,
    notes: '',
  };

  data.requests.unshift(request);
  saveData();
  logActivity(
    user,
    'request_submitted',
    'request',
    id,
    `${REQUEST_PRIORITY_LABEL(request)} request for ${payload.resource} at ${request.centerName}.`
  );
  return request;
}

function REQUEST_PRIORITY_LABEL(request) {
  return request.priority.charAt(0).toUpperCase() + request.priority.slice(1);
}

export function updateRequestStatus(id, status, notes, user) {
  const data = loadData();
  const request = data.requests.find((r) => r.id === id);
  if (!request) return null;

  const prev = request.status;
  request.status = status;
  request.reviewedBy = user.name;
  request.reviewedAt = new Date().toISOString();
  if (notes !== undefined) request.notes = notes;

  saveData();
  logActivity(
    user,
    'request_status_changed',
    'request',
    id,
    `${request.id}: ${prev} → ${status}.${notes ? ` Note: ${notes}` : ''}`
  );
  return request;
}

export { LOG_ACTIONS, generateId };

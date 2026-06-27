'use strict';

import { initLogin, isLDRRMO, getAssignedCenterId, clearSession } from './auth.js';
import {
  RESOURCE_TYPES,
  RESOURCE_STATUS,
  REQUEST_PRIORITIES,
  REQUEST_STATUSES,
  LOG_ACTIONS,
} from './data.js';
import {
  loadData,
  getCenters,
  getRequests,
  getLogs,
  createCenter,
  updateCenter,
  updateEvacuees,
  updateResources,
  createRequest,
  updateRequestStatus,
  resetData,
} from './storage.js';
import { rankCenters, getCriticalAlerts, getSummaryStats } from './priority.js';

let session = null;
let navigateTo = null;

function $(sel) {
  return document.querySelector(sel);
}

function formatDateTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function resourceLabel(key) {
  return RESOURCE_TYPES.find((r) => r.key === key)?.label || key;
}

function statusBadge(status) {
  const meta = RESOURCE_STATUS[status] || { label: status, class: '' };
  return `<span class="status-badge ${meta.class}">${meta.label}</span>`;
}

function priorityBadge(priority) {
  const meta = REQUEST_PRIORITIES[priority] || { label: priority, class: '' };
  return `<span class="priority-badge ${meta.class}">${meta.label}</span>`;
}

function reqStatusBadge(status) {
  const meta = REQUEST_STATUSES[status] || { label: status, class: '' };
  return `<span class="req-badge ${meta.class}">${meta.label}</span>`;
}

function priorityLevelBadge(level) {
  const map = {
    critical: 'level-critical',
    high: 'level-high',
    moderate: 'level-moderate',
    normal: 'level-normal',
  };
  return `<span class="level-badge ${map[level] || ''}">${level.charAt(0).toUpperCase() + level.slice(1)}</span>`;
}

function accessibleCenters() {
  const centers = getCenters();
  if (isLDRRMO(session)) return centers;
  const centerId = getAssignedCenterId(session);
  return centers.filter((c) => c.id === centerId);
}

function refreshAll() {
  renderDashboard();
  renderCenters();
  renderResources();
  renderRequests();
  renderLogs();
  updateAlertBadge();
}

/* ── Navigation ── */
function initSidebar() {
  const sidebar = $('#sidebar');
  const overlay = $('#sidebarOverlay');
  const toggle = $('#sidebarToggle');

  function closeSidebar() {
    sidebar.classList.remove('open');
    overlay.classList.remove('show');
    document.body.style.overflow = '';
  }

  toggle.addEventListener('click', () => {
    sidebar.classList.contains('open') ? closeSidebar() : (sidebar.classList.add('open'), overlay.classList.add('show'), (document.body.style.overflow = 'hidden'));
  });
  overlay.addEventListener('click', closeSidebar);
  window.addEventListener('resize', () => {
    if (window.innerWidth >= 992) closeSidebar();
  });
  return { closeSidebar };
}

function initNavigation() {
  const viewMeta = {
    dashboard: {
      title: 'Decision Support Dashboard',
      subtitle: 'Consolidated view for LDRRMO decision-making and incident coordination.',
      action: 'Export Summary',
      ldrrmoOnly: true,
    },
    overview: {
      title: 'Operations Overview',
      subtitle: 'Status of your assigned evacuation center and recent activity.',
      action: null,
      ldrrmoOnly: false,
    },
    centers: {
      title: 'Evacuation Centers',
      subtitle: 'Register and maintain evacuation center information and evacuee counts.',
      action: isLDRRMO(session) ? 'Register Center' : null,
    },
    resources: {
      title: 'Resource Monitoring',
      subtitle: 'Track availability of food, water, medicines, hygiene kits, and sleeping kits.',
      action: null,
    },
    requests: {
      title: 'Resource Requests',
      subtitle: 'Submit and track requests for additional supplies when stocks become insufficient.',
      action: 'New Request',
    },
    logs: {
      title: 'Activity & Inventory Logs',
      subtitle: 'Audit trail of inventory updates, requests, and status changes (ICS documentation).',
      action: null,
    },
  };

  function navigate(view) {
    if (viewMeta[view]?.ldrrmoOnly && !isLDRRMO(session)) {
      view = 'overview';
    }

    document.querySelectorAll('.sidebar-nav [data-view]').forEach((l) => {
      l.classList.toggle('active', l.dataset.view === view);
    });

    document.querySelectorAll('.view-section').forEach((s) => {
      s.classList.toggle('active', s.id === `view-${view}`);
    });

    const meta = viewMeta[view];
    if (meta) {
      $('#pageTitle').textContent = meta.title;
      $('#pageSubtitle').textContent = meta.subtitle;
      const btn = $('#headerAction');
      if (btn) {
        btn.hidden = !meta.action;
        btn.dataset.action = meta.action || '';
        if (meta.action) {
          btn.innerHTML = `<i class="bi bi-plus-lg"></i><span class="d-none d-sm-inline">${meta.action}</span>`;
        }
      }
    }

    if (view === 'dashboard') renderDashboard();
    if (view === 'overview') renderOverview();
    if (view === 'centers') renderCenters();
    if (view === 'resources') renderResources();
    if (view === 'requests') renderRequests();
    if (view === 'logs') renderLogs();
  }

  document.querySelectorAll('.sidebar-nav [data-view]').forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      navigate(link.dataset.view);
    });
  });

  return { navigateTo: navigate };
}

/* ── Dashboard (LDRRMO) ── */
function renderDashboard() {
  const centers = getCenters().filter((c) => c.status === 'active');
  const requests = getRequests();
  const stats = getSummaryStats(centers, requests);
  const rankings = rankCenters(centers, requests);
  const alerts = getCriticalAlerts(centers);

  $('#statCenters').textContent = stats.centerCount;
  $('#statEvacuees').textContent = stats.totalEvacuees.toLocaleString();
  $('#statVulnerable').textContent = stats.totalVulnerable.toLocaleString();
  $('#statPending').textContent = stats.pendingRequests;
  $('#statUrgent').textContent = stats.urgentRequests;
  $('#statCritical').textContent = stats.criticalAlerts;

  const alertsEl = $('#criticalAlertsList');
  if (alerts.length === 0) {
    alertsEl.innerHTML = '<p class="empty-msg">No critical shortages reported.</p>';
  } else {
    alertsEl.innerHTML = alerts
      .map(
        (a) => `
      <div class="alert-item alert-critical">
        <i class="bi bi-exclamation-octagon-fill"></i>
        <div>
          <strong>${a.centerName}</strong>
          <span>${a.resourceLabel} — Critical (${a.evacuees} evacuees)</span>
        </div>
      </div>`
      )
      .join('');
  }

  const rankEl = $('#priorityRankings');
  rankEl.innerHTML = rankings
    .map(
      (r, i) => `
    <tr>
      <td><span class="rank-num">${i + 1}</span></td>
      <td><strong>${r.centerName}</strong></td>
      <td>${r.evacuees}</td>
      <td>${r.vulnerable}</td>
      <td>${r.criticalCount}</td>
      <td>${r.pendingRequests}</td>
      <td>${priorityLevelBadge(r.level)}</td>
      <td class="score-cell">${r.score}</td>
      <td><small>${r.reasons.join(' · ') || 'Stable'}</small></td>
    </tr>`
    )
    .join('');

  const pendingEl = $('#pendingRequestsTable');
  const pending = requests.filter((r) => ['pending', 'under_review'].includes(r.status));
  if (pending.length === 0) {
    pendingEl.innerHTML = '<tr><td colspan="7" class="text-center text-muted py-4">No pending requests</td></tr>';
  } else {
    pendingEl.innerHTML = pending
      .map(
        (r) => `
      <tr>
        <td><code>${r.id}</code></td>
        <td>${r.centerName}</td>
        <td>${resourceLabel(r.resource)}</td>
        <td>${priorityBadge(r.priority)}</td>
        <td>${formatDateTime(r.dateSubmitted)}</td>
        <td>${reqStatusBadge(r.status)}</td>
        <td>
          <button class="btn btn-sm btn-outline-primary review-req" data-id="${r.id}">Review</button>
        </td>
      </tr>`
      )
      .join('');
  }

  const historyEl = $('#requestHistoryTable');
  historyEl.innerHTML = requests
    .slice(0, 10)
    .map(
      (r) => `
    <tr>
      <td><code>${r.id}</code></td>
      <td>${r.centerName}</td>
      <td>${resourceLabel(r.resource)}</td>
      <td>${priorityBadge(r.priority)}</td>
      <td>${reqStatusBadge(r.status)}</td>
      <td>${formatDateTime(r.dateSubmitted)}</td>
      <td>${r.reviewedBy || '—'}</td>
    </tr>`
    )
    .join('');

  const resourceOverview = $('#resourceOverviewGrid');
  resourceOverview.innerHTML = centers
    .map((c) => {
      const chips = RESOURCE_TYPES.map(({ key, label }) => {
        const st = c.resources[key];
        return `<span class="resource-chip ${RESOURCE_STATUS[st]?.class || ''}" title="${label}">${label.split(' ')[0]}: ${RESOURCE_STATUS[st]?.label || st}</span>`;
      }).join('');
      return `
      <div class="resource-center-card">
        <h4>${c.name}</h4>
        <p class="text-muted">${c.evacuees.total} evacuees · ${c.barangay}</p>
        <div class="resource-chips">${chips}</div>
      </div>`;
    })
    .join('');

  bindReviewButtons();
}

/* ── Field Overview ── */
function renderOverview() {
  const centers = accessibleCenters();
  const center = centers[0];
  if (!center) {
    $('#overviewContent').innerHTML = '<p class="empty-msg">No assigned evacuation center.</p>';
    return;
  }

  const requests = getRequests().filter((r) => r.centerId === center.id);
  const pending = requests.filter((r) => ['pending', 'under_review', 'approved'].includes(r.status));
  const critical = RESOURCE_TYPES.filter(({ key }) => center.resources[key] === 'critical');

  $('#overviewContent').innerHTML = `
    <div class="overview-grid">
      <article class="stat-card">
        <div class="stat-icon bg-blue"><i class="bi bi-people-fill"></i></div>
        <div><p class="stat-label">Evacuees</p><h2>${center.evacuees.total}</h2></div>
      </article>
      <article class="stat-card">
        <div class="stat-icon bg-amber"><i class="bi bi-heart-pulse"></i></div>
        <div><p class="stat-label">Vulnerable</p><h2>${center.evacuees.children + center.evacuees.seniors + center.evacuees.pregnant + center.evacuees.pwd}</h2></div>
      </article>
      <article class="stat-card">
        <div class="stat-icon bg-red"><i class="bi bi-exclamation-triangle"></i></div>
        <div><p class="stat-label">Critical Resources</p><h2>${critical.length}</h2></div>
      </article>
      <article class="stat-card">
        <div class="stat-icon bg-teal"><i class="bi bi-inbox"></i></div>
        <div><p class="stat-label">Open Requests</p><h2>${pending.length}</h2></div>
      </article>
    </div>
    <div class="card-panel mt-4">
      <h3>${center.name}</h3>
      <p class="text-muted">${center.address} · Capacity: ${center.capacity}</p>
      <div class="resource-chips mt-3">
        ${RESOURCE_TYPES.map(({ key, label }) => `<span class="resource-chip ${RESOURCE_STATUS[center.resources[key]]?.class}">${label}: ${RESOURCE_STATUS[center.resources[key]]?.label}</span>`).join('')}
      </div>
      <div class="mt-3 d-flex gap-2 flex-wrap">
        <button class="btn btn-primary btn-sm" data-quick="evacuees" data-id="${center.id}">Update Evacuees</button>
        <button class="btn btn-outline-primary btn-sm" data-quick="resources" data-id="${center.id}">Update Resources</button>
        <button class="btn btn-outline-secondary btn-sm" data-quick="request" data-id="${center.id}">Submit Request</button>
      </div>
    </div>`;

  $('#overviewContent').querySelectorAll('[data-quick]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.quick;
      const id = btn.dataset.id;
      if (action === 'evacuees') openEvacueeModal(id);
      else if (action === 'resources') openResourceModal(id);
      else if (action === 'request') openRequestModal(id);
    });
  });
}

/* ── Centers ── */
function renderCenters() {
  const centers = accessibleCenters();
  const filter = ($('#centerSearch')?.value || '').toLowerCase();
  const filtered = centers.filter(
    (c) =>
      !filter ||
      c.name.toLowerCase().includes(filter) ||
      c.barangay.toLowerCase().includes(filter) ||
      c.id.toLowerCase().includes(filter)
  );

  const tbody = $('#centersTable');
  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted py-4">No centers found</td></tr>';
    return;
  }

  tbody.innerHTML = filtered
    .map((c) => {
      const vuln = c.evacuees.children + c.evacuees.seniors + c.evacuees.pregnant + c.evacuees.pwd;
      const occ = c.capacity ? Math.round((c.evacuees.total / c.capacity) * 100) : 0;
      return `
    <tr>
      <td><code>${c.id}</code></td>
      <td><strong>${c.name}</strong><br><small class="text-muted">${c.address}</small></td>
      <td>${c.barangay}</td>
      <td>${c.evacuees.total} <small class="text-muted">(${vuln} vuln.)</small></td>
      <td><span class="${occ >= 90 ? 'text-danger fw-bold' : ''}">${occ}%</span></td>
      <td>${c.coordinatorName}</td>
      <td><span class="badge ${c.status === 'active' ? 'bg-success' : 'bg-secondary'}">${c.status}</span></td>
      <td class="actions-cell">
        <button class="btn btn-sm btn-outline-primary edit-center" data-id="${c.id}" title="Edit"><i class="bi bi-pencil"></i></button>
        <button class="btn btn-sm btn-outline-secondary evac-center" data-id="${c.id}" title="Evacuees"><i class="bi bi-people"></i></button>
      </td>
    </tr>`;
    })
    .join('');

  tbody.querySelectorAll('.edit-center').forEach((btn) => {
    btn.addEventListener('click', () => openCenterModal(btn.dataset.id));
  });
  tbody.querySelectorAll('.evac-center').forEach((btn) => {
    btn.addEventListener('click', () => openEvacueeModal(btn.dataset.id));
  });
}

/* ── Resources ── */
function renderResources() {
  const centers = accessibleCenters();
  const grid = $('#resourcesGrid');
  grid.innerHTML = centers
    .map((c) => {
      const rows = RESOURCE_TYPES.map(
        ({ key, label, icon }) => `
      <div class="resource-row">
        <span><i class="bi ${icon}"></i> ${label}</span>
        ${statusBadge(c.resources[key])}
      </div>`
      ).join('');
      return `
    <div class="card-panel resource-card">
      <div class="resource-card-header">
        <div>
          <h4>${c.name}</h4>
          <small class="text-muted">Last updated ${formatDateTime(c.lastUpdated)} by ${c.updatedBy}</small>
        </div>
        <button class="btn btn-sm btn-primary update-resources" data-id="${c.id}">Update</button>
      </div>
      <div class="resource-rows">${rows}</div>
    </div>`;
    })
    .join('');

  grid.querySelectorAll('.update-resources').forEach((btn) => {
    btn.addEventListener('click', () => openResourceModal(btn.dataset.id));
  });
}

/* ── Requests ── */
function renderRequests() {
  const centers = accessibleCenters();
  const centerIds = new Set(centers.map((c) => c.id));
  let requests = getRequests();
  if (!isLDRRMO(session)) {
    requests = requests.filter((r) => centerIds.has(r.centerId));
  }

  const statusFilter = $('#requestStatusFilter')?.value || 'all';
  if (statusFilter !== 'all') {
    requests = requests.filter((r) => r.status === statusFilter);
  }

  const tbody = $('#requestsTable');
  if (requests.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted py-4">No requests found</td></tr>';
    return;
  }

  tbody.innerHTML = requests
    .map(
      (r) => `
    <tr>
      <td><code>${r.id}</code></td>
      <td>${r.centerName}</td>
      <td>${resourceLabel(r.resource)}</td>
      <td>${priorityBadge(r.priority)}</td>
      <td class="reason-cell" title="${r.reason}">${r.reason.length > 60 ? r.reason.slice(0, 60) + '…' : r.reason}</td>
      <td>${formatDateTime(r.dateSubmitted)}</td>
      <td>${reqStatusBadge(r.status)}</td>
      <td>
        ${isLDRRMO(session) && ['pending', 'under_review', 'approved'].includes(r.status)
          ? `<button class="btn btn-sm btn-outline-primary review-req" data-id="${r.id}">Review</button>`
          : '<span class="text-muted">—</span>'}
      </td>
    </tr>`
    )
    .join('');

  bindReviewButtons();
}

function bindReviewButtons() {
  document.querySelectorAll('.review-req').forEach((btn) => {
    btn.replaceWith(btn.cloneNode(true));
  });
  document.querySelectorAll('.review-req').forEach((btn) => {
    btn.addEventListener('click', () => openReviewModal(btn.dataset.id));
  });
}

/* ── Logs ── */
function renderLogs() {
  const logs = getLogs();
  const filter = $('#logFilter')?.value || 'all';
  const filtered = filter === 'all' ? logs : logs.filter((l) => l.action === filter);

  const tbody = $('#logsTable');
  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted py-4">No log entries</td></tr>';
    return;
  }

  tbody.innerHTML = filtered
    .map(
      (l) => `
    <tr>
      <td>${formatDateTime(l.timestamp)}</td>
      <td>${l.userName}</td>
      <td><span class="log-action">${LOG_ACTIONS[l.action] || l.action}</span></td>
      <td><code>${l.entityId}</code></td>
      <td>${l.details}</td>
    </tr>`
    )
    .join('');
}

function updateAlertBadge() {
  const badge = $('#alertBadge');
  if (!badge || !isLDRRMO(session)) return;
  const alerts = getCriticalAlerts(getCenters());
  const pending = getRequests().filter((r) => r.status === 'pending').length;
  const count = alerts.length + pending;
  badge.textContent = count;
  badge.hidden = count === 0;
}

/* ── Modals ── */
function openCenterModal(id = null) {
  const modal = bootstrap.Modal.getOrCreateInstance($('#centerModal'));
  const form = $('#centerForm');
  form.reset();
  $('#centerFormId').value = id || '';

  if (id) {
    const c = getCenters().find((x) => x.id === id);
    if (!c) return;
    $('#centerModalTitle').textContent = 'Edit Evacuation Center';
    $('#centerName').value = c.name;
    $('#centerAddress').value = c.address;
    $('#centerBarangay').value = c.barangay;
    $('#centerCapacity').value = c.capacity;
    $('#centerCoordinator').value = c.coordinatorName;
    $('#centerContact').value = c.contactNumber;
  } else {
    $('#centerModalTitle').textContent = 'Register Evacuation Center';
  }

  modal.show();
}

function openEvacueeModal(id) {
  const c = getCenters().find((x) => x.id === id);
  if (!c) return;
  const modal = bootstrap.Modal.getOrCreateInstance($('#evacueeModal'));
  $('#evacueeCenterId').value = id;
  $('#evacueeModalTitle').textContent = `Evacuee Count — ${c.name}`;
  $('#evacTotal').value = c.evacuees.total;
  $('#evacChildren').value = c.evacuees.children;
  $('#evacSeniors').value = c.evacuees.seniors;
  $('#evacPregnant').value = c.evacuees.pregnant;
  $('#evacPwd').value = c.evacuees.pwd;
  modal.show();
}

function openResourceModal(id) {
  const c = getCenters().find((x) => x.id === id);
  if (!c) return;
  const modal = bootstrap.Modal.getOrCreateInstance($('#resourceModal'));
  $('#resourceCenterId').value = id;
  $('#resourceModalTitle').textContent = `Resource Status — ${c.name}`;

  const container = $('#resourceStatusFields');
  container.innerHTML = RESOURCE_TYPES.map(
    ({ key, label }) => `
    <div class="mb-3">
      <label class="form-label">${label}</label>
      <select class="form-select" name="resource_${key}" data-key="${key}">
        ${Object.entries(RESOURCE_STATUS)
          .map(
            ([val, meta]) =>
              `<option value="${val}" ${c.resources[key] === val ? 'selected' : ''}>${meta.label}</option>`
          )
          .join('')}
      </select>
    </div>`
  ).join('');

  modal.show();
}

function openRequestModal(centerId = null) {
  const modal = bootstrap.Modal.getOrCreateInstance($('#requestModal'));
  $('#requestForm').reset();
  const select = $('#requestCenter');
  const centers = accessibleCenters();
  select.innerHTML = centers.map((c) => `<option value="${c.id}">${c.name}</option>`).join('');
  if (centerId) select.value = centerId;
  modal.show();
}

function openReviewModal(id) {
  const r = getRequests().find((x) => x.id === id);
  if (!r) return;
  const modal = bootstrap.Modal.getOrCreateInstance($('#reviewModal'));
  $('#reviewRequestId').value = id;
  $('#reviewDetails').innerHTML = `
    <p><strong>Center:</strong> ${r.centerName}</p>
    <p><strong>Resource:</strong> ${resourceLabel(r.resource)}</p>
    <p><strong>Priority:</strong> ${priorityBadge(r.priority)}</p>
    <p><strong>Reason:</strong> ${r.reason}</p>
    <p><strong>Submitted:</strong> ${formatDateTime(r.dateSubmitted)} by ${r.submittedBy}</p>
    <p><strong>Current Status:</strong> ${reqStatusBadge(r.status)}</p>
  `;
  $('#reviewStatus').value = r.status === 'pending' ? 'under_review' : r.status;
  $('#reviewNotes').value = r.notes || '';
  modal.show();
}

function initModals() {
  $('#centerForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const id = $('#centerFormId').value;
    const payload = {
      name: $('#centerName').value,
      address: $('#centerAddress').value,
      barangay: $('#centerBarangay').value,
      capacity: $('#centerCapacity').value,
      coordinatorName: $('#centerCoordinator').value,
      contactNumber: $('#centerContact').value,
    };

    if (id) {
      updateCenter(id, payload, session);
    } else if (isLDRRMO(session)) {
      createCenter(payload, session);
    }

    bootstrap.Modal.getInstance($('#centerModal')).hide();
    refreshAll();
  });

  $('#evacueeForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const id = $('#evacueeCenterId').value;
    updateEvacuees(
      id,
      {
        total: Number($('#evacTotal').value) || 0,
        children: Number($('#evacChildren').value) || 0,
        seniors: Number($('#evacSeniors').value) || 0,
        pregnant: Number($('#evacPregnant').value) || 0,
        pwd: Number($('#evacPwd').value) || 0,
      },
      session
    );
    bootstrap.Modal.getInstance($('#evacueeModal')).hide();
    refreshAll();
  });

  $('#resourceForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const id = $('#resourceCenterId').value;
    const resources = {};
    $('#resourceStatusFields').querySelectorAll('select[data-key]').forEach((sel) => {
      resources[sel.dataset.key] = sel.value;
    });
    updateResources(id, resources, session);
    bootstrap.Modal.getInstance($('#resourceModal')).hide();
    refreshAll();
  });

  $('#requestForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    createRequest(
      {
        centerId: $('#requestCenter').value,
        resource: $('#requestResource').value,
        priority: $('#requestPriority').value,
        reason: $('#requestReason').value,
      },
      session
    );
    bootstrap.Modal.getInstance($('#requestModal')).hide();
    refreshAll();
  });

  $('#reviewForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    updateRequestStatus($('#reviewRequestId').value, $('#reviewStatus').value, $('#reviewNotes').value, session);
    bootstrap.Modal.getInstance($('#reviewModal')).hide();
    refreshAll();
  });
}

function initHeaderActions() {
  $('#headerAction')?.addEventListener('click', () => {
    const action = $('#headerAction').dataset.action;
    if (action === 'Register Center') openCenterModal();
    else if (action === 'New Request') openRequestModal();
    else if (action === 'Export Summary') exportSummary();
  });
}

function exportSummary() {
  const centers = getCenters();
  const requests = getRequests();
  const stats = getSummaryStats(centers, requests);
  const rankings = rankCenters(centers, requests);
  const report = {
    generatedAt: new Date().toISOString(),
    generatedBy: session.name,
    stats,
    priorityRankings: rankings,
    criticalAlerts: getCriticalAlerts(centers),
    pendingRequests: requests.filter((r) => ['pending', 'under_review'].includes(r.status)),
  };
  const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `ldrrmo-summary-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
}

function initFilters() {
  $('#centerSearch')?.addEventListener('input', renderCenters);
  $('#requestStatusFilter')?.addEventListener('change', renderRequests);
  $('#logFilter')?.addEventListener('change', renderLogs);
}

function initApp(sessionData) {
  session = sessionData;
  loadData();
  initSidebar();
  const nav = initNavigation();
  navigateTo = nav.navigateTo;
  initModals();
  initHeaderActions();
  initFilters();

  $('#logoutBtn')?.addEventListener('click', (e) => {
    e.preventDefault();
    clearSession();
    location.reload();
  });

  $('#resetDataBtn')?.addEventListener('click', () => {
    if (confirm('Reset all demo data to defaults? This cannot be undone.')) {
      resetData();
      refreshAll();
    }
  });

  const startView = isLDRRMO(session) ? 'dashboard' : 'overview';
  navigateTo(startView);
  refreshAll();
}

document.addEventListener('DOMContentLoaded', () => {
  initLogin(initApp);
  window.__evachubReady = true;
});

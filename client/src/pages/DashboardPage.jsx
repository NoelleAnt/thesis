import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { dashboardApi } from '../api/client.js';
import { RESOURCE_STATUS, RESOURCE_TYPES } from '../constants.js';
import { formatDateTime, resourceLabel } from '../utils/format.js';
import { LevelBadge, PriorityBadge, ReqStatusBadge } from '../components/Badges.jsx';
import ReviewModal from '../components/modals/ReviewModal.jsx';

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [reviewId, setReviewId] = useState(null);

  async function load() {
    try {
      const { data: payload } = await dashboardApi.get();
      setData(payload);
    } catch (err) {
      if (err.response?.status === 403) return <Navigate to="/overview" replace />;
      setError(err.response?.data?.error || 'Failed to load dashboard.');
    }
  }

  useEffect(() => {
    load();
  }, []);

  if (error) return <div className="alert alert-danger">{error}</div>;
  if (!data) return <div className="loading-inline">Loading dashboard…</div>;

  const { stats, rankings, criticalAlerts, pendingRequests, requestHistory, resourceOverview } = data;

  return (
    <>
      <PageHeader
        title="Decision Support Dashboard"
        subtitle="Consolidated view for LDRRMO decision-making and incident coordination."
      />

      <div className="stats-grid">
        <article className="stat-card"><p className="stat-label">Active Centers</p><h2>{stats.centerCount}</h2></article>
        <article className="stat-card"><p className="stat-label">Total Evacuees</p><h2>{stats.totalEvacuees.toLocaleString()}</h2></article>
        <article className="stat-card"><p className="stat-label">Vulnerable Population</p><h2>{stats.totalVulnerable.toLocaleString()}</h2></article>
        <article className="stat-card"><p className="stat-label">Pending Requests</p><h2>{stats.pendingRequests}</h2></article>
        <article className="stat-card stat-warning"><p className="stat-label">Urgent Requests</p><h2 className="stat-value">{stats.urgentRequests}</h2></article>
        <article className="stat-card stat-danger"><p className="stat-label">Critical Shortages</p><h2>{stats.criticalAlerts}</h2></article>
      </div>

      <div className="dashboard-grid">
        <div className="card-panel">
          <div className="panel-header"><h3><i className="bi bi-exclamation-octagon text-danger" /> Critical Shortage Alerts</h3></div>
          {criticalAlerts.length === 0 ? (
            <p className="empty-msg">No critical shortages reported.</p>
          ) : (
            criticalAlerts.map((a) => (
              <div key={`${a.centerId}-${a.resource}`} className="alert-item alert-critical">
                <i className="bi bi-exclamation-octagon-fill" />
                <div>
                  <strong>{a.centerName}</strong>
                  <span>{a.resourceLabel} — Critical ({a.evacuees} evacuees)</span>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="card-panel">
          <div className="panel-header"><h3><i className="bi bi-inbox" /> Pending Resource Requests</h3></div>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th><th>Center</th><th>Resource</th><th>Priority</th><th>Submitted</th><th>Status</th><th />
                </tr>
              </thead>
              <tbody>
                {pendingRequests.length === 0 ? (
                  <tr><td colSpan={7} className="text-center text-muted py-4">No pending requests</td></tr>
                ) : (
                  pendingRequests.map((r) => (
                    <tr key={r.id}>
                      <td><code>{r.id}</code></td>
                      <td>{r.centerName}</td>
                      <td>{resourceLabel(r.resource)}</td>
                      <td><PriorityBadge priority={r.priority} /></td>
                      <td>{formatDateTime(r.dateSubmitted)}</td>
                      <td><ReqStatusBadge status={r.status} /></td>
                      <td><button className="btn btn-sm btn-outline-primary" onClick={() => setReviewId(r.id)}>Review</button></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="card-panel mt-3">
        <div className="panel-header">
          <h3><i className="bi bi-sort-numeric-down" /> Priority Rankings</h3>
          <small className="text-muted">Based on evacuees, critical shortages, vulnerable populations, and pending requests</small>
        </div>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Rank</th><th>Center</th><th>Evacuees</th><th>Vulnerable</th><th>Critical</th><th>Requests</th><th>Level</th><th>Score</th><th>Factors</th>
              </tr>
            </thead>
            <tbody>
              {rankings.map((r, i) => (
                <tr key={r.centerId}>
                  <td><span className="rank-num">{i + 1}</span></td>
                  <td><strong>{r.centerName}</strong></td>
                  <td>{r.evacuees}</td>
                  <td>{r.vulnerable}</td>
                  <td>{r.criticalCount}</td>
                  <td>{r.pendingRequests}</td>
                  <td><LevelBadge level={r.level} /></td>
                  <td className="score-cell">{r.score}</td>
                  <td><small>{r.reasons.join(' · ') || 'Stable'}</small></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card-panel">
        <div className="panel-header"><h3><i className="bi bi-grid" /> Resource Status Overview</h3></div>
        <div className="resource-overview-grid">
          {resourceOverview.map((c) => (
            <div key={c.id} className="resource-center-card">
              <h4>{c.name}</h4>
              <p className="text-muted">{c.evacuees.total} evacuees · {c.barangay}</p>
              <div className="resource-chips">
                {RESOURCE_TYPES.map(({ key, label }) => (
                  <span key={key} className={`resource-chip ${RESOURCE_STATUS[c.resources[key]]?.class || ''}`}>
                    {label.split(' ')[0]}: {RESOURCE_STATUS[c.resources[key]]?.label || c.resources[key]}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card-panel">
        <div className="panel-header"><h3><i className="bi bi-clock-history" /> Request History</h3></div>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr><th>ID</th><th>Center</th><th>Resource</th><th>Priority</th><th>Status</th><th>Submitted</th><th>Reviewed By</th></tr>
            </thead>
            <tbody>
              {requestHistory.map((r) => (
                <tr key={r.id}>
                  <td><code>{r.id}</code></td>
                  <td>{r.centerName}</td>
                  <td>{resourceLabel(r.resource)}</td>
                  <td><PriorityBadge priority={r.priority} /></td>
                  <td><ReqStatusBadge status={r.status} /></td>
                  <td>{formatDateTime(r.dateSubmitted)}</td>
                  <td>{r.reviewedBy || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {reviewId && <ReviewModal requestId={reviewId} onClose={() => setReviewId(null)} onSaved={load} />}
    </>
  );
}

export function PageHeader({ title, subtitle, action }) {
  return (
    <div className="page-header">
      <div>
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

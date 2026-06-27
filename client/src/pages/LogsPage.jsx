import { useEffect, useState } from 'react';
import { logsApi } from '../api/client.js';
import { LOG_ACTIONS } from '../constants.js';
import { formatDateTime } from '../utils/format.js';
import { PageHeader } from './DashboardPage.jsx';

export default function LogsPage() {
  const [logs, setLogs] = useState([]);
  const [action, setAction] = useState('all');

  async function load() {
    const { data } = await logsApi.list(action);
    setLogs(data.logs);
  }

  useEffect(() => {
    load();
  }, [action]);

  return (
    <>
      <PageHeader
        title="Activity & Inventory Logs"
        subtitle="Audit trail of inventory updates, requests, and status changes (ICS documentation)."
      />

      <p className="ics-note">
        <i className="bi bi-journal-check" /> Activity log for accountability and ICS documentation. Records
        inventory updates, resource requests, and status changes.
      </p>

      <div className="filter-bar">
        <select className="form-select" value={action} onChange={(e) => setAction(e.target.value)}>
          <option value="all">All activities</option>
          {Object.entries(LOG_ACTIONS).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>

      <div className="card-panel">
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr><th>Timestamp</th><th>User</th><th>Action</th><th>Reference</th><th>Details</th></tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr><td colSpan={5} className="text-center text-muted py-4">No log entries</td></tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id}>
                    <td>{formatDateTime(log.timestamp)}</td>
                    <td>{log.userName}</td>
                    <td><span className="log-action">{LOG_ACTIONS[log.action] || log.action}</span></td>
                    <td><code>{log.entityId || '—'}</code></td>
                    <td>{log.details}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

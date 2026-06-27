import { useEffect, useState } from 'react';
import { centersApi } from '../api/client.js';
import { RESOURCE_STATUS, RESOURCE_TYPES } from '../constants.js';
import { formatDateTime } from '../utils/format.js';
import { StatusBadge } from '../components/Badges.jsx';
import { PageHeader } from './DashboardPage.jsx';
import ResourceModal from '../components/modals/ResourceModal.jsx';

export default function ResourcesPage() {
  const [centers, setCenters] = useState([]);
  const [selected, setSelected] = useState(null);

  async function load() {
    const { data } = await centersApi.list();
    setCenters(data.centers);
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <>
      <PageHeader
        title="Resource Monitoring"
        subtitle="Track availability of food, water, medicines, hygiene kits, and sleeping kits."
      />

      <p className="ics-note">
        <i className="bi bi-info-circle" /> Update resource status when inventory changes. Status levels:{' '}
        <strong>Sufficient</strong>, <strong>Low Stock</strong>, or <strong>Critical</strong>.
      </p>

      <div className="resources-grid">
        {centers.map((c) => (
          <div key={c.id} className="card-panel resource-card">
            <div className="resource-card-header">
              <div>
                <h4>{c.name}</h4>
                <small className="text-muted">Last updated {formatDateTime(c.lastUpdated)} by {c.updatedBy}</small>
              </div>
              <button className="btn btn-sm btn-primary" onClick={() => setSelected(c)}>Update</button>
            </div>
            <div className="resource-rows">
              {RESOURCE_TYPES.map(({ key, label, icon }) => (
                <div key={key} className="resource-row">
                  <span><i className={`bi ${icon}`} /> {label}</span>
                  <StatusBadge status={c.resources[key]} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {selected && <ResourceModal center={selected} onClose={() => setSelected(null)} onSaved={load} />}
    </>
  );
}

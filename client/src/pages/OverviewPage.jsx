import { useEffect, useState } from 'react';
import { centersApi, requestsApi } from '../api/client.js';
import { RESOURCE_STATUS, RESOURCE_TYPES } from '../constants.js';
import { vulnerableCount } from '../utils/format.js';
import { PageHeader } from './DashboardPage.jsx';
import EvacueeModal from '../components/modals/EvacueeModal.jsx';
import ResourceModal from '../components/modals/ResourceModal.jsx';
import RequestModal from '../components/modals/RequestModal.jsx';

export default function OverviewPage() {
  const [center, setCenter] = useState(null);
  const [requests, setRequests] = useState([]);
  const [modal, setModal] = useState(null);

  async function load() {
    const [{ data: centersData }, { data: requestsData }] = await Promise.all([
      centersApi.list(),
      requestsApi.list('all'),
    ]);
    setCenter(centersData.centers[0] || null);
    setRequests(requestsData.requests);
  }

  useEffect(() => {
    load();
  }, []);

  if (!center) return <p className="empty-msg">No assigned evacuation center.</p>;

  const centerRequests = requests.filter((r) => r.centerId === center.id);
  const pending = centerRequests.filter((r) => ['pending', 'under_review', 'approved'].includes(r.status));
  const critical = RESOURCE_TYPES.filter(({ key }) => center.resources[key] === 'critical');
  const vuln = vulnerableCount(center.evacuees);

  return (
    <>
      <PageHeader
        title="Operations Overview"
        subtitle="Status of your assigned evacuation center and recent activity."
      />

      <div className="overview-grid">
        <article className="stat-card">
          <div className="stat-icon bg-blue"><i className="bi bi-people-fill" /></div>
          <div><p className="stat-label">Evacuees</p><h2>{center.evacuees.total}</h2></div>
        </article>
        <article className="stat-card">
          <div className="stat-icon bg-amber"><i className="bi bi-heart-pulse" /></div>
          <div><p className="stat-label">Vulnerable</p><h2>{vuln}</h2></div>
        </article>
        <article className="stat-card">
          <div className="stat-icon bg-red"><i className="bi bi-exclamation-triangle" /></div>
          <div><p className="stat-label">Critical Resources</p><h2>{critical.length}</h2></div>
        </article>
        <article className="stat-card">
          <div className="stat-icon bg-teal"><i className="bi bi-inbox" /></div>
          <div><p className="stat-label">Open Requests</p><h2>{pending.length}</h2></div>
        </article>
      </div>

      <div className="card-panel mt-4">
        <h3>{center.name}</h3>
        <p className="text-muted">{center.address} · Capacity: {center.capacity}</p>
        <div className="resource-chips mt-3">
          {RESOURCE_TYPES.map(({ key, label }) => (
            <span key={key} className={`resource-chip ${RESOURCE_STATUS[center.resources[key]]?.class}`}>
              {label}: {RESOURCE_STATUS[center.resources[key]]?.label}
            </span>
          ))}
        </div>
        <div className="mt-3 d-flex gap-2 flex-wrap">
          <button className="btn btn-primary btn-sm" onClick={() => setModal('evacuees')}>Update Evacuees</button>
          <button className="btn btn-outline-primary btn-sm" onClick={() => setModal('resources')}>Update Resources</button>
          <button className="btn btn-outline-secondary btn-sm" onClick={() => setModal('request')}>Submit Request</button>
        </div>
      </div>

      {modal === 'evacuees' && <EvacueeModal center={center} onClose={() => setModal(null)} onSaved={load} />}
      {modal === 'resources' && <ResourceModal center={center} onClose={() => setModal(null)} onSaved={load} />}
      {modal === 'request' && <RequestModal centers={[center]} defaultCenterId={center.id} onClose={() => setModal(null)} onSaved={load} />}
    </>
  );
}

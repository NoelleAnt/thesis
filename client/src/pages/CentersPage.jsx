import { useEffect, useState } from 'react';
import { centersApi } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { vulnerableCount } from '../utils/format.js';
import { PageHeader } from './DashboardPage.jsx';
import CenterModal from '../components/modals/CenterModal.jsx';
import EvacueeModal from '../components/modals/EvacueeModal.jsx';

export default function CentersPage() {
  const { isLDRRMO } = useAuth();
  const [centers, setCenters] = useState([]);
  const [search, setSearch] = useState('');
  const [centerModal, setCenterModal] = useState(null);
  const [evacModal, setEvacModal] = useState(null);

  async function load() {
    const { data } = await centersApi.list(search);
    setCenters(data.centers);
  }

  useEffect(() => {
    const timer = setTimeout(load, 200);
    return () => clearTimeout(timer);
  }, [search]);

  return (
    <>
      <PageHeader
        title="Evacuation Centers"
        subtitle="Register and maintain evacuation center information and evacuee counts."
        action={
          isLDRRMO ? (
            <button className="btn btn-primary" onClick={() => setCenterModal('new')}>
              <i className="bi bi-plus-lg" /> Register Center
            </button>
          ) : null
        }
      />

      <div className="filter-bar">
        <input
          type="search"
          className="form-control"
          placeholder="Search centers…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="card-panel">
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th><th>Center</th><th>Barangay</th><th>Evacuees</th><th>Occupancy</th><th>Coordinator</th><th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {centers.length === 0 ? (
                <tr><td colSpan={8} className="text-center text-muted py-4">No centers found</td></tr>
              ) : (
                centers.map((c) => {
                  const vuln = vulnerableCount(c.evacuees);
                  const occ = c.capacity ? Math.round((c.evacuees.total / c.capacity) * 100) : 0;
                  return (
                    <tr key={c.id}>
                      <td><code>{c.id}</code></td>
                      <td><strong>{c.name}</strong><br /><small className="text-muted">{c.address}</small></td>
                      <td>{c.barangay}</td>
                      <td>{c.evacuees.total} <small className="text-muted">({vuln} vuln.)</small></td>
                      <td><span className={occ >= 90 ? 'text-danger fw-bold' : ''}>{occ}%</span></td>
                      <td>{c.coordinatorName}</td>
                      <td><span className={`badge ${c.status === 'active' ? 'bg-success' : 'bg-secondary'}`}>{c.status}</span></td>
                      <td className="actions-cell">
                        <button className="btn btn-sm btn-outline-primary me-1" onClick={() => setCenterModal(c.id)} title="Edit"><i className="bi bi-pencil" /></button>
                        <button className="btn btn-sm btn-outline-secondary" onClick={() => setEvacModal(c.id)} title="Evacuees"><i className="bi bi-people" /></button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {centerModal && (
        <CenterModal
          centerId={centerModal === 'new' ? null : centerModal}
          onClose={() => setCenterModal(null)}
          onSaved={load}
        />
      )}
      {evacModal && (
        <EvacueeModal
          center={centers.find((c) => c.id === evacModal)}
          onClose={() => setEvacModal(null)}
          onSaved={load}
        />
      )}
    </>
  );
}

import { useEffect, useState } from 'react';
import { centersApi, requestsApi } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { formatDateTime, resourceLabel } from '../utils/format.js';
import { PriorityBadge, ReqStatusBadge } from '../components/Badges.jsx';
import { PageHeader } from './DashboardPage.jsx';
import RequestModal from '../components/modals/RequestModal.jsx';
import ReviewModal from '../components/modals/ReviewModal.jsx';

export default function RequestsPage() {
  const { isLDRRMO } = useAuth();
  const [requests, setRequests] = useState([]);
  const [centers, setCenters] = useState([]);
  const [status, setStatus] = useState('all');
  const [showNew, setShowNew] = useState(false);
  const [reviewId, setReviewId] = useState(null);

  async function load() {
    const [{ data: reqData }, { data: centerData }] = await Promise.all([
      requestsApi.list(status),
      centersApi.list(),
    ]);
    setRequests(reqData.requests);
    setCenters(centerData.centers);
  }

  useEffect(() => {
    load();
  }, [status]);

  return (
    <>
      <PageHeader
        title="Resource Requests"
        subtitle="Submit and track requests for additional supplies when stocks become insufficient."
        action={
          <button className="btn btn-primary" onClick={() => setShowNew(true)}>
            <i className="bi bi-plus-lg" /> New Request
          </button>
        }
      />

      <div className="filter-bar">
        <select className="form-select" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="all">All statuses</option>
          <option value="pending">Pending</option>
          <option value="under_review">Under Review</option>
          <option value="approved">Approved</option>
          <option value="fulfilled">Fulfilled</option>
          <option value="denied">Denied</option>
        </select>
      </div>

      <div className="card-panel">
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th><th>Center</th><th>Resource</th><th>Priority</th><th>Reason</th><th>Submitted</th><th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.length === 0 ? (
                <tr><td colSpan={8} className="text-center text-muted py-4">No requests found</td></tr>
              ) : (
                requests.map((r) => (
                  <tr key={r.id}>
                    <td><code>{r.id}</code></td>
                    <td>{r.centerName}</td>
                    <td>{resourceLabel(r.resource)}</td>
                    <td><PriorityBadge priority={r.priority} /></td>
                    <td className="reason-cell" title={r.reason}>{r.reason.length > 60 ? `${r.reason.slice(0, 60)}…` : r.reason}</td>
                    <td>{formatDateTime(r.dateSubmitted)}</td>
                    <td><ReqStatusBadge status={r.status} /></td>
                    <td>
                      {isLDRRMO && ['pending', 'under_review', 'approved'].includes(r.status) ? (
                        <button className="btn btn-sm btn-outline-primary" onClick={() => setReviewId(r.id)}>Review</button>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showNew && <RequestModal centers={centers} onClose={() => setShowNew(false)} onSaved={load} />}
      {reviewId && <ReviewModal requestId={reviewId} onClose={() => setReviewId(null)} onSaved={load} />}
    </>
  );
}

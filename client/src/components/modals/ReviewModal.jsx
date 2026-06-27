import { useEffect, useState } from 'react';
import { requestsApi } from '../../api/client.js';
import { formatDateTime, resourceLabel } from '../../utils/format.js';
import { PriorityBadge, ReqStatusBadge } from '../Badges.jsx';
import Modal from '../Modal.jsx';

export default function ReviewModal({ requestId, onClose, onSaved }) {
  const [request, setRequest] = useState(null);
  const [status, setStatus] = useState('under_review');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    requestsApi.list('all').then(({ data }) => {
      const found = data.requests.find((r) => r.id === requestId);
      setRequest(found);
      if (found) {
        setStatus(found.status === 'pending' ? 'under_review' : found.status);
        setNotes(found.notes || '');
      }
    });
  }, [requestId]);

  async function handleSubmit() {
    setError('');
    try {
      await requestsApi.updateStatus(requestId, { status, notes });
      onSaved();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update request.');
    }
  }

  if (!request) return null;

  return (
    <Modal title="Review Resource Request" onClose={onClose} onSubmit={handleSubmit} submitLabel="Update Status">
      <div className="mb-3 p-3 bg-light rounded">
        <p className="mb-1"><strong>{request.id}</strong> — {request.centerName}</p>
        <p className="mb-1">{resourceLabel(request.resource)} · <PriorityBadge priority={request.priority} /></p>
        <p className="mb-1 small text-muted">Submitted {formatDateTime(request.dateSubmitted)} by {request.submittedBy}</p>
        <p className="mb-0">{request.reason}</p>
        <div className="mt-2"><ReqStatusBadge status={request.status} /></div>
      </div>
      <div className="mb-3">
        <label className="form-label">Update Status</label>
        <select className="form-select" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="under_review">Under Review</option>
          <option value="approved">Approved</option>
          <option value="fulfilled">Fulfilled</option>
          <option value="denied">Denied</option>
        </select>
      </div>
      <div className="mb-3">
        <label className="form-label">Notes / Documentation</label>
        <textarea className="form-control" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Coordination notes, delivery schedule, etc." />
      </div>
      <p className="text-muted small mb-0">Final approval and resource augmentation follow existing LGU and ICS procedures.</p>
      {error && <p className="login-error mt-2">{error}</p>}
    </Modal>
  );
}

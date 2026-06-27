import { useState } from 'react';
import { requestsApi } from '../../api/client.js';
import Modal from '../Modal.jsx';

export default function RequestModal({ centers, defaultCenterId = '', onClose, onSaved }) {
  const [form, setForm] = useState({
    centerId: defaultCenterId || centers[0]?.id || '',
    resource: 'food',
    priority: 'medium',
    reason: '',
  });
  const [error, setError] = useState('');

  async function handleSubmit() {
    setError('');
    try {
      await requestsApi.create(form);
      onSaved();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit request.');
    }
  }

  return (
    <Modal title="Submit Resource Request" onClose={onClose} onSubmit={handleSubmit} submitLabel="Submit Request">
      <div className="mb-3">
        <label className="form-label">Evacuation Center</label>
        <select className="form-select" required value={form.centerId} onChange={(e) => setForm({ ...form, centerId: e.target.value })}>
          {centers.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>
      <div className="mb-3">
        <label className="form-label">Requested Resource</label>
        <select className="form-select" value={form.resource} onChange={(e) => setForm({ ...form, resource: e.target.value })}>
          <option value="food">Food</option>
          <option value="water">Drinking Water</option>
          <option value="medicines">Medicines</option>
          <option value="hygiene_kits">Hygiene Kits</option>
          <option value="sleeping_kits">Sleeping Kits</option>
        </select>
      </div>
      <div className="mb-3">
        <label className="form-label">Priority Level</label>
        <select className="form-select" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>
      </div>
      <div className="mb-3">
        <label className="form-label">Reason for Request</label>
        <textarea className="form-control" rows={3} required value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="Describe the shortage and immediate need…" />
      </div>
      {error && <p className="login-error">{error}</p>}
    </Modal>
  );
}

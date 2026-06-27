import { useState } from 'react';
import { centersApi } from '../../api/client.js';
import { RESOURCE_TYPES } from '../../constants.js';
import Modal from '../Modal.jsx';

export default function ResourceModal({ center, onClose, onSaved }) {
  const [resources, setResources] = useState({ ...center.resources });
  const [error, setError] = useState('');

  async function handleSubmit() {
    setError('');
    try {
      await centersApi.updateResources(center.id, resources);
      onSaved();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update resources.');
    }
  }

  return (
    <Modal title={`Update Resource Status — ${center.name}`} onClose={onClose} onSubmit={handleSubmit} submitLabel="Save Status">
      {RESOURCE_TYPES.map(({ key, label }) => (
        <div className="mb-3" key={key}>
          <label className="form-label">{label}</label>
          <select className="form-select" value={resources[key]} onChange={(e) => setResources({ ...resources, [key]: e.target.value })}>
            <option value="sufficient">Sufficient</option>
            <option value="low">Low Stock</option>
            <option value="critical">Critical</option>
          </select>
        </div>
      ))}
      {error && <p className="login-error">{error}</p>}
    </Modal>
  );
}

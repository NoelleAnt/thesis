import { useEffect, useState } from 'react';
import { centersApi } from '../../api/client.js';
import Modal from '../Modal.jsx';

export default function CenterModal({ centerId, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: '',
    address: '',
    barangay: '',
    capacity: '',
    coordinatorName: '',
    contactNumber: '',
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (!centerId) return;
    centersApi.get(centerId).then(({ data }) => {
      const c = data.center;
      setForm({
        name: c.name,
        address: c.address,
        barangay: c.barangay,
        capacity: String(c.capacity),
        coordinatorName: c.coordinatorName,
        contactNumber: c.contactNumber,
      });
    });
  }, [centerId]);

  async function handleSubmit() {
    setError('');
    try {
      if (centerId) await centersApi.update(centerId, { ...form, capacity: Number(form.capacity) });
      else await centersApi.create({ ...form, capacity: Number(form.capacity) });
      onSaved();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save center.');
    }
  }

  const fields = [
    ['name', 'Center Name'],
    ['address', 'Address'],
    ['barangay', 'Barangay'],
    ['capacity', 'Capacity'],
    ['coordinatorName', 'Coordinator Name'],
    ['contactNumber', 'Contact Number'],
  ];

  return (
    <Modal title={centerId ? 'Edit Evacuation Center' : 'Register Evacuation Center'} onClose={onClose} onSubmit={handleSubmit} submitLabel="Save Center">
      {fields.map(([key, label]) => (
        <div className="mb-3" key={key}>
          <label className="form-label">{label}</label>
          <input
            className="form-control"
            type={key === 'capacity' ? 'number' : 'text'}
            min={key === 'capacity' ? 1 : undefined}
            required
            value={form[key]}
            onChange={(e) => setForm({ ...form, [key]: e.target.value })}
          />
        </div>
      ))}
      {error && <p className="login-error">{error}</p>}
    </Modal>
  );
}

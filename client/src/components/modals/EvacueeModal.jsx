import { useEffect, useState } from 'react';
import { centersApi } from '../../api/client.js';
import Modal from '../Modal.jsx';

export default function EvacueeModal({ center: initialCenter, onClose, onSaved }) {
  const [center, setCenter] = useState(initialCenter);
  const [form, setForm] = useState({ total: 0, children: 0, seniors: 0, pregnant: 0, pwd: 0 });
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialCenter) {
      setCenter(initialCenter);
      setForm({ ...initialCenter.evacuees });
    } else if (typeof initialCenter === 'string') {
      centersApi.get(initialCenter).then(({ data }) => {
        setCenter(data.center);
        setForm({ ...data.center.evacuees });
      });
    }
  }, [initialCenter]);

  if (!center) return null;

  async function handleSubmit() {
    setError('');
    try {
      await centersApi.updateEvacuees(center.id, form);
      onSaved();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update evacuees.');
    }
  }

  return (
    <Modal title={`Update Evacuee Count — ${center.name}`} onClose={onClose} onSubmit={handleSubmit} submitLabel="Save Count">
      <div className="mb-3">
        <label className="form-label">Total Evacuees</label>
        <input type="number" min="0" className="form-control" required value={form.total} onChange={(e) => setForm({ ...form, total: Number(e.target.value) })} />
      </div>
      <p className="text-muted small">Vulnerable populations</p>
      <div className="row g-2">
        {[['children', 'Children'], ['seniors', 'Senior Citizens'], ['pregnant', 'Pregnant Women'], ['pwd', 'Persons with Disabilities']].map(([key, label]) => (
          <div className="col-6" key={key}>
            <label className="form-label">{label}</label>
            <input type="number" min="0" className="form-control" value={form[key]} onChange={(e) => setForm({ ...form, [key]: Number(e.target.value) })} />
          </div>
        ))}
      </div>
      {error && <p className="login-error mt-2">{error}</p>}
    </Modal>
  );
}

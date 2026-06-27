export function formatDateTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function resourceLabel(key) {
  const map = {
    food: 'Food',
    water: 'Drinking Water',
    medicines: 'Medicines',
    hygiene_kits: 'Hygiene Kits',
    sleeping_kits: 'Sleeping Kits',
  };
  return map[key] || key;
}

export function vulnerableCount(evacuees = {}) {
  return (evacuees.children || 0) + (evacuees.seniors || 0) + (evacuees.pregnant || 0) + (evacuees.pwd || 0);
}

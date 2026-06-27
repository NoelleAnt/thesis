import { RESOURCE_STATUS, REQUEST_PRIORITIES, REQUEST_STATUSES } from '../constants.js';

export function StatusBadge({ status }) {
  const meta = RESOURCE_STATUS[status] || { label: status, class: '' };
  return <span className={`status-badge ${meta.class}`}>{meta.label}</span>;
}

export function PriorityBadge({ priority }) {
  const meta = REQUEST_PRIORITIES[priority] || { label: priority, class: '' };
  return <span className={`priority-badge ${meta.class}`}>{meta.label}</span>;
}

export function ReqStatusBadge({ status }) {
  const meta = REQUEST_STATUSES[status] || { label: status, class: '' };
  return <span className={`req-badge ${meta.class}`}>{meta.label}</span>;
}

export function LevelBadge({ level }) {
  const map = {
    critical: 'level-critical',
    high: 'level-high',
    moderate: 'level-moderate',
    normal: 'level-normal',
  };
  const label = level ? level.charAt(0).toUpperCase() + level.slice(1) : level;
  return <span className={`level-badge ${map[level] || ''}`}>{label}</span>;
}

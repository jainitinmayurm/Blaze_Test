export default function StatusBadge({ status }) {
  const cls = {
    'Draft': 'badge-draft',
    'Scheduled': 'badge-scheduled',
    'In Progress': 'badge-inprogress',
    'Completed': 'badge-completed',
    'Cancelled': 'badge-cancelled',
  }[status] || 'badge-draft';

  return <span className={`badge ${cls}`}>{status}</span>;
}

export function TypeBadge({ type }) {
  return <span className={`badge ${type === 'online' ? 'badge-online' : 'badge-offline'}`}>{type}</span>;
}

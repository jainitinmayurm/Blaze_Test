import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import StatusBadge, { TypeBadge } from '../components/StatusBadge';
import { formatDateTime, fromNow } from '../utils/time';

export default function MeetingDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [meeting, setMeeting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  const fetchMeeting = async () => {
    try {
      const res = await api.get(`/meetings/${id}`);
      setMeeting(res.data);
    } catch { navigate('/my-meetings'); }
    setLoading(false);
  };

  useEffect(() => { fetchMeeting(); }, [id]);

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel this meeting?')) return;
    setCancelling(true);
    try {
      await api.delete(`/meetings/${id}`, { data: { reason: 'Cancelled by organizer' } });
      fetchMeeting();
    } catch (err) { alert(err.response?.data?.error || 'Failed'); }
    setCancelling(false);
  };

  const handleRespond = async (response) => {
    try {
      await api.put(`/meetings/${id}/respond`, { response });
      fetchMeeting();
    } catch (err) { alert(err.response?.data?.error || 'Failed'); }
  };

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;
  if (!meeting) return <div className="alert alert-error">Meeting not found</div>;

  const isOrganizer = meeting.organizer_id === user?.id;
  const isParticipant = meeting.participants?.some(p => p.user_id === user?.id);

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>{meeting.title}</h1>
          <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
            <StatusBadge status={meeting.status} />
            <TypeBadge type={meeting.type} />
            {isOrganizer && <span className="chip">Organizer</span>}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {isOrganizer && meeting.status !== 'Cancelled' && meeting.status !== 'Completed' && (
            <>
              <button className="btn btn-secondary" onClick={() => navigate(`/meetings/new`)}>Edit</button>
              <button className="btn btn-danger" onClick={handleCancel} disabled={cancelling}>
                {cancelling ? 'Cancelling...' : 'Cancel Meeting'}
              </button>
            </>
          )}
          <button className="btn btn-secondary" onClick={() => navigate(-1)}>← Back</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        <div>
          {/* Details */}
          <div className="card" style={{ marginBottom: '20px' }}>
            <h3 style={{ marginBottom: '16px', fontWeight: 700 }}>Details</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>START TIME</div>
                <div style={{ fontWeight: 600 }}>{formatDateTime(meeting.start_time)}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>END TIME</div>
                <div style={{ fontWeight: 600 }}>{formatDateTime(meeting.end_time)}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>ORGANIZER</div>
                <div style={{ fontWeight: 600 }}>{meeting.organizer_name}</div>
              </div>
              {meeting.room_name && (
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>ROOM</div>
                  <div style={{ fontWeight: 600 }}>{meeting.room_name} ({meeting.room_location})</div>
                </div>
              )}
              {meeting.online_link && (
                <div style={{ gridColumn: '1 / -1' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>MEETING LINK</div>
                  <a href={meeting.online_link} target="_blank" rel="noreferrer"
                    style={{ color: 'var(--accent-cyan)', wordBreak: 'break-all' }}>{meeting.online_link}</a>
                </div>
              )}
            </div>
            {meeting.agenda && (
              <div style={{ marginTop: '16px' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>AGENDA</div>
                <p style={{ color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>{meeting.agenda}</p>
              </div>
            )}
          </div>

          {/* Participants */}
          <div className="card">
            <h3 style={{ marginBottom: '16px', fontWeight: 700 }}>
              Participants ({meeting.participants?.length || 0})
            </h3>
            {isParticipant && meeting.status !== 'Cancelled' && (
              <div style={{ marginBottom: '16px', display: 'flex', gap: '8px' }}>
                <button className="btn btn-success btn-sm" onClick={() => handleRespond('Accepted')}>Accept</button>
                <button className="btn btn-danger btn-sm" onClick={() => handleRespond('Declined')}>Decline</button>
                <button className="btn btn-secondary btn-sm" onClick={() => handleRespond('Tentative')}>Tentative</button>
              </div>
            )}
            <table>
              <thead><tr><th>Name</th><th>Email</th><th>Response</th></tr></thead>
              <tbody>
                {meeting.participants?.map(p => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 600 }}>{p.name}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{p.email}</td>
                    <td><span className={`badge ${p.response === 'Accepted' ? 'badge-completed' : p.response === 'Declined' ? 'badge-cancelled' : 'badge-draft'}`}>{p.response}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Status Log */}
        <div className="card" style={{ alignSelf: 'start' }}>
          <h3 style={{ marginBottom: '16px', fontWeight: 700 }}>Status History</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {meeting.status_log?.map((log, i) => (
              <div key={i} style={{ paddingLeft: '16px', borderLeft: '2px solid var(--accent-blue)', paddingBottom: '8px' }}>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  {log.from_status && <StatusBadge status={log.from_status} />}
                  {log.from_status && <span style={{ color: 'var(--text-muted)' }}>→</span>}
                  <StatusBadge status={log.to_status} />
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  {log.changed_by_name} · {fromNow(log.changed_at)}
                </div>
                {log.reason && <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>{log.reason}</div>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

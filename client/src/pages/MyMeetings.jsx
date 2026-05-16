import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import StatusBadge, { TypeBadge } from '../components/StatusBadge';
import { formatDateTime, fromNow } from '../utils/time';

export default function MyMeetings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('upcoming');

  useEffect(() => {
    const fetchMeetings = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/meetings?user_id=${user.id}`);
        setMeetings(res.data.meetings || []);
      } catch (err) { console.error(err); }
      setLoading(false);
    };
    fetchMeetings();
  }, [user]);

  const now = new Date();
  const upcoming = meetings.filter(m => new Date(m.start_time) >= now && m.status !== 'Cancelled');
  const past = meetings.filter(m => new Date(m.start_time) < now || m.status === 'Cancelled');
  const displayed = tab === 'upcoming' ? upcoming : past;

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>My Meetings</h1>
          <p>All meetings where you are an organizer or participant</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/meetings/new')}>+ New Meeting</button>
      </div>

      <div className="tabs">
        <button className={`tab ${tab === 'upcoming' ? 'active' : ''}`} onClick={() => setTab('upcoming')}>
          Upcoming ({upcoming.length})
        </button>
        <button className={`tab ${tab === 'past' ? 'active' : ''}`} onClick={() => setTab('past')}>
          Past & Cancelled ({past.length})
        </button>
      </div>

      {loading ? (
        <div className="loading-center"><div className="spinner" /></div>
      ) : displayed.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
          No {tab} meetings found.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {displayed.map(m => (
            <div key={m.id} className="meeting-card" onClick={() => navigate(`/meetings/${m.id}`)}>
              <div className="meeting-time">
                <div>{formatDateTime(m.start_time).split(',')[0]}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  {new Date(m.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
              <div className="meeting-info">
                <div className="meeting-title">{m.title}</div>
                <div className="meeting-meta">
                  <span>by {m.organizer_name}</span>
                  {m.room_name && <span>📍 {m.room_name}</span>}
                  <span>{m.participant_count} participants</span>
                  <span>{fromNow(m.start_time)}</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                <StatusBadge status={m.status} />
                <TypeBadge type={m.type} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

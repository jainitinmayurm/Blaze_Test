import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import StatusBadge, { TypeBadge } from '../components/StatusBadge';
import { formatDateTime, fromNow } from '../utils/time';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [meetings, setMeetings] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [m, s] = await Promise.all([
          api.get(`/meetings?user_id=${user.id}&limit=5`),
          api.get('/reports/summary'),
        ]);
        setMeetings(m.data.meetings || []);
        setSummary(s.data);
      } catch (err) { console.error(err); }
      setLoading(false);
    };
    fetch();
  }, [user]);

  const now = new Date();
  const upcoming = meetings.filter(m => new Date(m.start_time) >= now && m.status !== 'Cancelled').slice(0, 5);

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <h1>Welcome back, {user?.name?.split(' ')[0]} 👋</h1>
        <p>Here's your meeting overview for today</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Meetings</div>
          <div className="stat-value" style={{ color: 'var(--accent-blue)' }}>{summary?.total_meetings || 0}</div>
        </div>
        {summary?.by_status?.map(s => (
          <div key={s.status} className="stat-card">
            <div className="stat-label">{s.status}</div>
            <div className="stat-value">{s.count}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
        <div className="card">
          <div className="card-header">
            <h2>Upcoming Meetings</h2>
            <button className="btn btn-secondary btn-sm" onClick={() => navigate('/my-meetings')}>View All</button>
          </div>
          {upcoming.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '24px' }}>No upcoming meetings</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {upcoming.map(m => (
                <div key={m.id} className="meeting-card" onClick={() => navigate(`/meetings/${m.id}`)}>
                  <div className="meeting-time">
                    <div style={{ fontSize: '0.75rem' }}>{formatDateTime(m.start_time).split(',')[0]}</div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                      {new Date(m.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  <div className="meeting-info">
                    <div className="meeting-title">{m.title}</div>
                    <div className="meeting-meta">
                      <span>by {m.organizer_name}</span>
                      <span>{fromNow(m.start_time)}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <StatusBadge status={m.status} />
                    <TypeBadge type={m.type} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import api from '../api/client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';

const COLORS = ['#6366f1', '#22d3ee', '#10b981', '#f59e0b', '#ef4444', '#a855f7', '#ec4899'];

export default function Reports() {
  const [summary, setSummary] = useState(null);
  const [utilization, setUtilization] = useState([]);
  const [noShows, setNoShows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [s, u, n] = await Promise.all([
          api.get('/reports/summary'),
          api.get('/reports/room-utilization'),
          api.get('/reports/no-shows'),
        ]);
        setSummary(s.data);
        setUtilization(u.data);
        setNoShows(n.data);
      } catch (err) { console.error(err); }
      setLoading(false);
    };
    fetch();
  }, []);

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;

  const statusData = summary?.by_status?.map(s => ({ name: s.status, value: parseInt(s.count) })) || [];
  const typeData = summary?.by_type?.map(t => ({ name: t.type, value: parseInt(t.count) })) || [];
  const roomData = utilization.map(r => ({
    name: r.name,
    hours: parseFloat(parseFloat(r.total_hours).toFixed(1)),
    bookings: parseInt(r.total_bookings),
  }));

  return (
    <div>
      <div className="page-header">
        <h1>Reports & Analytics</h1>
        <p>Meeting statistics, room utilization, and attendance tracking</p>
      </div>

      {/* Stat Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Meetings</div>
          <div className="stat-value" style={{ color: 'var(--accent-blue)' }}>{summary?.total_meetings || 0}</div>
        </div>
        {summary?.by_type?.map(t => (
          <div key={t.type} className="stat-card">
            <div className="stat-label">{t.type} Meetings</div>
            <div className="stat-value" style={{ color: t.type === 'online' ? 'var(--accent-cyan)' : 'var(--accent-purple)' }}>{t.count}</div>
          </div>
        ))}
        <div className="stat-card">
          <div className="stat-label">Active Rooms</div>
          <div className="stat-value" style={{ color: 'var(--accent-green)' }}>{utilization.length}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
        {/* Status Distribution */}
        <div className="card">
          <h3 style={{ marginBottom: '16px', fontWeight: 700 }}>Meeting Status Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={statusData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#f1f5f9' }} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Type Distribution */}
        <div className="card">
          <h3 style={{ marginBottom: '16px', fontWeight: 700 }}>Meeting Type Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={typeData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                {typeData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#f1f5f9' }} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Room Utilization */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <h3 style={{ marginBottom: '16px', fontWeight: 700 }}>Room Utilization (Hours Booked)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={roomData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} />
            <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
            <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#f1f5f9' }} />
            <Bar dataKey="hours" fill="#6366f1" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* No-Shows */}
      <div className="card">
        <h3 style={{ marginBottom: '16px', fontWeight: 700 }}>No-Show / Decline Tracking</h3>
        {noShows.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>No no-show data available yet.</p>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead><tr><th>Name</th><th>Email</th><th>Declined</th><th>No Response (Past)</th><th>Total Invites</th></tr></thead>
              <tbody>
                {noShows.map(u => (
                  <tr key={u.id}>
                    <td style={{ fontWeight: 600 }}>{u.name}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{u.email}</td>
                    <td><span className="badge badge-cancelled">{u.declined_count}</span></td>
                    <td><span className="badge badge-draft">{u.no_response_past}</span></td>
                    <td>{u.total_invites}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

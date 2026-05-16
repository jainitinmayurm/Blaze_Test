import { useState, useEffect } from 'react';
import api from '../api/client';
import { formatShortTime } from '../utils/time';

export default function SlotPicker({ participants, date, roomId, onSelect, selectedSlot }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!participants?.length || !date) { setData(null); return; }
    const fetchSlots = async () => {
      setLoading(true);
      setError('');
      try {
        let url = `/availability?participants=${participants.join(',')}&date=${date}&duration=30`;
        if (roomId) url += `&room_id=${roomId}`;
        const res = await api.get(url);
        setData(res.data);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load availability');
      }
      setLoading(false);
    };
    fetchSlots();
  }, [participants, date, roomId]);

  if (!participants?.length || !date) {
    return <div className="card" style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
      Select participants and a date to view available slots
    </div>;
  }

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;
  if (error) return <div className="alert alert-error">{error}</div>;
  if (!data) return null;

  return (
    <div className="card">
      <div className="card-header">
        <h3>Available Slots — {date}</h3>
        <span className="chip">{data.total_free_slots} free slots</span>
      </div>

      {data.busy_slots.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>
            BUSY PERIODS
          </div>
          <div className="slot-grid">
            {data.busy_slots.map((s, i) => (
              <div key={i} className="slot-item slot-busy">
                {formatShortTime(s.start)} – {formatShortTime(s.end)}
                <div style={{ fontSize: '0.65rem', marginTop: '2px' }}>{s.title}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>
        FREE SLOTS (click to select)
      </div>
      {data.free_slots.length === 0 ? (
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No free slots available on this date.</p>
      ) : (
        <div className="slot-grid">
          {data.free_slots.map((s, i) => (
            <div
              key={i}
              className={`slot-item slot-free ${selectedSlot?.start === s.start ? 'selected' : ''}`}
              onClick={() => onSelect(s)}
            >
              {formatShortTime(s.start)} – {formatShortTime(s.end)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

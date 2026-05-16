import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Select from 'react-select';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import SlotPicker from '../components/SlotPicker';
import { dayjs } from '../utils/time';

export default function CreateMeeting() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [title, setTitle] = useState('');
  const [agenda, setAgenda] = useState('');
  const [type, setType] = useState('online');
  const [date, setDate] = useState(dayjs().add(1, 'day').format('YYYY-MM-DD'));
  const [startTime, setStartTime] = useState(searchParams.get('start') || '');
  const [endTime, setEndTime] = useState(searchParams.get('end') || '');
  const [duration, setDuration] = useState(30);
  const [participants, setParticipants] = useState([]);
  const [roomId, setRoomId] = useState('');
  const [onlineLink, setOnlineLink] = useState('');
  const [recurrence, setRecurrence] = useState('');

  const [users, setUsers] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/auth/users').then(r => setUsers(r.data)).catch(() => {});
    api.get('/rooms').then(r => setRooms(r.data)).catch(() => {});
  }, []);

  const userOptions = users
    .filter(u => u.id !== user?.id)
    .map(u => ({ value: u.id, label: `${u.name} (${u.email})` }));

  const participantIds = participants.map(p => p.value);

  const handleSlotSelect = (slot) => {
    setSelectedSlot(slot);
    setStartTime(slot.start);
    setEndTime(slot.end);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setErrors([]);
    setLoading(true);

    try {
      const payload = {
        title,
        agenda: agenda || undefined,
        type,
        start_time: startTime || new Date(`${date}T10:00:00Z`).toISOString(),
        end_time: endTime || new Date(`${date}T10:${duration}:00Z`).toISOString(),
        participants: participantIds,
        room_id: type === 'offline' && roomId ? parseInt(roomId) : undefined,
        online_link: type === 'online' && onlineLink ? onlineLink : undefined,
        recurrence: recurrence || undefined,
      };

      const res = await api.post('/meetings', payload);
      navigate(`/meetings/${res.data.id}`);
    } catch (err) {
      const data = err.response?.data;
      if (data?.errors) setErrors(data.errors);
      else if (data?.details) setErrors(data.details.map(d => `${d.field}: ${d.message}`));
      else setError(data?.error || 'Failed to create meeting');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Create Meeting</h1>
        <p>Schedule a new meeting with conflict detection</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {errors.length > 0 && (
        <div className="alert alert-error">
          <div>
            <strong>Cannot create meeting:</strong>
            <ul style={{ margin: '8px 0 0 16px', listStyle: 'disc' }}>
              {errors.map((e, i) => <li key={i}>{typeof e === 'string' ? e : e.message || JSON.stringify(e)}</li>)}
            </ul>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <div>
          <form onSubmit={handleSubmit}>
            <div className="card" style={{ marginBottom: '20px' }}>
              <h3 style={{ marginBottom: '16px', fontWeight: 700 }}>Meeting Details</h3>

              <div className="form-group">
                <label>Title *</label>
                <input className="form-control" value={title} onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Sprint Planning" required minLength={3} />
              </div>

              <div className="form-group">
                <label>Agenda</label>
                <textarea className="form-control" value={agenda} onChange={e => setAgenda(e.target.value)}
                  placeholder="Meeting agenda and discussion points..." />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Type *</label>
                  <select className="form-control" value={type} onChange={e => setType(e.target.value)}>
                    <option value="online">Online</option>
                    <option value="offline">Offline (In-Room)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Recurrence</label>
                  <select className="form-control" value={recurrence} onChange={e => setRecurrence(e.target.value)}>
                    <option value="">None</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
              </div>

              {type === 'offline' && (
                <div className="form-group">
                  <label>Room *</label>
                  <select className="form-control" value={roomId} onChange={e => setRoomId(e.target.value)} required>
                    <option value="">Select a room...</option>
                    {rooms.map(r => (
                      <option key={r.id} value={r.id}>{r.name} (Cap: {r.capacity})</option>
                    ))}
                  </select>
                </div>
              )}

              {type === 'online' && (
                <div className="form-group">
                  <label>Meeting Link (auto-generated if empty)</label>
                  <input className="form-control" value={onlineLink} onChange={e => setOnlineLink(e.target.value)}
                    placeholder="https://meet.jit.si/..." />
                </div>
              )}
            </div>

            <div className="card" style={{ marginBottom: '20px' }}>
              <h3 style={{ marginBottom: '16px', fontWeight: 700 }}>Participants & Time</h3>

              <div className="form-group">
                <label>Participants * (select at least one)</label>
                <Select
                  isMulti
                  options={userOptions}
                  value={participants}
                  onChange={setParticipants}
                  classNamePrefix="react-select"
                  placeholder="Search and select participants..."
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Date *</label>
                  <input className="form-control" type="date" value={date}
                    onChange={e => { setDate(e.target.value); setSelectedSlot(null); }}
                    min={dayjs().format('YYYY-MM-DD')} required />
                </div>
                <div className="form-group">
                  <label>Duration (minutes)</label>
                  <select className="form-control" value={duration} onChange={e => setDuration(parseInt(e.target.value))}>
                    <option value={15}>15 min</option>
                    <option value={30}>30 min</option>
                    <option value={45}>45 min</option>
                    <option value={60}>1 hour</option>
                    <option value={90}>1.5 hours</option>
                    <option value={120}>2 hours</option>
                  </select>
                </div>
              </div>

              {startTime && endTime && (
                <div className="alert alert-info">
                  <strong>Selected:</strong> {new Date(startTime).toLocaleString()} — {new Date(endTime).toLocaleString()}
                </div>
              )}
            </div>

            <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%' }}>
              {loading ? 'Creating...' : 'Create Meeting'}
            </button>
          </form>
        </div>

        <div>
          <SlotPicker
            participants={participantIds}
            date={date}
            roomId={type === 'offline' ? roomId : null}
            onSelect={handleSlotSelect}
            selectedSlot={selectedSlot}
          />
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { FiPlus, FiEdit2 } from 'react-icons/fi';

export default function RoomManagement() {
  const { user } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editRoom, setEditRoom] = useState(null);
  const [form, setForm] = useState({ name: '', capacity: '', equipment: '', location: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchRooms = async () => {
    setLoading(true);
    try { const res = await api.get('/rooms'); setRooms(res.data); } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchRooms(); }, []);

  const openCreate = () => { setEditRoom(null); setForm({ name: '', capacity: '', equipment: '', location: '' }); setError(''); setShowModal(true); };
  const openEdit = (room) => {
    setEditRoom(room);
    setForm({ name: room.name, capacity: room.capacity.toString(), equipment: room.equipment || '', location: room.location || '' });
    setError('');
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      const payload = { name: form.name, capacity: parseInt(form.capacity), equipment: form.equipment, location: form.location };
      if (editRoom) {
        await api.put(`/rooms/${editRoom.id}`, payload);
      } else {
        await api.post('/rooms', payload);
      }
      setShowModal(false);
      fetchRooms();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save room');
    }
    setSaving(false);
  };

  const parseEquipment = (eq) => {
    try { return JSON.parse(eq); } catch { return []; }
  };

  if (user?.role !== 'admin') {
    return <div className="alert alert-error">Access denied. Admin privileges required.</div>;
  }

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>Room Management</h1>
          <p>Manage meeting rooms, capacity, and equipment</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}><FiPlus /> Add Room</button>
      </div>

      {loading ? (
        <div className="loading-center"><div className="spinner" /></div>
      ) : (
        <div className="card">
          <div className="table-wrapper">
            <table>
              <thead><tr><th>Room</th><th>Capacity</th><th>Equipment</th><th>Location</th><th>Actions</th></tr></thead>
              <tbody>
                {rooms.map(room => (
                  <tr key={room.id}>
                    <td style={{ fontWeight: 600 }}>{room.name}</td>
                    <td><span className="chip">{room.capacity} people</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        {parseEquipment(room.equipment).map((eq, i) => (
                          <span key={i} className="chip">{eq}</span>
                        ))}
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>{room.location}</td>
                    <td>
                      <button className="btn btn-secondary btn-sm" onClick={() => openEdit(room)}><FiEdit2 /> Edit</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>{editRoom ? 'Edit Room' : 'Add New Room'}</h2>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label>Room Name *</label>
                <input className="form-control" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Capacity *</label>
                  <input className="form-control" type="number" min="1" value={form.capacity}
                    onChange={e => setForm({...form, capacity: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>Location</label>
                  <input className="form-control" value={form.location} onChange={e => setForm({...form, location: e.target.value})} />
                </div>
              </div>
              <div className="form-group">
                <label>Equipment (JSON array)</label>
                <input className="form-control" value={form.equipment}
                  onChange={e => setForm({...form, equipment: e.target.value})}
                  placeholder='["Projector", "Whiteboard"]' />
              </div>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : editRoom ? 'Update Room' : 'Create Room'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

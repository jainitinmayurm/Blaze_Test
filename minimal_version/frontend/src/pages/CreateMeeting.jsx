import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

export default function CreateMeeting() {
  const [formData, setFormData] = useState({
    title: '', agenda: '', type: 'offline', roomId: '', link: '', start: '', end: '', participants: ''
  });
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = {
      ...formData,
      participants: formData.participants.split(',').map(s => s.trim())
    };
    await api.post('/meetings', data);
    navigate('/');
  };

  return (
    <div className="bg-white p-6 rounded shadow max-w-lg mx-auto">
      <h2 className="text-xl font-bold mb-4">2. Create Meeting</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input className="border p-2" placeholder="Title" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required />
        <textarea className="border p-2" placeholder="Agenda" value={formData.agenda} onChange={e => setFormData({...formData, agenda: e.target.value})} />
        <select className="border p-2" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
          <option value="offline">Offline</option>
          <option value="online">Online</option>
        </select>
        {formData.type === 'offline' ? (
          <input className="border p-2" placeholder="Room ID" value={formData.roomId} onChange={e => setFormData({...formData, roomId: e.target.value})} />
        ) : (
          <input className="border p-2" placeholder="Meeting Link" value={formData.link} onChange={e => setFormData({...formData, link: e.target.value})} />
        )}
        <input className="border p-2" type="datetime-local" value={formData.start} onChange={e => setFormData({...formData, start: e.target.value})} required />
        <input className="border p-2" type="datetime-local" value={formData.end} onChange={e => setFormData({...formData, end: e.target.value})} required />
        <input className="border p-2" placeholder="Participants (comma separated IDs)" value={formData.participants} onChange={e => setFormData({...formData, participants: e.target.value})} />
        <button type="submit" className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700">Create</button>
      </form>
    </div>
  );
}

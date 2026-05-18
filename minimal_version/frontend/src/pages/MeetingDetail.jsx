import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';

export default function MeetingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [meeting, setMeeting] = useState(null);

  useEffect(() => {
    api.get('/meetings').then((res) => {
      const found = res.data.find(m => m.id === id);
      setMeeting(found);
    });
  }, [id]);

  const handleCancel = async () => {
    await api.put(`/meetings/${id}`, { status: 'Cancelled' });
    navigate('/');
  };

  if (!meeting) return <div>Loading...</div>;

  return (
    <div className="bg-white p-6 rounded shadow max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-2">4. Meeting Detail: {meeting.title}</h2>
      <div className="mb-4 text-sm text-gray-500">
        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded mr-2">{meeting.status}</span>
        <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded">{meeting.type}</span>
      </div>
      <p><strong>Agenda:</strong> {meeting.agenda}</p>
      <p><strong>Start:</strong> {new Date(meeting.start).toLocaleString()}</p>
      <p><strong>End:</strong> {new Date(meeting.end).toLocaleString()}</p>
      <p><strong>Participants:</strong> {meeting.participants?.join(', ')}</p>
      {meeting.type === 'offline' && <p><strong>Room ID:</strong> {meeting.roomId}</p>}
      {meeting.type === 'online' && <p><strong>Link:</strong> <a href={meeting.link} className="text-blue-500">{meeting.link}</a></p>}
      
      {meeting.status !== 'Cancelled' && (
        <button onClick={handleCancel} className="mt-4 bg-red-600 text-white p-2 rounded hover:bg-red-700">Cancel Meeting</button>
      )}
    </div>
  );
}

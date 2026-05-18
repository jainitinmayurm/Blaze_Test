import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';

export default function MeetingDetail() {
  // useParams allows us to grab the dynamic '/:id' part of the URL.
  // E.g., if we are on /meeting/123, id will be "123".
  const { id } = useParams();
  
  const navigate = useNavigate();
  
  // State to hold the specific meeting data
  const [meeting, setMeeting] = useState(null);

  useEffect(() => {
    // We fetch ALL meetings and then find the one that matches our ID.
    // In a real application, you would typically make an API call like `api.get('/meetings/' + id)` 
    // to just fetch the single meeting to save bandwidth.
    api.get('/meetings').then((res) => {
      const found = res.data.find(m => m.id === id);
      setMeeting(found);
    });
  }, [id]); // This effect re-runs if the URL 'id' changes

  // Function to handle cancelling the meeting
  const handleCancel = async () => {
    // We send a PUT request to update the status field of this specific meeting
    await api.put(`/meetings/${id}`, { status: 'Cancelled' });
    navigate('/'); // Send the user back to the dashboard
  };

  // If the data hasn't loaded yet, show a simple loading message
  if (!meeting) return <div>Loading...</div>;

  return (
    <div className="bg-white p-6 rounded shadow max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-2">4. Meeting Detail: {meeting.title}</h2>
      
      {/* Badges for status and type */}
      <div className="mb-4 text-sm text-gray-500">
        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded mr-2">{meeting.status}</span>
        <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded">{meeting.type}</span>
      </div>
      
      <p><strong>Agenda:</strong> {meeting.agenda}</p>
      <p><strong>Start:</strong> {new Date(meeting.start).toLocaleString()}</p>
      <p><strong>End:</strong> {new Date(meeting.end).toLocaleString()}</p>
      
      {/* Optional chaining (?.) is used here safely in case participants is undefined */}
      <p><strong>Participants:</strong> {meeting.participants?.join(', ')}</p>
      
      {/* Conditional rendering based on the meeting type */}
      {meeting.type === 'offline' && <p><strong>Room ID:</strong> {meeting.roomId}</p>}
      {meeting.type === 'online' && <p><strong>Link:</strong> <a href={meeting.link} className="text-blue-500">{meeting.link}</a></p>}
      
      {/* Only show the Cancel button if the meeting is not already cancelled */}
      {meeting.status !== 'Cancelled' && (
        <button onClick={handleCancel} className="mt-4 bg-red-600 text-white p-2 rounded hover:bg-red-700">Cancel Meeting</button>
      )}
    </div>
  );
}

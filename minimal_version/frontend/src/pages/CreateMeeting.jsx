import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

export default function CreateMeeting() {
  // We use a single state object to hold all the form fields.
  // This is cleaner than having 8 different useState variables.
  const [formData, setFormData] = useState({
    title: '', agenda: '', type: 'offline', roomId: '', link: '', start: '', end: '', participants: ''
  });
  
  const navigate = useNavigate();

  // This function is called when the user submits the form
  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent the browser from refreshing the page
    
    // Process the data before sending it to the backend
    const data = {
      ...formData,
      // Convert the comma-separated participants string into an actual array of strings, trimming extra whitespace
      participants: formData.participants.split(',').map(s => s.trim())
    };
    
    // Send a POST request to our minimal backend to create the meeting
    await api.post('/meetings', data);
    
    // Redirect the user back to the dashboard after successful creation
    navigate('/');
  };

  return (
    <div className="bg-white p-6 rounded shadow max-w-lg mx-auto">
      <h2 className="text-xl font-bold mb-4">2. Create Meeting</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        
        {/* Controlled Input: value is tied to state, onChange updates the state */}
        <input className="border p-2" placeholder="Title" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required />
        <textarea className="border p-2" placeholder="Agenda" value={formData.agenda} onChange={e => setFormData({...formData, agenda: e.target.value})} />
        
        {/* Dropdown to select offline vs online */}
        <select className="border p-2" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
          <option value="offline">Offline</option>
          <option value="online">Online</option>
        </select>
        
        {/* Conditional Rendering: Show Room ID if offline, otherwise show Meeting Link */}
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

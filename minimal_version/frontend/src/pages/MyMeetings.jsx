import { useState, useEffect } from 'react';
import api from '../api';
import { Link } from 'react-router-dom';

export default function MyMeetings() {
  const [meetings, setMeetings] = useState([]);

  useEffect(() => {
    // Assuming logged in user is ID '1'
    api.get('/meetings').then((res) => {
      const myMtgs = res.data.filter(m => m.participants.includes('1'));
      setMeetings(myMtgs);
    });
  }, []);

  return (
    <div className="bg-white p-6 rounded shadow max-w-4xl mx-auto">
      <h2 className="text-xl font-bold mb-4">5. My Meetings</h2>
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 border">Title</th>
            <th className="p-2 border">Date</th>
            <th className="p-2 border">Status</th>
            <th className="p-2 border">Action</th>
          </tr>
        </thead>
        <tbody>
          {meetings.map(m => (
            <tr key={m.id}>
              <td className="p-2 border">{m.title}</td>
              <td className="p-2 border">{new Date(m.start).toLocaleString()}</td>
              <td className="p-2 border">{m.status}</td>
              <td className="p-2 border text-blue-600 hover:underline">
                <Link to={`/meeting/${m.id}`}>View</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

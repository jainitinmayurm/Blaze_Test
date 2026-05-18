import { useState, useEffect } from 'react';
import api from '../api';
import { Link } from 'react-router-dom';

export default function MyMeetings() {
  const [meetings, setMeetings] = useState([]);

  useEffect(() => {
    // We assume the logged-in user has the ID '1' (Jai)
    // In a real application, this ID would come from your authentication context/token.
    api.get('/meetings').then((res) => {
      // Filter the meetings to only include ones where our user ID ('1') is in the participants array
      const myMtgs = res.data.filter(m => m.participants.includes('1'));
      setMeetings(myMtgs);
    });
  }, []);

  return (
    <div className="bg-white p-6 rounded shadow max-w-4xl mx-auto">
      <h2 className="text-xl font-bold mb-4">5. My Meetings</h2>
      
      {/* Simple HTML table to display tabular data clearly */}
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
                {/* Link component used instead of <a> tag to prevent full page reloads */}
                <Link to={`/meeting/${m.id}`}>View</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

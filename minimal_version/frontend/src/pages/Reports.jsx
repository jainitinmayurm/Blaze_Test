import { useState, useEffect } from 'react';
import api from '../api';

export default function Reports() {
  const [stats, setStats] = useState({ totalMeetings: 0, totalRooms: 0, cancelled: 0 });

  useEffect(() => {
    api.get('/reports').then(res => setStats(res.data));
  }, []);

  return (
    <div className="bg-white p-6 rounded shadow max-w-lg mx-auto">
      <h2 className="text-xl font-bold mb-6">7. Reports</h2>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-blue-50 border border-blue-200 p-4 rounded text-center">
          <div className="text-4xl font-bold text-blue-600">{stats.totalMeetings}</div>
          <div className="text-gray-600 mt-2">Total Meetings</div>
        </div>
        <div className="bg-green-50 border border-green-200 p-4 rounded text-center">
          <div className="text-4xl font-bold text-green-600">{stats.totalRooms}</div>
          <div className="text-gray-600 mt-2">Total Rooms</div>
        </div>
        <div className="bg-red-50 border border-red-200 p-4 rounded text-center col-span-2">
          <div className="text-4xl font-bold text-red-600">{stats.cancelled}</div>
          <div className="text-gray-600 mt-2">Cancelled Meetings</div>
        </div>
      </div>
    </div>
  );
}

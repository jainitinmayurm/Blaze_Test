import { useState, useEffect } from 'react';
import api from '../api';

export default function Reports() {
  // State for statistics fetched from the server
  // Initialized with 0s to prevent errors before data loads
  const [stats, setStats] = useState({ totalMeetings: 0, totalRooms: 0, cancelled: 0 });

  useEffect(() => {
    // The backend does the heavy lifting of calculating these numbers
    // Here we just fetch the aggregated object and set it to state
    api.get('/reports').then(res => setStats(res.data));
  }, []);

  return (
    <div className="bg-white p-6 rounded shadow max-w-lg mx-auto">
      <h2 className="text-xl font-bold mb-6">7. Reports</h2>
      
      {/* 
        Tailwind CSS Grid creates a layout with 2 columns.
        The last card uses col-span-2 to stretch across both columns.
      */}
      <div className="grid grid-cols-2 gap-4">
        
        {/* Total Meetings Card */}
        <div className="bg-blue-50 border border-blue-200 p-4 rounded text-center">
          <div className="text-4xl font-bold text-blue-600">{stats.totalMeetings}</div>
          <div className="text-gray-600 mt-2">Total Meetings</div>
        </div>
        
        {/* Total Rooms Card */}
        <div className="bg-green-50 border border-green-200 p-4 rounded text-center">
          <div className="text-4xl font-bold text-green-600">{stats.totalRooms}</div>
          <div className="text-gray-600 mt-2">Total Rooms</div>
        </div>
        
        {/* Cancelled Meetings Card (Spans full width) */}
        <div className="bg-red-50 border border-red-200 p-4 rounded text-center col-span-2">
          <div className="text-4xl font-bold text-red-600">{stats.cancelled}</div>
          <div className="text-gray-600 mt-2">Cancelled Meetings</div>
        </div>
        
      </div>
    </div>
  );
}

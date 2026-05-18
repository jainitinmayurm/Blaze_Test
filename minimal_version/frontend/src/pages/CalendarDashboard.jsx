import { useState, useEffect } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import api from '../api';
import { useNavigate } from 'react-router-dom';

// Configure the localizer for react-big-calendar using the moment library
// This tells the calendar how to format and handle dates
const localizer = momentLocalizer(moment);

export default function CalendarDashboard() {
  // State to hold our formatted meeting events
  const [events, setEvents] = useState([]);
  
  // React Router hook to programmatically navigate between pages
  const navigate = useNavigate();

  // useEffect runs when the component first mounts (because the dependency array [] is empty)
  useEffect(() => {
    // 1. Fetch meetings from our backend
    api.get('/meetings').then((res) => {
      // 2. Format the data to match what react-big-calendar expects
      const formatted = res.data.map(m => ({
        id: m.id,
        title: m.title,
        start: new Date(m.start), // Convert ISO string to native Date object
        end: new Date(m.end),     // Convert ISO string to native Date object
        resource: m               // Keep the original data around just in case
      }));
      // 3. Update the state to render the events
      setEvents(formatted);
    });
  }, []);

  return (
    <div className="bg-white p-6 rounded shadow" style={{ height: '80vh' }}>
      <h2 className="text-xl font-bold mb-4">1. Calendar Dashboard</h2>
      
      {/* 
        The Calendar component provided by react-big-calendar.
        It requires a localizer, an array of events, and accessors to know where the start/end dates are.
      */}
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: '100%' }}
        // When a user clicks an event on the calendar, navigate them to the detail page for that event
        onSelectEvent={(e) => navigate(`/meeting/${e.id}`)}
      />
    </div>
  );
}

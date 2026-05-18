import { useState, useEffect } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import api from '../api';
import { useNavigate } from 'react-router-dom';

const localizer = momentLocalizer(moment);

export default function CalendarDashboard() {
  const [events, setEvents] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/meetings').then((res) => {
      const formatted = res.data.map(m => ({
        id: m.id,
        title: m.title,
        start: new Date(m.start),
        end: new Date(m.end),
        resource: m
      }));
      setEvents(formatted);
    });
  }, []);

  return (
    <div className="bg-white p-6 rounded shadow" style={{ height: '80vh' }}>
      <h2 className="text-xl font-bold mb-4">1. Calendar Dashboard</h2>
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: '100%' }}
        onSelectEvent={(e) => navigate(`/meeting/${e.id}`)}
      />
    </div>
  );
}

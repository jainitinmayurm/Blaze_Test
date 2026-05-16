import { useState, useEffect, useCallback } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { formatDateTime } from '../utils/time';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const localizer = momentLocalizer(moment);

export default function CalendarDashboard() {
  const [events, setEvents] = useState([]);
  const [view, setView] = useState('month');
  const [date, setDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchEvents = useCallback(async (d, v) => {
    setLoading(true);
    try {
      const start = moment(d).startOf(v === 'agenda' ? 'month' : v).subtract(7, 'days');
      const end = moment(d).endOf(v === 'agenda' ? 'month' : v).add(7, 'days');
      const res = await api.get(`/calendar?from=${start.toISOString()}&to=${end.toISOString()}`);
      setEvents(res.data.map(e => ({
        id: e.id,
        title: e.title,
        start: new Date(e.start),
        end: new Date(e.end),
        type: e.type,
        status: e.status,
        resource: e,
      })));
    } catch (err) { console.error(err); }
    setLoading(false);
  }, []);

  useEffect(() => { fetchEvents(date, view); }, [date, view, fetchEvents]);

  const eventStyleGetter = (event) => {
    let bg = 'linear-gradient(135deg, #6366f1, #8b5cf6)';
    if (event.type === 'online') bg = 'linear-gradient(135deg, #0891b2, #22d3ee)';
    if (event.type === 'offline') bg = 'linear-gradient(135deg, #7c3aed, #a855f7)';
    if (event.status === 'Cancelled') bg = 'rgba(239,68,68,0.4)';
    return {
      style: {
        background: bg, border: 'none', borderRadius: '6px',
        fontSize: '0.75rem', padding: '2px 6px', fontWeight: 500,
        textDecoration: event.status === 'Cancelled' ? 'line-through' : 'none',
      },
    };
  };

  const handleSelectEvent = (event) => navigate(`/meetings/${event.id}`);
  const handleNavigate = (d) => setDate(d);
  const handleViewChange = (v) => setView(v);

  const handleSelectSlot = (slotInfo) => {
    const start = slotInfo.start.toISOString();
    const end = slotInfo.end.toISOString();
    navigate(`/meetings/new?start=${start}&end=${end}`);
  };

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>Calendar Dashboard</h1>
          <p>View and manage your meetings across day, week, and month views</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/meetings/new')}>+ New Meeting</button>
      </div>

      <div className="card" style={{ padding: '16px', minHeight: '600px' }}>
        {loading && <div className="loading-center"><div className="spinner" /></div>}
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          view={view}
          date={date}
          onNavigate={handleNavigate}
          onView={handleViewChange}
          onSelectEvent={handleSelectEvent}
          selectable
          onSelectSlot={handleSelectSlot}
          eventPropGetter={eventStyleGetter}
          views={['month', 'week', 'day']}
          style={{ height: 600 }}
          popup
          step={30}
          timeslots={2}
        />
      </div>
    </div>
  );
}

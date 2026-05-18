import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import CalendarDashboard from './pages/CalendarDashboard';
import CreateMeeting from './pages/CreateMeeting';
import SlotPicker from './pages/SlotPicker';
import MeetingDetail from './pages/MeetingDetail';
import MyMeetings from './pages/MyMeetings';
import MeetingRoomsAdmin from './pages/MeetingRoomsAdmin';
import Reports from './pages/Reports';

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex bg-slate-50 min-h-screen">
        <Sidebar />
        <div className="flex-1 p-8">
          <Routes>
            <Route path="/" element={<CalendarDashboard />} />
            <Route path="/create-meeting" element={<CreateMeeting />} />
            <Route path="/slot-picker" element={<SlotPicker />} />
            <Route path="/meeting/:id" element={<MeetingDetail />} />
            <Route path="/my-meetings" element={<MyMeetings />} />
            <Route path="/rooms" element={<MeetingRoomsAdmin />} />
            <Route path="/reports" element={<Reports />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

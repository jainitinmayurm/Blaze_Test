// 1. Import necessary components from React Router for navigation
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// 2. Import our custom components and pages
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
    // BrowserRouter is the wrapper that enables client-side routing
    <BrowserRouter>
      {/* Main layout container using Tailwind classes for a full height flex layout */}
      <div className="flex bg-slate-50 min-h-screen">
        
        {/* The Sidebar component will be visible on all pages */}
        <Sidebar />
        
        {/* Main content area where our different pages will be rendered */}
        <div className="flex-1 p-8">
          
          {/* The Routes component acts like a switch statement for URLs */}
          <Routes>
            {/* Each Route maps a specific URL path to a React component */}
            <Route path="/" element={<CalendarDashboard />} />
            <Route path="/create-meeting" element={<CreateMeeting />} />
            <Route path="/slot-picker" element={<SlotPicker />} />
            
            {/* The :id syntax means this route takes a dynamic parameter (e.g., /meeting/123) */}
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

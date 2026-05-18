import { Link } from 'react-router-dom';

export default function Sidebar() {
  return (
    <div className="w-64 bg-slate-900 text-white min-h-screen p-4 flex flex-col gap-4">
      <h1 className="text-2xl font-bold mb-8">Blaze Minimal</h1>
      <Link to="/" className="hover:bg-slate-800 p-2 rounded">1. Calendar Dashboard</Link>
      <Link to="/create-meeting" className="hover:bg-slate-800 p-2 rounded">2. Create Meeting</Link>
      <Link to="/slot-picker" className="hover:bg-slate-800 p-2 rounded">3. Slot Picker</Link>
      <Link to="/my-meetings" className="hover:bg-slate-800 p-2 rounded">5. My Meetings</Link>
      <Link to="/rooms" className="hover:bg-slate-800 p-2 rounded">6. Meeting Rooms</Link>
      <Link to="/reports" className="hover:bg-slate-800 p-2 rounded">7. Reports</Link>
    </div>
  );
}

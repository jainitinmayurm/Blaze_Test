import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiCalendar, FiPlusCircle, FiList, FiGrid, FiBarChart2, FiLogOut, FiHome } from 'react-icons/fi';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };
  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?';

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon">B</div>
        <div>
          <h1>Blaze</h1>
          <span>Meeting Booking</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        <NavLink to="/" end><FiHome /> Dashboard</NavLink>
        <NavLink to="/calendar"><FiCalendar /> Calendar</NavLink>
        <NavLink to="/meetings/new"><FiPlusCircle /> New Meeting</NavLink>
        <NavLink to="/my-meetings"><FiList /> My Meetings</NavLink>
        {user?.role === 'admin' && (
          <NavLink to="/rooms"><FiGrid /> Room Management</NavLink>
        )}
        <NavLink to="/reports"><FiBarChart2 /> Reports</NavLink>
        <div style={{ flex: 1 }} />
        <button onClick={handleLogout}><FiLogOut /> Sign Out</button>
      </nav>

      <div className="sidebar-user">
        <div className="avatar">{initials}</div>
        <div className="user-info">
          <div className="user-name">{user?.name}</div>
          <div className="user-role">{user?.role}</div>
        </div>
      </div>
    </aside>
  );
}

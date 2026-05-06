import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  HiOutlineViewGrid,
  HiOutlineOfficeBuilding,
  HiOutlineCalendar,
  HiOutlineChartBar,
  HiOutlineUserGroup,
  HiOutlineCog,
  HiOutlineTicket,
  HiOutlineLogout,
  HiOutlinePlus,
} from 'react-icons/hi';
import './Sidebar.css';

const Sidebar = ({ isOpen, onClose }) => {
  const { user, isAdmin, isManager, isTrainer, logout } = useAuth();
  const location = useLocation();

  const navItems = [
    {
      path: '/dashboard',
      label: 'Dashboard',
      icon: <HiOutlineViewGrid />,
      roles: ['Admin', 'Arena Manager', 'Trainer', 'Player'],
    },
    {
      path: '/arenas',
      label: 'Arenas',
      icon: <HiOutlineOfficeBuilding />,
      roles: ['Admin', 'Arena Manager', 'Trainer', 'Player'],
    },
    {
      path: '/schedules',
      label: 'Schedules',
      icon: <HiOutlineCalendar />,
      roles: ['Admin', 'Arena Manager'],
    },
    {
      path: '/bookings',
      label: 'Bookings',
      icon: <HiOutlineTicket />,
      roles: ['Admin', 'Arena Manager', 'Player'],
    },
    {
      path: '/trainer-requests',
      label: 'Trainer Requests',
      icon: <HiOutlineTicket />,
      roles: ['Trainer'],
    },

    {
      path: '/analytics',
      label: 'Analytics',
      icon: <HiOutlineChartBar />,
      roles: ['Admin', 'Arena Manager'],
    },
    {
      path: '/members',
      label: 'Members',
      icon: <HiOutlineUserGroup />,
      roles: ['Admin'],
    },
    {
      path: '/settings',
      label: 'Settings',
      icon: <HiOutlineCog />,
      roles: ['Admin', 'Arena Manager', 'Trainer', 'Player'],
    },
  ];

  const filteredItems = navItems.filter(item =>
    item.roles.includes(user?.role)
  );

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && <div className="sidebar-overlay" onClick={onClose} />}

      <aside className={`sidebar ${isOpen ? 'sidebar--open' : ''}`}>
        {/* Logo */}
        <NavLink to="/dashboard" className="sidebar__logo" onClick={onClose} style={{ textDecoration: 'none' }}>
          <div className="sidebar__logo-icon">
            <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M16 2L28 8V24L16 30L4 24V8L16 2Z" fill="var(--accent-primary)" opacity="0.9"/>
              <path d="M16 8L22 11V19L16 22L10 19V11L16 8Z" fill="var(--bg-primary)" opacity="0.8"/>
              <circle cx="16" cy="15" r="3" fill="var(--accent-primary)"/>
            </svg>
          </div>
          <span className="sidebar__logo-text">KINETIC STADIUM</span>
        </NavLink>

        {/* Navigation */}
        <nav className="sidebar__nav">
          {filteredItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`
              }
              onClick={onClose}
            >
              <span className="sidebar__link-icon">{item.icon}</span>
              <span className="sidebar__link-label">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Book New Session CTA */}
        {(user?.role === 'Player') && (
          <div className="sidebar__cta">
            <NavLink to="/arenas" className="sidebar__cta-btn" onClick={onClose}>
              <HiOutlinePlus />
              Book New Session
            </NavLink>
          </div>
        )}

        {/* Logout */}
        <div className="sidebar__footer">
          <button className="sidebar__logout" onClick={logout}>
            <HiOutlineLogout />
            <span>Log Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;

import { useAuth } from '../../context/AuthContext';
import { HiOutlineSearch, HiOutlineBell, HiOutlineMenu } from 'react-icons/hi';
import { useNavigate } from 'react-router-dom';
import './Topbar.css';

const Topbar = ({ onMenuToggle }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <header className="topbar">
      <div className="topbar__left">
        <button className="topbar__menu-btn" onClick={onMenuToggle}>
          <HiOutlineMenu />
        </button>
      </div>

      <div className="topbar__center">
        <div className="topbar__search">
          <HiOutlineSearch className="topbar__search-icon" />
          <input
            type="text"
            placeholder="Search Arenas..."
            className="topbar__search-input"
          />
        </div>
      </div>

      <div className="topbar__right">
        <button className="topbar__notification">
          <HiOutlineBell />
          <span className="topbar__notification-dot" />
        </button>

        <div className="topbar__profile" onClick={() => navigate('/profile')}>
          {user?.profile_image ? (
            <img
              src={user.profile_image}
              alt={user.name}
              className="topbar__avatar-img"
            />
          ) : (
            <div className="topbar__avatar">
              {getInitials(user?.name)}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Topbar;

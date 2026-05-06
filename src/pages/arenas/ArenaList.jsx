import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import API from '../../api/axios';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { HiOutlineLocationMarker, HiOutlineCurrencyDollar, HiOutlinePlus, HiOutlineSearch, HiOutlineFilter, HiOutlinePencil, HiOutlineEye } from 'react-icons/hi';
import './Arenas.css';

const ArenaList = () => {
  const { isAdmin, isManager } = useAuth();
  const navigate = useNavigate();
  const [arenas, setArenas] = useState([]);
  const [filteredArenas, setFilteredArenas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sportFilter, setSportFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchArenas();
  }, []);

  useEffect(() => {
    let result = arenas;
    if (search) {
      result = result.filter(a =>
        a.arena_name.toLowerCase().includes(search.toLowerCase()) ||
        a.location.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (sportFilter) {
      result = result.filter(a => a.sport_type?.includes(sportFilter));
    }
    if (statusFilter) {
      result = result.filter(a => a.status === statusFilter);
    }
    setFilteredArenas(result);
  }, [search, sportFilter, statusFilter, arenas]);

  const fetchArenas = async () => {
    try {
      const res = await API.get('/arenas');
      setArenas(res.data.data || []);
      setFilteredArenas(res.data.data || []);
    } catch (err) {
      console.error('Error fetching arenas:', err);
    } finally {
      setLoading(false);
    }
  };

  const allSports = [...new Set(arenas.flatMap(a => a.sport_type || []))].sort();

  if (loading) return <LoadingSpinner text="Loading arenas..." />;

  return (
    <div className="arenas-page">
      <div className="arenas-page__header">
        <div>
          <h1 className="arenas-page__title">ARENAS</h1>
          <p className="arenas-page__subtitle">{filteredArenas.length} venues available</p>
        </div>
        {(isAdmin || isManager) && (
          <Link to="/arenas/create" className="btn btn-primary">
            <HiOutlinePlus /> Add Arena
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="arenas-filters">
        <div className="arenas-filters__search">
          <HiOutlineSearch className="arenas-filters__search-icon" />
          <input
            type="text"
            placeholder="Search by name or location..."
            className="form-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: '2.5rem' }}
          />
        </div>
        <select className="form-select" value={sportFilter} onChange={(e) => setSportFilter(e.target.value)}>
          <option value="">All Sports</option>
          {allSports.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select className="form-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All Status</option>
          <option value="Available">Available</option>
          <option value="Under Maintenance">Under Maintenance</option>
          <option value="Unavailable">Unavailable</option>
        </select>
      </div>

      {/* Arena Grid */}
      {filteredArenas.length > 0 ? (
        <div className="arenas-grid">
          {filteredArenas.map((arena, index) => (
            <div
              key={arena._id}
              className="arena-card card-hover"
              style={{ animationDelay: `${index * 0.06}s`, cursor: 'pointer' }}
              onClick={() => navigate(`/arenas/${arena._id}`)}
            >
              <div className="arena-card__image">
                {arena.thumbnail_image || arena.images?.[0] ? (
                  <img src={arena.thumbnail_image || arena.images[0]} alt={arena.arena_name} />
                ) : (
                  <div className="arena-card__placeholder">
                    <HiOutlineOfficeBuilding />
                  </div>
                )}
                <div className="arena-card__overlay">
                  <span className={`badge ${arena.status === 'Available' ? 'badge-success' : arena.status === 'Under Maintenance' ? 'badge-warning' : 'badge-error'}`}>
                    {arena.status}
                  </span>
                </div>
                {/* Edit button overlay for managers/admins */}
                {(isAdmin || isManager) && (
                  <div className="arena-card__edit-overlay">
                    <Link
                      to={`/arenas/edit/${arena._id}`}
                      className="arena-card__edit-btn"
                      onClick={(e) => e.stopPropagation()}
                      title="Edit Arena"
                    >
                      <HiOutlinePencil />
                      Edit
                    </Link>
                  </div>
                )}
              </div>
              <div className="arena-card__body">
                <h3 className="arena-card__name">{arena.arena_name}</h3>
                <div className="arena-card__location">
                  <HiOutlineLocationMarker />
                  <span>{arena.location}</span>
                </div>
                <div className="arena-card__sports">
                  {arena.sport_type?.slice(0, 3).map(sport => (
                    <span key={sport} className="arena-card__sport-tag">{sport}</span>
                  ))}
                  {arena.sport_type?.length > 3 && (
                    <span className="arena-card__sport-tag arena-card__sport-more">+{arena.sport_type.length - 3}</span>
                  )}
                </div>
                <div className="arena-card__footer">
                  <div className="arena-card__price">
                    <HiOutlineCurrencyDollar />
                    <span>₹{arena.price_per_hour}<small>/hr</small></span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {arena.capacity && (
                      <span className="arena-card__capacity">{arena.capacity} cap</span>
                    )}
                    <Link
                      to={`/arenas/${arena._id}`}
                      className="btn btn-sm btn-ghost arena-card__view-btn"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <HiOutlineEye /> View
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="arenas-empty card">
          <HiOutlineFilter style={{ fontSize: '2.5rem', color: 'var(--text-muted)', marginBottom: 'var(--space-3)' }} />
          <p style={{ color: 'var(--text-secondary)' }}>No arenas match your filters</p>
        </div>
      )}
    </div>
  );
};

// HiOutlineOfficeBuilding placeholder for card
const HiOutlineOfficeBuilding = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="48" height="48">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
  </svg>
);

export default ArenaList;

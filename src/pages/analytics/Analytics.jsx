import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import API from '../../api/axios';
import StatsCard from '../../components/common/StatsCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { HiOutlineChartBar, HiOutlineTrendingUp, HiOutlineCurrencyDollar, HiOutlineCalendar } from 'react-icons/hi';
import './Analytics.css';

const Analytics = () => {
  const { isAdmin, isManager } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [arenas, setArenas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [bRes, aRes] = await Promise.allSettled([API.get('/bookings'), API.get('/arenas')]);
      if (bRes.status === 'fulfilled') setBookings(bRes.value.data.data || []);
      if (aRes.status === 'fulfilled') setArenas(aRes.value.data.data || []);
    } catch {} finally { setLoading(false); }
  };

  if (loading) return <LoadingSpinner text="Loading analytics..." />;

  const totalRevenue = bookings.reduce((s, b) => s + (b.total_amount || 0), 0);
  const confirmed = bookings.filter(b => b.booking_status === 'Confirmed').length;
  const pending = bookings.filter(b => b.booking_status === 'Pending').length;
  const cancelled = bookings.filter(b => b.booking_status === 'Cancelled').length;
  const conversionRate = bookings.length > 0 ? ((confirmed / bookings.length) * 100).toFixed(1) : 0;

  // Revenue by arena
  const revenueByArena = {};
  bookings.forEach(b => {
    const name = b.arena_id?.arena_name || 'Unknown';
    revenueByArena[name] = (revenueByArena[name] || 0) + (b.total_amount || 0);
  });
  const topArenas = Object.entries(revenueByArena).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const maxRevenue = topArenas.length > 0 ? topArenas[0][1] : 1;

  return (
    <div className="analytics-page">
      <h1 className="analytics-page__title">ANALYTICS</h1>

      <div className="dashboard__stats">
        <StatsCard title="Total Revenue" value={`₹${totalRevenue.toLocaleString()}`} icon={<HiOutlineCurrencyDollar />} />
        <StatsCard title="Total Bookings" value={bookings.length.toString()} icon={<HiOutlineCalendar />} />
        <StatsCard title="Conversion Rate" value={`${conversionRate}%`} icon={<HiOutlineTrendingUp />} />
        <StatsCard title="Active Arenas" value={arenas.length.toString()} icon={<HiOutlineChartBar />} />
      </div>

      <div className="analytics-grid">
        {/* Booking Status Breakdown */}
        <div className="card">
          <h3 className="dashboard__section-title" style={{ marginBottom: 'var(--space-6)' }}>BOOKING STATUS</h3>
          <div className="analytics-donut">
            <div className="analytics-donut__chart">
              <svg viewBox="0 0 36 36" className="analytics-donut__svg">
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="var(--border-primary)" strokeWidth="3" />
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="var(--color-success)" strokeWidth="3"
                  strokeDasharray={`${(confirmed / Math.max(bookings.length, 1)) * 100} ${100 - (confirmed / Math.max(bookings.length, 1)) * 100}`} strokeDashoffset="25" strokeLinecap="round" />
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="var(--color-warning)" strokeWidth="3"
                  strokeDasharray={`${(pending / Math.max(bookings.length, 1)) * 100} ${100 - (pending / Math.max(bookings.length, 1)) * 100}`}
                  strokeDashoffset={`${25 - (confirmed / Math.max(bookings.length, 1)) * 100}`} strokeLinecap="round" />
              </svg>
              <div className="analytics-donut__center">
                <span className="analytics-donut__total">{bookings.length}</span>
                <span className="analytics-donut__label">Total</span>
              </div>
            </div>
            <div className="analytics-donut__legend">
              <div className="legend-item"><span className="legend-dot" style={{ background: 'var(--color-success)' }} /> Confirmed ({confirmed})</div>
              <div className="legend-item"><span className="legend-dot" style={{ background: 'var(--color-warning)' }} /> Pending ({pending})</div>
              <div className="legend-item"><span className="legend-dot" style={{ background: 'var(--color-error)' }} /> Cancelled ({cancelled})</div>
            </div>
          </div>
        </div>

        {/* Top Arenas */}
        <div className="card">
          <h3 className="dashboard__section-title" style={{ marginBottom: 'var(--space-6)' }}>TOP ARENAS BY REVENUE</h3>
          <div className="analytics-bars">
            {topArenas.map(([name, revenue], i) => (
              <div key={name} className="analytics-bar-item" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="analytics-bar-info">
                  <span className="analytics-bar-name">{name}</span>
                  <span className="analytics-bar-value">₹{revenue.toLocaleString()}</span>
                </div>
                <div className="analytics-bar-track">
                  <div className="analytics-bar-fill" style={{ width: `${(revenue / maxRevenue) * 100}%` }} />
                </div>
              </div>
            ))}
            {topArenas.length === 0 && <p className="text-muted">No data yet</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;

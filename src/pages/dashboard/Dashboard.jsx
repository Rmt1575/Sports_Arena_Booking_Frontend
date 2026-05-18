import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import API from '../../api/axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import StatsCard from '../../components/common/StatsCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { 
  HiOutlineTicket, 
  HiOutlineCurrencyDollar, 
  HiOutlineUserGroup, 
  HiOutlineOfficeBuilding, 
  HiOutlineEye, 
  HiOutlineArrowRight,
  HiOutlineFire,
  HiOutlineLocationMarker,
  HiOutlineStar
} from 'react-icons/hi';
import './Dashboard.css';

const Dashboard = () => {
  const { user, isAdmin, isManager, isTrainer, isPlayer } = useAuth();
  const [stats, setStats] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [allArenas, setAllArenas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [allBookings, setAllBookings] = useState([]);
  const [chartFilter, setChartFilter] = useState('Daily');
  const [selectedSport, setSelectedSport] = useState('');
  
  const [showReportPreview, setShowReportPreview] = useState(false);
  const [reportPdfUrl, setReportPdfUrl] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportStartDate, setReportStartDate] = useState('');
  const [reportEndDate, setReportEndDate] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Helpers for Chart and Stats
  const getBookingDate = (b) => {
    if (b.slot_id && b.slot_id.date) return new Date(b.slot_id.date);
    return new Date(b.createdAt || b.booking_date);
  };

  const getBookingRevenue = (b) => {
    if (isTrainer) return (b.duration || 1) * (user?.fee_per_session || 0);
    return b.total_amount || 0;
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const promises = [];

      // Fetch bookings
      if (isAdmin || isManager) {
        promises.push(API.get('/bookings'));
      } else {
        promises.push(API.get('/bookings/my'));
      }

      // Fetch arenas
      promises.push(API.get('/arenas'));

      let userIndex = -1;
      if (isAdmin) {
        userIndex = promises.length;
        promises.push(API.get('/users/getallusers'));
      }

      const results = await Promise.allSettled(promises);

      const bookingData = results[0]?.status === 'fulfilled' ? results[0].value.data.data : [];
      const arenaData = results[1]?.status === 'fulfilled' ? results[1].value.data.data : [];
      const userData = (userIndex !== -1 && results[userIndex]?.status === 'fulfilled') ? results[userIndex].value.data.data : [];

      setAllBookings(bookingData || []);
      setBookings(bookingData?.slice(0, 5) || []);
      setAllArenas(arenaData || []);

      // Calculate stats based on role
      if (isPlayer) {
        const totalBookings = bookingData?.length || 0;
        const upcomingBookings = bookingData?.filter(b => b.booking_status === 'Confirmed' || b.booking_status === 'Pending').length || 0;
        const totalSpent = bookingData?.filter(b => b.booking_status === 'Confirmed').reduce((sum, b) => sum + (b.total_amount || 0), 0) || 0;
        
        setStats({
          totalBookings,
          upcomingBookings,
          totalSpent,
          favoriteSport: user?.preferred_sport || 'None'
        });
      } else {
        const totalBookings = bookingData?.length || 0;
        const confirmedBookings = bookingData?.filter(b => b.booking_status === 'Confirmed').length || 0;
        const totalRevenue = bookingData?.filter(b => b.booking_status === 'Confirmed').reduce((sum, b) => {
          let rev = b.total_amount || 0;
          if (isTrainer) rev = (b.duration || 1) * (user?.fee_per_session || 0);
          return sum + rev;
        }, 0) || 0;
        const totalArenas = arenaData?.length || 0;
        
        let activeMembers = confirmedBookings;
        if (isAdmin) {
          activeMembers = userData.filter(u => u.status === 'Active').length || userData.length;
        }
  
        setStats({
          totalBookings,
          confirmedBookings,
          activeMembers,
          totalRevenue,
          totalArenas,
        });
      }
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const map = {
      Confirmed: 'badge-success',
      Pending: 'badge-warning',
      Rejected: 'badge-error',
      Cancelled: 'badge-error',
    };
    return map[status] || 'badge-info';
  };

  const handleGenerateReport = async (e) => {
    e.preventDefault();
    if (!reportStartDate || !reportEndDate) {
      alert("Please select both start and end dates.");
      return;
    }
    
    setIsGenerating(true);
    
    try {
      const start = new Date(reportStartDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(reportEndDate);
      end.setHours(23, 59, 59, 999);

      const reportBookings = allBookings.filter(b => {
        const bd = getBookingDate(b);
        return bd >= start && bd <= end;
      });

      // Calculate stats for the report
      let reportStats = {
        totalBookings: reportBookings.length,
        totalRevenue: reportBookings.filter(b => b.booking_status === 'Confirmed').reduce((sum, b) => sum + getBookingRevenue(b), 0),
        confirmedBookings: reportBookings.filter(b => b.booking_status === 'Confirmed').length
      };

      if (isAdmin) {
         try {
           const usersRes = await API.get('/users/getallusers');
           const allUsers = usersRes.data.data || [];
           reportStats.activeMembers = allUsers.filter(u => u.status === 'Active').length || allUsers.length;
         } catch (e) {
           reportStats.activeMembers = 0;
         }
      }

      const doc = new jsPDF();
      
      // Add title
      doc.setFontSize(22);
      doc.setTextColor(40);
      doc.text("Weekly Performance Report", 14, 22);
      
      // Add Metadata
      doc.setFontSize(11);
      doc.setTextColor(100);
      doc.text(`Generated By: ${user?.name || 'User'} (${user?.role || 'Unknown'})`, 14, 32);
      doc.text(`Period: ${new Date(reportStartDate).toLocaleDateString()} to ${new Date(reportEndDate).toLocaleDateString()}`, 14, 38);
      
      // Add Stats Summary
      doc.setFontSize(16);
      doc.setTextColor(40);
      doc.text("Stats Summary", 14, 52);
      doc.setFontSize(12);
      doc.setTextColor(80);
      
      let currentY = 62;
      if (isAdmin || isManager || isTrainer) {
         doc.text(`Total Bookings: ${reportStats.totalBookings || 0}`, 14, currentY);
         currentY += 8;
         doc.text(`Revenue: Rs. ${reportStats.totalRevenue || 0}`, 14, currentY);
         currentY += 8;
         doc.text(`${isAdmin ? 'Active Members' : 'Confirmed'}: ${isAdmin ? (reportStats.activeMembers || 0) : (reportStats.confirmedBookings || 0)}`, 14, currentY);
         currentY += 15;
      }
      
      // Add Recent Bookings Table
      doc.setFontSize(16);
      doc.setTextColor(40);
      doc.text("Bookings Log", 14, currentY);
      currentY += 8;
      
      const tableColumn = ["Date", isAdmin || isManager ? "Player / Team" : "Arena", "Venue", "Time Slot", "Amount", "Status"];
      const tableRows = [];
      
      reportBookings.forEach(booking => {
          const date = getBookingDate(booking).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
          const playerName = isAdmin || isManager 
              ? (booking.user_id?.name || 'Unknown') 
              : (booking.arena_id?.arena_name || 'Arena');
          const venue = booking.arena_id?.arena_name || 'N/A';
          const timeSlot = booking.slot_id 
                           ? `${booking.slot_id.start_time} - ${booking.slot_id.end_time}` 
                           : `${booking.duration || 1} ${booking.booking_type || 'Session'}(s)`;
          const amount = `Rs. ${getBookingRevenue(booking).toLocaleString()}`;
          const status = booking.booking_status || 'N/A';
          
          tableRows.push([date, playerName, venue, timeSlot, amount, status]);
      });
      
      autoTable(doc, {
          head: [tableColumn],
          body: tableRows,
          startY: currentY,
          theme: 'grid',
          styles: { 
            fontSize: 10, 
            cellPadding: 5,
            textColor: [60, 60, 60],
            font: 'helvetica'
          },
          headStyles: { 
            fillColor: [232, 97, 45], 
            textColor: [255, 255, 255], 
            fontStyle: 'bold',
            halign: 'center'
          },
          columnStyles: {
            0: { fontStyle: 'bold', textColor: [40, 40, 40] }, // Date
            4: { halign: 'right', fontStyle: 'bold', textColor: [40, 150, 80] }, // Amount
            5: { halign: 'center' } // Status
          },
          alternateRowStyles: {
            fillColor: [248, 249, 250]
          }
      });
      
      const pdfBlobUrl = doc.output('bloburl');
      setReportPdfUrl(pdfBlobUrl);
      setShowReportPreview(true);
      setShowReportModal(false); // Close modal
    } catch (err) {
      console.error("Error generating report:", err);
      alert("Failed to generate report.");
    } finally {
      setIsGenerating(false);
    }
  };

  if (loading) return <LoadingSpinner text="Loading dashboard..." />;

  if (showReportModal) {
    return (
      <div className="report-preview-container">
        <div className="card" style={{ maxWidth: '500px', margin: '100px auto', padding: '2rem', background: 'var(--surface-color)', position: 'relative', zIndex: 1000 }}>
          <h2 style={{ marginBottom: '1.5rem', color: 'var(--text-primary)' }}>Generate Weekly Report</h2>
          <form onSubmit={handleGenerateReport}>
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Week Start Date (Monday)</label>
              <input 
                type="date" 
                className="form-input" 
                value={reportStartDate} 
                onChange={(e) => setReportStartDate(e.target.value)} 
                required 
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-color)', color: 'var(--text-primary)' }}
              />
            </div>
            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Week End Date (Sunday)</label>
              <input 
                type="date" 
                className="form-input" 
                value={reportEndDate} 
                onChange={(e) => setReportEndDate(e.target.value)} 
                required 
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-color)', color: 'var(--text-primary)' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowReportModal(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={isGenerating}>
                {isGenerating ? 'Generating...' : 'Generate PDF'}
              </button>
            </div>
          </form>
        </div>
        <div className="modal-backdrop" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 999 }} onClick={() => setShowReportModal(false)}></div>
      </div>
    );
  }

  if (showReportPreview) {
    return (
      <div className="report-preview-container">
        <div className="report-preview-header">
          <h1 className="report-preview-title">Report Preview</h1>
          <div className="report-preview-actions">
            <button className="btn btn-secondary" onClick={() => setShowReportPreview(false)}>
              Back to Dashboard
            </button>
            <button className="btn btn-primary" onClick={() => {
              const a = document.createElement('a');
              a.href = reportPdfUrl;
              a.download = 'Weekly_Report.pdf';
              a.click();
            }}>
              Download PDF
            </button>
          </div>
        </div>
        <iframe src={reportPdfUrl} className="report-preview-frame" title="Report Preview"></iframe>
      </div>
    );
  }

  // All unique sports present in arenas
  const allSports = [...new Set(allArenas.flatMap(a => a.sport_type || []))].sort();

  // Sport emoji map
  const SPORT_EMOJI = {
    Cricket: String.fromCodePoint(0x1F3CF),
    Football: '\u26BD',
    Badminton: String.fromCodePoint(0x1F3F8),
    Tennis: String.fromCodePoint(0x1F3BE),
    Basketball: String.fromCodePoint(0x1F3C0),
    Volleyball: String.fromCodePoint(0x1F3D0),
    'Table Tennis': String.fromCodePoint(0x1F3D3),
    Hockey: String.fromCodePoint(0x1F3D1),
    Swimming: String.fromCodePoint(0x1F3CA),
    Boxing: String.fromCodePoint(0x1F94A),
    Yoga: String.fromCodePoint(0x1F9D8),
    Kabaddi: String.fromCodePoint(0x1F93C),
    Golf: '\u26F3',
    Futsal: '\u26BD',
    Skating: '\u26F8',
    Athletics: String.fromCodePoint(0x1F3C3),
    Gymnastics: String.fromCodePoint(0x1F938),
    Archery: String.fromCodePoint(0x1F3F9),
    Cycling: String.fromCodePoint(0x1F6B4),
    Rugby: String.fromCodePoint(0x1F3C9),
    Squash: String.fromCodePoint(0x1F3BE),
    Wrestling: String.fromCodePoint(0x1F93C),
    Pickleball: String.fromCodePoint(0x1F3F8),
  };

  // Arenas filtered by selected sport chip (live)
  const displayedArenas = allArenas
    .filter(a => !selectedSport || a.sport_type?.includes(selectedSport))
    .slice(0, 6);

  // Chart Logic
  const getChartData = () => {
    const confirmedBookings = allBookings.filter(b => b.booking_status === 'Confirmed');
    const now = new Date();
    
    if (chartFilter === 'Daily') {
      const days = [];
      const data = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        days.push(d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase());
        
        const sum = confirmedBookings.filter(b => {
          const bd = getBookingDate(b);
          return bd.getDate() === d.getDate() && bd.getMonth() === d.getMonth() && bd.getFullYear() === d.getFullYear();
        }).reduce((acc, b) => acc + getBookingRevenue(b), 0);
        
        data.push(sum);
      }
      return { labels: days, data };
    } else if (chartFilter === 'Weekly') {
      const labels = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
      const data = [0, 0, 0, 0];
      for (let i = 0; i < 4; i++) {
        const endDay = new Date(now);
        endDay.setDate(endDay.getDate() - (i * 7));
        const startDay = new Date(now);
        startDay.setDate(startDay.getDate() - ((i + 1) * 7));
        
        data[3 - i] = confirmedBookings.filter(b => {
          const bd = getBookingDate(b);
          return bd > startDay && bd <= endDay;
        }).reduce((acc, b) => acc + getBookingRevenue(b), 0);
      }
      return { labels, data };
    } else if (chartFilter === 'Monthly') {
      const labels = [];
      const data = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        labels.push(d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase());
        
        const sum = confirmedBookings.filter(b => {
          const bd = getBookingDate(b);
          return bd.getMonth() === d.getMonth() && bd.getFullYear() === d.getFullYear();
        }).reduce((acc, b) => acc + getBookingRevenue(b), 0);
        data.push(sum);
      }
      return { labels, data };
    }
    return { labels: [], data: [] };
  };

  const chartInfo = getChartData();
  const maxRevenue = Math.max(...chartInfo.data, 1);
  const chartHeights = chartInfo.data.map(val => Math.max((val / maxRevenue) * 100, 5));

  return (
    <div className="dashboard">
      {/* Page Header */}
      <div className="dashboard__header">
        <div>
          <h1 className="dashboard__title">{isPlayer ? 'PLAYER DASHBOARD' : 'DASHBOARD'}</h1>
          <div className="dashboard__status">
            <span className="dashboard__status-dot" />
            LIVE STADIUM OPERATIONS: ACTIVE
          </div>
        </div>
        <div className="dashboard__actions">
          {isPlayer ? (
            <Link to="/arenas" className="btn btn-primary">
              <HiOutlineEye /> Explore Arenas
            </Link>
          ) : (
            <>
              <button className="btn btn-secondary" onClick={() => setShowReportModal(true)}>Generate Report</button>
              <Link to="/arenas" className="btn btn-primary">
                <HiOutlineEye /> Live View
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="dashboard__stats">
        {isPlayer ? (
          <>
            <StatsCard
              title="Total Sessions"
              value={stats?.totalBookings?.toString()}
              change="+1 this week"
              changeType="positive"
              icon={<HiOutlineTicket />}
            />
            <StatsCard
              title="Upcoming Matches"
              value={stats?.upcomingBookings?.toString()}
              change="Ready to play"
              changeType="neutral"
              icon={<HiOutlineFire />}
            />
            <StatsCard
              title="Favorite Sport"
              value={stats?.favoriteSport}
              change="Top tier!"
              changeType="positive"
              icon={<HiOutlineStar />}
            />
            <StatsCard
              title="Total Spent"
              value={`₹${(stats?.totalSpent || 0).toLocaleString()}`}
              change="Value generated"
              changeType="neutral"
              icon={<HiOutlineCurrencyDollar />}
            />
          </>
        ) : (
          <>
            <StatsCard
              title="Total Bookings"
              value={stats?.totalBookings?.toLocaleString() || '0'}
              icon={<HiOutlineTicket />}
            />
            <StatsCard
              title="Monthly Revenue"
              value={`₹${(stats?.totalRevenue || 0).toLocaleString()}`}
              icon={<HiOutlineCurrencyDollar />}
            />
            <StatsCard
              title={isAdmin ? 'Active Members' : 'Confirmed'}
              value={(isAdmin ? stats?.activeMembers : stats?.confirmedBookings)?.toLocaleString() || '0'}
              icon={<HiOutlineUserGroup />}
            />
            <StatsCard
              title="Arena Utilization"
              value={stats?.totalArenas ? `${Math.min(stats.totalArenas * 13, 100)}%` : '0%'}
              icon={<HiOutlineOfficeBuilding />}
            />
          </>
        )}
      </div>

      {/* Content Grid */}
      {isPlayer ? (
        <div className="dashboard__player-explore">
          <div className="dashboard__bookings-header" style={{marginBottom: '1.5rem'}}>
            <div>
              <h2 className="dashboard__section-title">
                {selectedSport ? `${SPORT_EMOJI[selectedSport] || ''} ${selectedSport} ARENAS` : 'RECOMMENDED ARENAS'}
              </h2>
              <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                {selectedSport
                  ? `${displayedArenas.length} venue${displayedArenas.length !== 1 ? 's' : ''} available`
                  : user?.preferred_sport ? `Based on your preference: ${user.preferred_sport}` : 'Top venues near you'}
              </p>
            </div>
            <Link to="/arenas" className="dashboard__view-all">
              View All <HiOutlineArrowRight />
            </Link>
          </div>

          {/* Browse by Sport chips */}
          {allSports.length > 0 && (
            <div className="sport-filter-bar">
              <button
                className={`sport-filter-chip ${!selectedSport ? 'sport-filter-chip--active' : ''}`}
                onClick={() => setSelectedSport('')}
              >
                All
              </button>
              {allSports.map(sport => (
                <button
                  key={sport}
                  className={`sport-filter-chip ${selectedSport === sport ? 'sport-filter-chip--active' : ''}`}
                  onClick={() => setSelectedSport(prev => prev === sport ? '' : sport)}
                >
                  <span className="sport-filter-chip__emoji">{SPORT_EMOJI[sport] || '🏟️'}</span>
                  {sport}
                </button>
              ))}
            </div>
          )}

          {displayedArenas.length > 0 ? (
            <div className="dashboard__arena-grid" style={{ marginTop: '1.25rem' }}>
              {displayedArenas.map((arena, index) => (
                <div key={arena._id} className="player-arena-card" style={{ animationDelay: `${index * 0.07}s` }}>
                  {/* Image */}
                  <div className="player-arena-card__image">
                    <img
                      src={arena.thumbnail_image || arena.images?.[0] || 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=800&q=80'}
                      alt={arena.arena_name}
                    />
                    {/* Status badge */}
                    <div className="player-arena-card__status">
                      <span className={`badge ${
                        arena.status === 'Available' ? 'badge-success' :
                        arena.status === 'Under Maintenance' ? 'badge-warning' : 'badge-error'
                      }`}>{arena.status}</span>
                    </div>
                    {/* Sport tags overlay */}
                    <div className="player-arena-card__sports-overlay">
                      {arena.sport_type?.slice(0, 2).map((s, i) => (
                        <span key={i} className="player-arena-card__sport-pill">{s}</span>
                      ))}
                      {arena.sport_type?.length > 2 && (
                        <span className="player-arena-card__sport-pill player-arena-card__sport-more">+{arena.sport_type.length - 2}</span>
                      )}
                    </div>
                  </div>
                  {/* Body */}
                  <div className="player-arena-card__body">
                    <h3 className="player-arena-card__title">{arena.arena_name}</h3>
                    <p className="player-arena-card__location">
                      <HiOutlineLocationMarker />
                      <span>{arena.location}</span>
                    </p>
                    {/* Sports tags row */}
                    {arena.sport_type?.length > 0 && (
                      <div className="player-arena-card__tags">
                        {arena.sport_type.slice(0, 3).map(s => (
                          <span key={s} className="player-arena-card__tag">{s}</span>
                        ))}
                        {arena.sport_type.length > 3 && (
                          <span className="player-arena-card__tag player-arena-card__tag--more">+{arena.sport_type.length - 3}</span>
                        )}
                      </div>
                    )}
                    <div className="player-arena-card__footer">
                      <div className="player-arena-card__price">
                        <span className="player-arena-card__price-amount">&#8377;{arena.price_per_hour}</span>
                        <span className="player-arena-card__price-unit">/hr</span>
                      </div>
                      <Link
                        to={`/arenas/${arena._id}`}
                        className={`btn btn-primary btn-sm ${
                          arena.status !== 'Available' ? 'btn-disabled' : ''
                        }`}
                        onClick={e => arena.status !== 'Available' && e.preventDefault()}
                      >
                        {arena.status === 'Available' ? 'Book Now' : 'Unavailable'}
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
             <div className="dashboard__empty card">
               <HiOutlineLocationMarker className="dashboard__empty-icon" />
               <p>{selectedSport ? `No arenas found matching ${selectedSport}.` : 'No arenas found matching your preferred sport.'}</p>
               <div style={{ display: 'flex', gap: '0.75rem', marginTop: 'var(--space-3)', justifyContent: 'center' }}>
                 {selectedSport && (
                   <button className="btn btn-secondary btn-sm" onClick={() => setSelectedSport('')}>Clear Filter</button>
                 )}
                 <Link to="/arenas" className="btn btn-secondary btn-sm">Browse All</Link>
               </div>
             </div>
          )}
        </div>
      ) : (
        <div className="dashboard__grid">
          {/* Revenue Chart - Admin/Manager Only */}
          <div className="dashboard__chart card">
            <div className="dashboard__chart-header">
              <h2 className="dashboard__section-title">REVENUE PERFORMANCE</h2>
              <div className="dashboard__chart-tabs">
                <button 
                  className={`dashboard__chart-tab ${chartFilter === 'Daily' ? 'dashboard__chart-tab--active' : ''}`}
                  onClick={() => setChartFilter('Daily')}
                >Daily</button>
                <button 
                  className={`dashboard__chart-tab ${chartFilter === 'Weekly' ? 'dashboard__chart-tab--active' : ''}`}
                  onClick={() => setChartFilter('Weekly')}
                >Weekly</button>
                <button 
                  className={`dashboard__chart-tab ${chartFilter === 'Monthly' ? 'dashboard__chart-tab--active' : ''}`}
                  onClick={() => setChartFilter('Monthly')}
                >Monthly</button>
              </div>
            </div>
            <div className="dashboard__chart-body">
              {chartInfo.labels.map((label, i) => {
                const height = chartHeights[i];
                const value = chartInfo.data[i];
                const isHighlight = value === Math.max(...chartInfo.data) && value > 0;
                return (
                  <div key={label + i} className="chart-bar-group">
                    <div className="chart-bar-wrapper">
                      <div className={`chart-bar-label ${isHighlight ? 'chart-bar-label--highlight' : ''}`}>
                        ₹{value.toLocaleString()}
                      </div>
                      <div
                        className={`chart-bar ${isHighlight ? 'chart-bar--highlight' : ''}`}
                        style={{ height: `${height}%` }}
                        title={`₹${value.toLocaleString()}`}
                      />
                    </div>
                    <span className="chart-bar-day">{label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Prime Time Boost */}
          <div className="dashboard__boost card">
            <div className="dashboard__boost-bg" />
            <div className="dashboard__boost-content">
              <h2 className="dashboard__boost-title">PRIME TIME BOOST</h2>
              <p className="dashboard__boost-subtitle">
                Court utilization is low during off-peak hours
              </p>
              <div className="dashboard__boost-card">
                <span className="dashboard__boost-label">AI RECOMMENDATION</span>
                <p className="dashboard__boost-text">
                  "Launch 20% discount flash sale for 6PM-9PM slots to increase traffic."
                </p>
              </div>
              <Link to="/arenas" className="btn btn-primary" style={{ marginTop: 'var(--space-4)' }}>
                Apply Campaign
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Recent Bookings Table (Shared) */}
      <div className="dashboard__bookings card" style={{marginTop: '2rem'}}>
        <div className="dashboard__bookings-header">
          <h2 className="dashboard__section-title">RECENT BOOKINGS</h2>
          <Link to="/bookings" className="dashboard__view-all">
            View All Activity <HiOutlineArrowRight />
          </Link>
        </div>

        {bookings.length > 0 ? (
          <div className="table-container" style={{ border: 'none' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>{isAdmin || isManager ? 'Player / Team' : 'Arena'}</th>
                  <th>Venue</th>
                  <th>Time Slot</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking) => (
                  <tr key={booking._id}>
                    <td>
                      <div className="booking-user">
                        <div className="booking-user__avatar">
                          {(booking.user_id?.name || booking.arena_id?.arena_name || 'U')[0]}
                        </div>
                        <div>
                          <div className="booking-user__name">
                            {isAdmin || isManager
                              ? booking.user_id?.name || 'Unknown'
                              : booking.arena_id?.arena_name || 'Arena'
                            }
                          </div>
                          <div className="booking-user__role">
                            {isAdmin || isManager
                              ? booking.user_id?.role || ''
                              : booking.arena_id?.location || ''
                            }
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>{booking.arena_id?.arena_name || 'N/A'}</td>
                    <td>
                      {booking.slot_id
                        ? `${booking.slot_id.start_time} - ${booking.slot_id.end_time}`
                        : `${booking.duration} ${booking.booking_type}(s)`
                      }
                    </td>
                    <td className="booking-amount">₹{booking.total_amount?.toLocaleString()}</td>
                    <td>
                      <span className={`badge ${getStatusBadge(booking.booking_status)}`}>
                        {booking.booking_status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="dashboard__empty">
            <HiOutlineTicket className="dashboard__empty-icon" />
            <p>No bookings yet.</p>
            {isPlayer && (
              <Link to="/arenas" className="btn btn-primary btn-sm" style={{ marginTop: 'var(--space-3)' }}>
                Book your first session
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;

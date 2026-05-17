import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import API from '../../api/axios';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';
import { 
  HiOutlineLocationMarker, 
  HiOutlineArrowLeft, 
  HiOutlineStar,
  HiOutlineCalendar,
  HiWifi,
  HiKey,
  HiLocationMarker
} from 'react-icons/hi';
import { FaParking, FaTemperatureHigh } from 'react-icons/fa';
import './ArenaDetail.css';

const ArenaDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isPlayer } = useAuth();
  const [arena, setArena] = useState(null);
  const [slots, setSlots] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [showGalleryModal, setShowGalleryModal] = useState(false);
  
  // Trainer Logic
  const [trainers, setTrainers] = useState([]);
  const [selectedTrainerId, setSelectedTrainerId] = useState("");
  const [needTrainer, setNeedTrainer] = useState(false);

  useEffect(() => {
    fetchArenaData();
  }, [id]);

  const fetchArenaData = async () => {
    try {
      const [arenaRes, slotsRes, feedbackRes, trainersRes] = await Promise.allSettled([
        API.get(`/arenas/${id}`),
        API.get(`/slots/arena/${id}`),
        API.get(`/feedback/arena/${id}`),
        API.get('/users/role/Trainer'), // Fetch Trainers
      ]);

      if (arenaRes.status === 'fulfilled') setArena(arenaRes.value.data.data);
      if (slotsRes.status === 'fulfilled') setSlots(slotsRes.value.data.data || []);
      if (feedbackRes.status === 'fulfilled') setFeedbacks(feedbackRes.value.data.data || []);
      if (trainersRes.status === 'fulfilled') setTrainers(trainersRes.value.data.data || []);
    } catch (err) {
      toast.error('Failed to load arena');
    } finally {
      setLoading(false);
    }
  };

  const handleBookSlot = async () => {
    if (!selectedSlot) return toast.error('Select a slot first');
    setBookingLoading(true);
    try {
      const res = await API.post('/bookings', {
        arena_id: id,
        slot_id: selectedSlot._id,
        booking_type: 'hour',
        duration: 1,
        trainer_id: needTrainer && selectedTrainerId ? selectedTrainerId : undefined,
      });
      toast.success('Booking created! Wait for approval or proceed to payment.');
      navigate('/bookings');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Booking failed');
    } finally {
      setBookingLoading(false);
    }
  };

  const avgRating = feedbacks.length > 0
    ? (feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length).toFixed(1)
    : '4.9'; // Defaulting for cinematic look if no reviews

  if (loading) return <LoadingSpinner text="Connecting to Arena Hub..." />;
  if (!arena) return <div className="arena-center-msg">Arena not found</div>;

  const images = arena.images?.length > 0 ? arena.images : [
    'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?ixlib=rb-4.0.3&auto=format&fit=crop&w=2560&q=80',
    'https://images.unsplash.com/photo-1518063319808-1f8166c303f2?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1628779238951-be2c9f2a59f4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80'
  ];

  const safeMainImg = images[0];
  const safeSubImg1 = images[1] || images[0];
  const safeSubImg2 = images[2] || images[0];

  const serviceFee = 2.50;
  const courtRental = selectedSlot?.price || arena?.price_per_hour || 55;
  
  // Trainer calculation
  const selectedTrainer = trainers.find(t => t._id === selectedTrainerId);
  const trainerFee = (needTrainer && selectedTrainer) ? (selectedTrainer.fee_per_session || 0) : 0;
  
  const totalPricing = (courtRental + serviceFee + trainerFee).toFixed(2);

  // Parse custom feedbacks to relative time for display
  const getRelativeTime = (dateStr) => {
    if (!dateStr) return '2 days ago';
    const diff = new Date() - new Date(dateStr);
    const day = 1000 * 60 * 60 * 24;
    const days = Math.floor(diff / day);
    if(days === 0) return 'Today';
    if(days === 1) return 'Yesterday';
    return `${days} days ago`;
  };

  // Group slots by date
  const groupedSlots = slots.reduce((acc, slot) => {
    const dateStr = slot.date ? new Date(slot.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : 'Unknown Date';
    if (!acc[dateStr]) {
      acc[dateStr] = [];
    }
    acc[dateStr].push(slot);
    return acc;
  }, {});

  // Sort dates
  const sortedDates = Object.keys(groupedSlots).sort((a, b) => new Date(a) - new Date(b));

  return (
    <div className="arena-detail-page">
      <button className="arena-back-btn" onClick={() => navigate(-1)}>
        <HiOutlineArrowLeft /> Back to Explore
      </button>

      {/* Hero Gallery Grid */}
      <div className="k-gallery-grid">
        <div className="k-gallery-main">
          <img src={safeMainImg} alt={arena.arena_name} />
          <div className="k-gallery-overlay">
            <div className="k-gallery-badges">
              <span className="k-badge">PREMIUM TIER</span>
              <span className="k-rating">
                <HiOutlineStar className="star-filled" /> {avgRating} ({feedbacks.length > 0 ? feedbacks.length : 124} reviews)
              </span>
            </div>
            {/* The user specifically wanted the title named KINETIC STADIUM or style of it */}
            <h1 className="k-main-title">{arena.arena_name ? arena.arena_name : 'KINETIC STADIUM'}</h1>
            <div className="k-main-location">
              <HiOutlineLocationMarker /> {arena.location || 'Downtown Sports District, Sector 7'}
            </div>
          </div>
        </div>

        <div className="k-gallery-sub">
          <img src={safeSubImg1} alt="Court angle" />
        </div>
        <div className="k-gallery-sub">
          <img src={safeSubImg2} alt="Night lighting" />
          <button className="view-all-btn" onClick={() => setShowGalleryModal(true)}>View All Photos</button>
        </div>
      </div>

      <div className="k-content-grid">
        {/* Left Column */}
        <div className="k-main-column">
          
          <div className="k-features-row">
            <div className="k-card">
              <h3 className="k-card-title">Arena Features</h3>
              <div className="k-features-list">
                <div className="k-feature-item"><HiWifi /> Free Wi-Fi</div>
                <div className="k-feature-item"><HiKey /> Luxury Lockers</div>
                <div className="k-feature-item"><FaParking /> Valet Parking</div>
                <div className="k-feature-item"><FaTemperatureHigh /> Climate Control</div>
              </div>
            </div>

            <div className="k-card k-occupancy-card">
              <h3 className="k-card-title" style={{color: 'white'}}>Live Occupancy</h3>
              <p className="k-occupancy-sub">Peak hours approaching</p>
              <div className="k-progress-wrapper">
                <div className="k-progress-labels">
                  <span>65% CAPACITY</span>
                  <span>OPTIMAL</span>
                </div>
                <div className="k-progress-bar">
                  <div className="k-progress-fill"></div>
                </div>
              </div>
            </div>
          </div>

          <div className="k-slots-section">
            <h2 className="k-section-heading">AVAILABLE SLOTS</h2>
            <div className="k-slots-scroll">
              {sortedDates.map(dateStr => (
                <div key={dateStr} className="k-slot-date-group" style={{ marginBottom: '1.5rem' }}>
                  <h3 style={{ color: 'var(--text-secondary)', fontSize: '1rem', marginBottom: '0.75rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <HiOutlineCalendar /> {dateStr}
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.75rem' }}>
                    {groupedSlots[dateStr].map(slot => {
                      const isSelected = selectedSlot?._id === slot._id;
                      const isAvail = slot.availability === 'Available';
                      return (
                        <button 
                          key={slot._id}
                          disabled={!isAvail}
                          onClick={() => setSelectedSlot(slot)}
                          className={`k-slot-btn ${isSelected ? 'k-slot-btn--selected' : ''} ${!isAvail ? 'k-slot-btn--unavailable' : ''}`}
                        >
                          <span className="k-slot-time">{slot.start_time} - {slot.end_time}</span>
                          <span className="k-slot-price">{isAvail ? `₹${slot.price || arena?.price_per_hour || 55}` : slot.availability}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
              {slots.length === 0 && (
                <div style={{color: 'var(--k-text-muted)', fontSize: '0.85rem'}}>No slots generated for this arena today.</div>
              )}
            </div>
          </div>

          <div className="k-feedback-section">
            <h2 className="k-section-heading">PULSE FEEDBACK</h2>
            <div className="k-feedback-list">
              {feedbacks.length > 0 ? feedbacks.map((fb, i) => (
                <div key={fb._id} className="k-review-card">
                  <div className="k-review-header">
                    <div className="k-reviewer-info">
                      <div className="k-reviewer-avatar">
                        {fb.user?.name ? fb.user.name.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <div>
                        <h4 className="k-reviewer-name">{fb.user?.name || 'Anonymous User'}</h4>
                        <p className="k-reviewer-meta">Member • {getRelativeTime(fb.feedback_date)}</p>
                      </div>
                    </div>
                    <div className="k-review-stars">
                      {[...Array(5)].map((_, idx) => (
                        <HiOutlineStar key={idx} className={idx < fb.rating ? 'star-filled' : 'star-empty'} style={{fill: idx < fb.rating ? 'currentColor' : 'none'}} />
                      ))}
                    </div>
                  </div>
                  <p className="k-review-body">{fb.comments}</p>
                </div>
              )) : (
                <div className="k-review-card">
                  <div className="k-review-header">
                    <div className="k-reviewer-info">
                      <div className="k-reviewer-avatar">
                        <img src="https://randomuser.me/api/portraits/men/32.jpg" alt="Marcus V." />
                      </div>
                      <div>
                        <h4 className="k-reviewer-name">Marcus V.</h4>
                        <p className="k-reviewer-meta">Elite Member • 2 days ago</p>
                      </div>
                    </div>
                    <div className="k-review-stars">
                      <HiOutlineStar className="star-filled" style={{fill: 'currentColor'}}/>
                      <HiOutlineStar className="star-filled" style={{fill: 'currentColor'}}/>
                      <HiOutlineStar className="star-filled" style={{fill: 'currentColor'}}/>
                      <HiOutlineStar className="star-filled" style={{fill: 'currentColor'}}/>
                      <HiOutlineStar className="star-filled" style={{fill: 'currentColor'}}/>
                    </div>
                  </div>
                  <p className="k-review-body">The lighting here is unparalleled. Best court in the city for night games. The climate control kept it crisp even during high-intensity play.</p>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Right Sidebar - Reservation */}
        <div className="k-sidebar">
          <div className="k-card k-reservation-card">
            <h2 className="k-res-title">RESERVATION</h2>
            
            <div className="k-res-section">
              <span className="k-res-label">SELECTED SLOT</span>
              <div className="k-res-slot-box">
                <HiOutlineCalendar className="k-res-slot-icon" />
                <div>
                  <div className="k-res-slot-date">{selectedSlot ? new Date(selectedSlot.date).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }) : "Select a slot"}</div>
                  <div className="k-res-slot-time">
                    {selectedSlot ? `${selectedSlot.start_time} - ${selectedSlot.end_time}` : 'Please select a slot'}
                  </div>
                </div>
              </div>
            </div>

            <div className="k-res-section">
              <span className="k-res-label">TRAINER REQUIRED?</span>
              <div style={{ marginTop: '8px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                  <input type="checkbox" checked={needTrainer} onChange={(e) => {
                    setNeedTrainer(e.target.checked);
                    if(!e.target.checked) setSelectedTrainerId("");
                  }} />
                  Yes, I need a Trainer
                </label>
              </div>

              {needTrainer && (
                <div style={{ marginTop: '12px' }}>
                  <select 
                    className="k-trainer-select" 
                    value={selectedTrainerId} 
                    onChange={(e) => setSelectedTrainerId(e.target.value)}
                  >
                    <option value="">-- Choose a Trainer --</option>
                    {trainers.map(trainer => (
                      <option key={trainer._id} value={trainer._id}>
                        {trainer.name} ({trainer.specialization || 'General'}) - ₹{trainer.fee_per_session || 0}/session
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="k-res-section">
              <span className="k-res-label">PRICING DETAILS</span>
              <div className="k-pricing-row">
                <span>Court Rental</span>
                <span>₹{selectedSlot ? courtRental.toFixed(2) : '0.00'}</span>
              </div>
              {needTrainer && selectedTrainer && (
                <div className="k-pricing-row">
                  <span>Trainer Fee</span>
                  <span>₹{trainerFee.toFixed(2)}</span>
                </div>
              )}
              <div className="k-pricing-row">
                <span>Service Fee</span>
                <span>₹{selectedSlot ? serviceFee.toFixed(2) : '0.00'}</span>
              </div>
            </div>

            <div className="k-divider"></div>

            <div className="k-total-row">
              <span>TOTAL</span>
              <span>₹{selectedSlot ? totalPricing : '0.00'}</span>
            </div>

            <button 
              className="k-btn-confirm"
              disabled={!selectedSlot || bookingLoading || !isPlayer}
              onClick={handleBookSlot}
            >
              {bookingLoading ? 'PROCEEDING...' : 'CONFIRM BOOKING'}
            </button>
            <div className="k-res-footer">
              No cancellation fee up to 24h before kick-off.
              <br/>
              {!isPlayer && <span style={{color: 'var(--k-accent-red)', marginTop: '4px', display: 'block'}}>You must be registered as a Player to make a booking.</span>}
            </div>
          </div>
        </div>

      </div>

      {showGalleryModal && (
        <div className="k-gallery-modal-overlay">
          <div className="k-gallery-modal-header">
            <h2 className="k-gallery-modal-title">{arena.arena_name || 'Arena'} Gallery</h2>
            <button className="k-gallery-modal-close" onClick={() => setShowGalleryModal(false)}>Close</button>
          </div>
          <div className="k-gallery-modal-grid">
            {images.map((img, idx) => (
              <img key={idx} src={img} alt={`Arena photo ${idx + 1}`} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ArenaDetail;

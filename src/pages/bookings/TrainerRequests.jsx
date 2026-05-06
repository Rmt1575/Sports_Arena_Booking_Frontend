import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import API from '../../api/axios';
import { toast } from 'react-hot-toast';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { HiOutlineBadgeCheck, HiOutlineXCircle } from 'react-icons/hi';
import './Bookings.css'; // Re-use Bookings CSS

const TrainerRequests = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('Pending');

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const res = await API.get('/bookings/my');
      setRequests(res.data.data || []);
    } catch (err) {
      toast.error('Failed to load trainer requests');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await API.put(`/bookings/trainer-status/${id}`, { status });
      toast.success(`Request ${status}`);
      fetchRequests();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    }
  };

  if (loading) return <LoadingSpinner text="Fetching your requests..." />;

  const filteredRequests = requests.filter(req => req.trainer_status === filter);

  return (
    <div className="bookings-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">TRAINER REQUESTS</h1>
          <p className="page-subtitle">Manage incoming training sessions</p>
        </div>
      </div>

      <div className="bookings-filters">
        {['Pending', 'Approved', 'Rejected'].map(status => (
          <button 
            key={status}
            className={`bookings-filter-btn ${filter === status ? 'bookings-filter-btn--active' : ''}`}
            onClick={() => setFilter(status)}
          >
            {status}
          </button>
        ))}
      </div>

      {filteredRequests.length > 0 ? (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Player Name</th>
                <th>Arena & Slot</th>
                <th>Fee Expected</th>
                <th>Booking Status</th>
                <th>Your Status</th>
                {filter === 'Pending' && <th className="text-right">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filteredRequests.map(req => (
                <tr key={req._id}>
                  <td>
                    <div className="booking-user">
                      <div className="booking-user__avatar">
                        {(req.user_id?.name || 'U')[0]}
                      </div>
                      <div>
                        <div className="booking-user__name">{req.user_id?.name || 'Unknown'}</div>
                        <div className="booking-user__role">{req.user_id?.skill_level || 'Player'}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div>{req.arena_id?.arena_name || 'N/A'}</div>
                    <div style={{fontSize: '0.8rem', color: 'var(--text-secondary)'}}>
                      {req.slot_id ? `${req.slot_id.start_time} - ${req.slot_id.end_time}` : '-'}
                    </div>
                  </td>
                  <td className="booking-amount">
                    ₹{user.fee_per_session ? (user.fee_per_session * req.duration).toFixed(2) : '0.00'}
                  </td>
                  <td>
                    <span className={`badge ${req.booking_status === 'Confirmed' ? 'badge-success' : 'badge-warning'}`}>
                      {req.booking_status}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${
                      req.trainer_status === 'Approved' ? 'badge-success' :
                      req.trainer_status === 'Rejected' ? 'badge-error' : 'badge-warning'
                    }`}>
                      {req.trainer_status}
                    </span>
                  </td>
                  {filter === 'Pending' && (
                    <td className="actions-cell">
                      <button 
                        className="btn-icon btn-icon--success"
                        onClick={() => handleUpdateStatus(req._id, 'Approved')}
                        title="Accept Request"
                      >
                        <HiOutlineBadgeCheck />
                      </button>
                      <button 
                        className="btn-icon btn-icon--danger"
                        onClick={() => handleUpdateStatus(req._id, 'Rejected')}
                        title="Decline Request"
                      >
                        <HiOutlineXCircle />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state card">
          <p>No {filter.toLowerCase()} requests found.</p>
        </div>
      )}
    </div>
  );
};

export default TrainerRequests;

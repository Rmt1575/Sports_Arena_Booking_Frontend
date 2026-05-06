import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import API from '../../api/axios';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';
import { HiOutlineCalendar, HiOutlinePlus, HiOutlineTrash } from 'react-icons/hi';
import './Schedules.css';

const Schedules = () => {
  const { isAdmin, isManager } = useAuth();
  const [arenas, setArenas] = useState([]);
  const [selectedArena, setSelectedArena] = useState('');
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ date: '', start_time: '', end_time: '', price: '' });
  const [creating, setCreating] = useState(false);

  useEffect(() => { fetchArenas(); }, []);

  useEffect(() => { if (selectedArena) fetchSlots(); }, [selectedArena]);

  const fetchArenas = async () => {
    try {
      const res = await API.get('/arenas');
      const data = res.data.data || [];
      setArenas(data);
      if (data.length > 0) setSelectedArena(data[0]._id);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchSlots = async () => {
    try {
      const res = await API.get(`/slots/arena/${selectedArena}`);
      setSlots(res.data.data || []);
    } catch (err) { console.error(err); }
  };

  const handleCreateSlot = async (e) => {
    e.preventDefault();
    if (!formData.date || !formData.start_time || !formData.end_time || !formData.price) {
      return toast.error('Fill all fields');
    }
    setCreating(true);
    try {
      await API.post('/slots', { ...formData, arena_id: selectedArena });
      toast.success('Slot created!');
      setShowForm(false);
      setFormData({ date: '', start_time: '', end_time: '', price: '' });
      fetchSlots();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setCreating(false); }
  };

  const handleDeleteSlot = async (slotId) => {
    if (!window.confirm('Delete this slot?')) return;
    try {
      await API.delete(`/slots/${slotId}`);
      toast.success('Slot deleted');
      fetchSlots();
    } catch (err) { toast.error('Failed to delete slot'); }
  };

  const getStatusClass = (s) => ({ Available: 'badge-success', Booked: 'badge-warning', Blocked: 'badge-error' }[s] || 'badge-info');

  if (loading) return <LoadingSpinner text="Loading schedules..." />;

  return (
    <div className="schedules-page">
      <div className="schedules-page__header">
        <div>
          <h1 className="schedules-page__title">SCHEDULES</h1>
          <p className="text-muted">Manage arena time slots</p>
        </div>
        {(isAdmin || isManager) && (
          <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
            <HiOutlinePlus /> Add Slot
          </button>
        )}
      </div>

      {/* Arena Selector */}
      <div className="schedules-selector">
        <label className="form-label">Select Arena</label>
        <select className="form-select" value={selectedArena} onChange={e => setSelectedArena(e.target.value)}>
          {arenas.map(a => <option key={a._id} value={a._id}>{a.arena_name} — {a.location}</option>)}
        </select>
      </div>

      {/* Create Slot Form */}
      {showForm && (
        <div className="card animate-fade-in">
          <h3 style={{ marginBottom: 'var(--space-4)', fontWeight: 700 }}>Create New Slot</h3>
          <form className="slot-form" onSubmit={handleCreateSlot}>
            <div className="form-group">
              <label className="form-label">Date</label>
              <input type="date" className="form-input" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Start Time</label>
              <input type="time" className="form-input" value={formData.start_time} onChange={e => setFormData({ ...formData, start_time: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">End Time</label>
              <input type="time" className="form-input" value={formData.end_time} onChange={e => setFormData({ ...formData, end_time: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Price (₹)</label>
              <input type="number" className="form-input" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} />
            </div>
            <button type="submit" className="btn btn-primary" disabled={creating}>
              {creating ? 'Creating...' : 'Create Slot'}
            </button>
          </form>
        </div>
      )}

      {/* Slots Grid */}
      {slots.length > 0 ? (
        <div className="slots-grid">
          {slots.map(slot => (
            <div key={slot._id} className={`slot-card card ${slot.availability === 'Available' ? '' : 'slot-card--booked'}`}>
              <div className="slot-card__header">
                <span className="slot-card__date">{new Date(slot.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                <span className={`badge ${getStatusClass(slot.availability)}`}>{slot.availability}</span>
              </div>
              <div className="slot-card__time">{slot.start_time} — {slot.end_time}</div>
              <div className="slot-card__footer">
                <span className="slot-card__price">₹{slot.price}</span>
                {(isAdmin || isManager) && slot.availability === 'Available' && (
                  <button className="btn btn-ghost btn-sm text-error" onClick={() => handleDeleteSlot(slot._id)}>
                    <HiOutlineTrash />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
          <HiOutlineCalendar style={{ fontSize: '2.5rem', color: 'var(--text-muted)', marginBottom: 'var(--space-3)' }} />
          <p className="text-muted">No slots created yet</p>
        </div>
      )}
    </div>
  );
};

export default Schedules;

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../../api/axios';
import toast from 'react-hot-toast';
import { HiOutlineArrowLeft, HiOutlineCheckCircle } from 'react-icons/hi';
import './Arenas.css';

const SPORTS_LIST = ['Cricket','Football','Badminton','Tennis','Basketball','Volleyball','Table Tennis','Hockey','Swimming','Boxing','Yoga','Kabaddi','Squash','Golf','Futsal','Pickleball','Skating','Athletics','Gymnastics','Wrestling','Archery','Cycling','Rugby'];

const ArenaForm = () => {
  // Works for both /arenas/create (id=undefined) and /arenas/edit/:id
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState([]);
  const [formData, setFormData] = useState({
    arena_name: '', location: '', description: '', price_per_hour: '',
    price_per_day: '', price_per_month: '', capacity: '', sport_type: [], status: 'Available',
  });

  useEffect(() => {
    if (isEdit) fetchArena();
  }, [id]);

  const fetchArena = async () => {
    try {
      const res = await API.get(`/arenas/${id}`);
      const a = res.data.data;
      setFormData({
        arena_name: a.arena_name || '', location: a.location || '', description: a.description || '',
        price_per_hour: a.price_per_hour || '', price_per_day: a.price_per_day || '',
        price_per_month: a.price_per_month || '', capacity: a.capacity || '',
        sport_type: a.sport_type || [], status: a.status || 'Available',
      });
    } catch { toast.error('Failed to load arena'); }
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const toggleSport = (sport) => {
    setFormData(prev => ({
      ...prev,
      sport_type: prev.sport_type.includes(sport)
        ? prev.sport_type.filter(s => s !== sport)
        : [...prev.sport_type, sport],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.arena_name || !formData.location || !formData.price_per_hour) {
      return toast.error('Fill required fields');
    }
    if (formData.sport_type.length === 0) return toast.error('Select at least one sport');
    setLoading(true);

    try {
      if (isEdit) {
        // Send as JSON — backend updateArena accepts plain body
        await API.put(`/arenas/${id}`, formData);
        toast.success('Arena updated successfully!');
      } else {
        // Create: use FormData for image uploads
        const data = new FormData();
        Object.keys(formData).forEach(key => {
          if (key === 'sport_type') {
            formData.sport_type.forEach(s => data.append('sport_type', s));
          } else if (formData[key] !== '' && formData[key] !== null) {
            data.append(key, formData[key]);
          }
        });
        images.forEach(img => data.append('images', img));
        await API.post('/arenas', data, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Arena created!');
      }
      navigate('/arenas');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save arena');
    } finally { setLoading(false); }
  };

  return (
    <div className="arenas-page">
      <button className="btn btn-ghost" onClick={() => navigate(-1)} style={{ alignSelf: 'flex-start' }}>
        <HiOutlineArrowLeft /> Back
      </button>
      <h1 className="arenas-page__title">{isEdit ? 'Edit Arena' : 'Create New Arena'}</h1>

      <form className="arena-form card" onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Arena Name *</label>
            <input name="arena_name" className="form-input" placeholder="Center Court Arena" value={formData.arena_name} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label className="form-label">Location *</label>
            <input name="location" className="form-input" placeholder="Mumbai, India" value={formData.location} onChange={handleChange} />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Description</label>
          <textarea name="description" className="form-input" rows="3" placeholder="Describe this arena..." value={formData.description} onChange={handleChange} style={{ resize: 'vertical' }} />
        </div>

        <div className="form-group">
          <label className="form-label">
            Sports Offered *
            {formData.sport_type.length > 0 && (
              <span className="sports-selected-count"> — {formData.sport_type.length} selected</span>
            )}
          </label>
          <div className="arena-form__sports">
            {SPORTS_LIST.map(s => {
              const selected = formData.sport_type.includes(s);
              return (
                <button key={s} type="button"
                  className={`sport-chip ${selected ? 'sport-chip--active' : ''}`}
                  onClick={() => toggleSport(s)}
                >
                  {selected && <HiOutlineCheckCircle className="sport-chip__icon" />}
                  {s}
                </button>
              );
            })}
          </div>
        </div>

        <div className="form-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          <div className="form-group">
            <label className="form-label">Price/Hour (₹) *</label>
            <input name="price_per_hour" type="number" className="form-input" value={formData.price_per_hour} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label className="form-label">Price/Day (₹)</label>
            <input name="price_per_day" type="number" className="form-input" value={formData.price_per_day} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label className="form-label">Price/Month (₹)</label>
            <input name="price_per_month" type="number" className="form-input" value={formData.price_per_month} onChange={handleChange} />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Capacity</label>
            <input name="capacity" type="number" className="form-input" value={formData.capacity} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label className="form-label">Status</label>
            <select name="status" className="form-select" value={formData.status} onChange={handleChange}>
              <option value="Available">Available</option>
              <option value="Under Maintenance">Under Maintenance</option>
              <option value="Unavailable">Unavailable</option>
            </select>
          </div>
        </div>

        {!isEdit && (
          <div className="form-group">
            <label className="form-label">Images (max 5)</label>
            <input type="file" multiple accept="image/*" className="form-input"
              onChange={(e) => setImages([...e.target.files].slice(0, 5))} />
          </div>
        )}

        <button type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{ alignSelf: 'flex-start' }}>
          {loading ? 'Saving...' : isEdit ? 'Update Arena' : 'Create Arena'}
        </button>
      </form>
    </div>
  );
};

export default ArenaForm;

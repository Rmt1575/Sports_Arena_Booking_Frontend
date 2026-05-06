import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import API from '../../api/axios';
import toast from 'react-hot-toast';
import { HiOutlineCamera, HiOutlinePencil, HiOutlineSave } from 'react-icons/hi';
import './Profile.css';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '', email: user.email || '', phone_no: user.phone_no || '',
        // Player
        gender: user.gender || '', date_of_birth: user.date_of_birth ? user.date_of_birth.split('T')[0] : '',
        preferred_sport: user.preferred_sport || '', skill_level: user.skill_level || '',
        emergency_contact: user.emergency_contact || '',
        // Trainer
        specialization: user.specialization || '', experience_years: user.experience_years || '',
        availability: user.availability || '', fee_per_session: user.fee_per_session || '',
        // Manager
        office_address: user.office_address || '',
      });
    }
  }, [user]);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await API.put(`/users/update/${user._id}`, formData);
      updateUser(res.data.data);
      toast.success('Profile updated!');
      setEditing(false);
    } catch (err) { toast.error(err.response?.data?.message || 'Update failed'); }
    finally { setLoading(false); }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const data = new FormData();
    data.append('image', file);
    try {
      const res = await API.post('/users/upload-profile', data, { headers: { 'Content-Type': 'multipart/form-data' } });
      updateUser(res.data.data);
      toast.success('Profile photo updated!');
    } catch (err) { toast.error('Upload failed'); }
    finally { setUploading(false); }
  };

  const getInitials = (n) => n ? n.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : 'U';

  if (!user) return null;

  return (
    <div className="profile-page">
      <h1 className="profile-page__title">PROFILE</h1>

      {/* Profile Header */}
      <div className="profile-header card">
        <div className="profile-header__avatar-wrap">
          {user.profile_image ? (
            <img src={user.profile_image} alt={user.name} className="profile-header__avatar-img" />
          ) : (
            <div className="profile-header__avatar">{getInitials(user.name)}</div>
          )}
          <label className="profile-header__upload" title="Change photo">
            <HiOutlineCamera />
            <input type="file" accept="image/*" hidden onChange={handleImageUpload} />
          </label>
          {uploading && <div className="profile-header__uploading">Uploading...</div>}
        </div>
        <div className="profile-header__info">
          <h2 className="profile-header__name">{user.name}</h2>
          <p className="profile-header__email">{user.email}</p>
          <div className="profile-header__badges">
            <span className="badge badge-accent">{user.role}</span>
            <span className={`badge ${user.status === 'Active' ? 'badge-success' : 'badge-warning'}`}>{user.status}</span>
          </div>
        </div>
        <button className="btn btn-secondary" onClick={() => setEditing(!editing)}>
          {editing ? 'Cancel' : <><HiOutlinePencil /> Edit Profile</>}
        </button>
      </div>

      {/* Profile Details */}
      <div className="profile-details card">
        <h3 style={{ marginBottom: 'var(--space-6)', fontWeight: 700 }}>Personal Information</h3>
        <div className="profile-grid">
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input name="name" className="form-input" value={formData.name} onChange={handleChange} disabled={!editing} />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input name="email" className="form-input" value={formData.email} onChange={handleChange} disabled={!editing} />
          </div>
          <div className="form-group">
            <label className="form-label">Phone</label>
            <input name="phone_no" className="form-input" value={formData.phone_no} onChange={handleChange} disabled={!editing} />
          </div>

          {user.role === 'Player' && (
            <>
              <div className="form-group">
                <label className="form-label">Gender</label>
                <select name="gender" className="form-select" value={formData.gender} onChange={handleChange} disabled={!editing}>
                  <option value="">Select</option>
                  <option value="Male">Male</option><option value="Female">Female</option><option value="Other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Date of Birth</label>
                <input name="date_of_birth" type="date" className="form-input" value={formData.date_of_birth} onChange={handleChange} disabled={!editing} />
              </div>
              <div className="form-group">
                <label className="form-label">Preferred Sport</label>
                <input name="preferred_sport" className="form-input" value={formData.preferred_sport} onChange={handleChange} disabled={!editing} />
              </div>
              <div className="form-group">
                <label className="form-label">Skill Level</label>
                <select name="skill_level" className="form-select" value={formData.skill_level} onChange={handleChange} disabled={!editing}>
                  <option value="Beginner">Beginner</option><option value="Intermediate">Intermediate</option><option value="Advanced">Advanced</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Emergency Contact</label>
                <input name="emergency_contact" className="form-input" value={formData.emergency_contact} onChange={handleChange} disabled={!editing} />
              </div>
            </>
          )}

          {user.role === 'Trainer' && (
            <>
              <div className="form-group"><label className="form-label">Specialization</label><input name="specialization" className="form-input" value={formData.specialization} onChange={handleChange} disabled={!editing} /></div>
              <div className="form-group"><label className="form-label">Experience (Years)</label><input name="experience_years" type="number" className="form-input" value={formData.experience_years} onChange={handleChange} disabled={!editing} /></div>
              <div className="form-group"><label className="form-label">Availability</label><input name="availability" className="form-input" value={formData.availability} onChange={handleChange} disabled={!editing} /></div>
              <div className="form-group"><label className="form-label">Fee/Session (₹)</label><input name="fee_per_session" type="number" className="form-input" value={formData.fee_per_session} onChange={handleChange} disabled={!editing} /></div>
            </>
          )}

          {user.role === 'Arena Manager' && (
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label">Office Address</label>
              <input name="office_address" className="form-input" value={formData.office_address} onChange={handleChange} disabled={!editing} />
            </div>
          )}
        </div>

        {editing && (
          <button className="btn btn-primary" onClick={handleSave} disabled={loading} style={{ marginTop: 'var(--space-6)' }}>
            {loading ? 'Saving...' : <><HiOutlineSave /> Save Changes</>}
          </button>
        )}
      </div>
    </div>
  );
};

export default Profile;

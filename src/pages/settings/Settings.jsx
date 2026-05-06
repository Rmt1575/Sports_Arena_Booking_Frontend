import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import API from '../../api/axios';
import toast from 'react-hot-toast';
import { HiOutlineLockClosed, HiOutlineShieldCheck } from 'react-icons/hi';
import './Settings.css';

const Settings = () => {
  const { user, logout } = useAuth();
  const [passwords, setPasswords] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setPasswords({ ...passwords, [e.target.name]: e.target.value });

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!passwords.oldPassword || !passwords.newPassword) return toast.error('Fill all fields');
    if (passwords.newPassword !== passwords.confirmPassword) return toast.error('Passwords don\'t match');
    if (passwords.newPassword.length < 6) return toast.error('Min 6 characters');
    setLoading(true);
    try {
      await API.put('/users/change-password', {
        oldPassword: passwords.oldPassword,
        newPassword: passwords.newPassword,
      });
      toast.success('Password changed successfully!');
      setPasswords({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setLoading(false); }
  };

  const handleDeactivate = async () => {
    if (!window.confirm('Are you sure you want to deactivate your account? This action is reversible by contacting admin.')) return;
    try {
      await API.put(`/users/deactivate/${user._id}`);
      toast.success('Account deactivated');
      logout();
    } catch (err) { toast.error('Failed'); }
  };

  return (
    <div className="settings-page">
      <h1 className="settings-page__title">SETTINGS</h1>

      {/* Change Password */}
      <div className="settings-section card">
        <div className="settings-section__header">
          <HiOutlineLockClosed className="settings-section__icon" />
          <div>
            <h3>Change Password</h3>
            <p className="text-muted">Update your account password</p>
          </div>
        </div>
        <form className="settings-form" onSubmit={handleChangePassword}>
          <div className="form-group">
            <label className="form-label">Current Password</label>
            <input type="password" name="oldPassword" className="form-input" placeholder="Enter current password" value={passwords.oldPassword} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label className="form-label">New Password</label>
            <input type="password" name="newPassword" className="form-input" placeholder="Min 6 characters" value={passwords.newPassword} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label className="form-label">Confirm New Password</label>
            <input type="password" name="confirmPassword" className="form-input" placeholder="Re-enter new password" value={passwords.confirmPassword} onChange={handleChange} />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>

      {/* Danger Zone */}
      <div className="settings-section settings-section--danger card">
        <div className="settings-section__header">
          <HiOutlineShieldCheck className="settings-section__icon" />
          <div>
            <h3>Danger Zone</h3>
            <p className="text-muted">Irreversible and destructive actions</p>
          </div>
        </div>
        <div className="settings-danger-actions">
          <div>
            <h4>Deactivate Account</h4>
            <p className="text-muted" style={{ fontSize: 'var(--font-sm)' }}>
              Your account will be deactivated. Contact admin to reactivate.
            </p>
          </div>
          <button className="btn btn-danger" onClick={handleDeactivate}>
            Deactivate Account
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;

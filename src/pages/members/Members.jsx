import { useState, useEffect } from 'react';
import API from '../../api/axios';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';
import { HiOutlineUserGroup, HiOutlineSearch, HiOutlineShieldCheck, HiOutlineBan } from 'react-icons/hi';
import './Members.css';

const Members = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    try {
      const res = await API.get('/users/getallusers');
      setUsers(res.data.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleStatusUpdate = async (userId, status) => {
    try {
      await API.put(`/users/status/${userId}`, { status });
      toast.success(`User ${status.toLowerCase()}`);
      fetchUsers();
    } catch (err) { toast.error('Failed to update status'); }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm('Delete this user permanently?')) return;
    try {
      await API.delete(`/users/${userId}`);
      toast.success('User deleted');
      fetchUsers();
    } catch (err) { toast.error('Failed'); }
  };

  const filtered = users.filter(u => {
    const matchSearch = u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase());
    const matchRole = !roleFilter || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const getRoleBadge = (r) => ({ Admin: 'badge-error', 'Arena Manager': 'badge-info', Trainer: 'badge-warning', Player: 'badge-success' }[r] || 'badge-info');
  const getStatusBadge = (s) => ({ Active: 'badge-success', Pending: 'badge-pending', Inactive: 'badge-error' }[s] || 'badge-info');

  if (loading) return <LoadingSpinner text="Loading members..." />;

  return (
    <div className="members-page">
      <div className="members-page__header">
        <div>
          <h1 className="members-page__title">MEMBERS</h1>
          <p className="text-muted">{users.length} registered users</p>
        </div>
      </div>

      <div className="members-filters">
        <div className="members-search">
          <HiOutlineSearch className="members-search__icon" />
          <input type="text" className="form-input" placeholder="Search by name or email..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: '2.5rem' }} />
        </div>
        <select className="form-select" value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
          <option value="">All Roles</option>
          <option value="Admin">Admin</option>
          <option value="Arena Manager">Arena Manager</option>
          <option value="Trainer">Trainer</option>
          <option value="Player">Player</option>
        </select>
      </div>

      {/* Stats */}
      <div className="members-stats">
        {['Admin', 'Arena Manager', 'Trainer', 'Player'].map(role => (
          <div key={role} className="members-stat card" onClick={() => setRoleFilter(role === roleFilter ? '' : role)} style={{ cursor: 'pointer' }}>
            <span className="members-stat__count">{users.filter(u => u.role === role).length}</span>
            <span className="members-stat__label">{role}s</span>
          </div>
        ))}
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Role</th>
              <th>Phone</th>
              <th>Status</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(u => (
              <tr key={u._id}>
                <td>
                  <div className="booking-user">
                    <div className="booking-user__avatar">{(u.name || 'U')[0]}</div>
                    <div>
                      <div className="booking-user__name">{u.name}</div>
                      <div className="booking-user__role">{u.email}</div>
                    </div>
                  </div>
                </td>
                <td><span className={`badge ${getRoleBadge(u.role)}`}>{u.role}</span></td>
                <td>{u.phone_no || '—'}</td>
                <td><span className={`badge ${getStatusBadge(u.status)}`}>{u.status}</span></td>
                <td className="text-muted">{new Date(u.createdAt).toLocaleDateString()}</td>
                <td>
                  <div className="booking-actions">
                    {u.status !== 'Active' && (
                      <button className="btn btn-success btn-sm" title="Activate" onClick={() => handleStatusUpdate(u._id, 'Active')}><HiOutlineShieldCheck /></button>
                    )}
                    {u.status === 'Active' && u.role !== 'Admin' && (
                      <button className="btn btn-ghost btn-sm text-warning" title="Deactivate" onClick={() => handleStatusUpdate(u._id, 'Inactive')}><HiOutlineBan /></button>
                    )}
                    {u.role !== 'Admin' && (
                      <button className="btn btn-ghost btn-sm text-error" title="Delete" onClick={() => handleDelete(u._id)}>×</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Members;

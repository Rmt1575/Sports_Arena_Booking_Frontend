import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import './Auth.css';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      toast.error('Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      await login(formData.email, formData.password);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg">
        <div className="auth-bg__gradient" />
        <div className="auth-bg__grid" />
      </div>

      <div className="auth-container">
        {/* Left branding panel */}
        <div className="auth-brand">
          <div className="auth-brand__content">
            <div className="auth-brand__logo">
              <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M24 4L42 13V35L24 44L6 35V13L24 4Z" fill="#e8612d" opacity="0.9"/>
                <path d="M24 12L33 17V29L24 34L15 29V17L24 12Z" fill="#080d1a" opacity="0.85"/>
                <circle cx="24" cy="23" r="4.5" fill="#e8612d"/>
              </svg>
            </div>
            <h1 className="auth-brand__title">KINETIC STADIUM</h1>
            <p className="auth-brand__subtitle">
              Premium sports arena management platform. Book, train, and compete at world-class facilities.
            </p>

            <div className="auth-brand__features">
              <div className="auth-brand__feature">
                <div className="auth-brand__feature-icon">⚡</div>
                <div>
                  <h4>Instant Booking</h4>
                  <p>Reserve courts in seconds</p>
                </div>
              </div>
              <div className="auth-brand__feature">
                <div className="auth-brand__feature-icon">🏆</div>
                <div>
                  <h4>Pro Trainers</h4>
                  <p>Connect with expert coaches</p>
                </div>
              </div>
              <div className="auth-brand__feature">
                <div className="auth-brand__feature-icon">📊</div>
                <div>
                  <h4>Analytics</h4>
                  <p>Track performance & revenue</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right form panel */}
        <div className="auth-form-panel">
          <div className="auth-form-wrapper">
            <div className="auth-form__header">
              <h2 className="auth-form__title">Welcome Back</h2>
              <p className="auth-form__desc">Sign in to your account to continue</p>
            </div>

            <form className="auth-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label" htmlFor="email">Email Address</label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  className="form-input"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  autoComplete="email"
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="password">Password</label>
                <div className="auth-password-wrapper">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    className="form-input"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleChange}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="auth-password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              <div className="auth-options">
                <label className="auth-remember">
                  <input type="checkbox" />
                  <span>Remember me</span>
                </label>
                <Link to="/forgot-password" className="auth-forgot">
                  Forgot password?
                </Link>
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-lg w-full"
                disabled={loading}
              >
                {loading ? (
                  <span className="btn-loading">
                    <span className="btn-loading__spinner" />
                    Signing in...
                  </span>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            <div className="auth-footer">
              <p>
                Don't have an account?{' '}
                <Link to="/register" className="auth-link">Create Account</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

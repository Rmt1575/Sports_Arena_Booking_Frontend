import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API from '../../api/axios';
import toast from 'react-hot-toast';
import './Auth.css';

const ForgotPassword = () => {
  const [step, setStep] = useState(1); // 1=email, 2=otp, 3=newPassword
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!email) return toast.error('Enter your email');
    setLoading(true);
    try {
      await API.post('/users/forgot-password', { email });
      toast.success('OTP sent to your email');
      setStep(2);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp) return toast.error('Enter the OTP');
    setLoading(true);
    try {
      await API.post('/users/verify-otp', { email, otp });
      toast.success('OTP verified!');
      setStep(3);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) return toast.error('Passwords do not match');
    if (newPassword.length < 6) return toast.error('Min 6 characters');
    setLoading(true);
    try {
      await API.post('/users/reset-password', { email, otp, newPassword });
      toast.success('Password reset successfully!');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reset failed');
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

      <div className="auth-container auth-container--centered">
        <div className="auth-form-panel auth-form-panel--solo">
          <div className="auth-form-wrapper">
            <div className="auth-form__header">
              <div className="auth-brand__logo auth-brand__logo--sm">
                <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M24 4L42 13V35L24 44L6 35V13L24 4Z" fill="#e8612d" opacity="0.9"/>
                  <path d="M24 12L33 17V29L24 34L15 29V17L24 12Z" fill="#080d1a" opacity="0.85"/>
                  <circle cx="24" cy="23" r="4.5" fill="#e8612d"/>
                </svg>
              </div>
              <h2 className="auth-form__title">
                {step === 1 && 'Forgot Password'}
                {step === 2 && 'Verify OTP'}
                {step === 3 && 'Reset Password'}
              </h2>
              <p className="auth-form__desc">
                {step === 1 && "Enter your email and we'll send a verification code"}
                {step === 2 && `Enter the 6-digit OTP sent to ${email}`}
                {step === 3 && 'Create your new password'}
              </p>
            </div>

            {step === 1 && (
              <form className="auth-form animate-fade-in" onSubmit={handleSendOtp}>
                <div className="form-group">
                  <label className="form-label" htmlFor="fp-email">Email Address</label>
                  <input id="fp-email" type="email" className="form-input" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <button type="submit" className="btn btn-primary btn-lg w-full" disabled={loading}>
                  {loading ? 'Sending...' : 'Send OTP'}
                </button>
              </form>
            )}

            {step === 2 && (
              <form className="auth-form animate-fade-in" onSubmit={handleVerifyOtp}>
                <div className="form-group">
                  <label className="form-label" htmlFor="otp">Verification Code</label>
                  <input id="otp" type="text" className="form-input form-input--otp" placeholder="Enter 6-digit OTP" maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value)} />
                </div>
                <button type="submit" className="btn btn-primary btn-lg w-full" disabled={loading}>
                  {loading ? 'Verifying...' : 'Verify OTP'}
                </button>
              </form>
            )}

            {step === 3 && (
              <form className="auth-form animate-fade-in" onSubmit={handleResetPassword}>
                <div className="form-group">
                  <label className="form-label" htmlFor="new-pass">New Password</label>
                  <input id="new-pass" type="password" className="form-input" placeholder="Min 6 characters" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="confirm-pass">Confirm Password</label>
                  <input id="confirm-pass" type="password" className="form-input" placeholder="Re-enter password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                </div>
                <button type="submit" className="btn btn-primary btn-lg w-full" disabled={loading}>
                  {loading ? 'Resetting...' : 'Reset Password'}
                </button>
              </form>
            )}

            <div className="auth-footer">
              <p>
                <Link to="/login" className="auth-link">← Back to Sign In</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;

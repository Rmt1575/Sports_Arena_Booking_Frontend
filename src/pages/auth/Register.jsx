import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import './Auth.css';

const Register = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'Player',
    phone_no: '',
    // Player fields
    gender: '',
    date_of_birth: '',
    preferred_sport: '',
    skill_level: 'Beginner',
    emergency_contact: '',
    // Trainer fields
    specialization: '',
    experience_years: '',
    availability: '',
    fee_per_session: '',
    // Manager fields
    office_address: '',
  });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validateStep1 = () => {
    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      toast.error('Please fill in all fields');
      return false;
    }
    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep1()) setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Build payload based on role
    const payload = {
      name: formData.name,
      email: formData.email,
      password: formData.password,
      role: formData.role,
      phone_no: formData.phone_no,
    };

    if (formData.role === 'Player') {
      Object.assign(payload, {
        gender: formData.gender,
        date_of_birth: formData.date_of_birth,
        preferred_sport: formData.preferred_sport,
        skill_level: formData.skill_level,
        emergency_contact: formData.emergency_contact,
      });
    } else if (formData.role === 'Trainer') {
      Object.assign(payload, {
        specialization: formData.specialization,
        experience_years: Number(formData.experience_years),
        availability: formData.availability,
        fee_per_session: Number(formData.fee_per_session),
      });
    } else if (formData.role === 'Arena Manager') {
      payload.office_address = formData.office_address;
    }

    try {
      await register(payload);
      toast.success('Account created! Please login.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const sports = [
    'Cricket', 'Football', 'Badminton', 'Tennis', 'Basketball',
    'Volleyball', 'Table Tennis', 'Swimming', 'Boxing', 'Yoga',
  ];

  return (
    <div className="auth-page">
      <div className="auth-bg">
        <div className="auth-bg__gradient" />
        <div className="auth-bg__grid" />
      </div>

      <div className="auth-container">
        {/* Brand */}
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
              Join thousands of athletes, trainers, and managers on the premier sports platform.
            </p>

            {/* Progress indicator */}
            <div className="auth-brand__steps">
              <div className={`auth-brand__step ${step >= 1 ? 'auth-brand__step--active' : ''}`}>
                <div className="auth-brand__step-num">1</div>
                <span>Account Info</span>
              </div>
              <div className="auth-brand__step-line" />
              <div className={`auth-brand__step ${step >= 2 ? 'auth-brand__step--active' : ''}`}>
                <div className="auth-brand__step-num">2</div>
                <span>Role Details</span>
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="auth-form-panel">
          <div className="auth-form-wrapper">
            <div className="auth-form__header">
              <h2 className="auth-form__title">
                {step === 1 ? 'Create Account' : 'Complete Profile'}
              </h2>
              <p className="auth-form__desc">
                {step === 1
                  ? 'Enter your basic information to get started'
                  : `Fill in your ${formData.role} details`}
              </p>
            </div>

            <form className="auth-form" onSubmit={handleSubmit}>
              {step === 1 && (
                <div className="auth-form__step animate-fade-in">
                  <div className="form-group">
                    <label className="form-label" htmlFor="name">Full Name</label>
                    <input id="name" type="text" name="name" className="form-input" placeholder="John Doe" value={formData.name} onChange={handleChange} />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="reg-email">Email Address</label>
                    <input id="reg-email" type="email" name="email" className="form-input" placeholder="you@example.com" value={formData.email} onChange={handleChange} />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label" htmlFor="reg-password">Password</label>
                      <input id="reg-password" type="password" name="password" className="form-input" placeholder="Min 6 characters" value={formData.password} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                      <label className="form-label" htmlFor="confirmPassword">Confirm</label>
                      <input id="confirmPassword" type="password" name="confirmPassword" className="form-input" placeholder="Re-enter" value={formData.confirmPassword} onChange={handleChange} />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="role">I am a</label>
                    <select id="role" name="role" className="form-select" value={formData.role} onChange={handleChange}>
                      <option value="Player">Player</option>
                      <option value="Trainer">Trainer</option>
                      <option value="Arena Manager">Arena Manager</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="phone_no">Phone Number</label>
                    <input id="phone_no" type="tel" name="phone_no" className="form-input" placeholder="10-digit number" value={formData.phone_no} onChange={handleChange} />
                  </div>

                  <button type="button" className="btn btn-primary btn-lg w-full" onClick={handleNext}>
                    Continue →
                  </button>
                </div>
              )}

              {step === 2 && (
                <div className="auth-form__step animate-fade-in">
                  {formData.role === 'Player' && (
                    <>
                      <div className="form-row">
                        <div className="form-group">
                          <label className="form-label">Gender</label>
                          <select name="gender" className="form-select" value={formData.gender} onChange={handleChange}>
                            <option value="">Select</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                        <div className="form-group">
                          <label className="form-label">Date of Birth</label>
                          <input type="date" name="date_of_birth" className="form-input" value={formData.date_of_birth} onChange={handleChange} />
                        </div>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Preferred Sport</label>
                        <select name="preferred_sport" className="form-select" value={formData.preferred_sport} onChange={handleChange}>
                          <option value="">Select a sport</option>
                          {sports.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Skill Level</label>
                        <select name="skill_level" className="form-select" value={formData.skill_level} onChange={handleChange}>
                          <option value="Beginner">Beginner</option>
                          <option value="Intermediate">Intermediate</option>
                          <option value="Advanced">Advanced</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Emergency Contact</label>
                        <input type="tel" name="emergency_contact" className="form-input" placeholder="Emergency phone" value={formData.emergency_contact} onChange={handleChange} />
                      </div>
                    </>
                  )}

                  {formData.role === 'Trainer' && (
                    <>
                      <div className="form-group">
                        <label className="form-label">Specialization</label>
                        <input type="text" name="specialization" className="form-input" placeholder="e.g. Cricket Batting Coach" value={formData.specialization} onChange={handleChange} />
                      </div>
                      <div className="form-row">
                        <div className="form-group">
                          <label className="form-label">Experience (Years)</label>
                          <input type="number" name="experience_years" className="form-input" placeholder="5" value={formData.experience_years} onChange={handleChange} />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Fee/Session (₹)</label>
                          <input type="number" name="fee_per_session" className="form-input" placeholder="500" value={formData.fee_per_session} onChange={handleChange} />
                        </div>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Availability</label>
                        <input type="text" name="availability" className="form-input" placeholder="Mon-Fri, 9AM-5PM" value={formData.availability} onChange={handleChange} />
                      </div>
                    </>
                  )}

                  {formData.role === 'Arena Manager' && (
                    <div className="form-group">
                      <label className="form-label">Office Address</label>
                      <input type="text" name="office_address" className="form-input" placeholder="Full office address" value={formData.office_address} onChange={handleChange} />
                    </div>
                  )}

                  <div className="auth-form__actions">
                    <button type="button" className="btn btn-secondary" onClick={() => setStep(1)}>
                      ← Back
                    </button>
                    <button type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{ flex: 1 }}>
                      {loading ? 'Creating Account...' : 'Create Account'}
                    </button>
                  </div>
                </div>
              )}
            </form>

            <div className="auth-footer">
              <p>
                Already have an account?{' '}
                <Link to="/login" className="auth-link">Sign In</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;

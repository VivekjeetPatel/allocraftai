import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../../firebase/config';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Container, Form, Button, Card, Alert, ProgressBar, Spinner } from 'react-bootstrap';
import { toast } from 'react-toastify';

export default function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('volunteer');
  const [error, setError] = useState('');
  const [isSigningUp, setIsSigningUp] = useState(false);
  const navigate = useNavigate();

  // Password strength calculation
  const getPasswordStrength = () => {
    if (!password) return 0;
    let strength = 0;
    if (password.length >= 6) strength += 20;
    if (password.length >= 8) strength += 20;
    if (password.length >= 12) strength += 20;
    if (/[A-Z]/.test(password)) strength += 20;
    if (/[0-9]/.test(password)) strength += 20;
    return Math.min(strength, 100);
  };

  const getPasswordStrengthLabel = () => {
    const strength = getPasswordStrength();
    if (strength === 0) return '';
    if (strength < 40) return '🔴 Weak';
    if (strength < 70) return '🟡 Fair';
    return '🟢 Strong';
  };

  const validateForm = () => {
    if (!email || !password || !confirmPassword || !name) {
      setError('All fields are required');
      return false;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    if (!email.includes('@')) {
      setError('Please enter a valid email');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setError('');
      setIsSigningUp(true);

      // Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;

      // Create Firestore user document
      await setDoc(doc(db, 'users', uid), {
        uid: uid,
        email: email,
        name: name,
        role: role,
        createdAt: serverTimestamp(),
        projectIds: [],
        skills: [],
        status: 'active'
      });

      toast.success(`Account created successfully! Welcome, ${name}! 🎉`);
      
      // Redirect to profile
      setTimeout(() => {
        navigate('/profile');
      }, 1500);
    } catch (err) {
      console.error('Signup error:', err);
      
      // Handle specific Firebase errors
      if (err.code === 'auth/email-already-in-use') {
        setError('This email is already registered. Try logging in instead.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Invalid email address.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password is too weak. Use at least 6 characters.');
      } else {
        setError('Failed to create account. Please try again.');
      }
      toast.error('Signup failed');
    } finally {
      setIsSigningUp(false);
    }
  };

  const formProgress = Math.round(((name ? 25 : 0) + (email ? 25 : 0) + (password ? 25 : 0) + (confirmPassword ? 25 : 0)) / 4);

  return (
    <Container className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', paddingTop: '2rem', paddingBottom: '2rem' }}>
      <div className="w-100" style={{ maxWidth: '500px' }}>
        {/* Header */}
        <div className="text-center mb-5">
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✨</div>
          <h2 className="brand-text m-0" style={{ fontWeight: '800', color: 'white', fontSize: '2rem', marginBottom: '0.5rem' }}>Allocraft AI</h2>
          <p className="text-white" style={{ fontSize: '0.95rem', opacity: 0.9 }}>Join Our Community of Volunteers 🚀</p>
        </div>

        {/* Main Card */}
        <Card className="shadow-lg border-0" style={{ borderRadius: '24px', overflow: 'hidden', background: 'rgba(255, 255, 255, 0.12)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255, 255, 255, 0.25)' }}>
          <Card.Body className="p-5" style={{ background: 'rgba(255, 255, 255, 0.95)' }}>
            {/* Title */}
            <h5 className="text-center mb-2 fw-bold text-dark" style={{ fontSize: '1.3rem' }}>
              📝 Create Your Account
            </h5>
            <p className="text-center text-muted small mb-4">Join us and start making a difference</p>

            {/* Progress Bar */}
            {formProgress > 0 && formProgress < 100 && (
              <div className="mb-4">
                <small className="text-muted d-block mb-2">Profile completion: {formProgress}%</small>
                <ProgressBar 
                  now={formProgress} 
                  className="rounded-pill" 
                  style={{ height: '6px', backgroundColor: '#e5e7eb' }}
                  variant="success"
                />
              </div>
            )}

            {/* Error Alert */}
            {error && (
              <Alert 
                variant="danger" 
                className="border-0 shadow-sm rounded-4 small mb-4 d-flex align-items-center"
                style={{ backgroundColor: 'rgba(220, 53, 69, 0.1)', borderLeft: '4px solid #dc3545' }}
              >
                <span style={{ fontSize: '1.2rem', marginRight: '0.75rem' }}>⚠️</span>
                {error}
              </Alert>
            )}
            
            <Form onSubmit={handleSubmit}>
              {/* Name Field */}
              <Form.Group className="mb-4" controlId="name">
                <Form.Label className="small fw-semibold text-secondary mb-2 d-block">
                  👤 Full Name
                </Form.Label>
                <Form.Control 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  required 
                  placeholder="Enter your full name"
                  className="border-2"
                  style={{ 
                    background: 'rgba(255,255,255,0.8)',
                    borderColor: name ? '#0d6efd' : '#d1d5db',
                    borderRadius: '12px',
                    padding: '0.75rem 1rem',
                    transition: 'all 0.3s ease'
                  }}
                  disabled={isSigningUp}
                />
                {name && <small className="text-success d-block mt-1">✅ Name added</small>}
              </Form.Group>

              {/* Email Field */}
              <Form.Group className="mb-4" controlId="email">
                <Form.Label className="small fw-semibold text-secondary mb-2 d-block">
                  📧 Email Address
                </Form.Label>
                <Form.Control 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  required 
                  placeholder="your.email@example.com"
                  className="border-2"
                  style={{ 
                    background: 'rgba(255,255,255,0.8)',
                    borderColor: email ? '#0d6efd' : '#d1d5db',
                    borderRadius: '12px',
                    padding: '0.75rem 1rem',
                    transition: 'all 0.3s ease'
                  }}
                  disabled={isSigningUp}
                />
                {email && email.includes('@') && <small className="text-success d-block mt-1">✅ Valid email</small>}
              </Form.Group>

              {/* Role Selection */}
              <Form.Group className="mb-4" controlId="role">
                <Form.Label className="small fw-semibold text-secondary mb-2 d-block">
                  🎯 Your Role
                </Form.Label>
                <Form.Select 
                  value={role} 
                  onChange={(e) => setRole(e.target.value)} 
                  className="border-2"
                  style={{ 
                    background: 'rgba(255,255,255,0.8)',
                    borderColor: '#0d6efd',
                    borderRadius: '12px',
                    padding: '0.75rem 1rem',
                    transition: 'all 0.3s ease'
                  }}
                  disabled={isSigningUp}
                >
                  <option value="volunteer">👤 Volunteer</option>
                  <option value="volunteerHead">👨‍🏫 Volunteer Head</option>
                  <option value="admin">👨‍💼 Administrator</option>
                </Form.Select>
                <small className="text-muted d-block mt-2">
                  {role === 'admin' ? '⚠️ Admin accounts require approval' : '✅ Your role can be changed later'}
                </small>
              </Form.Group>

              {/* Password Field */}
              <Form.Group className="mb-4" controlId="password">
                <Form.Label className="small fw-semibold text-secondary mb-2 d-block">
                  🔐 Password
                </Form.Label>
                <Form.Control 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  required 
                  placeholder="6+ characters"
                  className="border-2"
                  style={{ 
                    background: 'rgba(255,255,255,0.8)',
                    borderColor: password ? '#0d6efd' : '#d1d5db',
                    borderRadius: '12px',
                    padding: '0.75rem 1rem',
                    transition: 'all 0.3s ease'
                  }}
                  disabled={isSigningUp}
                />
                {password && (
                  <div className="mt-2">
                    <small className="d-block mb-1">Strength: <strong>{getPasswordStrengthLabel()}</strong></small>
                    <ProgressBar 
                      now={getPasswordStrength()} 
                      className="rounded-pill"
                      style={{ height: '4px', backgroundColor: '#e5e7eb' }}
                      variant={getPasswordStrength() < 40 ? 'danger' : getPasswordStrength() < 70 ? 'warning' : 'success'}
                    />
                  </div>
                )}
              </Form.Group>

              {/* Confirm Password Field */}
              <Form.Group className="mb-5" controlId="confirmPassword">
                <Form.Label className="small fw-semibold text-secondary mb-2 d-block">
                  ✅ Confirm Password
                </Form.Label>
                <Form.Control 
                  type="password" 
                  value={confirmPassword} 
                  onChange={(e) => setConfirmPassword(e.target.value)} 
                  required 
                  placeholder="Confirm password"
                  className="border-2"
                  style={{ 
                    background: 'rgba(255,255,255,0.8)',
                    borderColor: confirmPassword && password === confirmPassword ? '#28a745' : confirmPassword && password !== confirmPassword ? '#dc3545' : '#d1d5db',
                    borderRadius: '12px',
                    padding: '0.75rem 1rem',
                    transition: 'all 0.3s ease'
                  }}
                  disabled={isSigningUp}
                />
                {confirmPassword && (
                  <small className={password === confirmPassword ? 'text-success' : 'text-danger'} style={{ display: 'block', marginTop: '0.5rem' }}>
                    {password === confirmPassword ? '✅ Passwords match' : '❌ Passwords do not match'}
                  </small>
                )}
              </Form.Group>

              {/* Submit Button */}
              <Button 
                disabled={isSigningUp || !name || !email || !password || !confirmPassword || password !== confirmPassword} 
                className="w-100 py-3 shadow mb-3 fw-bold"
                type="submit"
                style={{
                  borderRadius: '12px',
                  fontSize: '1rem',
                  letterSpacing: '0.5px',
                  background: isSigningUp ? '#6c757d' : 'linear-gradient(135deg, #28a745, #20c997)',
                  border: 'none',
                  color: 'white',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={e => {
                  if (!isSigningUp && name && email && password && confirmPassword && password === confirmPassword) {
                    e.currentTarget.style.background = 'linear-gradient(135deg, #20c997, #28a745)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 12px 24px rgba(40, 167, 69, 0.3)';
                  }
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #28a745, #20c997)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '';
                }}
              >
                {isSigningUp ? (
                  <>
                    <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                    Creating Account...
                  </>
                ) : (
                  '🚀 Create My Account'
                )}
              </Button>

              {/* Terms */}
              <small className="text-muted text-center d-block" style={{ lineHeight: '1.6' }}>
                By signing up, you agree to our terms of service and privacy policy
              </small>
            </Form>

            {/* Divider */}
            <div className="my-4" style={{ borderTop: '1px solid rgba(0,0,0,0.1)' }}></div>

            {/* Login Link */}
            <div className="text-center">
              <small className="text-muted">
                Already have an account?{' '}
                <a 
                  href="/login" 
                  className="text-primary fw-bold text-decoration-none"
                  style={{ transition: 'all 0.2s ease' }}
                  onMouseEnter={e => e.currentTarget.style.opacity = '0.7'}
                  onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                >
                  Log in here →
                </a>
              </small>
            </div>
          </Card.Body>
        </Card>

        {/* Footer Info */}
        <div className="text-center mt-5 text-muted small">
          <p style={{ lineHeight: '1.8' }}>
            🌍 Allocraft AI is a smart resource management platform<br />
            for NGOs and volunteer organizations worldwide
          </p>
        </div>
      </div>
    </Container>
  );
}

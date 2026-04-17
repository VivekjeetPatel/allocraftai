import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';
import { Container, Form, Button, Card, Alert } from 'react-bootstrap';
import { toast } from 'react-toastify';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState('volunteer'); // Default role selection
  const [error, setError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const navigate = useNavigate();
  const { currentUser, role, loading } = useAuth();

  useEffect(() => {
    // If logged in and role is resolved, redirect automatically
    if (currentUser && !loading) {
      if (role === null) {
        setError('Access Pending: Your account exists, but no role has been assigned yet.');
        return;
      }

      // Check if selected role matches the database role
      if (role !== selectedRole) {
        setError(`Access Denied: You are registered as a ${role}, but you selected ${selectedRole}. Please select the correct role.`);
        return;
      }

      // Successful match, redirect
      if (role === 'admin') navigate('/admin');
      else if (role === 'volunteerHead') navigate('/volunteer-head');
      else if (role === 'volunteer') navigate('/volunteer');
    }
  }, [currentUser, role, loading, navigate, selectedRole]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setIsLoggingIn(true);
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      console.error(err);
      setError('Failed to log in. Check your credentials.');
      toast.error('Login failed.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <Container className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <div className="w-100" style={{ maxWidth: '420px' }}>
        <div className="text-center mb-5">
           <h2 className="brand-text m-0" style={{ fontWeight: '800', color: 'white', fontSize: '2.5rem' }}>Allocraft AI</h2>
           <p className="text-white mt-2" style={{ opacity: 0.9 }}>Smart Resource Management</p>
        </div>
        <Card className="glass-card shadow-lg p-3" style={{ background: 'rgba(255, 255, 255, 0.12)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255, 255, 255, 0.25)' }}>
          <Card.Body className="p-5">
            <h5 className="text-center mb-4 fw-bold" style={{ color: 'white', fontSize: '1.3rem' }}>Welcome Back</h5>
            {error && <Alert variant="danger" className="border-0 shadow-sm rounded-4 small" style={{ background: 'rgba(220, 53, 69, 0.9)', color: 'white', borderRadius: '12px' }}>{error}</Alert>}
            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3" controlId="email">
                <Form.Label className="fw-semibold text-white mb-2">Email Address</Form.Label>
                <Form.Control 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  required 
                  placeholder="Enter your email"
                  className="bg-white border-0"
                  style={{ borderRadius: '10px', padding: '0.75rem', fontSize: '1rem' }}
                />
              </Form.Group>
              <Form.Group className="mb-3" controlId="role">
                <Form.Label className="fw-semibold text-white mb-2">Your Role</Form.Label>
                <Form.Select 
                  value={selectedRole} 
                  onChange={(e) => setSelectedRole(e.target.value)} 
                  className="bg-white border-0"
                  style={{ borderRadius: '10px', padding: '0.75rem', fontSize: '1rem' }}
                >
                  <option value="volunteer">Volunteer</option>
                  <option value="volunteerHead">Volunteer Head</option>
                  <option value="admin">Administrator</option>
                </Form.Select>
              </Form.Group>
              <Form.Group className="mb-5" controlId="password">
                <Form.Label className="fw-semibold text-white mb-2">Password</Form.Label>
                <Form.Control 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  required 
                  placeholder="Enter your password"
                  className="bg-white border-0"
                  style={{ borderRadius: '10px', padding: '0.75rem', fontSize: '1rem' }}
                />
              </Form.Group>
              <Button 
                disabled={isLoggingIn} 
                className="w-100 py-3 shadow fw-bold" 
                type="submit" 
                style={{
                  background: 'linear-gradient(135deg, #28a745, #20c997)',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '1.1rem',
                  color: 'white',
                  transition: 'all 0.3s ease'
                }}
              >
                {isLoggingIn ? '🔄 Signing in...' : '✨ Sign In'}
              </Button>
            </Form>
            <div className="text-center mt-4">
              <p className="text-white" style={{ opacity: 0.9 }}>
                Don't have an account?{' '}
                <a 
                  href="/signup" 
                  className="fw-bold"
                  style={{ color: '#20c997', textDecoration: 'none', transition: 'all 0.2s' }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#28a745'}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#20c997'}
                >
                  Sign up here
                </a>
              </p>
            </div>
          </Card.Body>
        </Card>
      </div>
    </Container>
  );
}

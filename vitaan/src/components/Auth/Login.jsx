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
    <Container className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh', background: 'transparent' }}>
      <div className="w-100" style={{ maxWidth: '420px' }}>
        <div className="text-center mb-5">
           <h2 className="brand-text m-0" style={{ fontWeight: '800', color: '#1f2937', fontSize: '2.5rem' }}>Allocraft AI</h2>
           <p className="text-muted mt-2">Smart Resource Management Node</p>
        </div>
        <Card className="glass-card shadow-lg p-3">
          <Card.Body className="p-4">
            <h5 className="text-center mb-4 fw-bold text-dark">System Authentication</h5>
            {error && <Alert variant="danger" className="border-0 shadow-sm rounded-4 small">{error}</Alert>}
            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3" controlId="email">
                <Form.Label className="small fw-semibold text-secondary mb-1">Electronic Mail</Form.Label>
                <Form.Control 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  required 
                  placeholder="Enter email address"
                  className="bg-white"
                />
              </Form.Group>
              <Form.Group className="mb-3" controlId="role">
                <Form.Label className="small fw-semibold text-secondary mb-1">Access Protocol</Form.Label>
                <Form.Select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)} className="bg-white">
                  <option value="volunteer">Volunteer Agent</option>
                  <option value="volunteerHead">Division Head</option>
                  <option value="admin">System Administrator</option>
                </Form.Select>
              </Form.Group>
              <Form.Group className="mb-5" controlId="password">
                <Form.Label className="small fw-semibold text-secondary mb-1">Security Key</Form.Label>
                <Form.Control 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  required 
                  placeholder="Password"
                  className="bg-white"
                />
              </Form.Group>
              <Button disabled={isLoggingIn} className="w-100 py-3 shadow" type="submit" variant="dark">
                {isLoggingIn ? 'Authenticating...' : 'Establish Secure Connection'}
              </Button>
            </Form>
            <div className="text-center mt-4 text-muted small px-3">
              Contact your System Administrator if you haven't received your security clearance.
            </div>
          </Card.Body>
        </Card>
      </div>
    </Container>
  );
}

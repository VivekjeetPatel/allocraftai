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
    <Container className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh', backgroundColor: '#f4f6f9' }}>
      <div className="w-100" style={{ maxWidth: '400px' }}>
        <h2 className="text-center mb-4" style={{ fontWeight: '700', color: '#2c3e50' }}>Smart Resource Allocation</h2>
        <Card className="shadow-lg border-0 rounded-lg">
          <Card.Body className="p-4">
            <h4 className="text-center mb-4">Log In</h4>
            {error && <Alert variant="danger">{error}</Alert>}
            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3" controlId="email">
                <Form.Label>Email</Form.Label>
                <Form.Control 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  required 
                  placeholder="Enter email"
                />
              </Form.Group>
              <Form.Group className="mb-3" controlId="role">
                <Form.Label>Select Your Role</Form.Label>
                <Form.Select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)}>
                  <option value="volunteer">Volunteer</option>
                  <option value="volunteerHead">Volunteer Head</option>
                  <option value="admin">Admin</option>
                </Form.Select>
              </Form.Group>
              <Form.Group className="mb-4" controlId="password">
                <Form.Label>Password</Form.Label>
                <Form.Control 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  required 
                  placeholder="Password"
                />
              </Form.Group>
              <Button disabled={isLoggingIn} className="w-100 mb-2 py-2" type="submit" variant="primary" style={{ fontWeight: '600' }}>
                {isLoggingIn ? 'Logging in...' : 'Sign In'}
              </Button>
            </Form>
            <div className="text-center mt-3 text-muted small">
              Please ensure you select the role assigned to you by the Admin.
            </div>
          </Card.Body>
        </Card>
      </div>
    </Container>
  );
}

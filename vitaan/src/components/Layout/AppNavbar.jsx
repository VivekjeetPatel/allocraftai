import React from 'react';
import { Navbar, Container, Button, Nav } from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext';
import { auth } from '../../firebase/config';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

export default function AppNavbar({ toggleSidebar }) {
  const { currentUser, role } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  return (
    <Navbar bg="white" expand="lg" className="shadow-sm mb-4 px-3" style={{ borderBottom: '1px solid #eaeaea' }}>
      <Container fluid className="px-0">
        <Button variant="light" className="d-md-none me-2" onClick={toggleSidebar}>
          ☰
        </Button>
        <Navbar.Brand className="fw-bold" style={{ color: '#2c3e50' }}>Resource Allocation</Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav" className="justify-content-end">
          <Nav className="align-items-center">
            <span className="me-3 text-muted">
              {currentUser?.name || currentUser?.email} ({role})
            </span>
            <Button variant="outline-danger" size="sm" onClick={handleLogout} style={{ fontWeight: '600' }}>
              Log Out
            </Button>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

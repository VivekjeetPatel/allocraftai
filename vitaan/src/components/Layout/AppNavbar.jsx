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
    <Navbar expand="lg" className="glass-panel mb-4 px-4 py-3" style={{ borderRadius: 'var(--pill-radius)', border: '1px solid rgba(255,255,255,0.8)' }}>
      <Container fluid className="px-0">
        <Button variant="outline-secondary" className="d-md-none me-3 border-0" onClick={toggleSidebar}>
          ☰
        </Button>
        <Navbar.Brand className="brand-text fw-bold m-0" style={{ color: '#1f2937' }}>
           NGO <span className="text-secondary fw-normal">Allocraft AI</span>
        </Navbar.Brand>
        <div className="d-flex align-items-center ms-auto">
            <div className="d-none d-md-flex align-items-center bg-white px-3 py-1 me-3 shadow-sm border" style={{ borderRadius: 'var(--pill-radius)' }}>
               <span className="text-dark fw-medium small me-1">{currentUser?.name || currentUser?.email}</span>
               <span className="badge bg-light text-secondary border">{role}</span>
            </div>
            <Button variant="dark" size="sm" onClick={handleLogout} className="px-4 shadow-sm" style={{ borderRadius: 'var(--pill-radius)' }}>
              Log Out
            </Button>
        </div>
      </Container>
    </Navbar>
  );
}

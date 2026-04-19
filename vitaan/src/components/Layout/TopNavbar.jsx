import React from 'react';
import { Navbar, Container, Nav, Button } from 'react-bootstrap';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function AppNavbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, logout } = useAuth();

  // Don't show navbar on auth pages
  const isAuthPage = ['/login', '/signup', '/'].includes(location.pathname);

  if (isAuthPage) return null;

  return (
    <Navbar 
      expand="lg" 
      sticky="top"
      className="shadow-sm"
      style={{
        background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
        borderBottom: '1px solid rgba(0,0,0,0.05)'
      }}
    >
      <Container>
        <Navbar.Brand 
          onClick={() => navigate('/')} 
          style={{ cursor: 'pointer', fontWeight: '800', fontSize: '1.3rem' }}
          className="text-dark"
        >
          🚀 Allocraft AI
        </Navbar.Brand>
        
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto d-flex align-items-center gap-2">
            {currentUser ? (
              <>
                <NavLink 
                  to="/chat" 
                  className="nav-link fw-semibold text-dark"
                  style={{ transition: 'all 0.2s' }}
                >
                  💬 Chat
                </NavLink>
                
                <NavLink 
                  to="/profile" 
                  className="nav-link fw-semibold text-dark"
                  style={{ transition: 'all 0.2s' }}
                >
                  👤 {currentUser?.name || 'Profile'}
                </NavLink>
                
                <Button
                  variant="outline-danger"
                  size="sm"
                  onClick={logout}
                  className="fw-semibold"
                >
                  🚪 Sign Out
                </Button>
              </>
            ) : (
              <>
                <NavLink 
                  to="/login" 
                  className="nav-link fw-semibold text-dark"
                  style={{ transition: 'all 0.2s' }}
                >
                  🔐 Sign In
                </NavLink>
                
                <Button
                  onClick={() => navigate('/signup')}
                  className="fw-bold px-4"
                  style={{
                    background: 'linear-gradient(135deg, #28a745, #20c997)',
                    border: 'none',
                    borderRadius: '8px',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 8px 16px rgba(40, 167, 69, 0.3)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  ✨ Sign Up
                </Button>
              </>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

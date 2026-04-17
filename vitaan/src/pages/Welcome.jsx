import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Button, Card, Navbar, Nav } from 'react-bootstrap';
import './Welcome.css';

export default function Welcome() {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      {/* Top Navbar */}
      <Navbar expand="lg" className="px-0 py-3" style={{ background: 'rgba(0,0,0,0.1)' }}>
        <Container>
          <Navbar.Brand 
            className="fw-bold text-white"
            style={{ fontSize: '1.5rem', cursor: 'pointer' }}
            onClick={() => navigate('/')}
          >
            🚀 Allocraft AI
          </Navbar.Brand>
          
          <Navbar.Toggle aria-controls="navbar-nav" />
          
          <Navbar.Collapse id="navbar-nav">
            <Nav className="ms-auto gap-3">
              <Nav.Link 
                onClick={() => navigate('/login')} 
                className="fw-semibold text-white"
                style={{ transition: 'all 0.2s' }}
              >
                🔐 Sign In
              </Nav.Link>
              
              <Button
                onClick={() => navigate('/signup')}
                className="fw-bold"
                style={{
                  background: 'linear-gradient(135deg, #28a745, #20c997)',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '0.5rem 1.5rem',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.3)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                ✨ Sign Up
              </Button>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      {/* Main Content */}
      <div style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
        <Container>
        {/* Header */}
        <Row className="align-items-center mb-5">
          <Col md={12}>
            <div className="text-center text-white mb-5">
              <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>🚀</div>
              <h1 className="fw-bold" style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>
                Allocraft AI
              </h1>
              <p style={{ fontSize: '1.3rem', opacity: 0.95, marginBottom: '2rem' }}>
                Smart Resource Management for NGOs & Volunteer Organizations
              </p>
              <p style={{ fontSize: '1rem', opacity: 0.85 }}>
                Efficiently manage projects, assign tasks, and empower your volunteer team with AI-powered insights
              </p>
            </div>
          </Col>
        </Row>

        {/* Features */}
        <Row className="mb-5 g-4">
          <Col md={4}>
            <Card className="h-100 border-0 shadow-lg glass-card" style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }}>
              <Card.Body className="text-center text-white p-4">
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📋</div>
                <h5 className="fw-bold mb-3">Task Management</h5>
                <p style={{ fontSize: '0.95rem', opacity: 0.9 }}>
                  Create, assign, and track tasks with ease. Monitor progress in real-time.
                </p>
              </Card.Body>
            </Card>
          </Col>

          <Col md={4}>
            <Card className="h-100 border-0 shadow-lg glass-card" style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }}>
              <Card.Body className="text-center text-white p-4">
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🤖</div>
                <h5 className="fw-bold mb-3">AI-Powered</h5>
                <p style={{ fontSize: '0.95rem', opacity: 0.9 }}>
                  Leverage Gemini AI for smart task analysis and volunteer assignments.
                </p>
              </Card.Body>
            </Card>
          </Col>

          <Col md={4}>
            <Card className="h-100 border-0 shadow-lg glass-card" style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }}>
              <Card.Body className="text-center text-white p-4">
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👥</div>
                <h5 className="fw-bold mb-3">Team Collaboration</h5>
                <p style={{ fontSize: '0.95rem', opacity: 0.9 }}>
                  Connect volunteers, share updates, and build stronger teams together.
                </p>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* CTA Section */}
        <Row className="justify-content-center">
          <Col md={8} lg={6}>
            <div className="text-center">
              <h3 className="text-white fw-bold mb-4">Ready to Get Started?</h3>
              <div className="d-grid gap-3 d-sm-flex justify-content-center">
                <Button
                  onClick={() => navigate('/signup')}
                  size="lg"
                  className="fw-bold shadow-lg px-5"
                  style={{
                    background: 'linear-gradient(135deg, #28a745, #20c997)',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '1.1rem',
                    padding: '0.75rem 2.5rem',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-3px)';
                    e.currentTarget.style.boxShadow = '0 16px 32px rgba(0,0,0,0.3)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.15)';
                  }}
                >
                  ✨ Sign Up Now
                </Button>

                <Button
                  onClick={() => navigate('/login')}
                  size="lg"
                  className="fw-bold shadow-lg px-5"
                  style={{
                    background: 'rgba(255,255,255,0.2)',
                    border: '2px solid white',
                    color: 'white',
                    borderRadius: '12px',
                    fontSize: '1.1rem',
                    padding: '0.75rem 2.5rem',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.3)';
                    e.currentTarget.style.transform = 'translateY(-3px)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  🔐 Sign In
                </Button>
              </div>
            </div>
          </Col>
        </Row>

        {/* Benefits */}
        <Row className="mt-5 pt-5">
          <Col md={6} className="text-white mb-4">
            <div className="d-flex align-items-start mb-4">
              <div style={{ fontSize: '2rem', marginRight: '1rem' }}>⚡</div>
              <div>
                <h5 className="fw-bold mb-2">Fast & Efficient</h5>
                <p style={{ opacity: 0.9 }}>Streamline your workflow with intelligent task management and automated assignments.</p>
              </div>
            </div>
          </Col>

          <Col md={6} className="text-white mb-4">
            <div className="d-flex align-items-start mb-4">
              <div style={{ fontSize: '2rem', marginRight: '1rem' }}>🔒</div>
              <div>
                <h5 className="fw-bold mb-2">Secure & Reliable</h5>
                <p style={{ opacity: 0.9 }}>Your data is protected with Firebase security and enterprise-grade encryption.</p>
              </div>
            </div>
          </Col>

          <Col md={6} className="text-white mb-4">
            <div className="d-flex align-items-start mb-4">
              <div style={{ fontSize: '2rem', marginRight: '1rem' }}>📊</div>
              <div>
                <h5 className="fw-bold mb-2">Insights & Analytics</h5>
                <p style={{ opacity: 0.9 }}>Get AI-powered insights about your projects and team performance.</p>
              </div>
            </div>
          </Col>

          <Col md={6} className="text-white mb-4">
            <div className="d-flex align-items-start mb-4">
              <div style={{ fontSize: '2rem', marginRight: '1rem' }}>🌍</div>
              <div>
                <h5 className="fw-bold mb-2">Global & Scalable</h5>
                <p style={{ opacity: 0.9 }}>Built to scale from small teams to large organizations worldwide.</p>
              </div>
            </div>
          </Col>
        </Row>

        {/* Footer */}
        <Row className="mt-5 pt-5 border-top border-white border-opacity-25">
          <Col md={12}>
            <div className="text-center text-white opacity-75">
              <p style={{ fontSize: '0.95rem', marginBottom: '0.5rem' }}>
                © 2026 Allocraft AI. All rights reserved.
              </p>
              <p style={{ fontSize: '0.85rem' }}>
                Empowering NGOs with intelligent resource management
              </p>
            </div>
          </Col>
        </Row>
        </Container>
      </div>
    </div>
  );
}

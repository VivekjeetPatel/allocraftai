import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import AIChatBox from '../components/AI/ChatBox';

export default function ChatPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '2rem 0', position: 'relative', overflow: 'hidden' }}>
      {/* Animated Background Elements */}
      <div style={{
        position: 'absolute',
        top: '-50%',
        right: '-10%',
        width: '500px',
        height: '500px',
        borderRadius: '50%',
        background: 'rgba(255, 255, 255, 0.1)',
        filter: 'blur(60px)',
        zIndex: 1
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-30%',
        left: '-5%',
        width: '400px',
        height: '400px',
        borderRadius: '50%',
        background: 'rgba(255, 255, 255, 0.08)',
        filter: 'blur(50px)',
        zIndex: 1
      }} />

      <Container style={{ position: 'relative', zIndex: 10 }}>
        {/* Header Section */}
        <Row className="mb-4">
          <Col lg={8} className="mx-auto">
            <div style={{
              textAlign: 'center',
              color: 'white',
              animation: 'fadeInDown 0.6s ease-out'
            }}>
              <h2 style={{
                fontSize: '2.5rem',
                fontWeight: '800',
                marginBottom: '1rem',
                letterSpacing: '-1px'
              }}>
                🤖 AI Assistant
              </h2>
              <p style={{
                fontSize: '1.1rem',
                opacity: 0.9,
                marginBottom: 0,
                fontWeight: '500'
              }}>
                Chat with Gemini AI to get insights, analyze tasks, and make smart decisions
              </p>
            </div>
          </Col>
        </Row>

        {/* Chat Container */}
        <Row>
          <Col lg={8} className="mx-auto">
            <div style={{
              background: 'white',
              borderRadius: '24px',
              overflow: 'hidden',
              boxShadow: '0 25px 50px rgba(0, 0, 0, 0.3)',
              height: '80vh',
              display: 'flex',
              flexDirection: 'column',
              animation: 'bounceIn 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55)'
            }}>
              <AIChatBox />
            </div>
          </Col>
        </Row>
      </Container>

      <style>{`
        @keyframes fadeInDown {
          from {
            opacity: 0;
            transform: translateY(-30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes bounceIn {
          0% {
            opacity: 0;
            transform: scale(0.3);
          }
          50% {
            opacity: 1;
            transform: scale(1.05);
          }
          100% {
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
}

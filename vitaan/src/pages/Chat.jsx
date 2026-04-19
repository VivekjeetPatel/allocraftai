import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import AIChatBox from '../components/AI/ChatBox';

export default function ChatPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)', padding: '2rem 0' }}>
      <Container>
        <Row>
          <Col lg={8} className="mx-auto">
            <div style={{
              background: 'white',
              borderRadius: '16px',
              overflow: 'hidden',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
              height: '80vh',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <AIChatBox />
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
}

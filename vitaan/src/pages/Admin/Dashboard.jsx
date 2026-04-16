import React, { useEffect, useState } from 'react';
import { db } from '../../firebase/config';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { Card, Row, Col, ProgressBar, Badge } from 'react-bootstrap';

export default function AdminDashboard() {
  const [activeProjectsCount, setActiveProjectsCount] = useState(0);
  const [volunteersCount, setVolunteersCount] = useState(0);
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    const qProjects = query(collection(db, 'projects'));
    const unsubProjects = onSnapshot(qProjects, (snapshot) => {
      const projData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProjects(projData);
      setActiveProjectsCount(projData.filter(p => p.status === 'Active').length);
    });

    const qVolunteers = query(collection(db, 'users'), where('role', '==', 'volunteer'));
    const unsubVolunteers = onSnapshot(qVolunteers, (snapshot) => {
      setVolunteersCount(snapshot.size);
    });

    return () => {
      unsubProjects();
      unsubVolunteers();
    };
  }, []);

  return (
    <div>
      <h2 className="mb-4">Admin Dashboard</h2>
      <Row className="mb-4">
        <Col md={6}>
          <Card className="shadow-sm border-0 text-center py-3" style={{ borderLeft: '5px solid #007bff' }}>
            <Card.Body>
              <h5 className="text-muted">Total Active Projects</h5>
              <h1 className="display-4 fw-bold text-primary">{activeProjectsCount}</h1>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6}>
          <Card className="shadow-sm border-0 text-center py-3" style={{ borderLeft: '5px solid #28a745' }}>
            <Card.Body>
              <h5 className="text-muted">Total Volunteers</h5>
              <h1 className="display-4 fw-bold text-success">{volunteersCount}</h1>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Card className="shadow-sm border-0">
        <Card.Body>
          <Card.Title className="mb-3 fw-bold">Ongoing Projects</Card.Title>
          {projects.filter(p => p.status !== 'Archived').map(proj => (
            <div key={proj.id} className="mb-4 p-3 border rounded shadow-sm">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h5 className="m-0">{proj.title}</h5>
                <Badge bg={proj.status === 'Completed' ? 'success' : 'primary'}>{proj.status}</Badge>
              </div>
              <p className="text-muted small mb-2">{proj.description}</p>
              <div className="d-flex justify-content-between small text-muted mb-1">
                <span>Progress</span>
                <span>{Math.round(proj.progress || 0)}%</span>
              </div>
              <ProgressBar now={proj.progress || 0} variant={proj.progress === 100 ? 'success' : 'info'} />
            </div>
          ))}
          {projects.length === 0 && <p className="text-muted">No projects found.</p>}
        </Card.Body>
      </Card>
    </div>
  );
}

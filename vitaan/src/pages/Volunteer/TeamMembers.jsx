import React, { useEffect, useState } from 'react';
import { db } from '../../firebase/config';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { Card, Badge, Spinner, Row, Col } from 'react-bootstrap';

export default function VolunteerTeamMembers() {
  const { currentUser } = useAuth();
  const [teammates, setTeammates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTeammates = async () => {
      try {
        if (!currentUser?.projectIds || currentUser.projectIds.length === 0) {
          setLoading(false);
          return;
        }

        // Fetch all users
        // Real app: we would filter backend, but firestore array-contains-any limits to 10
        const usersSnap = await getDocs(collection(db, 'users'));
        const allUsers = usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const myProjectIds = currentUser.projectIds || [];
        
        // Filter users who share at least one project
        const myTeam = allUsers.filter(user => {
          if (user.id === currentUser.uid) return false;
          if (!user.projectIds) return false;
          return user.projectIds.some(pid => myProjectIds.includes(pid));
        });

        setTeammates(myTeam);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch teammates", err);
        setError('Failed to load team members. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchTeammates();
  }, [currentUser]);

  const getRoleBadgeColor = (role) => {
    const colors = {
      'admin': 'danger',
      'volunteerHead': 'warning',
      'volunteer': 'primary'
    };
    return colors[role] || 'secondary';
  };

  const getRoleLabel = (role) => {
    const labels = {
      'admin': '👨‍💼 Admin',
      'volunteerHead': '👨‍🏫 Team Head',
      'volunteer': '👤 Volunteer'
    };
    return labels[role] || role;
  };

  return (
    <div>
      <div className="mb-4">
        <h2 className="mb-1 fw-bold text-dark">👥 My Team Members</h2>
        <p className="text-muted small mb-0">People working on your projects</p>
      </div>

      {error && (
        <Card className="bg-danger bg-opacity-10 border-danger mb-4">
          <Card.Body className="py-2 px-3">
            <span className="text-danger">⚠️ {error}</span>
          </Card.Body>
        </Card>
      )}

      {loading ? (
        <Card className="border-0 glass-card text-center py-5">
          <Card.Body>
            <Spinner animation="border" variant="primary" className="mb-3" />
            <p className="text-muted">Loading team members...</p>
          </Card.Body>
        </Card>
      ) : teammates.length === 0 ? (
        <Card className="border-0 glass-card text-center py-5">
          <Card.Body>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>👥</div>
            <h5 className="text-muted">No team members yet</h5>
            <p className="text-muted small">You'll see team members once you're assigned to a project with others</p>
          </Card.Body>
        </Card>
      ) : (
        <Row className="g-3">
          {teammates.map(user => (
            <Col lg={6} key={user.id}>
              <Card className="glass-card border-0 h-100 shadow-sm" style={{ transition: 'all 0.3s ease' }} onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.1)';
              }} onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)';
              }}>
                <Card.Body className="p-4">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div>
                      <h6 className="mb-1 fw-bold text-dark">{user.name || 'Unnamed User'}</h6>
                      <Badge bg={getRoleBadgeColor(user.role)}>{getRoleLabel(user.role)}</Badge>
                    </div>
                    <span style={{ fontSize: '2rem' }}>👤</span>
                  </div>
                  
                  {user.skills && user.skills.length > 0 && (
                    <div className="mb-3">
                      <small className="text-muted d-block mb-2">🎯 Skills</small>
                      <div className="d-flex flex-wrap gap-1">
                        {user.skills.map((skill, i) => (
                          <Badge key={i} bg="light" text="dark" className="text-capitalize">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="border-top pt-3">
                    <small className="text-muted d-block mb-2">📧 Contact</small>
                    <a href={`mailto:${user.email}`} className="text-primary text-decoration-none small fw-medium">
                      {user.email}
                    </a>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
}

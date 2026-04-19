import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Button, Form, Badge, Spinner, Alert } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase/config';
import { doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { toast } from 'react-toastify';

export default function UserProfile() {
  const { currentUser, logout } = useAuth();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    skills: '',
  });

  useEffect(() => {
    if (!currentUser?.uid) return;

    // Real-time listener for user data
    const unsubscribe = onSnapshot(doc(db, 'users', currentUser.uid), (doc) => {
      if (doc.exists()) {
        setUserData(doc.data());
        setFormData({
          name: doc.data().name || '',
          email: doc.data().email || '',
          skills: Array.isArray(doc.data().skills) 
            ? doc.data().skills.join(', ') 
            : doc.data().skills || '',
        });
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!currentUser?.uid) return;

    try {
      setLoading(true);
      const skillsArray = formData.skills
        .split(',')
        .map(skill => skill.trim())
        .filter(skill => skill.length > 0);

      await updateDoc(doc(db, 'users', currentUser.uid), {
        name: formData.name,
        skills: skillsArray,
      });

      toast.success('Profile updated successfully! ✅');
      setEditing(false);
    } catch (error) {
      toast.error('Failed to update profile');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) {
    return (
      <Container className="mt-5">
        <Alert variant="warning">
          Please log in to view your profile.
        </Alert>
      </Container>
    );
  }

  if (loading) {
    return (
      <Container className="d-flex align-items-center justify-content-center" style={{ minHeight: '80vh' }}>
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </Container>
    );
  }

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin': return 'danger';
      case 'volunteerHead': return 'warning';
      case 'volunteer': return 'primary';
      default: return 'secondary';
    }
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case 'admin': return '👨‍💼 System Administrator';
      case 'volunteerHead': return '👨‍🏫 Division Head';
      case 'volunteer': return '👤 Volunteer Agent';
      default: return role;
    }
  };

  return (
    <Container className="py-5">
      <Row className="mb-4">
        <Col md={12}>
          <h2 className="fw-bold mb-1">👤 My Profile</h2>
          <p className="text-muted">View and manage your account information</p>
        </Col>
      </Row>

      <Row className="g-4">
        {/* Main Profile Card */}
        <Col md={8}>
          <Card className="border-0 shadow-lg">
            <Card.Header style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
              <h5 className="mb-0 fw-bold">Account Information</h5>
            </Card.Header>
            <Card.Body className="p-4">
              {!editing ? (
                <>
                  <div className="mb-4">
                    <label className="text-muted small fw-semibold">Full Name</label>
                    <h5 className="fw-bold mb-0">{userData?.name || 'Not set'}</h5>
                  </div>

                  <div className="mb-4">
                    <label className="text-muted small fw-semibold">Email Address</label>
                    <p className="mb-0">{userData?.email}</p>
                  </div>

                  <div className="mb-4">
                    <label className="text-muted small fw-semibold">Your Role</label>
                    <div>
                      <Badge bg={getRoleBadgeColor(userData?.role)} className="fs-6">
                        {getRoleLabel(userData?.role)}
                      </Badge>
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="text-muted small fw-semibold">Skills & Expertise</label>
                    {userData?.skills && userData.skills.length > 0 ? (
                      <div>
                        {userData.skills.map((skill, idx) => (
                          <Badge key={idx} bg="light" text="dark" className="me-2 mb-2 px-3 py-2">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted mb-0">No skills added yet</p>
                    )}
                  </div>

                  <div className="mb-4">
                    <label className="text-muted small fw-semibold">Account Status</label>
                    <Badge bg="success" className="fs-6">
                      {userData?.status === 'active' ? '🟢 Active' : '🟡 Pending'}
                    </Badge>
                  </div>

                  <div className="mb-4">
                    <label className="text-muted small fw-semibold">Member Since</label>
                    <p className="mb-0">
                      {userData?.createdAt 
                        ? new Date(userData.createdAt.toDate?.() || userData.createdAt).toLocaleDateString()
                        : 'Not available'
                      }
                    </p>
                  </div>

                  {userData?.projectIds && userData.projectIds.length > 0 && (
                    <div className="mb-4">
                      <label className="text-muted small fw-semibold">Projects ({userData.projectIds.length})</label>
                      <p className="text-muted mb-0">You are part of {userData.projectIds.length} project(s)</p>
                    </div>
                  )}

                  <Button 
                    onClick={() => setEditing(true)}
                    variant="primary"
                    className="me-2"
                  >
                    ✏️ Edit Profile
                  </Button>
                  <Button 
                    onClick={logout}
                    variant="outline-danger"
                  >
                    🚪 Sign Out
                  </Button>
                </>
              ) : (
                <Form onSubmit={handleUpdateProfile}>
                  <Form.Group className="mb-4">
                    <Form.Label className="fw-semibold">Full Name</Form.Label>
                    <Form.Control
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Enter your full name"
                      disabled={loading}
                    />
                  </Form.Group>

                  <Form.Group className="mb-4">
                    <Form.Label className="fw-semibold">Email Address</Form.Label>
                    <Form.Control
                      type="email"
                      value={formData.email}
                      disabled
                      className="bg-light"
                    />
                    <small className="text-muted">Email cannot be changed</small>
                  </Form.Group>

                  <Form.Group className="mb-4">
                    <Form.Label className="fw-semibold">Skills & Expertise</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      value={formData.skills}
                      onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                      placeholder="Enter skills separated by commas (e.g., JavaScript, Design, Project Management)"
                      disabled={loading}
                    />
                    <small className="text-muted">Separate multiple skills with commas</small>
                  </Form.Group>

                  <div className="d-flex gap-2">
                    <Button 
                      type="submit"
                      variant="success"
                      disabled={loading}
                    >
                      {loading ? '💾 Saving...' : '💾 Save Changes'}
                    </Button>
                    <Button 
                      type="button"
                      variant="outline-secondary"
                      onClick={() => setEditing(false)}
                      disabled={loading}
                    >
                      ❌ Cancel
                    </Button>
                  </div>
                </Form>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Sidebar Stats */}
        <Col md={4}>
          <Card className="border-0 shadow-lg mb-4">
            <Card.Body className="p-4 text-center">
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👤</div>
              <h6 className="text-muted fw-semibold mb-2">User ID</h6>
              <p className="small text-break" style={{ wordBreak: 'break-all', fontSize: '0.75rem' }}>
                {currentUser?.uid}
              </p>
            </Card.Body>
          </Card>

          <Card className="border-0 shadow-lg mb-4">
            <Card.Body className="p-4">
              <h6 className="fw-bold mb-3">📊 Quick Stats</h6>
              <div className="mb-3">
                <small className="text-muted">Assigned Tasks</small>
                <h5 className="fw-bold mb-0">—</h5>
              </div>
              <div className="mb-3">
                <small className="text-muted">Completed Tasks</small>
                <h5 className="fw-bold mb-0">—</h5>
              </div>
              <div>
                <small className="text-muted">Active Projects</small>
                <h5 className="fw-bold mb-0">{userData?.projectIds?.length || 0}</h5>
              </div>
            </Card.Body>
          </Card>

          <Card className="border-0 shadow-lg bg-light">
            <Card.Body className="p-4">
              <h6 className="fw-bold mb-3">💡 Tips</h6>
              <ul className="small mb-0 ps-3">
                <li className="mb-2">Keep your profile updated with your skills</li>
                <li className="mb-2">Join projects to get assigned tasks</li>
                <li>Use the chat feature to get AI assistance</li>
              </ul>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

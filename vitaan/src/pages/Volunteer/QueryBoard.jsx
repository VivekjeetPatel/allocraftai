import React, { useEffect, useState } from 'react';
import { db } from '../../firebase/config';
import { collection, onSnapshot, query, where, addDoc, serverTimestamp, getDocs, updateDoc, doc } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { Card, Button, Form, Modal, Badge, Spinner, Row, Col } from 'react-bootstrap';
import { toast } from 'react-toastify';

export default function VolunteerQueryBoard() {
  const { currentUser } = useAuth();
  const [queries, setQueries] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ text: '', projectId: '' });

  useEffect(() => {
    if (!currentUser?.uid) {
      setLoading(false);
      return;
    }

    // 1. Fetch user's submitted queries
    const qQueries = query(collection(db, 'queries'), where('askedByUid', '==', currentUser.uid));
    const unsubQueries = onSnapshot(qQueries, (snapshot) => {
      setQueries(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)));
      setLoading(false);
    }, (error) => {
      console.error('Error fetching queries:', error);
      setLoading(false);
    });

    // 2. Fetch projects user is participating in for the dropdown
    const fetchProjects = async () => {
      if (currentUser.projectIds && currentUser.projectIds.length > 0) {
        // Simple client-side filtering if 'in' is limiting. Or fetch by teamIds array-contains
        const qProj = query(collection(db, 'projects'), where('teamIds', 'array-contains', currentUser.uid));
        const pSnap = await getDocs(qProj);
        setProjects(pSnap.docs.map(d => ({ id: d.id, title: d.data().title })));
      }
    };
    fetchProjects();

    return () => unsubQueries();
  }, [currentUser]);

  const handleClose = () => setShowModal(false);
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.projectId) {
      toast.error('Please select a project');
      return;
    }
    if (!formData.text.trim()) {
      toast.error('Please enter your question');
      return;
    }
    try {
      setSubmitting(true);
      const docRef = await addDoc(collection(db, 'queries'), {
        text: formData.text,
        askedBy: currentUser.name || currentUser.email,
        askedByUid: currentUser.uid,
        role: currentUser.role,
        projectId: formData.projectId,
        status: 'Pending',
        answer: null,
        aiSuggestion: null,
        createdAt: serverTimestamp()
      });
      
      toast.success('Query submitted successfully');
      handleClose();

      // Trigger AI asynchronously
      try {
        const { httpsCallable } = await import('firebase/functions');
        const { functions } = await import('../../firebase/config');
        const projName = projects.find(p => p.id === formData.projectId)?.title || 'Unknown';
        
        const askGemini = httpsCallable(functions, 'askGemini');
        const result = await askGemini({
          type: 'queryResolver',
          payload: { query: formData.text, projectTitle: projName }
        });

        if (result.data && result.data.text) {
          await updateDoc(doc(db, 'queries', docRef.id), { aiSuggestion: result.data.text });
        }
      } catch (aiErr) {
        console.error('Failed to get AI suggestion', aiErr);
      }

      setFormData({ text: '', projectId: '' });
    } catch (error) {
      console.error('Submit error:', error);
      toast.error('Failed to submit query');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadgeConfig = (status) => {
    const configs = {
      'Resolved': { bg: 'success', icon: '✅' },
      'Escalated': { bg: 'danger', icon: '⚠️' },
      'Pending': { bg: 'warning', icon: '⏳' }
    };
    return configs[status] || { bg: 'secondary', icon: '❓' };
  };

  return (
    <div>
      <div className="mb-4">
        <div className="d-flex justify-content-between align-items-start flex-wrap gap-3 mb-4">
          <div>
            <h2 className="mb-1 fw-bold text-dark">❓ Query Board</h2>
            <p className="text-muted small mb-0">Ask questions and get AI-powered suggestions</p>
          </div>
          <Button 
            variant="primary" 
            onClick={() => setShowModal(true)}
            disabled={projects.length === 0}
            className="mt-2"
          >
            ➕ Ask a Question
          </Button>
        </div>

        {projects.length === 0 && !loading && (
          <Card className="bg-info bg-opacity-10 border-info mb-4">
            <Card.Body className="py-2 px-3">
              <span className="text-info">ℹ️ You need to be assigned to a project first</span>
            </Card.Body>
          </Card>
        )}
      </div>

      {loading ? (
        <Row className="g-3">
          {[1, 2, 3, 4].map(i => (
            <Col lg={6} key={i}>
              <Card className="glass-card border-0 h-100 animate-pulse" style={{ height: '200px' }}></Card>
            </Col>
          ))}
        </Row>
      ) : queries.length === 0 ? (
        <Card className="border-0 glass-card text-center py-5">
          <Card.Body>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📭</div>
            <h5 className="text-muted">No questions asked yet</h5>
            <p className="text-muted small">Ask your first question to get AI-powered suggestions and connect with your team</p>
          </Card.Body>
        </Card>
      ) : (
        <Row className="g-3">
          {queries.map(q => {
            const statusConfig = getStatusBadgeConfig(q.status);
            const projectTitle = projects.find(p => p.id === q.projectId)?.title || 'Unknown Project';
            
            return (
              <Col lg={6} key={q.id}>
                <Card className="glass-card border-0 h-100 shadow-sm" style={{ 
                  borderLeft: `4px solid ${statusConfig.bg === 'success' ? '#28a745' : statusConfig.bg === 'danger' ? '#dc3545' : '#ffc107'}`,
                  transition: 'all 0.3s ease'
                }} onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.1)';
                }} onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)';
                }}>
                  <Card.Header className="border-0 pt-4 pb-2 px-4">
                    <div className="d-flex justify-content-between align-items-start">
                      <div>
                        <small className="text-muted d-block mb-2">📁 {projectTitle}</small>
                      </div>
                      <Badge bg={statusConfig.bg} className="ms-2">
                        {statusConfig.icon} {q.status || 'Pending'}
                      </Badge>
                    </div>
                  </Card.Header>
                  <Card.Body className="px-4 pb-4">
                    <p className="mb-3 text-dark">{q.text}</p>
                    
                    {q.aiSuggestion && (
                      <div className="mb-3 p-3 rounded" style={{ backgroundColor: 'rgba(13, 110, 253, 0.08)', borderLeft: '4px solid #0d6efd' }}>
                        <small className="text-muted d-block mb-2">💡 AI Suggestion</small>
                        <small className="text-dark" style={{ lineHeight: 1.5 }}>{q.aiSuggestion.substring(0, 150)}...</small>
                      </div>
                    )}
                    
                    {q.answer && (
                      <div className="p-3 rounded" style={{ 
                        backgroundColor: q.status === 'Escalated' ? 'rgba(220, 53, 69, 0.08)' : 'rgba(40, 167, 69, 0.08)',
                        borderLeft: `4px solid ${q.status === 'Escalated' ? '#dc3545' : '#28a745'}`
                      }}>
                        <strong className={`d-block mb-2 ${q.status === 'Escalated' ? 'text-danger' : 'text-success'}`}>
                          {q.status === 'Escalated' ? '⚠️' : '✅'} Answer
                        </strong>
                        <small className="text-dark" style={{ lineHeight: 1.5 }}>{q.answer}</small>
                      </div>
                    )}
                  </Card.Body>
                </Card>
              </Col>
            );
          })}
        </Row>
      )}

      <Modal show={showModal} onHide={handleClose} centered>
        <Modal.Header closeButton className="border-bottom-subtle">
          <Modal.Title className="fw-bold">❓ Submit a Query</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body className="p-4">
            <Form.Group className="mb-4">
              <Form.Label className="fw-medium mb-2">📁 Select Project</Form.Label>
              <Form.Select 
                required 
                value={formData.projectId} 
                onChange={e => setFormData({...formData, projectId: e.target.value})}
                className="glass-card border-2"
              >
                <option value="">Choose a project...</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.title}</option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="fw-medium mb-2">❓ Your Question</Form.Label>
              <Form.Control 
                required 
                as="textarea" 
                rows={4} 
                value={formData.text} 
                onChange={e => setFormData({...formData, text: e.target.value})}
                placeholder="What do you need help with? (Be specific for better AI suggestions)"
                className="glass-card border-2"
              />
              <small className="text-muted mt-2 d-block">
                Our AI will analyze your question and provide suggestions
              </small>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer className="border-top-subtle">
            <Button variant="secondary" onClick={handleClose}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                  Submitting...
                </>
              ) : (
                '📤 Submit Query'
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
}

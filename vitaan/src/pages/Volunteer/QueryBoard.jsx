import React, { useEffect, useState } from 'react';
import { db } from '../../firebase/config';
import { collection, onSnapshot, query, where, addDoc, serverTimestamp, getDocs } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { Card, Button, Form, Modal, Badge } from 'react-bootstrap';
import { toast } from 'react-toastify';

export default function VolunteerQueryBoard() {
  const { currentUser } = useAuth();
  const [queries, setQueries] = useState([]);
  const [projects, setProjects] = useState([]);
  
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ text: '', projectId: '' });

  useEffect(() => {
    // 1. Fetch user's submitted queries
    const qQueries = query(collection(db, 'queries'), where('askedByUid', '==', currentUser.uid));
    const unsubQueries = onSnapshot(qQueries, (snapshot) => {
      setQueries(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a, b) => b.createdAt - a.createdAt));
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
    try {
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
          await updateDoc(docRef, { aiSuggestion: result.data.text });
        }
      } catch (aiErr) {
        console.error('Failed to get AI suggestion', aiErr);
      }

      setFormData({ text: '', projectId: '' });
    } catch (error) {
      toast.error('Failed to submit query');
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>My Queries</h2>
        <Button variant="primary" onClick={() => setShowModal(true)}>+ Ask a Question</Button>
      </div>

      <div className="row">
        {queries.map(q => (
          <div key={q.id} className="col-md-6 mb-4">
            <Card className="h-100 shadow-sm border-0">
              <Card.Header className="bg-white d-flex justify-content-between align-items-center">
                <span className="text-muted small">
                  Project Info: {projects.find(p => p.id === q.projectId)?.title || 'Unknown Project'}
                </span>
                <Badge bg={q.status === 'Resolved' ? 'success' : q.status === 'Escalated' ? 'danger' : 'warning'}>
                  {q.status || 'Pending'}
                </Badge>
              </Card.Header>
              <Card.Body>
                <p className="mb-3">{q.text}</p>
                {q.answer && (
                  <div className={`bg-light p-3 rounded mb-3 border-start border-4 ${q.status === 'Escalated' ? 'border-danger' : 'border-success'}`}>
                    <strong className={`d-block mb-1 ${q.status === 'Escalated' ? 'text-danger' : 'text-success'}`}>Reply:</strong>
                    {q.answer}
                  </div>
                )}
              </Card.Body>
            </Card>
          </div>
        ))}
        {queries.length === 0 && <p className="text-muted">You haven't asked any questions yet.</p>}
      </div>

      <Modal show={showModal} onHide={handleClose}>
        <Form onSubmit={handleSubmit}>
          <Modal.Header closeButton>
            <Modal.Title>Submit a Query</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Select Project</Form.Label>
              <Form.Select required value={formData.projectId} onChange={e => setFormData({...formData, projectId: e.target.value})}>
                <option value="">Choose...</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.title}</option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Your Question</Form.Label>
              <Form.Control required as="textarea" rows={4} value={formData.text} onChange={e => setFormData({...formData, text: e.target.value})} placeholder="What do you need help with?" />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleClose}>Cancel</Button>
            <Button variant="primary" type="submit">Submit Query</Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { db } from '../../firebase/config';
import { collection, onSnapshot, query, where, doc, updateDoc, getDocs } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { Card, Button, Modal, Form, Badge } from 'react-bootstrap';
import { toast } from 'react-toastify';

export default function HeadQueryBoard() {
  const { currentUser } = useAuth();
  const [queries, setQueries] = useState([]);
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [selectedQuery, setSelectedQuery] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [escalate, setEscalate] = useState(false);

  useEffect(() => {
    // 1. Fetch assigned projects first
    const qProjects = query(collection(db, 'projects'), where('teamIds', 'array-contains', currentUser.uid));
    
    const fetchQueries = async () => {
      const projSnap = await getDocs(qProjects);
      const projectIds = projSnap.docs.map(d => d.id);
      
      if (projectIds.length === 0) return;

      // 2. Query 'queries' where projectId is in projectIds
      const qQueries = query(collection(db, 'queries'), where('projectId', 'in', projectIds));
      const unsub = onSnapshot(qQueries, (snapshot) => {
        setQueries(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a, b) => b.createdAt - a.createdAt));
      });
      return unsub;
    };

    let cleanup;
    fetchQueries().then(unsub => cleanup = unsub);

    return () => {
      if (cleanup) cleanup();
    };
  }, [currentUser.uid]);

  const handleOpenReply = (q) => {
    setSelectedQuery(q);
    setReplyText(q.answer || '');
    setEscalate(q.status === 'Escalated');
    setShowReplyModal(true);
  };

  const handleCloseReply = () => {
    setShowReplyModal(false);
    setSelectedQuery(null);
  };

  const handleSubmitReply = async (e) => {
    e.preventDefault();
    if (!selectedQuery) return;
    try {
      const payload = {
        answer: replyText,
        status: escalate ? 'Escalated' : 'Resolved'
      };
      await updateDoc(doc(db, 'queries', selectedQuery.id), payload);
      toast.success(escalate ? 'Query escalated to Admin' : 'Query resolved');
      handleCloseReply();
    } catch (error) {
      console.error(error);
      toast.error('Failed to submit');
    }
  };

  return (
    <div>
      <h2 className="mb-4">Project Query Board</h2>
      <div className="row">
        {queries.map(q => (
          <div key={q.id} className="col-md-6 mb-4">
            <Card className="h-100 shadow-sm border-0">
              <Card.Header className="bg-white d-flex justify-content-between align-items-center">
                <span className="fw-bold">{q.askedBy} <span className="text-muted fw-normal">({q.role})</span></span>
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
                {q.aiSuggestion && !q.answer && (
                  <div className="bg-primary bg-opacity-10 p-3 rounded mb-3 border-start border-4 border-primary">
                    <strong className="d-flex align-items-center mb-1 text-primary">
                      ✨ AI Suggested Reply
                    </strong>
                    <p className="mb-2 small">{q.aiSuggestion}</p>
                    <Button 
                      variant="outline-primary" 
                      size="sm" 
                      className="py-0 px-2 text-decoration-none" 
                      onClick={() => {
                        setSelectedQuery(q);
                        setReplyText(q.aiSuggestion);
                        setShowReplyModal(true);
                      }}>
                      Use Suggestion
                    </Button>
                  </div>
                )}
              </Card.Body>
              <Card.Footer className="bg-white text-end border-0 pb-3">
                <Button variant="outline-primary" size="sm" onClick={() => handleOpenReply(q)}>
                  Review / Reply
                </Button>
              </Card.Footer>
            </Card>
          </div>
        ))}
        {queries.length === 0 && <p className="text-muted">No queries for your projects.</p>}
      </div>

      <Modal show={showReplyModal} onHide={handleCloseReply}>
        <Form onSubmit={handleSubmitReply}>
          <Modal.Header closeButton>
            <Modal.Title>Reply or Escalate Query</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div className="mb-3 p-3 bg-light rounded text-muted">
              {selectedQuery?.text}
            </div>
            <Form.Group className="mb-3">
              <Form.Label>Response</Form.Label>
              <Form.Control as="textarea" rows={4} value={replyText} onChange={(e) => setReplyText(e.target.value)} required={!escalate} />
            </Form.Group>
            <Form.Check 
              type="checkbox" 
              id="escalate-check" 
              label="Escalate to Admin" 
              checked={escalate} 
              onChange={(e) => setEscalate(e.target.checked)} 
              className="text-danger fw-bold"
            />
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseReply}>Cancel</Button>
            <Button variant={escalate ? "danger" : "primary"} type="submit">
              {escalate ? 'Escalate' : 'Resolve'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
}

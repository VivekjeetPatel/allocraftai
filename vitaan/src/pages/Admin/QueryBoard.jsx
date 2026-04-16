import React, { useEffect, useState } from 'react';
import { db } from '../../firebase/config';
import { collection, onSnapshot, query, orderBy, doc, updateDoc } from 'firebase/firestore';
import { Card, Button, Form, Modal, Badge } from 'react-bootstrap';
import { toast } from 'react-toastify';

export default function AdminQueryBoard() {
  const [queries, setQueries] = useState([]);
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [selectedQuery, setSelectedQuery] = useState(null);
  const [replyText, setReplyText] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'queries'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      setQueries(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, []);

  const handleOpenReply = (q) => {
    setSelectedQuery(q);
    setReplyText(q.answer || '');
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
      await updateDoc(doc(db, 'queries', selectedQuery.id), {
        answer: replyText,
        status: 'Resolved'
      });
      toast.success('Query resolved.');
      handleCloseReply();
    } catch (error) {
      console.error(error);
      toast.error('Failed to submit reply.');
    }
  };

  return (
    <div>
      <h2 className="mb-4">Query Board</h2>
      <div className="row">
        {queries.map(q => (
          <div key={q.id} className="col-md-6 mb-4">
            <Card className="h-100 shadow-sm border-0">
              <Card.Header className="bg-white d-flex justify-content-between align-items-center">
                <span className="fw-bold">{q.askedBy} <span className="text-muted fw-normal">({q.role})</span></span>
                <Badge bg={q.status === 'Resolved' ? 'success' : 'warning'}>{q.status || 'Pending'}</Badge>
              </Card.Header>
              <Card.Body>
                <p className="mb-3">{q.text}</p>
                {q.answer && (
                  <div className="bg-light p-3 rounded mb-3 border-start border-4 border-success">
                    <strong className="d-block mb-1 text-success">Admin Reply:</strong>
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
                <Button variant={q.status === 'Resolved' ? "outline-secondary" : "primary"} size="sm" onClick={() => handleOpenReply(q)}>
                  {q.status === 'Resolved' ? 'Edit Reply' : 'Reply'}
                </Button>
              </Card.Footer>
            </Card>
          </div>
        ))}
        {queries.length === 0 && <p className="text-muted">No queries available.</p>}
      </div>

      <Modal show={showReplyModal} onHide={handleCloseReply}>
        <Form onSubmit={handleSubmitReply}>
          <Modal.Header closeButton>
            <Modal.Title>Reply to Query</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div className="mb-3 p-3 bg-light rounded text-muted">
              {selectedQuery?.text}
            </div>
            <Form.Group>
              <Form.Label>Your Reply</Form.Label>
              <Form.Control as="textarea" rows={4} required value={replyText} onChange={(e) => setReplyText(e.target.value)} />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseReply}>Cancel</Button>
            <Button variant="primary" type="submit">Submit & Resolve</Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
}

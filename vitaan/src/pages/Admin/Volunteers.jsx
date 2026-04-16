import React, { useEffect, useState } from 'react';
import { db, functions } from '../../firebase/config';
import { collection, onSnapshot, query, where, doc, updateDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { Card, Table, Button, Modal, Form } from 'react-bootstrap';
import { toast } from 'react-toastify';

export default function AdminVolunteers() {
  const [volunteers, setVolunteers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'volunteer' });

  useEffect(() => {
    const q = query(collection(db, 'users'), where('role', 'in', ['volunteer', 'volunteerHead']));
    const unsub = onSnapshot(q, (snapshot) => {
      setVolunteers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, []);

  const handleClose = () => setShowModal(false);
  const handleShow = () => {
    setFormData({ name: '', email: '', password: '', role: 'volunteer' });
    setShowModal(true);
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const adminCreateUser = httpsCallable(functions, 'adminCreateUser');
      const result = await adminCreateUser(formData);
      
      if (result.data.success) {
        toast.success(`Account for ${formData.name} created successfully!`);
        handleClose();
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to create account: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const promoteToHead = async (id, name, currentRole) => {
    if (currentRole === 'volunteerHead') {
        toast.info("User is already a Volunteer Head.");
        return;
    }
    if (window.confirm(`Are you sure you want to promote ${name} to Volunteer Head?`)) {
      try {
        await updateDoc(doc(db, 'users', id), { role: 'volunteerHead' });
        toast.success(`${name} has been promoted.`);
      } catch (error) {
        toast.error('Failed to promote user.');
      }
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Users Management</h2>
        <Button variant="primary" onClick={handleShow}>+ Add New User</Button>
      </div>

      <Card className="shadow-sm border-0">
        <Card.Body className="p-0">
          <Table responsive hover className="m-0">
            <thead className="bg-light">
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {volunteers.map(vol => (
                <tr key={vol.id}>
                  <td><strong>{vol.name || 'N/A'}</strong></td>
                  <td>{vol.email}</td>
                  <td>
                    <span className={`badge ${vol.role === 'volunteerHead' ? 'bg-info' : 'bg-secondary'}`}>
                        {vol.role === 'volunteerHead' ? 'Volunteer Head' : 'Volunteer'}
                    </span>
                  </td>
                  <td className="text-end">
                    {vol.role === 'volunteer' && (
                        <Button variant="outline-success" size="sm" onClick={() => promoteToHead(vol.id, vol.name, vol.role)}>
                            Promote to Head
                        </Button>
                    )}
                  </td>
                </tr>
              ))}
              {volunteers.length === 0 && (
                <tr>
                  <td colSpan="4" className="text-center py-4 text-muted">No volunteers found.</td>
                </tr>
              )}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      <Modal show={showModal} onHide={handleClose}>
        <Form onSubmit={handleCreateUser}>
          <Modal.Header closeButton>
            <Modal.Title>Create New User Account</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Full Name</Form.Label>
              <Form.Control required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Initial Password</Form.Label>
              <Form.Control required type="text" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} placeholder="Set a default password" />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Role</Form.Label>
              <Form.Select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
                <option value="volunteer">Volunteer</option>
                <option value="volunteerHead">Volunteer Head</option>
              </Form.Select>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleClose}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={loading}>
                {loading ? 'Creating...' : 'Create Account'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { db } from '../../firebase/config';
import { collection, onSnapshot, query, where, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { Card, Table, Button, Modal, Form, Badge } from 'react-bootstrap';
import { toast } from 'react-toastify';

export default function HeadTaskManagement() {
  const { currentUser } = useAuth();
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [tasks, setTasks] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ title: '', description: '', assignedTo: '', deadline: '', status: 'Pending' });

  // Load Projects for this Head
  useEffect(() => {
    const qProjects = query(collection(db, 'projects'), where('teamIds', 'array-contains', currentUser.uid));
    const unsubProjects = onSnapshot(qProjects, (snapshot) => {
      const projs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProjects(projs);
      if (projs.length > 0 && !selectedProjectId) {
        setSelectedProjectId(projs[0].id);
      }
    });

    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      setTeamMembers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => { unsubProjects(); unsubUsers(); };
  }, [currentUser.uid, selectedProjectId]);

  // Load Tasks for the selected Project
  useEffect(() => {
    if (!selectedProjectId) return;
    const qTasks = query(collection(db, 'tasks'), where('projectId', '==', selectedProjectId));
    const unsubTasks = onSnapshot(qTasks, (snapshot) => {
      setTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubTasks();
  }, [selectedProjectId]);

  const handleShow = () => setShowModal(true);
  const handleClose = () => {
    setShowModal(false);
    setFormData({ title: '', description: '', assignedTo: '', deadline: '', status: 'Pending' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedProjectId) return;
    try {
      await addDoc(collection(db, 'tasks'), {
        ...formData,
        projectId: selectedProjectId,
        assignedBy: currentUser.uid,
        createdAt: serverTimestamp()
      });
      toast.success('Task created successfully');
      handleClose();
    } catch (error) {
      console.error(error);
      toast.error('Failed to create task');
    }
  };

  const currentTeam = teamMembers.filter(u => u.projectIds && u.projectIds.includes(selectedProjectId));

  return (
    <div>
      <h2 className="mb-4">Task Management</h2>

      <Form.Group className="mb-4" style={{ maxWidth: '400px' }}>
        <Form.Label className="fw-bold">Select Project</Form.Label>
        <Form.Select value={selectedProjectId} onChange={(e) => setSelectedProjectId(e.target.value)}>
          {projects.map(p => (
            <option key={p.id} value={p.id}>{p.title}</option>
          ))}
          {projects.length === 0 && <option value="">No active projects</option>}
        </Form.Select>
      </Form.Group>

      {selectedProjectId && (
        <Card className="shadow-sm border-0">
          <Card.Header className="bg-white d-flex justify-content-between align-items-center py-3">
            <h5 className="m-0">Project Tasks</h5>
            <Button variant="primary" size="sm" onClick={handleShow}>+ New Task</Button>
          </Card.Header>
          <Card.Body className="p-0">
            <Table responsive hover className="m-0">
              <thead className="bg-light">
                <tr>
                  <th>Title</th>
                  <th>Assigned To</th>
                  <th>Deadline</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map(task => {
                  const assignee = teamMembers.find(u => u.id === task.assignedTo);
                  return (
                    <tr key={task.id}>
                      <td>
                        <strong>{task.title}</strong>
                        <div className="text-muted small">{task.description}</div>
                      </td>
                      <td>{assignee ? (assignee.name || assignee.email) : 'Unassigned'}</td>
                      <td>{task.deadline}</td>
                      <td>
                        <Badge bg={task.status === 'Completed' ? 'success' : task.status === 'In Progress' ? 'primary' : 'warning'}>
                          {task.status || 'Pending'}
                        </Badge>
                      </td>
                    </tr>
                  )
                })}
                {tasks.length === 0 && (
                  <tr>
                    <td colSpan="4" className="text-center py-4 text-muted">No tasks exist for this project.</td>
                  </tr>
                )}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      )}

      <Modal show={showModal} onHide={handleClose}>
        <Form onSubmit={handleSubmit}>
          <Modal.Header closeButton>
            <Modal.Title>Create New Task</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Task Title</Form.Label>
              <Form.Control required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control required as="textarea" rows={3} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Assign To</Form.Label>
              <Form.Select required value={formData.assignedTo} onChange={e => setFormData({...formData, assignedTo: e.target.value})}>
                <option value="">Select Volunteer...</option>
                {currentTeam.map(member => (
                  <option key={member.id} value={member.id}>{member.name || member.email}</option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Deadline</Form.Label>
              <Form.Control required type="date" value={formData.deadline} onChange={e => setFormData({...formData, deadline: e.target.value})} />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleClose}>Cancel</Button>
            <Button variant="primary" type="submit">Create Task</Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
}

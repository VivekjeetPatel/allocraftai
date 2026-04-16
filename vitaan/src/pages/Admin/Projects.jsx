import React, { useEffect, useState } from 'react';
import { db } from '../../firebase/config';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { Card, Table, Button, Modal, Form, Badge } from 'react-bootstrap';
import { toast } from 'react-toastify';

export default function AdminProjects() {
  const [projects, setProjects] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const { currentUser } = useAuth();
  
  const initialFormState = { title: '', description: '', location: '', skillsRequired: '', deadline: '', priority: 'Medium', status: 'Draft' };
  const [formData, setFormData] = useState(initialFormState);
  const [editingId, setEditingId] = useState(null);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedTasks, setGeneratedTasks] = useState([]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'projects'), (snapshot) => {
      setProjects(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, []);

  const handleShow = (proj = null) => {
    if (proj) {
      setFormData({ 
        ...proj, 
        skillsRequired: Array.isArray(proj.skillsRequired) ? proj.skillsRequired.join(', ') : proj.skillsRequired 
      });
      setIsEditing(true);
      setEditingId(proj.id);
    } else {
      setFormData(initialFormState);
      setIsEditing(false);
      setEditingId(null);
    }
    setShowModal(true);
  };

  const handleClose = () => {
    setShowModal(false);
    setGeneratedTasks([]);
  };

  const handleGenerateTasks = async () => {
    if (!formData.title || !formData.description) return;
    try {
      setIsGenerating(true);
      const { httpsCallable } = await import('firebase/functions');
      const { functions } = await import('../../firebase/config');
      const askGemini = httpsCallable(functions, 'askGemini');
      
      const result = await askGemini({
        type: 'taskRecommendation',
        payload: { title: formData.title, description: formData.description }
      });
      
      // Attempt to extract JSON from markdown formatting if present
      let jsonString = result.data.text;
      jsonString = jsonString.replace(/```json/g, '').replace(/```/g, '').trim();
      
      const parsedTasks = JSON.parse(jsonString);
      setGeneratedTasks(parsedTasks.map(t => ({ ...t, selected: true })));
      toast.success('Tasks generated!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate tasks.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const skillsArray = formData.skillsRequired.split(',').map(s => s.trim()).filter(s => s);
      const projectPayload = {
        title: formData.title,
        description: formData.description,
        location: formData.location,
        skillsRequired: skillsArray,
        deadline: formData.deadline,
        priority: formData.priority,
        status: formData.status,
      };

      if (isEditing) {
        await updateDoc(doc(db, 'projects', editingId), projectPayload);
        toast.success('Project updated successfully');
      } else {
        const docRef = await addDoc(collection(db, 'projects'), {
          ...projectPayload,
          createdBy: currentUser.uid,
          teamIds: [],
          progress: 0,
          createdAt: serverTimestamp()
        });
        
        // Add selected generated tasks
        const tasksToAdd = generatedTasks.filter(t => t.selected);
        if (tasksToAdd.length > 0) {
          await Promise.all(tasksToAdd.map(t => addDoc(collection(db, 'tasks'), {
            title: t.title,
            description: t.description,
            projectId: docRef.id,
            assignedTo: null,
            assignedBy: currentUser.uid,
            status: 'Pending',
            deadline: '',
            createdAt: serverTimestamp()
          })));
        }
        
        toast.success('Project created successfully');
      }
      handleClose();
    } catch (error) {
      console.error(error);
      toast.error('Error saving project');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      try {
        await deleteDoc(doc(db, 'projects', id));
        toast.success('Project deleted');
      } catch (error) {
        toast.error('Error deleting project');
      }
    }
  };

  const statusColors = { Draft: 'secondary', Active: 'primary', Completed: 'success', Archived: 'dark' };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Projects Management</h2>
        <Button variant="primary" onClick={() => handleShow()}>+ New Project</Button>
      </div>

      <Card className="shadow-sm border-0">
        <Card.Body className="p-0">
          <Table responsive hover className="m-0">
            <thead className="bg-light">
              <tr>
                <th>Title</th>
                <th>Location</th>
                <th>Deadline</th>
                <th>Priority</th>
                <th>Status</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {projects.map(proj => (
                <tr key={proj.id}>
                  <td>{proj.title}</td>
                  <td>{proj.location}</td>
                  <td>{proj.deadline}</td>
                  <td>{proj.priority}</td>
                  <td><Badge bg={statusColors[proj.status] || 'secondary'}>{proj.status}</Badge></td>
                  <td className="text-end">
                    <Button variant="outline-primary" size="sm" className="me-2" onClick={() => handleShow(proj)}>Edit</Button>
                    <Button variant="outline-danger" size="sm" onClick={() => handleDelete(proj.id)}>Delete</Button>
                  </td>
                </tr>
              ))}
              {projects.length === 0 && (
                <tr>
                  <td colSpan="6" className="text-center py-4 text-muted">No projects found.</td>
                </tr>
              )}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      <Modal show={showModal} onHide={handleClose} size="lg">
        <Form onSubmit={handleSubmit}>
          <Modal.Header closeButton>
            <Modal.Title>{isEditing ? 'Edit Project' : 'Create New Project'}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Title</Form.Label>
              <Form.Control required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control required as="textarea" rows={3} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
            </Form.Group>

            {!isEditing && (
              <div className="mb-3 bg-light p-3 rounded border">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h6 className="m-0 text-primary">✨ AI Task Suggestions</h6>
                  <Button 
                    variant="outline-primary" 
                    size="sm" 
                    onClick={handleGenerateTasks} 
                    disabled={isGenerating || !formData.title || !formData.description}
                  >
                    {isGenerating ? 'Generating...' : 'Generate Tasks with AI'}
                  </Button>
                </div>
                {generatedTasks.length > 0 && (
                  <div className="mt-3">
                    <p className="small text-muted mb-2">Select the tasks you want to add to this project upon creation:</p>
                    {generatedTasks.map((task, idx) => (
                      <Form.Check 
                        key={idx} 
                        type="checkbox" 
                        label={<strong>{task.title}</strong>} 
                        checked={task.selected} 
                        onChange={(e) => {
                          const updated = [...generatedTasks];
                          updated[idx].selected = e.target.checked;
                          setGeneratedTasks(updated);
                        }} 
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="row">
              <div className="col-md-6 mb-3">
                <Form.Label>Location</Form.Label>
                <Form.Control type="text" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />
              </div>
              <div className="col-md-6 mb-3">
                <Form.Label>Deadline</Form.Label>
                <Form.Control type="date" value={formData.deadline} onChange={e => setFormData({...formData, deadline: e.target.value})} />
              </div>
            </div>
            <Form.Group className="mb-3">
              <Form.Label>Required Skills (comma separated)</Form.Label>
              <Form.Control type="text" value={formData.skillsRequired} onChange={e => setFormData({...formData, skillsRequired: e.target.value})} placeholder="e.g. Teaching, Coding, Medical" />
            </Form.Group>
            <div className="row">
              <div className="col-md-6 mb-3">
                <Form.Label>Priority</Form.Label>
                <Form.Select value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value})}>
                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>
                </Form.Select>
              </div>
              <div className="col-md-6 mb-3">
                <Form.Label>Status</Form.Label>
                <Form.Select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                  <option>Draft</option>
                  <option>Active</option>
                  <option>Completed</option>
                  <option>Archived</option>
                </Form.Select>
              </div>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleClose}>Cancel</Button>
            <Button variant="primary" type="submit">Save Project</Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
}

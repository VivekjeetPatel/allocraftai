import React, { useEffect, useState } from 'react';
import { db, storage } from '../../firebase/config';
import { collection, query, where, onSnapshot, doc, updateDoc, getDocs } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { useAuth } from '../../context/AuthContext';
import { Card, Button, Modal, Form, Badge, ProgressBar, Spinner } from 'react-bootstrap';
import { toast } from 'react-toastify';

export default function VolunteerTaskKanban() {
  const { currentUser } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [projectsMap, setProjectsMap] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [activeTask, setActiveTask] = useState(null);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!currentUser?.uid) {
      setLoading(false);
      return;
    }

    // 1. Fetch tasks assigned to Volunteer
    const qTasks = query(collection(db, 'tasks'), where('assignedTo', '==', currentUser.uid));
    const unsubTasks = onSnapshot(qTasks, async (snapshot) => {
      const taskDocs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTasks(taskDocs);

      // 2. Fetch corresponding project names to map them
      const projIds = [...new Set(taskDocs.map(t => t.projectId))];
      if (projIds.length > 0) {
        const pMap = {};
        // Note: 'in' query limited to 10. For scale, fetch all projects assigned to user
        const qProj = query(collection(db, 'projects'), where('teamIds', 'array-contains', currentUser.uid));
        const pSnap = await getDocs(qProj);
        pSnap.forEach(p => { pMap[p.id] = p.data().title; });
        setProjectsMap(pMap);
      }
      setLoading(false);
      setError(null);
    }, (err) => {
      console.error('Error fetching tasks:', err);
      setError('Failed to load tasks. Please try again.');
      setLoading(false);
    });

    return () => unsubTasks();
  }, [currentUser]);

  const getColumnTasks = (status) => tasks.filter(t => (t.status || 'Pending') === status);

  const handleOpenTask = (task) => {
    setActiveTask(task);
    setShowModal(true);
  };

  const handleClose = () => {
    setShowModal(false);
    setActiveTask(null);
    setUploadFile(null);
    setUploadProgress(0);
  };

  const handleUpdateStatus = async (newStatus) => {
    try {
      await updateDoc(doc(db, 'tasks', activeTask.id), { status: newStatus });
      setActiveTask(prev => ({ ...prev, status: newStatus }));
      toast.success('Task status updated');
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleUploadProof = async () => {
    if (!uploadFile || !activeTask) return;
    try {
      setUploading(true);
      const storageRef = ref(storage, `proofs/${activeTask.id}_${uploadFile.name}`);
      const uploadTask = uploadBytesResumable(storageRef, uploadFile);

      uploadTask.on('state_changed', 
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
        }, 
        (error) => {
          console.error(error);
          toast.error('Upload failed');
          setUploading(false);
        }, 
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          await updateDoc(doc(db, 'tasks', activeTask.id), { proof: downloadURL });
          setActiveTask(prev => ({ ...prev, proof: downloadURL }));
          toast.success('File uploaded successfully');
          setUploading(false);
          setUploadFile(null);
        }
      );
    } catch (error) {
      console.error(error);
      setUploading(false);
    }
  };

  const renderColumn = (title, statusName, bgStyle) => {
    const colTasks = getColumnTasks(statusName);
    const statusEmojis = { 'Pending': '⏳', 'In Progress': '🚀', 'Completed': '✅' };
    
    return (
      <div className="col-lg-4 mb-4">
        <Card className="h-100 glass-card border-0 overflow-hidden">
          <Card.Header className="text-white fw-bold py-3 px-4" style={{ backgroundColor: bgStyle, fontSize: '1.1rem' }}>
            {statusEmojis[statusName] || '📌'} {title} <Badge bg="light" text="dark" className="ms-2 fs-6">{colTasks.length}</Badge>
          </Card.Header>
          <Card.Body className="px-0 py-3 overflow-y-auto" style={{ minHeight: '60vh', backgroundColor: 'rgba(255,255,255,0.5)' }}>
            {colTasks.length === 0 ? (
              <div className="text-center text-muted py-5">
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📭</div>
                <small>No {statusName.toLowerCase()} tasks</small>
              </div>
            ) : (
              <div className="px-3">
                {colTasks.map(task => (
                  <Card 
                    key={task.id} 
                    className="mb-3 glass-card cursor-pointer task-card border-0 shadow-sm" 
                    style={{ 
                      cursor: 'pointer', 
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      borderLeft: `4px solid ${bgStyle}`,
                      minHeight: '140px'
                    }}
                    onClick={() => handleOpenTask(task)}
                    onMouseEnter={e => {
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.12)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '';
                    }}
                  >
                    <Card.Body className="p-3">
                      <h6 className="mb-2 fw-bold text-dark">{task.title}</h6>
                      <p className="text-muted small mb-3 text-truncate" style={{ maxHeight: '2.4em', overflow: 'hidden' }}>
                        {task.description || 'No description provided'}
                      </p>
                      <div className="d-flex justify-content-between align-items-center small">
                        <span className="text-truncate text-secondary" style={{ maxWidth: '65%', fontSize: '0.85rem' }}>
                          📁 {projectsMap[task.projectId] || 'Unassigned'}
                        </span>
                        <span className="text-muted" style={{ fontSize: '0.85rem' }}>🕒 {task.deadline || 'TBD'}</span>
                      </div>
                      {task.proof && (
                        <Badge bg="success" className="mt-2 text-white">
                          ✅ Proof submitted
                        </Badge>
                      )}
                    </Card.Body>
                  </Card>
                ))}
              </div>
            )}
          </Card.Body>
        </Card>
      </div>
    );
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1 fw-bold text-dark">📋 My Tasks Kanban</h2>
          <p className="text-muted small mb-0">Track and manage your assigned tasks</p>
        </div>
      </div>

      {error && (
        <Card className="bg-danger bg-opacity-10 border-danger mb-4">
          <Card.Body className="py-2 px-3">
            <span className="text-danger">⚠️ {error}</span>
          </Card.Body>
        </Card>
      )}

      {loading ? (
        <div className="row">
          {[1, 2, 3].map(i => (
            <div key={i} className="col-md-4 mb-4">
              <Card className="h-100 bg-light border-0">
                <Card.Header className="bg-secondary bg-opacity-25 animate-pulse" style={{ height: '40px' }}></Card.Header>
                <Card.Body className="px-1 py-3" style={{ minHeight: '60vh' }}>
                  {[1, 2, 3].map(j => (
                    <Card key={j} className="mb-3 bg-white border-0 animate-pulse" style={{ height: '120px' }}></Card>
                  ))}
                </Card.Body>
              </Card>
            </div>
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <Card className="border-0 shadow-sm text-center py-5 bg-white">
          <Card.Body>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
            <h5 className="text-muted">No tasks assigned yet</h5>
            <p className="text-muted small">Check back later for new assignments</p>
          </Card.Body>
        </Card>
      ) : (
        <div className="row">
          {renderColumn('Pending', 'Pending', '#6c757d')}
          {renderColumn('In Progress', 'In Progress', '#007bff')}
          {renderColumn('Completed', 'Completed', '#28a745')}
        </div>
      )}

      <Modal show={showModal} onHide={handleClose} size="lg" centered>
        {activeTask && (
          <>
            <Modal.Header closeButton className="border-bottom-subtle">
              <div>
                <Modal.Title className="fw-bold">{activeTask.title}</Modal.Title>
                <small className="text-muted">Status: {activeTask.status || 'Pending'}</small>
              </div>
            </Modal.Header>
            <Modal.Body className="p-4">
              <div className="mb-4">
                <h6 className="text-primary fw-bold mb-2">📝 Description</h6>
                <p className="text-dark">{activeTask.description || 'No description provided'}</p>
              </div>

              <div className="row mb-4">
                <div className="col-sm-6 mb-3">
                  <Card className="glass-card border-0 h-100">
                    <Card.Body className="p-3">
                      <small className="text-muted d-block mb-1">📁 Project</small>
                      <strong className="text-dark">{projectsMap[activeTask.projectId] || 'Unassigned'}</strong>
                    </Card.Body>
                  </Card>
                </div>
                <div className="col-sm-6 mb-3">
                  <Card className="glass-card border-0 h-100">
                    <Card.Body className="p-3">
                      <small className="text-muted d-block mb-1">🕒 Deadline</small>
                      <strong className="text-dark">{activeTask.deadline || 'Not set'}</strong>
                    </Card.Body>
                  </Card>
                </div>
              </div>

              <hr className="my-4" />

              <div className="mb-4">
                <h6 className="fw-bold mb-3">🎯 Update Status</h6>
                <div className="d-flex gap-2 flex-wrap">
                  <Button 
                    size="sm"
                    variant={activeTask.status === 'Pending' ? 'secondary' : 'outline-secondary'} 
                    onClick={() => handleUpdateStatus('Pending')}
                    className="flex-grow-1"
                  >
                    ⏳ Pending
                  </Button>
                  <Button 
                    size="sm"
                    variant={activeTask.status === 'In Progress' ? 'primary' : 'outline-primary'} 
                    onClick={() => handleUpdateStatus('In Progress')}
                    className="flex-grow-1"
                  >
                    🚀 In Progress
                  </Button>
                  <Button 
                    size="sm"
                    variant={activeTask.status === 'Completed' ? 'success' : 'outline-success'} 
                    onClick={() => handleUpdateStatus('Completed')}
                    className="flex-grow-1"
                  >
                    ✅ Completed
                  </Button>
                </div>
              </div>

              <hr className="my-4" />

              <div>
                <h6 className="fw-bold mb-3">📎 Proof of Completion</h6>
                {activeTask.proof ? (
                  <Card className="border-0 bg-success bg-opacity-10 mb-3">
                    <Card.Body className="p-3 d-flex justify-content-between align-items-center">
                      <div>
                        <span className="me-2">✅</span> 
                        <strong className="text-success">Proof file uploaded</strong>
                      </div>
                      <a href={activeTask.proof} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-success">
                        👁️ View File
                      </a>
                    </Card.Body>
                  </Card>
                ) : (
                  <Card className="border-0 glass-card">
                    <Card.Body className="p-3">
                      <Form.Group className="mb-3">
                        <Form.Label className="small text-muted">Upload proof file</Form.Label>
                        <Form.Control 
                          type="file" 
                          onChange={e => setUploadFile(e.target.files[0])}
                          className="border-2"
                        />
                      </Form.Group>
                      {uploading && (
                        <div className="mb-3">
                          <small className="text-muted d-block mb-2">Uploading... {Math.floor(uploadProgress)}%</small>
                          <ProgressBar now={uploadProgress} className="rounded-pill" style={{ height: '6px' }} />
                        </div>
                      )}
                      <Button 
                        variant="primary" 
                        disabled={!uploadFile || uploading} 
                        onClick={handleUploadProof}
                        className="w-100"
                      >
                        {uploading ? (
                          <>
                            <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                            Uploading...
                          </>
                        ) : (
                          '📤 Upload Proof'
                        )}
                      </Button>
                    </Card.Body>
                  </Card>
                )}
              </div>
            </Modal.Body>
          </>
        )}
      </Modal>
    </div>
  );
}

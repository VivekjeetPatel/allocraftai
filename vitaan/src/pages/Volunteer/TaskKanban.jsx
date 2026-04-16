import React, { useEffect, useState } from 'react';
import { db, storage } from '../../firebase/config';
import { collection, query, where, onSnapshot, doc, updateDoc, getDocs } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { useAuth } from '../../context/AuthContext';
import { Card, Button, Modal, Form, Badge, ProgressBar } from 'react-bootstrap';
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

  useEffect(() => {
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
    });

    return () => unsubTasks();
  }, [currentUser.uid]);

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
    return (
      <div className="col-md-4 mb-4">
        <Card className="h-100 bg-transparent border-0">
          <Card.Header className="text-white fw-bold rounded shadow-sm text-center" style={{ backgroundColor: bgStyle }}>
            {title} ({colTasks.length})
          </Card.Header>
          <Card.Body className="px-1 py-3" style={{ minHeight: '60vh', backgroundColor: '#f4f6f9', borderRadius: '5px' }}>
            {colTasks.map(task => (
              <Card 
                key={task.id} 
                className="mb-3 shadow-sm task-card" 
                style={{ cursor: 'pointer', transition: 'transform 0.2s', borderLeft: `5px solid ${bgStyle}` }}
                onClick={() => handleOpenTask(task)}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <Card.Body className="p-3">
                  <h6 className="mb-1">{task.title}</h6>
                  <div className="text-muted small mb-2 text-truncate">{task.description}</div>
                  <div className="d-flex justify-content-between text-muted small">
                    <span className="text-truncate" style={{ maxWidth: '60%' }}>{projectsMap[task.projectId] || 'Project'}</span>
                    <span>🕒 {task.deadline}</span>
                  </div>
                  {task.proof && <Badge bg="success" className="mt-2 text-white">Proof uploaded</Badge>}
                </Card.Body>
              </Card>
            ))}
            {colTasks.length === 0 && <div className="text-center text-muted small py-4">No {statusName} tasks.</div>}
          </Card.Body>
        </Card>
      </div>
    );
  };

  return (
    <div>
      <h2 className="mb-4">My Tasks Kanban</h2>
      <div className="row">
        {renderColumn('Pending', 'Pending', '#6c757d')}
        {renderColumn('In Progress', 'In Progress', '#007bff')}
        {renderColumn('Completed', 'Completed', '#28a745')}
      </div>

      <Modal show={showModal} onHide={handleClose} size="lg">
        {activeTask && (
          <>
            <Modal.Header closeButton>
              <Modal.Title>{activeTask.title}</Modal.Title>
            </Modal.Header>
            <Modal.Body className="p-4">
              <div className="mb-4">
                <h6 className="text-primary fw-bold text-uppercase small">Description</h6>
                <p>{activeTask.description}</p>
              </div>

              <div className="row mb-4 bg-light p-3 rounded">
                <div className="col-sm-6 mb-2">
                  <strong className="d-block small text-muted">Project</strong>
                  {projectsMap[activeTask.projectId]}
                </div>
                <div className="col-sm-6 mb-2">
                  <strong className="d-block small text-muted">Deadline</strong>
                  {activeTask.deadline}
                </div>
              </div>

              <div className="mb-4">
                <h6 className="fw-bold">Update Status</h6>
                <div className="d-flex gap-2">
                  <Button variant={activeTask.status === 'Pending' ? 'secondary' : 'outline-secondary'} onClick={() => handleUpdateStatus('Pending')}>Pending</Button>
                  <Button variant={activeTask.status === 'In Progress' ? 'primary' : 'outline-primary'} onClick={() => handleUpdateStatus('In Progress')}>In Progress</Button>
                  <Button variant={activeTask.status === 'Completed' ? 'success' : 'outline-success'} onClick={() => handleUpdateStatus('Completed')}>Completed</Button>
                </div>
              </div>

              <hr />
              <div className="mt-4">
                <h6 className="fw-bold">Proof of Completion</h6>
                {activeTask.proof ? (
                  <div className="bg-success text-white p-3 rounded flex align-items-center justify-content-between">
                    <div>
                      <span className="me-2">✅</span> 
                      <strong>Proof file uploaded</strong>
                    </div>
                    <a href={activeTask.proof} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-light mt-2">View File</a>
                  </div>
                ) : (
                  <div>
                    <Form.Group className="mb-2">
                      <Form.Control type="file" onChange={e => setUploadFile(e.target.files[0])} />
                    </Form.Group>
                    {uploading && <ProgressBar now={uploadProgress} label={`${Math.floor(uploadProgress)}%`} className="mb-2" />}
                    <Button variant="primary" disabled={!uploadFile || uploading} onClick={handleUploadProof}>
                      {uploading ? 'Uploading...' : 'Upload Proof'}
                    </Button>
                  </div>
                )}
              </div>
            </Modal.Body>
          </>
        )}
      </Modal>
    </div>
  );
}

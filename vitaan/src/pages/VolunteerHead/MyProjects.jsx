import React, { useEffect, useState } from 'react';
import { db } from '../../firebase/config';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { Card, Badge, ProgressBar } from 'react-bootstrap';

export default function HeadMyProjects() {
  const { currentUser } = useAuth();
  const [projects, setProjects] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);

  useEffect(() => {
    // A Volunteer Head sees projects where their uid is in teamIds
    const qProjects = query(collection(db, 'projects'), where('teamIds', 'array-contains', currentUser.uid));
    const unsubProjects = onSnapshot(qProjects, (snapshot) => {
      setProjects(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // We can also fetch the users that belong to these projects
    // For simplicity, we fetch users who have the volunteer head's uid in the same project or just fetch users based on the active projects.
    // Given 'projectIds' array is on the users doc, we can query users where projectIds array contains any of our project ids.
    // However, Firestore 'array-contains-any' limits to 10. For a simple app, we just listen to all users and filter locally.
    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      setTeamMembers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubProjects();
      unsubUsers();
    };
  }, [currentUser.uid]);

  const getProjectTeam = (projectId) => {
    return teamMembers.filter(user => user.projectIds && user.projectIds.includes(projectId));
  };

  return (
    <div>
      <h2 className="mb-4">My Assigned Projects</h2>
      {projects.map(proj => {
        const projTeam = getProjectTeam(proj.id);
        return (
          <Card key={proj.id} className="mb-4 shadow-sm border-0">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h4 className="m-0 text-primary">{proj.title}</h4>
                <Badge bg={proj.status === 'Completed' ? 'success' : 'primary'}>{proj.status}</Badge>
              </div>
              <p className="text-muted mb-3">{proj.description}</p>
              
              <div className="mb-3">
                <div className="d-flex justify-content-between small text-muted mb-1">
                  <span>Overall Progress</span>
                  <span>{Math.round(proj.progress || 0)}%</span>
                </div>
                <ProgressBar now={proj.progress || 0} variant="success" />
              </div>

              <h6 className="mt-4 fw-bold">Team Members ({projTeam.length})</h6>
              {projTeam.length > 0 ? (
                <ul className="list-unstyled d-flex flex-wrap gap-2 mt-2">
                  {projTeam.map(member => (
                    <li key={member.id} className="bg-light px-3 py-2 rounded shadow-sm border">
                      <strong>{member.name || member.email}</strong>
                      <br />
                      <small className="text-muted">{member.role}</small>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted small">No team members assigned yet.</p>
              )}
            </Card.Body>
          </Card>
        );
      })}
      {projects.length === 0 && <p className="text-muted">You are not assigned to any projects currently.</p>}
    </div>
  );
}

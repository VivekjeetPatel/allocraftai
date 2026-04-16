import React, { useEffect, useState } from 'react';
import { db } from '../../firebase/config';
import { collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { Card, Table, ProgressBar } from 'react-bootstrap';

export default function HeadTeamMonitoring() {
  const { currentUser } = useAuth();
  const [teamMetrics, setTeamMetrics] = useState([]);

  useEffect(() => {
    // 1. Fetch user's assigned projects
    const qProjects = query(collection(db, 'projects'), where('teamIds', 'array-contains', currentUser.uid));
    
    const fetchMetrics = async () => {
      const projSnap = await getDocs(qProjects);
      const projectIds = projSnap.docs.map(d => d.id);
      
      if (projectIds.length === 0) return;

      // 2. Fetch all users
      // Limit: Real app might just fetch users associated with these projects.
      const usersSnap = await getDocs(collection(db, 'users'));
      const volunteers = usersSnap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(u => u.projectIds && u.projectIds.some(pid => projectIds.includes(pid)));

      // 3. Listen to tasks to calculate real-time efficiency
      const qTasks = query(collection(db, 'tasks'), where('projectId', 'in', projectIds));
      
      const unsub = onSnapshot(qTasks, (snapshot) => {
        const tasksData = snapshot.docs.map(doc => doc.data());
        
        const metrics = volunteers.map(vol => {
          const volTasks = tasksData.filter(t => t.assignedTo === vol.id);
          const totalTasks = volTasks.length;
          const completedTasks = volTasks.filter(t => t.status === 'Completed').length;
          const efficiency = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
          
          return {
            ...vol,
            totalTasks,
            completedTasks,
            efficiency
          };
        });
        
        setTeamMetrics(metrics);
      });

      return () => unsub();
    };

    let cleanup;
    fetchMetrics().then(unsub => cleanup = unsub);
    
    return () => {
      if (cleanup) cleanup();
    };
  }, [currentUser.uid]);

  return (
    <div>
      <h2 className="mb-4">Team Monitoring</h2>
      <Card className="shadow-sm border-0">
        <Card.Body className="p-0">
          <Table responsive hover className="m-0">
            <thead className="bg-light">
              <tr>
                <th>Volunteer Name</th>
                <th>Tasks Completed</th>
                <th>Total Assigned</th>
                <th style={{ width: '30%' }}>Efficiency Score</th>
              </tr>
            </thead>
            <tbody>
              {teamMetrics.map(vol => (
                <tr key={vol.id}>
                  <td><strong>{vol.name || vol.email}</strong></td>
                  <td>{vol.completedTasks}</td>
                  <td>{vol.totalTasks}</td>
                  <td>
                    <div className="d-flex align-items-center">
                      <div className="flex-grow-1 me-2">
                        <ProgressBar 
                          now={vol.efficiency} 
                          variant={vol.efficiency === 100 ? 'success' : vol.efficiency > 50 ? 'primary' : 'warning'} 
                        />
                      </div>
                      <span className="small fw-bold">{Math.round(vol.efficiency)}%</span>
                    </div>
                  </td>
                </tr>
              ))}
              {teamMetrics.length === 0 && (
                <tr>
                  <td colSpan="4" className="text-center py-4 text-muted">No team members data available.</td>
                </tr>
              )}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    </div>
  );
}

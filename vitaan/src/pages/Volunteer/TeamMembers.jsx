import React, { useEffect, useState } from 'react';
import { db } from '../../firebase/config';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { Card, Table } from 'react-bootstrap';

export default function VolunteerTeamMembers() {
  const { currentUser } = useAuth();
  const [teammates, setTeammates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTeammates = async () => {
      try {
        if (!currentUser.projectIds || currentUser.projectIds.length === 0) {
          setLoading(false);
          return;
        }

        // Fetch all users
        // Real app: we would filter backend, but firestore array-contains-any limits to 10
        const usersSnap = await getDocs(collection(db, 'users'));
        const allUsers = usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const myProjectIds = currentUser.projectIds || [];
        
        // Filter users who share at least one project
        const myTeam = allUsers.filter(user => {
          if (user.id === currentUser.uid) return false;
          if (!user.projectIds) return false;
          return user.projectIds.some(pid => myProjectIds.includes(pid));
        });

        setTeammates(myTeam);
      } catch (error) {
        console.error("Failed to fetch teammates", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTeammates();
  }, [currentUser]);

  return (
    <div>
      <h2 className="mb-4">My Team Members</h2>
      <Card className="shadow-sm border-0">
        <Card.Body className="p-0">
          <Table responsive hover className="m-0">
            <thead className="bg-light">
              <tr>
                <th>Name</th>
                <th>Role</th>
                <th>Skills</th>
                <th>Contact</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="4" className="text-center py-4">Loading...</td></tr>
              ) : teammates.length === 0 ? (
                <tr><td colSpan="4" className="text-center py-4 text-muted">No team members found for your projects.</td></tr>
              ) : (
                teammates.map(user => (
                  <tr key={user.id}>
                    <td><strong>{user.name || 'Unnamed User'}</strong></td>
                    <td className="text-capitalize">{user.role}</td>
                    <td>{user.skills ? user.skills.join(', ') : <span className="text-muted">None</span>}</td>
                    <td><a href={`mailto:${user.email}`}>{user.email}</a></td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    </div>
  );
}

import React from 'react';
import { Nav } from 'react-bootstrap';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Sidebar({ show, toggleSidebar }) {
  const { role } = useAuth();
  
  const adminLinks = [
    { to: '/admin', label: 'Dashboard' },
    { to: '/admin/projects', label: 'Projects' },
    { to: '/admin/volunteers', label: 'Volunteers' },
    { to: '/admin/queries', label: 'Query Board' },
  ];

  const headLinks = [
    { to: '/volunteer-head', label: 'My Projects' },
    { to: '/volunteer-head/tasks', label: 'Task Management' },
    { to: '/volunteer-head/team', label: 'Team Monitoring' },
    { to: '/volunteer-head/queries', label: 'Query Board' },
  ];

  const volunteerLinks = [
    { to: '/volunteer', label: 'My Tasks' },
    { to: '/volunteer/team', label: 'Team Members' },
    { to: '/volunteer/queries', label: 'Query Board' },
  ];

  let links = [];
  if (role === 'admin') links = adminLinks;
  else if (role === 'volunteerHead') links = headLinks;
  else if (role === 'volunteer') links = volunteerLinks;

  return (
    <div 
      className={`sidebar-nav bg-dark text-white p-3 ${show ? 'd-block' : 'd-none d-md-block'}`} 
      style={{ width: '250px', minHeight: '100vh', transition: 'left 0.3s ease', zIndex: 1000 }}
    >
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="m-0" style={{ fontWeight: '700', letterSpacing: '1px' }}>Menu</h4>
        {show && (
          <button className="btn btn-sm btn-dark d-md-none" onClick={toggleSidebar}>
            ✕
          </button>
        )}
      </div>
      <Nav className="flex-column gap-2">
        {links.map((link) => (
          <NavLink 
            key={link.to} 
            to={link.to} 
            className={({ isActive }) => 
              `nav-link text-white rounded p-2 ${isActive ? 'bg-primary shadow-sm' : 'hover-bg-secondary'}`
            }
            end={link.to === '/admin' || link.to === '/volunteer-head' || link.to === '/volunteer'}
          >
            {link.label}
          </NavLink>
        ))}
      </Nav>
    </div>
  );
}

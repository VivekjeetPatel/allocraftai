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
      className={`glass-panel p-3 m-3 ${show ? 'd-block position-fixed' : 'd-none d-md-block'}`} 
      style={{ 
        width: '260px', 
        height: 'calc(100vh - 2rem)', 
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', 
        zIndex: 1000,
        borderRadius: 'var(--card-radius)',
        left: show ? '0' : 'auto'
      }}
    >
      <div className="d-flex justify-content-between align-items-center mb-4 px-2 pt-2">
        <h4 className="m-0 brand-text text-dark" style={{ fontWeight: '700' }}>Menu</h4>
        {show && (
          <button className="btn btn-sm btn-outline-dark d-md-none rounded-circle px-2" onClick={toggleSidebar}>
            ✕
          </button>
        )}
      </div>
      <Nav className="flex-column gap-2 mt-4">
        {links.map((link) => (
          <NavLink 
            key={link.to} 
            to={link.to} 
            className={({ isActive }) => 
              `nav-link text-dark px-3 py-2 ${isActive ? 'bg-white shadow-sm fw-bold' : ''}`
            }
            style={{ borderRadius: 'var(--pill-radius)', transition: 'all 0.2s' }}
            end={link.to === '/admin' || link.to === '/volunteer-head' || link.to === '/volunteer'}
            onClick={() => show && toggleSidebar()} // close on mobile
          >
            {link.label}
          </NavLink>
        ))}

        {/* Divider */}
        <hr className="my-3" />

        {/* Additional Links */}
        <NavLink 
          to="/chat" 
          className={({ isActive }) => 
            `nav-link text-dark px-3 py-2 ${isActive ? 'bg-white shadow-sm fw-bold' : ''}`
          }
          style={{ borderRadius: 'var(--pill-radius)', transition: 'all 0.2s' }}
          onClick={() => show && toggleSidebar()}
        >
          🤖 AI Chat
        </NavLink>

        <NavLink 
          to="/profile" 
          className={({ isActive }) => 
            `nav-link text-dark px-3 py-2 ${isActive ? 'bg-white shadow-sm fw-bold' : ''}`
          }
          style={{ borderRadius: 'var(--pill-radius)', transition: 'all 0.2s' }}
          onClick={() => show && toggleSidebar()}
        >
          👤 My Profile
        </NavLink>
      </Nav>
    </div>
  );
}

import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import AppNavbar from './AppNavbar';

export default function MainLayout() {
  const [showSidebar, setShowSidebar] = useState(false);

  const toggleSidebar = () => setShowSidebar(!showSidebar);

  return (
    <div className="d-flex" style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
      <Sidebar show={showSidebar} toggleSidebar={toggleSidebar} />
      <div className="flex-grow-1 d-flex flex-column" style={{ overflowX: 'hidden' }}>
        <AppNavbar toggleSidebar={toggleSidebar} />
        <div className="p-4 flex-grow-1">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

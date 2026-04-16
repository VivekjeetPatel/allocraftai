import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import AppNavbar from './AppNavbar';

export default function MainLayout() {
  const [showSidebar, setShowSidebar] = useState(false);
  const toggleSidebar = () => setShowSidebar(!showSidebar);

  return (
    <div className="d-flex w-100" style={{ minHeight: '100vh', position: 'relative' }}>
      <Sidebar show={showSidebar} toggleSidebar={toggleSidebar} />
      
      {/* Overlay for mobile sidebar */}
      {showSidebar && (
        <div 
          className="position-fixed top-0 start-0 w-100 h-100 bg-dark d-md-none" 
          style={{ opacity: 0.5, zIndex: 999 }}
          onClick={toggleSidebar}
        ></div>
      )}

      <div className="flex-grow-1 d-flex flex-column wrapper-content" style={{ overflowX: 'hidden' }}>
        <div className="px-3 px-md-4 pt-3 w-100">
           <AppNavbar toggleSidebar={toggleSidebar} />
        </div>
        <div className="p-3 p-md-4 flex-grow-1 d-flex flex-column w-100">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

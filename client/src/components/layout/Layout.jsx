import React, { useState } from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);

  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleSidebarClose = () => {
    setSidebarOpen(false);
  };

  const handleOpenProjectModal = () => {
    setShowProjectModal(true);
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      {/* Navbar */}
      <Navbar 
        onSidebarToggle={handleSidebarToggle} 
        sidebarOpen={sidebarOpen}
        showProjectModal={showProjectModal}
        setShowProjectModal={setShowProjectModal}
      />
      
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebar 
          isOpen={sidebarOpen} 
          onClose={handleSidebarClose}
          onOpenProjectModal={handleOpenProjectModal}
        />
        
        {/* Main content */}
        <main className="flex-1 w-full overflow-auto bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
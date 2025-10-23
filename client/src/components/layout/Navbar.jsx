import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { NotificationPanel, Avatar } from '../common';
import {
  Menu,
  X,
  Bell,
  Settings,
  LogOut,
  User,
  ChevronDown,
  Search,
  Plus,
  FolderPlus,
  ListTodo,
} from 'lucide-react';
import Modal from '../common/Modal';
import TaskModal from '../tasks/TaskModal';
import ProjectModal from '../projects/ProjectModal';
import { projectService } from '../../services/projectService';

const Navbar = ({ onSidebarToggle, sidebarOpen }) => {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [createMenuOpen, setCreateMenuOpen] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);

  const { user, logout } = useAuth();
  const { notifications, getUnreadCount } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();
  
  const unreadCount = getUnreadCount();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleSaveProject = async (projectData) => {
    try {
      await projectService.createProject(projectData);
      setShowProjectModal(false);
      navigate('/projects');
    } catch (error) {
      console.error('Error creating project:', error);
      throw error;
    }
  };

  return (
    <nav className="bg-white border-b border-gray-200 py-4">
      <div className="flex items-center justify-between px-8 lg:px-12">
        {/* Left side */}
        <div className="flex items-center space-x-4">
          {/* Sidebar toggle */}
          <button
            type="button"
            className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 lg:hidden"
            onClick={onSidebarToggle}
          >
            {sidebarOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>

          {/* Logo */}
          <Link to="/dashboard" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">T</span>
            </div>
            <span className="text-xl font-bold text-gray-900 hidden sm:block">
              TaskFlow
            </span>
          </Link>
        </div>

        {/* Center - Search */}
        <div className="flex-1 max-w-2xl mx-4 hidden md:block">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-10 w-full"
              placeholder="Search tasks, projects, or team members..."
            />
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-4">
          {/* Create button with dropdown */}
          <div className="relative hidden sm:block">
            <button 
              onClick={() => setCreateMenuOpen(!createMenuOpen)}
              className="btn btn-primary flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create
            </button>
            
            {/* Create dropdown menu */}
            {createMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                <button
                  onClick={() => {
                    setCreateMenuOpen(false);
                    setShowTaskModal(true);
                  }}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center text-gray-700 rounded-t-lg"
                >
                  <ListTodo className="h-4 w-4 mr-3 text-blue-600" />
                  <div>
                    <div className="font-medium">New Task</div>
                    <div className="text-xs text-gray-500">Create a new task</div>
                  </div>
                </button>
                <button
                  onClick={() => {
                    setCreateMenuOpen(false);
                    setShowProjectModal(true);
                  }}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center text-gray-700 rounded-b-lg"
                >
                  <FolderPlus className="h-4 w-4 mr-3 text-green-600" />
                  <div>
                    <div className="font-medium">New Project</div>
                    <div className="text-xs text-gray-500">Create a new project</div>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Notifications */}
          <NotificationPanel 
            isOpen={notificationsOpen} 
            onToggle={() => setNotificationsOpen(!notificationsOpen)} 
          />

          {/* User menu */}
          <div className="relative">
            <button
              type="button"
              className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
              onClick={() => setUserMenuOpen(!userMenuOpen)}
            >
              <Avatar user={user} size="sm" showOnlineStatus={false} />
              <div className="hidden sm:block text-left">
                <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                <p className="text-xs text-gray-600 capitalize">{user?.role}</p>
              </div>
              <ChevronDown className="h-4 w-4 text-gray-600" />
            </button>

            {/* User dropdown */}
            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                <div className="p-4 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                  <p className="text-sm text-gray-600">{user?.email}</p>
                </div>
                <div className="py-2">
                  <Link
                    to="/profile"
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <User className="h-4 w-4 mr-3" />
                    Profile
                  </Link>
                  <Link
                    to="/settings"
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <Settings className="h-4 w-4 mr-3" />
                    Settings
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <LogOut className="h-4 w-4 mr-3" />
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile search */}
      <div className="mt-3 md:hidden">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input pl-10 w-full"
            placeholder="Search..."
          />
        </div>
      </div>

      {/* Click outside to close dropdowns */}
      {(userMenuOpen || notificationsOpen || createMenuOpen) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setUserMenuOpen(false);
            setNotificationsOpen(false);
            setCreateMenuOpen(false);
          }}
        ></div>
      )}

      {/* Task Modal */}
      {showTaskModal && (
        <TaskModal
          isOpen={showTaskModal}
          onClose={() => setShowTaskModal(false)}
          onSave={() => {
            setShowTaskModal(false);
            // Refresh will happen via socket events
          }}
        />
      )}

      {/* Project Modal */}
      {showProjectModal && (
        <ProjectModal
          isOpen={showProjectModal}
          onClose={() => setShowProjectModal(false)}
          onSave={handleSaveProject}
        />
      )}
    </nav>
  );
};

export default Navbar;
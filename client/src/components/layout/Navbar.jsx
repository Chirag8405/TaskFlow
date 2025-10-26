import React, { useState, useEffect, useRef } from 'react';
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
  CheckCircle,
} from 'lucide-react';
import Modal from '../common/Modal';
import TaskModal from '../tasks/TaskModal';
import ProjectModal from '../projects/ProjectModal';
import { projectService } from '../../services/projectService';

const Navbar = ({ onSidebarToggle, sidebarOpen, showProjectModal: externalShowProjectModal, setShowProjectModal: externalSetShowProjectModal }) => {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [createMenuOpen, setCreateMenuOpen] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [internalShowProjectModal, setInternalShowProjectModal] = useState(false);

  // Use external state if provided, otherwise use internal state
  const showProjectModal = externalShowProjectModal !== undefined ? externalShowProjectModal : internalShowProjectModal;
  const setShowProjectModal = externalSetShowProjectModal || setInternalShowProjectModal;

  const { user, logout } = useAuth();
  const { notifications, getUnreadCount } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();
  const searchTimeoutRef = useRef(null);
  
  const unreadCount = getUnreadCount();

  // Debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchQuery.trim()) {
      searchTimeoutRef.current = setTimeout(() => {
        handleSearch(searchQuery);
      }, 300);
    } else {
      setSearchResults(null);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  const handleSearch = async (query) => {
    if (!query.trim()) {
      setSearchResults(null);
      return;
    }

    setSearchLoading(true);
    try {
      const { taskService } = await import('../../services/taskService');
      const { projectService } = await import('../../services/projectService');
      const { userService } = await import('../../services/userService');

      const [tasksRes, projectsRes, usersRes] = await Promise.allSettled([
        taskService.getRecentTasks(10, query),
        projectService.getProjects({ search: query, limit: 5 }),
        userService.getUsers({ search: query, limit: 5 }),
      ]);

      setSearchResults({
        tasks: tasksRes.status === 'fulfilled' ? (tasksRes.value.data || []).slice(0, 5) : [],
        projects: projectsRes.status === 'fulfilled' ? (projectsRes.value.data.projects || []).slice(0, 5) : [],
        users: usersRes.status === 'fulfilled' ? (usersRes.value.data.users || []).slice(0, 5) : [],
      });
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults({ tasks: [], projects: [], users: [] });
    } finally {
      setSearchLoading(false);
    }
  };

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
              onChange={(e) => {
                setSearchQuery(e.target.value);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && searchQuery.trim()) {
                  navigate(`/tasks?search=${encodeURIComponent(searchQuery)}`);
                  setSearchResults(null);
                  setSearchQuery('');
                }
                if (e.key === 'Escape') {
                  setSearchResults(null);
                  setSearchQuery('');
                }
              }}
              className="input pl-10 w-full"
              placeholder="Search tasks, projects, or team members..."
            />
            
            {/* Search Results Dropdown */}
            {searchResults && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-y-auto">
                {searchLoading ? (
                  <div className="p-4 text-center text-gray-500">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 mx-auto"></div>
                  </div>
                ) : (
                  <>
                    {/* Tasks */}
                    {searchResults.tasks?.length > 0 && (
                      <div className="p-2">
                        <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Tasks</div>
                        {searchResults.tasks.map((task) => (
                          <button
                            key={task._id}
                            onClick={() => {
                              navigate(`/tasks?search=${encodeURIComponent(task.title)}`);
                              setSearchResults(null);
                              setSearchQuery('');
                            }}
                            className="w-full text-left px-3 py-2 hover:bg-gray-50 rounded-md flex items-start"
                          >
                            <CheckCircle className="h-4 w-4 mt-0.5 mr-2 text-gray-400 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{task.title}</p>
                              <p className="text-xs text-gray-500 truncate">{task.project?.title || 'No project'}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                    
                    {/* Projects */}
                    {searchResults.projects?.length > 0 && (
                      <div className="p-2 border-t border-gray-100">
                        <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Projects</div>
                        {searchResults.projects.map((project) => (
                          <button
                            key={project._id}
                            onClick={() => {
                              navigate(`/projects/${project._id}`);
                              setSearchResults(null);
                              setSearchQuery('');
                            }}
                            className="w-full text-left px-3 py-2 hover:bg-gray-50 rounded-md flex items-start"
                          >
                            <FolderPlus className="h-4 w-4 mt-0.5 mr-2 text-gray-400 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{project.title}</p>
                              <p className="text-xs text-gray-500 truncate">{project.description || 'No description'}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                    
                    {/* Team Members */}
                    {searchResults.users?.length > 0 && (
                      <div className="p-2 border-t border-gray-100">
                        <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Team Members</div>
                        {searchResults.users.map((member) => (
                          <button
                            key={member._id}
                            onClick={() => {
                              navigate(`/team`);
                              setSearchResults(null);
                              setSearchQuery('');
                            }}
                            className="w-full text-left px-3 py-2 hover:bg-gray-50 rounded-md flex items-center"
                          >
                            <Avatar user={member} size="xs" showOnlineStatus={false} />
                            <div className="ml-2 flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{member.name}</p>
                              <p className="text-xs text-gray-500 truncate">{member.email}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                    
                    {/* No Results */}
                    {!searchResults.tasks?.length && !searchResults.projects?.length && !searchResults.users?.length && (
                      <div className="p-4 text-center text-gray-500">
                        <p className="text-sm">No results found</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
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
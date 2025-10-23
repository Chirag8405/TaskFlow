import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { projectService } from '../../services/projectService';
import {
  Home,
  FolderOpen,
  Users,
  Calendar,
  BarChart3,
  Settings,
  Plus,
  ChevronDown,
  ChevronRight,
  Hash,
  Star,
  Clock,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

const Sidebar = ({ isOpen, onClose }) => {
  const [projects, setProjects] = useState([]);
  const [projectsExpanded, setProjectsExpanded] = useState(true);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const location = useLocation();

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await projectService.getProjects();
      setProjects(response.data.projects || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
      setProjects([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const sidebarItems = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: Home,
      current: location.pathname === '/dashboard',
    },
    {
      name: 'My Tasks',
      href: '/tasks',
      icon: CheckCircle,
      current: location.pathname === '/tasks',
      badge: '12', // This would come from actual task count
    },
    {
      name: 'Calendar',
      href: '/calendar',
      icon: Calendar,
      current: location.pathname === '/calendar',
    },
    {
      name: 'Team',
      href: '/team',
      icon: Users,
      current: location.pathname === '/team',
    },
    {
      name: 'Analytics',
      href: '/analytics',
      icon: BarChart3,
      current: location.pathname === '/analytics',
    },
  ];

  const getProjectIcon = (project) => {
    switch (project.status) {
      case 'completed':
        return CheckCircle;
      case 'on-hold':
        return Clock;
      case 'at-risk':
        return AlertCircle;
      default:
        return Hash;
    }
  };

  const getProjectStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'text-green-500';
      case 'completed':
        return 'text-blue-500';
      case 'on-hold':
        return 'text-yellow-500';
      case 'at-risk':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-25 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-0 lg:z-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar header - hidden on desktop since navbar has the logo */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 lg:hidden">
            <Link to="/dashboard" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">T</span>
              </div>
              <span className="text-xl font-bold text-gray-900">TaskFlow</span>
            </Link>
          </div>

          {/* Main navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {/* Main navigation items */}
            <div className="space-y-1">
              {sidebarItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={onClose}
                  className={`group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    item.current
                      ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-700'
                      : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <item.icon
                    className={`mr-3 h-5 w-5 flex-shrink-0 ${
                      item.current ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-500'
                    }`}
                  />
                  <span className="flex-1">{item.name}</span>
                  {item.badge && (
                    <span className="ml-3 inline-block py-0.5 px-2 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                      {item.badge}
                    </span>
                  )}
                </Link>
              ))}
            </div>

            {/* Projects section */}
            <div className="mt-8">
              <div className="flex items-center justify-between px-3 py-2">
                <button
                  onClick={() => setProjectsExpanded(!projectsExpanded)}
                  className="flex items-center text-sm font-medium text-gray-900 hover:text-gray-600"
                >
                  {projectsExpanded ? (
                    <ChevronDown className="mr-1 h-4 w-4" />
                  ) : (
                    <ChevronRight className="mr-1 h-4 w-4" />
                  )}
                  Projects
                </button>
                <Link
                  to="/projects/new"
                  className="p-1 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                  title="Create new project"
                >
                  <Plus className="h-4 w-4" />
                </Link>
              </div>

              {projectsExpanded && (
                <div className="mt-2 space-y-1">
                  {loading ? (
                    <div className="px-3 py-2 text-sm text-gray-500">Loading projects...</div>
                  ) : projects.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-gray-500">
                      No projects yet.{' '}
                      <Link to="/projects/new" className="text-primary-600 hover:text-primary-700">
                        Create one
                      </Link>
                    </div>
                  ) : (
                    projects.map((project) => {
                      const IconComponent = getProjectIcon(project);
                      return (
                        <Link
                          key={project._id}
                          to={`/projects/${project._id}`}
                          onClick={onClose}
                          className={`group flex items-center px-3 py-2 text-sm rounded-lg transition-colors ${
                            location.pathname === `/projects/${project._id}`
                              ? 'bg-primary-50 text-primary-700'
                              : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                          }`}
                        >
                          <IconComponent
                            className={`mr-3 h-4 w-4 flex-shrink-0 ${getProjectStatusColor(project.status)}`}
                          />
                          <div className="flex-1 min-w-0">
                            <span className="truncate">{project.name}</span>
                            {project.description && (
                              <div className="text-xs text-gray-500 truncate">
                                {project.description}
                              </div>
                            )}
                          </div>
                          {project.priority === 'high' && (
                            <Star className="ml-2 h-3 w-3 text-yellow-500 flex-shrink-0" />
                          )}
                        </Link>
                      );
                    })
                  )}
                </div>
              )}
            </div>

            {/* Quick actions */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="px-3 py-2">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Quick Actions
                </h3>
              </div>
              <div className="mt-2 space-y-1">
                <Link
                  to="/tasks"
                  onClick={onClose}
                  className="group flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:text-gray-900 hover:bg-gray-50"
                >
                  <Plus className="mr-3 h-4 w-4 text-gray-400 group-hover:text-gray-500" />
                  View Tasks
                </Link>
                <Link
                  to="/projects"
                  onClick={onClose}
                  className="group flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:text-gray-900 hover:bg-gray-50"
                >
                  <FolderOpen className="mr-3 h-4 w-4 text-gray-400 group-hover:text-gray-500" />
                  View Projects
                </Link>
              </div>
            </div>
          </nav>

          {/* Sidebar footer */}
          <div className="flex-shrink-0 border-t border-gray-200 p-4">
            <Link
              to="/settings"
              onClick={onClose}
              className="group flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:text-gray-900 hover:bg-gray-50"
            >
              <Settings className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" />
              Settings
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
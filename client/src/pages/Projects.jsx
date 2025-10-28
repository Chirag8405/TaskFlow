import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { projectService } from '../services/projectService';
import Layout from '../components/layout/Layout';
import ProjectModal from '../components/projects/ProjectModal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import toast from 'react-hot-toast';
import {
  Plus,
  Search,
  Filter,
  Calendar,
  Users,
  Star,
  MoreVertical,
  Grid,
  List,
  CheckCircle,
  Clock,
  AlertCircle,
  Activity,
} from 'lucide-react';

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    filterProjects();
  }, [projects, searchQuery, statusFilter, priorityFilter]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await projectService.getProjects();
      setProjects(response.data.projects || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = () => {
    setSelectedProject(null);
    setShowProjectModal(true);
  };

  const handleEditProject = (project) => {
    setSelectedProject(project);
    setShowProjectModal(true);
  };

  const handleSaveProject = async (projectData) => {
    try {
      if (selectedProject) {
        // Update existing project
        const response = await projectService.updateProject(selectedProject._id, projectData);
        setProjects(prev => prev.map(p => p._id === selectedProject._id ? response.data : p));
        toast.success('Project updated successfully');
      } else {
        // Create new project
        const response = await projectService.createProject(projectData);
        setProjects(prev => [response.data, ...prev]);
        toast.success('Project created successfully');
      }
      setShowProjectModal(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save project');
      throw error;
    }
  };

  const handleDeleteProject = (projectId) => {
    const project = projects.find(p => p._id === projectId);
    setProjectToDelete(project);
    setShowConfirmDialog(true);
  };

  const confirmDeleteProject = async () => {
    if (!projectToDelete) return;

    try {
      await projectService.deleteProject(projectToDelete._id);
      setProjects(prev => prev.filter(p => p._id !== projectToDelete._id));
      toast.success('Project deleted successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete project');
    } finally {
      setShowConfirmDialog(false);
      setProjectToDelete(null);
    }
  };

  const cancelDeleteProject = () => {
    setShowConfirmDialog(false);
    setProjectToDelete(null);
  };

  const filterProjects = () => {
    let filtered = [...projects];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(project =>
        project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(project => project.status === statusFilter);
    }

    // Priority filter
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(project => project.priority === priorityFilter);
    }

    setFilteredProjects(filtered);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return <Activity className="h-4 w-4 text-green-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      case 'on-hold':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'at-risk':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'text-green-700 bg-green-100';
      case 'completed':
        return 'text-blue-700 bg-blue-100';
      case 'on-hold':
        return 'text-yellow-700 bg-yellow-100';
      case 'at-risk':
        return 'text-red-700 bg-red-100';
      default:
        return 'text-gray-700 bg-gray-100';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'text-red-700 bg-red-100';
      case 'medium':
        return 'text-yellow-700 bg-yellow-100';
      case 'low':
        return 'text-green-700 bg-green-100';
      default:
        return 'text-gray-700 bg-gray-100';
    }
  };

  const formatDate = (date) => {
    if (!date) return 'No due date';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const isOverdue = (dueDate, status) => {
    if (!dueDate || status === 'completed') return false;
    return new Date(dueDate) < new Date();
  };

  const calculateProgress = (project) => {
    // Calculate based on task stats if available
    if (project.stats && project.stats.total > 0) {
      return Math.round((project.stats.done / project.stats.total) * 100);
    }
    return 0;
  };

  if (loading) {
    return (
      <Layout>
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white p-6 rounded-lg shadow border border-gray-200">
                  <div className="h-6 bg-gray-200 rounded mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="h-full w-full overflow-auto">
        <div className="p-8 lg:p-12 w-full">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
                <p className="text-gray-600 mt-1">Manage your projects and track progress</p>
              </div>
              <button
                onClick={handleCreateProject}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Project
            </button>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="mb-6 space-y-4 lg:space-y-0 lg:flex lg:items-center lg:justify-between">
          <div className="flex flex-1 items-center space-x-4">
            {/* Search */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input pl-10 w-full"
                  placeholder="Search projects..."
                />
              </div>
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input w-auto"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="on-hold">On Hold</option>
              <option value="at-risk">At Risk</option>
            </select>

            {/* Priority Filter */}
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="input w-auto"
            >
              <option value="all">All Priority</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          {/* View toggle */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md ${
                viewMode === 'grid' 
                  ? 'bg-primary-100 text-primary-700' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Grid className="h-5 w-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md ${
                viewMode === 'list' 
                  ? 'bg-primary-100 text-primary-700' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <List className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Results count */}
        <div className="mb-4">
          <p className="text-sm text-gray-600">
            Showing {filteredProjects.length} of {projects.length} projects
          </p>
        </div>

        {/* Projects */}
        {filteredProjects.length === 0 ? (
          <div className="text-center py-12">
            <Activity className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No projects found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {projects.length === 0 
                ? "Get started by creating your first project."
                : "Try adjusting your search or filter criteria."
              }
            </p>
            {projects.length === 0 && (
              <div className="mt-6">
                <Link to="/projects/new" className="btn btn-primary">
                  <Plus className="h-4 w-4 mr-2" />
                  New Project
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className={viewMode === 'grid' 
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" 
            : "space-y-4"
          }>
            {filteredProjects.map((project) => {
              const progress = calculateProgress(project);
              const overdue = isOverdue(project.dueDate, project.status);

              return viewMode === 'grid' ? (
                <Link
                  key={project._id}
                  to={`/projects/${project._id}`}
                  className="bg-white p-6 rounded-lg shadow border border-gray-200 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <h3 className="text-lg font-medium text-gray-900">{project.name}</h3>
                        {project.priority === 'high' && (
                          <Star className="ml-2 h-4 w-4 text-yellow-500" />
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {project.description}
                      </p>
                    </div>
                    <button className="text-gray-400 hover:text-gray-600">
                      <MoreVertical className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="space-y-3">
                    {/* Status and Priority */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(project.status)}
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(project.status)}`}>
                          {project.status}
                        </span>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(project.priority)}`}>
                        {project.priority} priority
                      </span>
                    </div>

                    {/* Progress */}
                    <div>
                      <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                        <span>Progress</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-primary-600 h-2 rounded-full"
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Due date and members */}
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        <span className={overdue ? 'text-red-600' : ''}>
                          {formatDate(project.dueDate)}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <Users className="h-3 w-3 mr-1" />
                        <span>{project.members?.length || 0} members</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ) : (
                <div key={project._id} className="bg-white p-6 rounded-lg shadow border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4">
                        <Link
                          to={`/projects/${project._id}`}
                          className="text-lg font-medium text-gray-900 hover:text-primary-600"
                        >
                          {project.name}
                        </Link>
                        {project.priority === 'high' && (
                          <Star className="h-4 w-4 text-yellow-500" />
                        )}
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(project.status)}
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(project.status)}`}>
                            {project.status}
                          </span>
                        </div>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(project.priority)}`}>
                          {project.priority}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{project.description}</p>
                      <div className="flex items-center space-x-6 mt-2 text-xs text-gray-500">
                        <div className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          <span className={overdue ? 'text-red-600' : ''}>
                            Due {formatDate(project.dueDate)}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <Users className="h-3 w-3 mr-1" />
                          <span>{project.members?.length || 0} members</span>
                        </div>
                        <div className="flex items-center">
                          <span>{progress}% complete</span>
                        </div>
                      </div>
                    </div>
                    <button className="text-gray-400 hover:text-gray-600">
                      <MoreVertical className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        </div>
        </div>

      {/* Project Modal */}
      <ProjectModal
        isOpen={showProjectModal}
        onClose={() => setShowProjectModal(false)}
        project={selectedProject}
        onSave={handleSaveProject}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showConfirmDialog}
        onClose={cancelDeleteProject}
        onConfirm={confirmDeleteProject}
        title="Delete Project"
        message={`Are you sure you want to delete "${projectToDelete?.name}"? This action cannot be undone and will delete all associated tasks.`}
        confirmText="Delete"
        type="danger"
      />
    </Layout>
  );
};

export default Projects;
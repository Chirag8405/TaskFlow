import React, { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { taskService } from '../services/taskService';
import { projectService } from '../services/projectService';
import Layout from '../components/layout/Layout';
import { LoadingSpinner, Button, Select, Input } from '../components/common';
import TaskModal from '../components/tasks/TaskModal';
import {
  Plus,
  Search,
  Filter,
  Calendar,
  User,
  Flag,
  Clock,
  CheckCircle,
  AlertCircle,
  MoreVertical,
  Edit,
  Trash2,
} from 'lucide-react';

const Tasks = () => {
  const [searchParams] = useSearchParams();
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [projectFilter, setProjectFilter] = useState('all');
  const [openMenuId, setOpenMenuId] = useState(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const menuRef = useRef(null);

  // Set search query from URL parameter
  useEffect(() => {
    const urlSearch = searchParams.get('search');
    if (urlSearch) {
      setSearchQuery(urlSearch);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterTasks();
  }, [tasks, searchQuery, statusFilter, priorityFilter, projectFilter]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenMenuId(null);
      }
    };

    if (openMenuId) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openMenuId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [projectsResponse, recentTasksResponse] = await Promise.all([
        projectService.getProjects(),
        taskService.getRecentTasks(50), // Get more tasks for the tasks page
      ]);

      setProjects(projectsResponse.data.projects || []);
      setTasks(recentTasksResponse.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterTasks = () => {
    let filtered = [...tasks];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(task =>
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(task => task.status === statusFilter);
    }

    // Priority filter
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(task => task.priority === priorityFilter);
    }

    // Project filter
    if (projectFilter !== 'all') {
      filtered = filtered.filter(task => task.project?._id === projectFilter);
    }

    setFilteredTasks(filtered);
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) {
      return;
    }

    try {
      await taskService.deleteTask(taskId);
      setTasks(tasks.filter(task => task._id !== taskId));
      setOpenMenuId(null);
    } catch (error) {
      console.error('Error deleting task:', error);
      alert('Failed to delete task. Please try again.');
    }
  };

  const handleEditTask = (taskId) => {
    const task = tasks.find(t => t._id === taskId);
    setSelectedTask(task);
    setShowTaskModal(true);
    setOpenMenuId(null);
  };

  const handleCreateTask = () => {
    setSelectedTask(null);
    setShowTaskModal(true);
  };

  const handleSaveTask = async (taskData) => {
    try {
      if (selectedTask) {
        // Update existing task
        const response = await taskService.updateTask(selectedTask._id, taskData);
        setTasks(tasks.map(t => t._id === selectedTask._id ? response.data : t));
      } else {
        // Create new task
        const response = await taskService.createTask(taskData);
        setTasks([response.data, ...tasks]);
      }
      setShowTaskModal(false);
      fetchData(); // Refresh to get updated task with populated fields
    } catch (error) {
      console.error('Error saving task:', error);
      throw error;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'todo':
        return <Clock className="h-4 w-4 text-gray-500" />;
      case 'inprogress':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'done':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const isOverdue = (dueDate, status) => {
    if (!dueDate || status === 'completed') return false;
    return new Date(dueDate) < new Date();
  };

  if (loading) {
    return (
      <Layout>
        <LoadingSpinner 
          size="lg" 
          text="Loading tasks..." 
          className="min-h-[400px]"
        />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="h-full w-full flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex-shrink-0 bg-white border-b border-gray-200 p-8 lg:px-12 lg:py-8 w-full">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">All Tasks</h1>
                <p className="text-gray-600 mt-1">
                  Manage and track all your tasks across projects
                </p>
              </div>
              <Button className="w-full sm:w-auto" onClick={handleCreateTask}>
                <Plus className="h-4 w-4 mr-2" />
                New Task
              </Button>
            </div>
        </div>

        {/* Filters */}
        <div className="flex-shrink-0 bg-white border-b border-gray-200 p-8 lg:px-12 lg:py-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <Input
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                icon={<Search className="h-4 w-4" />}
              />
            </div>

            {/* Status Filter */}
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="todo">To Do</option>
              <option value="in-progress">In Progress</option>
              <option value="review">Review</option>
              <option value="completed">Completed</option>
            </Select>

            {/* Priority Filter */}
            <Select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
            >
              <option value="all">All Priorities</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </Select>

            {/* Project Filter */}
            <Select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
            >
              <option value="all">All Projects</option>
              {projects.map((project) => (
                <option key={project._id} value={project._id}>
                  {project.title}
                </option>
              ))}
            </Select>
          </div>

          {/* Active Filters Chips */}
          {(searchQuery || statusFilter !== 'all' || priorityFilter !== 'all' || projectFilter !== 'all') && (
            <div className="flex flex-wrap items-center gap-2 mt-4">
              <span className="text-sm text-gray-600">Active filters:</span>
              
              {searchQuery && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  Search: "{searchQuery}"
                  <button
                    onClick={() => setSearchQuery('')}
                    className="ml-2 hover:text-blue-900"
                  >
                    ×
                  </button>
                </span>
              )}
              
              {statusFilter !== 'all' && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                  Status: {statusFilter}
                  <button
                    onClick={() => setStatusFilter('all')}
                    className="ml-2 hover:text-purple-900"
                  >
                    ×
                  </button>
                </span>
              )}
              
              {priorityFilter !== 'all' && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800">
                  Priority: {priorityFilter}
                  <button
                    onClick={() => setPriorityFilter('all')}
                    className="ml-2 hover:text-orange-900"
                  >
                    ×
                  </button>
                </span>
              )}
              
              {projectFilter !== 'all' && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                  Project: {projects.find(p => p._id === projectFilter)?.title || projectFilter}
                  <button
                    onClick={() => setProjectFilter('all')}
                    className="ml-2 hover:text-green-900"
                  >
                    ×
                  </button>
                </span>
              )}
              
              <button
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                  setPriorityFilter('all');
                  setProjectFilter('all');
                }}
                className="text-sm text-gray-600 hover:text-gray-900 underline"
              >
                Clear all
              </button>
            </div>
          )}
        </div>

        {/* Tasks List - Scrollable */}
        <div className="flex-1 overflow-auto p-8 lg:p-12">
            <div className="bg-white rounded-lg shadow border border-gray-200 overflow-visible">
            {filteredTasks.length === 0 ? (
              <div className="text-center py-12">
                <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks found</h3>
                <p className="text-gray-600">
                  {tasks.length === 0 
                    ? "You don't have any tasks yet. Create your first task to get started."
                    : "No tasks match your current filters. Try adjusting your search criteria."
                  }
                </p>
              </div>
            ) : (
              <>
                {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto overflow-y-visible">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Task
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Project
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Priority
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Assignee
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Due Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="relative px-6 py-3">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredTasks.map((task) => (
                      <tr key={task._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            {getStatusIcon(task.status)}
                            <div className="ml-3">
                              <div className="text-sm font-medium text-gray-900">
                                {task.title}
                              </div>
                              {task.description && (
                                <div className="text-sm text-gray-500 truncate max-w-xs">
                                  {task.description}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Link
                            to={`/projects/${task.project?._id}`}
                            className="text-sm font-medium text-primary-600 hover:text-primary-700"
                          >
                            {task.project?.title}
                          </Link>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(task.priority)}`}>
                            {task.priority}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {task.assignedTo ? (
                            <div className="flex items-center">
                              <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                                <span className="text-xs font-medium text-primary-600">
                                  {task.assignedTo.name?.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div className="ml-3">
                                <div className="text-sm font-medium text-gray-900">
                                  {task.assignedTo.name}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">Unassigned</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {task.dueDate ? (
                            <span className={`text-sm ${isOverdue(task.dueDate, task.status) ? 'text-red-600 font-medium' : 'text-gray-900'}`}>
                              {formatDate(task.dueDate)}
                            </span>
                          ) : (
                            <span className="text-sm text-gray-400">No due date</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-900 capitalize">
                            {task.status.replace('inprogress', 'In Progress')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="relative inline-block" ref={openMenuId === task._id ? menuRef : null}>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenMenuId(openMenuId === task._id ? null : task._id);
                              }}
                              className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100"
                              id={`menu-button-${task._id}`}
                            >
                              <MoreVertical className="h-4 w-4" />
                            </button>
                            
                            {openMenuId === task._id && (() => {
                              const button = document.getElementById(`menu-button-${task._id}`);
                              const rect = button?.getBoundingClientRect();
                              return (
                                <div 
                                  className="fixed w-32 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-[9999]"
                                  style={{
                                    top: rect ? `${rect.top - 80}px` : '0px',
                                    left: rect ? `${rect.left - 100}px` : '0px',
                                  }}
                                >
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleEditTask(task._id);
                                    }}
                                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                                  >
                                    <Edit className="h-3 w-3 mr-2" />
                                    Edit
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteTask(task._id);
                                    }}
                                    className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
                                  >
                                    <Trash2 className="h-3 w-3 mr-2" />
                                    Delete
                                  </button>
                                </div>
                              );
                            })()}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden divide-y divide-gray-200">
                {filteredTasks.map((task) => (
                  <div key={task._id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center flex-1 min-w-0">
                        {getStatusIcon(task.status)}
                        <h3 className="ml-2 text-sm font-medium text-gray-900 truncate">
                          {task.title}
                        </h3>
                      </div>
                      <div className="relative ml-2 flex-shrink-0" ref={openMenuId === task._id ? menuRef : null}>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuId(openMenuId === task._id ? null : task._id);
                          }}
                          className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                        
                        {openMenuId === task._id && (
                          <div className="absolute right-0 mt-1 w-32 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditTask(task._id);
                              }}
                              className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                            >
                              <Edit className="h-3 w-3 mr-2" />
                              Edit
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteTask(task._id);
                              }}
                              className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
                            >
                              <Trash2 className="h-3 w-3 mr-2" />
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {task.description && (
                      <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                        {task.description}
                      </p>
                    )}

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Project:</span>
                        <Link
                          to={`/projects/${task.project?._id}`}
                          className="font-medium text-primary-600 hover:text-primary-700"
                        >
                          {task.project?.title}
                        </Link>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">Priority:</span>
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">Status:</span>
                        <span className="text-sm text-gray-900 capitalize">
                          {task.status.replace('inprogress', 'In Progress')}
                        </span>
                      </div>

                      {task.dueDate && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500">Due:</span>
                          <span className={`text-sm ${isOverdue(task.dueDate, task.status) ? 'text-red-600 font-medium' : 'text-gray-900'}`}>
                            {formatDate(task.dueDate)}
                          </span>
                        </div>
                      )}

                      {task.assignedTo && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500">Assigned to:</span>
                          <div className="flex items-center">
                            <div className="h-6 w-6 rounded-full bg-primary-100 flex items-center justify-center mr-2">
                              <span className="text-xs font-medium text-primary-600">
                                {task.assignedTo.name?.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <span className="text-sm font-medium text-gray-900">
                              {task.assignedTo.name}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
          </div>
        </div>
      </div>

      {/* Task Modal */}
      <TaskModal
        isOpen={showTaskModal}
        onClose={() => setShowTaskModal(false)}
        task={selectedTask}
        projectId={projectFilter !== 'all' ? projectFilter : null}
        onSave={handleSaveTask}
      />
    </Layout>
  );
};

export default Tasks;
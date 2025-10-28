import React, { useState, useEffect } from 'react';
import { taskService } from '../../services/taskService';
import { userService } from '../../services/userService';
import { projectService } from '../../services/projectService';
import { useToast } from '../../hooks/useToast';
import { X, Calendar, User, Flag, FileText, FolderOpen } from 'lucide-react';

const TaskModal = ({ isOpen, onClose, task, projectId, onSave }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'todo',
    priority: 'medium',
    dueDate: '',
    assignedTo: '',
    projectId: projectId || '',
  });
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
      fetchProjects();
      if (task) {
        setFormData({
          title: task.title || '',
          description: task.description || '',
          status: task.status || 'todo',
          priority: task.priority || 'medium',
          dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
          assignedTo: task.assignedTo?._id || '',
          projectId: task.projectId || projectId || '',
        });
      } else {
        setFormData({
          title: '',
          description: '',
          status: 'todo',
          priority: 'medium',
          dueDate: '',
          assignedTo: '',
          projectId: projectId || '',
        });
      }
      setErrors({});
    }
  }, [isOpen, task, projectId]);

  const fetchUsers = async () => {
    try {
      const response = await userService.getUsers();
      // Handle nested response structure
      const usersData = response.data?.users || response.users || response.data || [];
      setUsers(Array.isArray(usersData) ? usersData : []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
      setUsers([]);
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await projectService.getProjects();
      // Handle nested response structure
      const projectsData = response.data?.projects || response.projects || response.data || [];
      setProjects(Array.isArray(projectsData) ? projectsData : []);
    } catch (error) {
      toast.error('Failed to load projects');
      setProjects([]);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.projectId) {
      newErrors.projectId = 'Project is required';
    }

    if (formData.dueDate && new Date(formData.dueDate) < new Date()) {
      newErrors.dueDate = 'Due date cannot be in the past';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    const submitData = {
      title: formData.title,
      description: formData.description,
      status: formData.status,
      priority: formData.priority,
      project: formData.projectId,  // Backend expects 'project', not 'projectId'
      dueDate: formData.dueDate || null,
      assignedTo: formData.assignedTo || null,
    };

    try {
      let response;
      if (task) {
        response = await taskService.updateTask(task._id, submitData);
        toast.success('Task updated successfully');
      } else {
        response = await taskService.createTask(submitData);
        toast.success('Task created successfully');
      }

      onSave(response.data);
      onClose();
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to save task';
      toast.error(errorMessage);
      setErrors({
        submit: errorMessage
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 z-[60] transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        ></div>

        {/* Modal */}
        <div className="inline-block w-full max-w-lg p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg sm:align-middle relative z-[70]">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900">
              {task ? 'Edit Task' : 'Create New Task'}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Title *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className={`input w-full ${errors.title ? 'border-red-500' : ''}`}
                placeholder="Enter task title"
              />
              {errors.title && (
                <p className="text-red-600 text-sm mt-1">{errors.title}</p>
              )}
            </div>

            {/* Project */}
            <div>
              <label htmlFor="projectId" className="block text-sm font-medium text-gray-700 mb-2">
                <FolderOpen className="inline h-4 w-4 mr-1" />
                Project *
              </label>
              <select
                id="projectId"
                name="projectId"
                value={formData.projectId}
                onChange={handleChange}
                className={`input w-full ${errors.projectId ? 'border-red-500' : ''}`}
                disabled={!!projectId} // Disable if projectId is passed as prop
              >
                <option value="">Select a project</option>
                {Array.isArray(projects) && projects.map(project => (
                  <option key={project._id} value={project._id}>
                    {project.title || project.name}
                  </option>
                ))}
              </select>
              {errors.projectId && (
                <p className="text-red-600 text-sm mt-1">{errors.projectId}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                <FileText className="inline h-4 w-4 mr-1" />
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="input w-full"
                placeholder="Enter task description"
              />
            </div>

            {/* Row 1: Status and Priority */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="input w-full"
                >
                  <option value="todo">To Do</option>
                  <option value="in-progress">In Progress</option>
                  <option value="review">Review</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <div>
                <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-2">
                  <Flag className="inline h-4 w-4 mr-1" />
                  Priority
                </label>
                <select
                  id="priority"
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  className="input w-full"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>

            {/* Row 2: Due Date and Assignee */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="inline h-4 w-4 mr-1" />
                  Due Date
                </label>
                <input
                  type="date"
                  id="dueDate"
                  name="dueDate"
                  value={formData.dueDate}
                  onChange={handleChange}
                  className={`input w-full ${errors.dueDate ? 'border-red-500' : ''}`}
                  min={new Date().toISOString().split('T')[0]}
                />
                {errors.dueDate && (
                  <p className="text-red-600 text-sm mt-1">{errors.dueDate}</p>
                )}
              </div>

              <div>
                <label htmlFor="assignedTo" className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="inline h-4 w-4 mr-1" />
                  Assign To
                </label>
                <select
                  id="assignedTo"
                  name="assignedTo"
                  value={formData.assignedTo}
                  onChange={handleChange}
                  className="input w-full"
                >
                  <option value="">Unassigned</option>
                  {Array.isArray(users) && users.map(user => (
                    <option key={user._id} value={user._id}>
                      {user.name} ({user.email})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Error message */}
            {errors.submit && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-600 text-sm">{errors.submit}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="btn btn-secondary"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? 'Saving...' : task ? 'Update Task' : 'Create Task'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TaskModal;
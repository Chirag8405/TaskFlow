import api from './api';

// Task service functions
export const taskService = {
  // Get tasks for a project
  getTasks: async (projectId, params = {}) => {
    const response = await api.get('/tasks', { 
      params: { project: projectId, ...params } 
    });
    return response.data;
  },

  // Get single task
  getTask: async (taskId) => {
    const response = await api.get(`/tasks/${taskId}`);
    return response.data;
  },

  // Create new task
  createTask: async (taskData) => {
    const response = await api.post('/tasks', taskData);
    return response.data;
  },

  // Update task
  updateTask: async (taskId, taskData) => {
    const response = await api.put(`/tasks/${taskId}`, taskData);
    return response.data;
  },

  // Move task (change status/position)
  moveTask: async (taskId, moveData) => {
    const response = await api.patch(`/tasks/${taskId}/move`, moveData);
    return response.data;
  },

  // Delete task
  deleteTask: async (taskId) => {
    const response = await api.delete(`/tasks/${taskId}`);
    return response.data;
  },

  // Add comment to task
  addComment: async (taskId, text) => {
    const response = await api.post(`/tasks/${taskId}/comments`, { text });
    return response.data;
  },

  // Get task statistics
  getTaskStats: async (projectId = null) => {
    const params = projectId ? { projectId } : {};
    const response = await api.get('/tasks/stats', { params });
    return response.data;
  },

  // Get recent tasks for dashboard
  getRecentTasks: async (limit = 5) => {
    const response = await api.get('/tasks/recent', { 
      params: { limit } 
    });
    return response.data;
  },
};
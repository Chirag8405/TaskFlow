import api from './api';

// Project service functions
export const projectService = {
  // Get all projects for user
  getProjects: async (params = {}) => {
    const response = await api.get('/projects', { params });
    return response.data;
  },

  // Get single project with tasks
  getProject: async (projectId) => {
    const response = await api.get(`/projects/${projectId}`);
    return response.data;
  },

  // Create new project
  createProject: async (projectData) => {
    try {
      const response = await api.post('/projects', projectData);
      return response.data;
    } catch (error) {
      console.error('Create project error:', error.response?.data || error.message);
      throw error;
    }
  },

  // Update project
  updateProject: async (projectId, projectData) => {
    try {
      const response = await api.put(`/projects/${projectId}`, projectData);
      return response.data;
    } catch (error) {
      console.error('Update project error:', error.response?.data || error.message);
      throw error;
    }
  },

  // Delete project
  deleteProject: async (projectId) => {
    const response = await api.delete(`/projects/${projectId}`);
    return response.data;
  },

  // Add member to project
  addMember: async (projectId, userId) => {
    const response = await api.post(`/projects/${projectId}/members`, { userId });
    return response.data;
  },

  // Remove member from project
  removeMember: async (projectId, userId) => {
    const response = await api.delete(`/projects/${projectId}/members/${userId}`);
    return response.data;
  },
};
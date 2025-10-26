import { useState, useEffect } from 'react';
import api from '../services/api';
import Layout from '../components/layout/Layout';
import LoadingSpinner from '../components/common/LoadingSpinner';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const Analytics = () => {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [timeRange, setTimeRange] = useState('week'); // week, month, year

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const [tasksRes, projectsRes, activitiesRes] = await Promise.all([
        api.get('/tasks/recent?limit=1000'), // Get all recent tasks
        api.get('/projects'),
        api.get('/activities/recent?limit=100')
      ]);

      // Process data for charts - handle different response structures
      const tasks = Array.isArray(tasksRes.data.data) ? tasksRes.data.data : (Array.isArray(tasksRes.data) ? tasksRes.data : []);
      const projectsData = projectsRes.data.data || projectsRes.data || {};
      const projects = Array.isArray(projectsData.projects) ? projectsData.projects : (Array.isArray(projectsData) ? projectsData : []);
      const activities = Array.isArray(activitiesRes.data.data) ? activitiesRes.data.data : (Array.isArray(activitiesRes.data) ? activitiesRes.data : []);

      // Task status distribution
      const statusData = [
        { name: 'To Do', value: tasks.filter(t => t.status === 'todo').length, color: '#94a3b8' },
        { name: 'In Progress', value: tasks.filter(t => t.status === 'in-progress').length, color: '#3b82f6' },
        { name: 'Review', value: tasks.filter(t => t.status === 'review').length, color: '#f59e0b' },
        { name: 'Completed', value: tasks.filter(t => t.status === 'completed').length, color: '#10b981' }
      ];

      // Task priority distribution
      const priorityData = [
        { name: 'Low', value: tasks.filter(t => t.priority === 'low').length, color: '#10b981' },
        { name: 'Medium', value: tasks.filter(t => t.priority === 'medium').length, color: '#f59e0b' },
        { name: 'High', value: tasks.filter(t => t.priority === 'high').length, color: '#ef4444' }
      ];

      // Tasks per project
      const projectTaskData = projects.map(project => {
        const projectId = project._id || project.id;
        const taskCount = tasks.filter(t => {
          const taskProjectId = typeof t.project === 'object' ? t.project._id : t.project;
          return taskProjectId === projectId;
        }).length;
        return {
          name: project.title || project.name,
          tasks: taskCount
        };
      }).filter(p => p.tasks > 0).slice(0, 5); // Top 5 projects with tasks

      // Activity timeline (last 7 days)
      const activityTimeline = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const count = activities.filter(a => {
          const activityDate = new Date(a.createdAt);
          return activityDate.toDateString() === date.toDateString();
        }).length;
        activityTimeline.push({ date: dateStr, activities: count });
      }

      setAnalytics({
        statusData,
        priorityData,
        projectTaskData,
        activityTimeline,
        totalTasks: tasks.length,
        totalProjects: projects.length,
        completedTasks: tasks.filter(t => t.status === 'completed').length,
        activeProjects: projects.filter(p => p.status === 'active').length
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="h-full w-full overflow-auto">
          <div className="flex items-center justify-center h-full">
            <LoadingSpinner />
          </div>
        </div>
      </Layout>
    );
  }

  if (!analytics) {
    return (
      <Layout>
        <div className="h-full w-full overflow-auto">
          <div className="p-8 lg:p-12 w-full">
            <div className="text-center text-gray-500">
              No analytics data available
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics</h1>
          <p className="text-gray-600">Track your productivity and progress</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Tasks</p>
                <p className="text-3xl font-bold text-gray-900">{analytics.totalTasks}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Completed Tasks</p>
                <p className="text-3xl font-bold text-green-600">{analytics.completedTasks}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Projects</p>
                <p className="text-3xl font-bold text-gray-900">{analytics.totalProjects}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Active Projects</p>
                <p className="text-3xl font-bold text-blue-600">{analytics.activeProjects}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Task Status Distribution */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Task Status Distribution</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics.statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent, value }) => value > 0 ? `${name}: ${(percent * 100).toFixed(0)}%` : ''}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {analytics.statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Task Priority Distribution */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Task Priority Distribution</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics.priorityData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent, value }) => value > 0 ? `${name}: ${(percent * 100).toFixed(0)}%` : ''}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {analytics.priorityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Activity Timeline */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Activity Timeline (Last 7 Days)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analytics.activityTimeline}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="activities" stroke="#3b82f6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Tasks per Project */}
        {analytics.projectTaskData.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Tasks per Project (Top 5)</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.projectTaskData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="tasks" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
    </Layout>
  );
};

export default Analytics;

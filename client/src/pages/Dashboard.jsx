import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import { useSocket } from '../context/SocketContext';
import { 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  TrendingUp,
  FolderOpen,
  Users,
  Calendar,
  ArrowRight
} from 'lucide-react';
import api from '../services/api';
import ActivityFeed from '../components/dashboard/ActivityFeed';
import { StatsCardSkeleton, ActivityFeedSkeleton } from '../components/common';
import { toast } from 'react-hot-toast';

const Dashboard = () => {
  const navigate = useNavigate();
  const { addEventListener, removeEventListener } = useSocket();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    inProgressTasks: 0,
    overdueTasks: 0,
    totalProjects: 0,
    activeProjects: 0
  });
  const [recentTasks, setRecentTasks] = useState([]);
  const [activities, setActivities] = useState([]);
  const [activitiesLoading, setActivitiesLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Real-time socket listeners
  useEffect(() => {
    const handleTaskCreated = (task) => {
      // Refresh dashboard data when a task is created
      fetchDashboardData();
    };

    const handleTaskUpdated = (task) => {
      // Update recent tasks if the updated task is in the list
      setRecentTasks(prev => 
        prev.map(t => t._id === task._id ? task : t)
      );
      // Refresh stats
      fetchDashboardData();
    };

    const handleTaskDeleted = (taskId) => {
      // Remove from recent tasks
      setRecentTasks(prev => prev.filter(t => t._id !== taskId));
      // Refresh stats
      fetchDashboardData();
    };

    // Add event listeners
    addEventListener('task-created', handleTaskCreated);
    addEventListener('task-updated', handleTaskUpdated);
    addEventListener('task-deleted', handleTaskDeleted);

    return () => {
      // Cleanup
      removeEventListener('task-created', handleTaskCreated);
      removeEventListener('task-updated', handleTaskUpdated);
      removeEventListener('task-deleted', handleTaskDeleted);
    };
  }, []);


  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch projects - API returns data.projects
      const projectsRes = await api.get('/projects');
      const projects = projectsRes.data?.data?.projects || [];
      
      // Fetch recent tasks - API returns data directly as array
      const tasksRes = await api.get('/tasks/recent?limit=10');
      const tasks = tasksRes.data?.data || [];
      
      // Fetch activities
      setActivitiesLoading(true);
      const activitiesRes = await api.get('/activities/recent?limit=15');
      const activitiesData = activitiesRes.data?.data || [];
      
      // Ensure projects is an array before filtering
      const projectsArray = Array.isArray(projects) ? projects : [];
      const tasksArray = Array.isArray(tasks) ? tasks : [];
      
      // Calculate stats
      const totalProjects = projectsArray.length;
      const activeProjects = projectsArray.filter(p => p.status === 'active').length;
      const totalTasks = tasksArray.length;
      const completedTasks = tasksArray.filter(t => t.status === 'completed').length;
      const inProgressTasks = tasksArray.filter(t => t.status === 'in-progress').length;
      const overdueTasks = tasksArray.filter(t => {
        if (!t.dueDate) return false;
        const dueDate = new Date(t.dueDate);
        const today = new Date();
        return dueDate < today && t.status !== 'completed';
      }).length;

      setStats({
        totalTasks,
        completedTasks,
        inProgressTasks,
        overdueTasks,
        totalProjects,
        activeProjects
      });

      setRecentTasks(tasksArray.slice(0, 5));
      setActivities(activitiesData);
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
      setActivitiesLoading(false);
    }
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'text-green-600 bg-green-100',
      medium: 'text-yellow-600 bg-yellow-100',
      high: 'text-red-600 bg-red-100'
    };
    return colors[priority] || 'text-gray-600 bg-gray-100';
  };

  const getStatusColor = (status) => {
    const colors = {
      'todo': 'text-gray-600 bg-gray-100',
      'in-progress': 'text-blue-600 bg-blue-100',
      'review': 'text-purple-600 bg-purple-100',
      'done': 'text-green-600 bg-green-100'
    };
    return colors[status] || 'text-gray-600 bg-gray-100';
  };

  return (
    <Layout>
      <div className="h-full w-full overflow-auto">
        <div className="p-8 lg:p-12 w-full">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600">Welcome back! Here's an overview of your tasks and projects.</p>
          </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {loading ? (
            <>
              <StatsCardSkeleton />
              <StatsCardSkeleton />
              <StatsCardSkeleton />
              <StatsCardSkeleton />
            </>
          ) : (
            <>
              {/* Total Tasks */}
              <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-medium text-gray-600">Total Tasks</p>
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <CheckCircle className="h-5 w-5 text-blue-600" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-gray-900">{stats.totalTasks}</p>
                <p className="text-sm text-gray-500 mt-2">Across all projects</p>
              </div>

              {/* In Progress */}
              <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-medium text-gray-600">In Progress</p>
                  <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                    <Clock className="h-5 w-5 text-purple-600" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-gray-900">{stats.inProgressTasks}</p>
                <p className="text-sm text-gray-500 mt-2">Currently working on</p>
              </div>

              {/* Completed */}
              <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-medium text-gray-600">Completed</p>
                  <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-gray-900">{stats.completedTasks}</p>
                <p className="text-sm text-gray-500 mt-2">
                  {stats.totalTasks > 0 
                    ? `${Math.round((stats.completedTasks / stats.totalTasks) * 100)}% completion rate`
                    : 'No tasks yet'}
                </p>
              </div>

              {/* Overdue */}
              <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-medium text-gray-600">Overdue</p>
                  <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-gray-900">{stats.overdueTasks}</p>
                <p className="text-sm text-gray-500 mt-2">Need attention</p>
              </div>
            </>
          )}
        </div>

        {/* Projects Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Projects</h3>
              <FolderOpen className="h-5 w-5 text-gray-400" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Total Projects</span>
                <span className="font-semibold text-gray-900">{stats.totalProjects}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Active Projects</span>
                <span className="font-semibold text-green-600">{stats.activeProjects}</span>
              </div>
            </div>
            <button
              onClick={() => navigate('/projects')}
              className="mt-4 w-full py-2 px-4 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
            >
              View All Projects
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          {/* Recent Tasks */}
          <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Recent Tasks</h3>
              <Calendar className="h-5 w-5 text-gray-400" />
            </div>
            {loading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-12 bg-gray-200 rounded animate-pulse"></div>
                ))}
              </div>
            ) : recentTasks.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-8">No recent tasks</p>
            ) : (
              <div className="space-y-3">
                {recentTasks.map((task) => (
                  <div
                    key={task._id}
                    className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/projects/${task.project._id}`)}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {task.title}
                      </p>
                      <p className="text-xs text-gray-500">{task.project?.name}</p>
                    </div>
                    <div className="flex items-center gap-2 ml-3">
                      <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(task.status)}`}>
                        {task.status}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <button
              onClick={() => navigate('/tasks')}
              className="mt-4 w-full py-2 px-4 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
            >
              View All Tasks
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Activity Feed */}
        <div className="mb-8">
          {activitiesLoading ? (
            <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
              <ActivityFeedSkeleton items={5} />
            </div>
          ) : (
            <ActivityFeed activities={activities} loading={false} />
          )}
        </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;

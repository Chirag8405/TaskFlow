import React from 'react';
import { Avatar } from '../common';
import { 
  Plus, 
  Edit, 
  Trash2, 
  CheckCircle, 
  Circle, 
  User, 
  Calendar,
  MessageSquare,
  FileText
} from 'lucide-react';

const ActivityFeed = ({ activities = [], loading = false, className = '' }) => {
  const getActivityIcon = (type) => {
    const iconMap = {
      'task_created': Plus,
      'task_updated': Edit,
      'task_deleted': Trash2,
      'task_completed': CheckCircle,
      'task_reopened': Circle,
      'project_created': Plus,
      'project_updated': Edit,
      'user_joined': User,
      'deadline_approaching': Calendar,
      'comment_added': MessageSquare,
      'file_uploaded': FileText
    };
    
    return iconMap[type] || FileText;
  };

  const getActivityColor = (type) => {
    const colorMap = {
      'task_created': 'text-green-600 bg-green-100',
      'task_updated': 'text-blue-600 bg-blue-100',
      'task_deleted': 'text-red-600 bg-red-100',
      'task_completed': 'text-green-600 bg-green-100',
      'task_reopened': 'text-yellow-600 bg-yellow-100',
      'project_created': 'text-purple-600 bg-purple-100',
      'project_updated': 'text-purple-600 bg-purple-100',
      'user_joined': 'text-indigo-600 bg-indigo-100',
      'deadline_approaching': 'text-orange-600 bg-orange-100',
      'comment_added': 'text-blue-600 bg-blue-100',
      'file_uploaded': 'text-gray-600 bg-gray-100'
    };
    
    return colorMap[type] || '#6366f1';
  };

  if (loading) {

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const activityTime = new Date(timestamp);
    const diffTime = Math.abs(now - activityTime);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
    const diffMinutes = Math.ceil(diffTime / (1000 * 60));

    if (diffMinutes < 60) {
      return `${diffMinutes}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return activityTime.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
    }
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow border border-gray-200 ${className}`}>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {[...Array(5)].map((_, index) => (
              <div key={index} className="flex items-center space-x-3">
                <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded animate-pulse mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded animate-pulse w-24"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow border border-gray-200 ${className}`}>
      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
        
        {activities.length === 0 ? (
          <div className="text-center py-8">
            <div className="h-12 w-12 mx-auto mb-4 flex items-center justify-center bg-gray-100 rounded-full">
              <MessageSquare className="h-6 w-6 text-gray-400" />
            </div>
            <p className="text-gray-600">No recent activity</p>
            <p className="text-sm text-gray-500 mt-1">
              Activity will appear here as team members work on projects
            </p>
          </div>
        ) : (
          <div className="flow-root">
            <ul className="-mb-8">
              {activities.map((activity, index) => {
                const Icon = getActivityIcon(activity.type);
                const colorClasses = getActivityColor(activity.type);
                
                return (
                  <li key={activity._id || index}>
                    <div className="relative pb-8">
                      {index !== activities.length - 1 && (
                        <span 
                          className="absolute left-4 top-8 -ml-px h-full w-0.5 bg-gray-200" 
                          aria-hidden="true" 
                        />
                      )}
                      
                      <div className="relative flex space-x-3">
                        {/* Activity Icon */}
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center ${colorClasses}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              {/* User Avatar */}
                              {activity.user && (
                                <Avatar user={activity.user} size="xs" showOnlineStatus={false} />
                              )}
                              
                              <p className="text-sm text-gray-900">
                                <span className="font-medium">
                                  {activity.user?.name || 'Unknown User'}
                                </span>
                                {' '}
                                <span className="text-gray-600">{activity.description}</span>
                              </p>
                            </div>
                            
                            <time className="text-xs text-gray-500 whitespace-nowrap">
                              {formatTimeAgo(activity.createdAt)}
                            </time>
                          </div>
                          
                          {activity.metadata && (
                            <div className="mt-1">
                              {activity.metadata.taskTitle && (
                                <p className="text-xs text-gray-600">
                                  Task: <span className="font-medium">{activity.metadata.taskTitle}</span>
                                </p>
                              )}
                              {activity.metadata.projectTitle && (
                                <p className="text-xs text-gray-600">
                                  Project: <span className="font-medium">{activity.metadata.projectTitle}</span>
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};
}

export default ActivityFeed;
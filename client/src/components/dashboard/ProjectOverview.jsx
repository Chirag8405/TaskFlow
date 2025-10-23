import React from 'react';
import { 
  MoreHorizontal, 
  Calendar, 
  Users, 
  CheckCircle, 
  Clock,
  AlertTriangle,
  Folder
} from 'lucide-react';

const ProjectOverview = ({ projects = [], loading = false, className = '' }) => {
  const getStatusColor = (status) => {
    const statusColors = {
      'active': 'bg-green-100 text-green-800',
      'on-hold': 'bg-yellow-100 text-yellow-800',
      'completed': 'bg-blue-100 text-blue-800',
      'cancelled': 'bg-red-100 text-red-800'
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800';
  };

  const getProgressColor = (progress) => {
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 60) return 'bg-blue-500';
    if (progress >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const calculateDaysLeft = (endDate) => {
    if (!endDate) return null;
    const today = new Date();
    const end = new Date(endDate);
    const diffTime = end - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const formatDate = (date) => {
    if (!date) return 'No deadline';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow border border-gray-200 ${className}`}>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Overview</h3>
          <div className="space-y-4">
            {[...Array(3)].map((_, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="h-5 bg-gray-200 rounded animate-pulse mb-2"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse mb-3 w-3/4"></div>
                <div className="flex justify-between items-center">
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-20"></div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-16"></div>
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
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Project Overview</h3>
          <button className="text-gray-400 hover:text-gray-600">
            <MoreHorizontal className="h-5 w-5" />
          </button>
        </div>
        
        {projects.length === 0 ? (
          <div className="text-center py-8">
            <div className="h-12 w-12 mx-auto mb-4 flex items-center justify-center bg-gray-100 rounded-full">
              <Folder className="h-6 w-6 text-gray-400" />
            </div>
            <p className="text-gray-600">No projects yet</p>
            <p className="text-sm text-gray-500 mt-1">
              Create your first project to get started
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {projects.slice(0, 5).map((project) => {
              const daysLeft = calculateDaysLeft(project.endDate);
              const progress = project.progress || 0;
              
              return (
                <div key={project._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 mb-1">{project.name}</h4>
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                        {project.description || 'No description available'}
                      </p>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {formatDate(project.endDate)}
                        </div>
                        
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-1" />
                          {project.members?.length || 0} members
                        </div>
                        
                        {daysLeft !== null && (
                          <div className={`flex items-center ${
                            daysLeft < 0 ? 'text-red-600' : 
                            daysLeft <= 3 ? 'text-yellow-600' : 
                            'text-gray-600'
                          }`}>
                            {daysLeft < 0 ? (
                              <AlertTriangle className="h-4 w-4 mr-1" />
                            ) : (
                              <Clock className="h-4 w-4 mr-1" />
                            )}
                            {daysLeft < 0 ? 
                              `${Math.abs(daysLeft)} days overdue` : 
                              daysLeft === 0 ? 'Due today' :
                              `${daysLeft} days left`
                            }
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(project.status)}`}>
                      {project.status?.replace('-', ' ').toUpperCase() || 'ACTIVE'}
                    </span>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Progress</span>
                      <span className="font-medium text-gray-900">{progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(progress)}`}
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  {/* Task Summary */}
                  <div className="mt-3 flex items-center justify-between text-sm">
                    <div className="flex items-center text-gray-600">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      {project.completedTasks || 0} / {project.totalTasks || 0} tasks completed
                    </div>
                    
                    <button className="text-blue-600 hover:text-blue-800 font-medium">
                      View Details
                    </button>
                  </div>
                </div>
              );
            })}
            
            {projects.length > 5 && (
              <div className="pt-4 border-t border-gray-200">
                <button className="w-full text-center text-blue-600 hover:text-blue-800 font-medium text-sm">
                  View All {projects.length} Projects
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectOverview;
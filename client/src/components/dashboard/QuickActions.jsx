import React from 'react';
import { Button } from '../common';
import { useToast } from '../../hooks/useToast';
import { 
  Plus, 
  Calendar, 
  Users, 
  CheckSquare,
  FolderPlus,
  UserPlus
} from 'lucide-react';

const QuickActions = ({ onAction, className = '' }) => {
  const { toast } = useToast();
  const actions = [
    {
      id: 'create-task',
      label: 'Create Task',
      icon: Plus,
      color: 'blue',
      description: 'Add a new task to your project'
    },
    {
      id: 'create-project',
      label: 'New Project',
      icon: FolderPlus,
      color: 'purple',
      description: 'Start a new project'
    },
    {
      id: 'schedule-meeting',
      label: 'Schedule Meeting',
      icon: Calendar,
      color: 'green',
      description: 'Schedule a team meeting'
    },
    {
      id: 'invite-member',
      label: 'Invite Member',
      icon: UserPlus,
      color: 'indigo',
      description: 'Invite someone to your team'
    },
    {
      id: 'view-calendar',
      label: 'View Calendar',
      icon: Calendar,
      color: 'yellow',
      description: 'Check your upcoming deadlines'
    },
    {
      id: 'view-tasks',
      label: 'My Tasks',
      icon: CheckSquare,
      color: 'red',
      description: 'View all your assigned tasks'
    }
  ];

  const getColorClasses = (color) => {
    const colors = {
      blue: 'bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700',
      purple: 'bg-purple-50 hover:bg-purple-100 border-purple-200 text-purple-700',
      green: 'bg-green-50 hover:bg-green-100 border-green-200 text-green-700',
      indigo: 'bg-indigo-50 hover:bg-indigo-100 border-indigo-200 text-indigo-700',
      yellow: 'bg-yellow-50 hover:bg-yellow-100 border-yellow-200 text-yellow-700',
      red: 'bg-red-50 hover:bg-red-100 border-red-200 text-red-700'
    };
    return colors[color] || colors.blue;
  };

  const handleActionClick = (actionId) => {
    if (onAction) {
      onAction(actionId);
    } else {
      // Default actions
      switch (actionId) {
        case 'create-task':
          // Navigate to task creation or open modal
          toast.info('Task creation feature coming soon');
          break;
        case 'create-project':
          // Navigate to project creation
          toast.info('Project creation feature coming soon');
          break;
        case 'schedule-meeting':  
          // Open calendar scheduling
          toast.info('Meeting scheduling feature coming soon');
          break;
        case 'invite-member':
          // Open invite modal
          toast.info('Member invitation feature coming soon');
          break;
        case 'view-calendar':
          // Navigate to calendar
          window.location.href = '/calendar';
          break;
        case 'view-tasks':
          // Navigate to tasks
          window.location.href = '/tasks';
          break;
        default:
          toast.warning('Unknown action requested');
      }
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow border border-gray-200 ${className}`}>
      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {actions.map((action) => {
            const Icon = action.icon;
            const colorClasses = getColorClasses(action.color);
            
            return (
              <button
                key={action.id}
                onClick={() => handleActionClick(action.id)}
                className={`p-4 rounded-lg border transition-colors text-left ${colorClasses}`}
              >
                <div className="flex items-center mb-2">
                  <Icon className="h-5 w-5 mr-2" />
                  <span className="font-medium">{action.label}</span>
                </div>
                <p className="text-sm opacity-75">{action.description}</p>
              </button>
            );
          })}
        </div>
        
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1"
              onClick={() => handleActionClick('view-tasks')}
            >
              <CheckSquare className="h-4 w-4 mr-2" />
              View All Tasks
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1"
              onClick={() => handleActionClick('view-calendar')}
            >
              <Calendar className="h-4 w-4 mr-2" />
              Open Calendar
            </Button>
            <Button 
              size="sm" 
              className="flex-1"
              onClick={() => handleActionClick('create-task')}
            >
              <Plus className="h-4 w-4 mr-2" />
              New Task
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickActions;
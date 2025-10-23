import React, { useState, useRef, useEffect } from 'react';
import { 
  Calendar, 
  User, 
  Flag, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Clock,
  MessageSquare,
  Paperclip
} from 'lucide-react';
import { Avatar } from '../common';
import TaskEditModal from '../common/TaskEditModal';

const TaskCard = ({ task, onUpdate, onDelete, isDragging }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const menuRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 bg-red-100';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100';
      case 'low':
        return 'text-green-600 bg-green-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const formatDate = (date) => {
    if (!date) return null;
    const taskDate = new Date(date);
    const today = new Date();
    const diffTime = taskDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { text: `${Math.abs(diffDays)}d overdue`, color: 'text-red-600' };
    } else if (diffDays === 0) {
      return { text: 'Due today', color: 'text-orange-600' };
    } else if (diffDays === 1) {
      return { text: 'Due tomorrow', color: 'text-yellow-600' };
    } else if (diffDays <= 7) {
      return { text: `${diffDays}d left`, color: 'text-blue-600' };
    } else {
      return { 
        text: taskDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), 
        color: 'text-gray-600' 
      };
    }
  };

  const dueDateInfo = formatDate(task.dueDate);

  const handleEdit = () => {
    setShowEditModal(true);
    setShowMenu(false);
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      onDelete(task._id);
    }
    setShowMenu(false);
  };

  const handleSaveEdit = async (updatedData) => {
    try {
      await onUpdate(task._id, updatedData);
      setShowEditModal(false);
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  return (
    <div 
      className={`bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing ${
        isDragging ? 'shadow-lg ring-2 ring-blue-300' : ''
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <h4 className="font-medium text-gray-900 text-sm leading-5 pr-2">
          {task.title}
        </h4>
        
        <div className="relative flex-shrink-0" ref={menuRef}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <MoreHorizontal className="h-4 w-4 text-gray-400" />
          </button>
          
          {showMenu && (
            <div className="absolute right-0 mt-1 w-32 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleEdit();
                }}
                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
              >
                <Edit className="h-3 w-3 mr-2" />
                Edit
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete();
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

      {/* Description */}
      {task.description && (
        <p className="text-gray-600 text-xs mb-3 line-clamp-2">
          {task.description}
        </p>
      )}

      {/* Tags/Labels */}
      {task.tags && task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {task.tags.slice(0, 3).map((tag, index) => (
            <span
              key={index}
              className="inline-flex px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded"
            >
              {tag}
            </span>
          ))}
          {task.tags.length > 3 && (
            <span className="inline-flex px-2 py-1 text-xs font-medium bg-gray-100 text-gray-500 rounded">
              +{task.tags.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Metadata */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {/* Priority */}
          {task.priority && (
            <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded ${getPriorityColor(task.priority)}`}>
              <Flag className="h-3 w-3 mr-1" />
              {task.priority}
            </span>
          )}

          {/* Due Date */}
          {dueDateInfo && (
            <span className={`inline-flex items-center text-xs ${dueDateInfo.color}`}>
              <Clock className="h-3 w-3 mr-1" />
              {dueDateInfo.text}
            </span>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {/* Comments Count */}
          {task.commentsCount > 0 && (
            <span className="inline-flex items-center text-xs text-gray-500">
              <MessageSquare className="h-3 w-3 mr-1" />
              {task.commentsCount}
            </span>
          )}

          {/* Attachments Count */}
          {task.attachmentsCount > 0 && (
            <span className="inline-flex items-center text-xs text-gray-500">
              <Paperclip className="h-3 w-3 mr-1" />
              {task.attachmentsCount}
            </span>
          )}

          {/* Assignee Avatar */}
          {task.assignedTo && (
            <Avatar 
              user={task.assignedTo} 
              size="xs" 
              showOnlineStatus={false}
            />
          )}
          {!task.assignedTo && task.assignee && (
            <Avatar 
              user={task.assignee} 
              size="xs" 
              showOnlineStatus={false}
            />
          )}
        </div>
      </div>

      {/* Edit Modal */}
      <TaskEditModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        task={task}
        onSave={handleSaveEdit}
      />
    </div>
  );
};

export default TaskCard;
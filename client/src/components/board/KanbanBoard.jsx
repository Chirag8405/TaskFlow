import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import KanbanColumn from './KanbanColumn';
import TaskCard from './TaskCard';
import { taskService } from '../../services/taskService';
import { useSocket } from '../../context/SocketContext';
import { LoadingSpinner } from '../common';
import toast from 'react-hot-toast';
import { Plus, Users, Wifi, WifiOff } from 'lucide-react';

const KanbanBoard = ({ projectId, onTaskCreate, onTaskUpdate }) => {
  const { 
    isConnected, 
    activeUsers, 
    joinProject, 
    leaveProject, 
    emitTaskCreated,
    emitTaskUpdated,
    emitTaskMoved,
    addEventListener,
    removeEventListener 
  } = useSocket();
  const [columns, setColumns] = useState({
    'todo': {
      id: 'todo',
      title: 'To Do',
      color: 'gray',
      tasks: []
    },
    'in-progress': {
      id: 'in-progress',
      title: 'In Progress',
      color: 'blue',
      tasks: []
    },
    'review': {
      id: 'review',
      title: 'Review',
      color: 'yellow',
      tasks: []
    },
    'completed': {
      id: 'completed',
      title: 'Completed',
      color: 'green',
      tasks: []
    }
  });
  const [loading, setLoading] = useState(true);
  const [draggedTask, setDraggedTask] = useState(null);

  useEffect(() => {
    if (projectId) {
      fetchTasks();
    }
  }, [projectId]);

  // Socket.io real-time effects
  useEffect(() => {
    if (projectId && isConnected) {
      // Join project room for real-time updates
      joinProject(projectId);

      // Listen for real-time task events
      const handleTaskCreated = (task) => {
        setColumns(prev => {
          const newColumns = { ...prev };
          const status = task.status || 'todo';
          if (newColumns[status]) {
            newColumns[status].tasks.push(task);
          }
          return newColumns;
        });
      };

      const handleTaskUpdated = (task) => {
        setColumns(prev => {
          const newColumns = { ...prev };
          Object.keys(newColumns).forEach(columnId => {
            newColumns[columnId].tasks = newColumns[columnId].tasks.map(t => 
              t._id === task._id ? task : t
            );
          });
          return newColumns;
        });
      };

      const handleTaskMoved = ({ taskId, newStatus, task }) => {
        setColumns(prev => {
          const newColumns = { ...prev };
          
          // Remove task from all columns
          Object.keys(newColumns).forEach(columnId => {
            newColumns[columnId].tasks = newColumns[columnId].tasks.filter(t => t._id !== taskId);
          });
          
          // Add task to new column
          if (newColumns[newStatus] && task) {
            newColumns[newStatus].tasks.push(task);
          }
          
          return newColumns;
        });
      };

      const handleTaskDeleted = (taskId) => {
        setColumns(prev => {
          const newColumns = { ...prev };
          Object.keys(newColumns).forEach(columnId => {
            newColumns[columnId].tasks = newColumns[columnId].tasks.filter(t => t._id !== taskId);
          });
          return newColumns;
        });
      };

      // Add event listeners
      addEventListener('task-created', handleTaskCreated);
      addEventListener('task-updated', handleTaskUpdated);
      addEventListener('task-moved', handleTaskMoved);
      addEventListener('task-deleted', handleTaskDeleted);

      return () => {
        // Cleanup: remove listeners and leave project
        removeEventListener('task-created', handleTaskCreated);
        removeEventListener('task-updated', handleTaskUpdated);
        removeEventListener('task-moved', handleTaskMoved);
        removeEventListener('task-deleted', handleTaskDeleted);
        leaveProject(projectId);
      };
    }
  }, [projectId, isConnected]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await taskService.getTasks(projectId);
      const tasks = response.data?.tasks || [];
      
      // Group tasks by status
      const newColumns = { ...columns };
      
      // Reset all columns
      Object.keys(newColumns).forEach(columnId => {
        newColumns[columnId].tasks = [];
      });
      
      // Group tasks by their status
      tasks.forEach(task => {
        const status = task.status || 'todo';
        if (newColumns[status]) {
          newColumns[status].tasks.push(task);
        }
      });
      
      setColumns(newColumns);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (start) => {
    const taskId = start.draggableId;
    const sourceColumn = columns[start.source.droppableId];
    const task = sourceColumn.tasks.find(t => t._id === taskId);
    setDraggedTask(task);
  };

  const handleDragEnd = async (result) => {
    setDraggedTask(null);
    
    const { destination, source, draggableId } = result;

    // If dropped outside a droppable area
    if (!destination) {
      return;
    }

    // If dropped in the same position
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const sourceColumn = columns[source.droppableId];
    const destinationColumn = columns[destination.droppableId];
    const task = sourceColumn.tasks.find(t => t._id === draggableId);

    if (!task) return;

    try {
      // Update task status if moved to different column
      if (source.droppableId !== destination.droppableId) {
        const updatedTask = {
          ...task,
          status: destination.droppableId
        };

        // Update task on server
        await taskService.updateTask(task._id, { status: destination.droppableId });
        
        // Emit real-time move event
        emitTaskMoved(projectId, task._id, destination.droppableId, updatedTask);
        
        if (onTaskUpdate) {
          onTaskUpdate(updatedTask);
        }
      }

      // Update local state
      const newColumns = { ...columns };

      // Remove task from source column
      newColumns[source.droppableId].tasks = sourceColumn.tasks.filter(
        t => t._id !== draggableId
      );

      // Add task to destination column
      const updatedTask = { ...task, status: destination.droppableId };
      newColumns[destination.droppableId].tasks.splice(
        destination.index,
        0,
        updatedTask
      );

      setColumns(newColumns);
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error('Failed to move task');
      // Revert on error
      fetchTasks();
    }
  };

  const handleTaskCreate = async (columnId, taskData) => {
    try {
      const newTask = {
        ...taskData,
        status: columnId,
        project: projectId
      };

      const response = await taskService.createTask(newTask);
      const createdTask = response.data?.task || response.data;

      // Don't update local state here - let socket event handle it to avoid duplicates
      // The handleTaskCreated socket event will add the task to the UI
      
      // Emit real-time event
      emitTaskCreated(projectId, createdTask);

      if (onTaskCreate) {
        onTaskCreate(createdTask);
      }
      
      toast.success('Task created successfully');
    } catch (error) {
      console.error('Error creating task:', error);
      toast.error('Failed to create task');
    }
  };

  const handleTaskUpdate = async (taskId, updates) => {
    try {
      const response = await taskService.updateTask(taskId, updates);
      const updatedTask = response.data?.task || response.data;

      // Update local state
      const newColumns = { ...columns };
      Object.keys(newColumns).forEach(columnId => {
        const taskIndex = newColumns[columnId].tasks.findIndex(t => t._id === taskId);
        if (taskIndex !== -1) {
          newColumns[columnId].tasks[taskIndex] = updatedTask;
        }
      });
      setColumns(newColumns);

      // Emit real-time event
      emitTaskUpdated(projectId, updatedTask);

      if (onTaskUpdate) {
        onTaskUpdate(updatedTask);
      }
      
      toast.success('Task updated successfully');
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error('Failed to update task');
    }
  };

  const handleTaskDelete = async (taskId) => {
    try {
      await taskService.deleteTask(taskId);

      // Update local state
      const newColumns = { ...columns };
      Object.keys(newColumns).forEach(columnId => {
        newColumns[columnId].tasks = newColumns[columnId].tasks.filter(
          t => t._id !== taskId
        );
      });
      setColumns(newColumns);
      
      toast.success('Task deleted successfully');
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error('Failed to delete task');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" text="Loading board..." />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Connection Status Indicator */}
      <div className="flex items-center justify-between mb-4 px-2">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            {isConnected ? (
              <Wifi className="h-4 w-4 text-green-500" />
            ) : (
              <WifiOff className="h-4 w-4 text-red-500" />
            )}
            <span className={`text-sm font-medium ${isConnected ? 'text-green-700' : 'text-red-700'}`}>
              {isConnected ? 'Real-time connected' : 'Offline mode'}
            </span>
          </div>
          
          {activeUsers.length > 0 && (
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">
                {activeUsers.length} user{activeUsers.length !== 1 ? 's' : ''} online
              </span>
            </div>
          )}
        </div>
      </div>

      <DragDropContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex gap-6 overflow-x-auto pb-6 h-full">
          {Object.values(columns).map(column => (
            <KanbanColumn
              key={column.id}
              column={column}
              onTaskCreate={(taskData) => handleTaskCreate(column.id, taskData)}
              onTaskUpdate={handleTaskUpdate}
              onTaskDelete={handleTaskDelete}
              draggedTask={draggedTask}
            />
          ))}
        </div>
      </DragDropContext>
    </div>
  );
};

export default KanbanBoard;
import React, { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import { LoadingSpinner, Button } from '../components/common';
import TaskEditModal from '../components/common/TaskEditModal';
import { taskService } from '../services/taskService';
import { projectService } from '../services/projectService';
import toast from 'react-hot-toast';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  User,
  Flag,
} from 'lucide-react';

const Calendar = () => {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [projectsResponse, tasksResponse] = await Promise.all([
        projectService.getProjects(),
        taskService.getRecentTasks(100), // Get more tasks for calendar view
      ]);

      setProjects(projectsResponse.data.projects || []);
      setTasks(tasksResponse.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const getTasksForDate = (date) => {
    if (!date) return [];
    const dateStr = date.toDateString();
    return tasks.filter(task => {
      if (!task.dueDate) return false;
      return new Date(task.dueDate).toDateString() === dateStr;
    });
  };

  const navigateMonth = (direction) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + direction);
      return newDate;
    });
  };

  const isToday = (date) => {
    if (!date) return false;
    return date.toDateString() === new Date().toDateString();
  };

  const isSelected = (date) => {
    if (!date) return false;
    return date.toDateString() === selectedDate.toDateString();
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
    });
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'bg-red-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'low':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const days = getDaysInMonth(currentDate);
  const selectedDateTasks = getTasksForDate(selectedDate);

  if (loading) {
    return (
      <Layout>
        <LoadingSpinner 
          size="lg" 
          text="Loading calendar..." 
          className="min-h-[400px]"
        />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
              <p className="text-gray-600 mt-1">
                View and manage your tasks by date
              </p>
            </div>
            <Button onClick={() => {
              setSelectedTask(null);
              setShowTaskModal(true);
            }}>
              <Plus className="h-4 w-4 mr-2" />
              New Task
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Calendar */}
          <div className="lg:col-span-3 bg-white rounded-lg shadow border border-gray-200">
            {/* Calendar Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                {formatDate(currentDate)}
              </h2>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => navigateMonth(-1)}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setCurrentDate(new Date())}
                  className="px-3 py-1 text-sm text-primary-600 hover:bg-primary-50 rounded-md"
                >
                  Today
                </button>
                <button
                  onClick={() => navigateMonth(1)}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="p-6">
              {/* Week Days */}
              <div className="grid grid-cols-7 gap-1 mb-4">
                {weekDays.map((day) => (
                  <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Days */}
              <div className="grid grid-cols-7 gap-1">
                {days.map((date, index) => {
                  const dayTasks = getTasksForDate(date);
                  return (
                    <div
                      key={index}
                      className={`
                        min-h-[80px] p-2 border border-gray-100 cursor-pointer transition-colors
                        ${date ? 'hover:bg-gray-50' : ''}
                        ${isToday(date) ? 'bg-primary-50 border-primary-200' : ''}
                        ${isSelected(date) ? 'ring-2 ring-primary-500' : ''}
                      `}
                      onClick={() => date && setSelectedDate(date)}
                    >
                      {date && (
                        <>
                          <div className={`text-sm font-medium ${isToday(date) ? 'text-primary-600' : 'text-gray-900'}`}>
                            {date.getDate()}
                          </div>
                          <div className="mt-1 space-y-1">
                            {dayTasks.slice(0, 2).map((task) => (
                              <div
                                key={task._id}
                                className="text-xs p-1 rounded bg-gray-100 text-gray-700 truncate"
                                title={task.title}
                              >
                                <div className={`w-2 h-2 rounded-full inline-block mr-1 ${getPriorityColor(task.priority)}`}></div>
                                {task.title}
                              </div>
                            ))}
                            {dayTasks.length > 2 && (
                              <div className="text-xs text-gray-500">
                                +{dayTasks.length - 2} more
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Selected Date Tasks */}
          <div className="bg-white rounded-lg shadow border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {selectedDate.toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {selectedDateTasks.length} task{selectedDateTasks.length !== 1 ? 's' : ''}
              </p>
            </div>

            <div className="p-6">
              {selectedDateTasks.length === 0 ? (
                <div className="text-center py-8">
                  <CalendarIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No tasks for this date</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedDateTasks.map((task) => (
                    <div 
                      key={task._id} 
                      onClick={() => {
                        setSelectedTask(task);
                        setShowTaskModal(true);
                      }}
                      className="p-3 border border-gray-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-gray-900">
                            {task.title}
                          </h4>
                          {task.description && (
                            <p className="text-xs text-gray-600 mt-1">
                              {task.description}
                            </p>
                          )}
                          <div className="flex items-center mt-2 space-x-3">
                            <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
                              task.priority === 'high' ? 'bg-red-100 text-red-800' :
                              task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              <Flag className="h-3 w-3 mr-1" />
                              {task.priority}
                            </span>
                            {task.assignedTo && (
                              <span className="text-xs text-gray-500">
                                <User className="h-3 w-3 inline mr-1" />
                                {task.assignedTo.name}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Task Edit Modal */}
      <TaskEditModal
        isOpen={showTaskModal}
        onClose={() => setShowTaskModal(false)}
        task={selectedTask}
        onSave={async (taskData) => {
          try {
            if (selectedTask) {
              await taskService.updateTask(selectedTask._id, taskData);
              toast.success('Task updated successfully');
            } else {
              await taskService.createTask(taskData);
              toast.success('Task created successfully');
            }
            fetchData();
            setShowTaskModal(false);
          } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to save task');
            throw error;
          }
        }}
      />
    </Layout>
  );
};

export default Calendar;
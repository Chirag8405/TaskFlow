import React, { useState } from 'react';
import { Button, Input, Textarea, Select } from '../common';
import { useToast } from '../../hooks/useToast';
import { Calendar, Flag, User } from 'lucide-react';

const TaskCreateForm = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    dueDate: '',
    assignee: ''
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const priorityOptions = [
    { value: 'low', label: 'Low Priority', color: 'text-green-600' },
    { value: 'medium', label: 'Medium Priority', color: 'text-yellow-600' },
    { value: 'high', label: 'High Priority', color: 'text-red-600' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      return;
    }

    setLoading(true);
    try {
      const taskData = {
        ...formData,
        title: formData.title.trim(),
        description: formData.description.trim(),
        dueDate: formData.dueDate || null,
        assignee: formData.assignee || null
      };

      await onSubmit(taskData);
      toast.success('Task created successfully');
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        priority: 'medium',
        dueDate: '',
        assignee: ''
      });
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to create task';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
      <div className="space-y-4">
        {/* Title */}
        <Input
          placeholder="Task title..."
          value={formData.title}
          onChange={(e) => handleChange('title', e.target.value)}
          autoFocus
          required
          className="border-0 shadow-none p-0 text-sm font-medium placeholder-gray-400 focus:ring-0"
        />

        {/* Description */}
        <Textarea
          placeholder="Add a description..."
          value={formData.description}
          onChange={(e) => handleChange('description', e.target.value)}
          rows={2}
          className="border-0 shadow-none p-0 text-sm placeholder-gray-400 focus:ring-0 resize-none"
        />

        {/* Metadata Row */}
        <div className="flex items-center space-x-3 pt-2 border-t border-gray-100">
          {/* Priority */}
          <div className="flex items-center space-x-2">
            <Flag className="h-4 w-4 text-gray-400" />
            <Select
              value={formData.priority}
              onChange={(e) => handleChange('priority', e.target.value)}
              className="border-0 shadow-none p-0 text-xs focus:ring-0"
            >
              {priorityOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>

          {/* Due Date */}
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-gray-400" />
            <input
              type="date"
              value={formData.dueDate}
              onChange={(e) => handleChange('dueDate', e.target.value)}
              className="border-0 shadow-none p-0 text-xs focus:ring-0 text-gray-600"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center space-x-2">
            <Button
              type="submit"
              size="sm"
              disabled={!formData.title.trim() || loading}
              className="h-8"
            >
              {loading ? 'Creating...' : 'Add Task'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onCancel}
              className="h-8"
            >
              Cancel
            </Button>
          </div>

          <div className="text-xs text-gray-500">
            Press Enter to save
          </div>
        </div>
      </div>
    </form>
  );
};

export default TaskCreateForm;
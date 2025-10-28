import React, { useState } from 'react';
import { Droppable, Draggable } from '@hello-pangea/dnd';
import TaskCard from './TaskCard';
import TaskCreateForm from './TaskCreateForm';
import { Button } from '../common';
import { Plus, MoreHorizontal } from 'lucide-react';

const KanbanColumn = ({ 
  column, 
  onTaskCreate, 
  onTaskUpdate, 
  onTaskDelete, 
  draggedTask 
}) => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const getColumnColor = (color) => {
    const colors = {
      gray: {
        header: 'bg-gray-100 text-gray-800',
        border: 'border-gray-200',
        accent: 'bg-gray-500'
      },
      blue: {
        header: 'bg-blue-100 text-blue-800',
        border: 'border-blue-200',
        accent: 'bg-blue-500'
      },
      yellow: {
        header: 'bg-yellow-100 text-yellow-800',
        border: 'border-yellow-200',
        accent: 'bg-yellow-500'
      },
      green: {
        header: 'bg-green-100 text-green-800',
        border: 'border-green-200',
        accent: 'bg-green-500'
      }
    };
    return colors[color] || colors.gray;
  };

  const colorClasses = getColumnColor(column.color);

  const handleCreateTask = (taskData) => {
    onTaskCreate(taskData);
    setShowCreateForm(false);
  };

  return (
    <div className="flex flex-col w-80 flex-shrink-0">
      {/* Column Header */}
      <div className={`flex items-center justify-between p-4 rounded-t-lg border-b ${colorClasses.header} ${colorClasses.border}`}>
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${colorClasses.accent}`}></div>
          <h3 className="font-semibold text-sm uppercase tracking-wide">
            {column.title}
          </h3>
          <span className="bg-white bg-opacity-60 text-xs px-2 py-1 rounded-full font-medium">
            {column.tasks.length}
          </span>
        </div>
        
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1 hover:bg-white hover:bg-opacity-20 rounded transition-colors"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
          
          {showMenu && (
            <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-10">
              <button
                onClick={() => {
                  setShowCreateForm(true);
                  setShowMenu(false);
                }}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Task
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Column Content */}
      <Droppable droppableId={column.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-1 p-4 min-h-[200px] bg-gray-50 rounded-b-lg border-l border-r border-b ${colorClasses.border} ${
              snapshot.isDraggingOver ? 'bg-blue-50' : ''
            }`}
          >
            {/* Create Task Form */}
            {showCreateForm && (
              <div className="mb-4 animate-in slide-in-from-top duration-200">
                <TaskCreateForm
                  onSubmit={handleCreateTask}
                  onCancel={() => setShowCreateForm(false)}
                />
              </div>
            )}

            {/* Tasks */}
            <div className="space-y-3">
              {column.tasks.map((task, index) => (
                <Draggable
                  key={task._id}
                  draggableId={task._id}
                  index={index}
                  isDragDisabled={false}
                >
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      className={`${
                        snapshot.isDragging ? 'opacity-50 rotate-2' : ''
                      }`}
                    >
                      <TaskCard
                        task={task}
                        onUpdate={onTaskUpdate}
                        onDelete={onTaskDelete}
                        isDragging={snapshot.isDragging}
                      />
                    </div>
                  )}
                </Draggable>
              ))}
            </div>

            {provided.placeholder}

            {/* Add Task Button */}
            {!showCreateForm && column.tasks.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500 text-sm mb-4">No tasks yet</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCreateForm(true)}
                  className="border-dashed"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Task
                </Button>
              </div>
            )}

            {!showCreateForm && column.tasks.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCreateForm(true)}
                className="w-full mt-4 border-dashed border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-100"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Task
              </Button>
            )}
          </div>
        )}
      </Droppable>
    </div>
  );
};

export default KanbanColumn;
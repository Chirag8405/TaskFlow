import React from 'react';

// Generic Skeleton component
export const Skeleton = ({ className = '', variant = 'rectangular', animation = 'pulse' }) => {
  const baseClasses = 'bg-gray-200 dark:bg-gray-700';
  
  const variantClasses = {
    rectangular: 'rounded',
    circular: 'rounded-full',
    text: 'rounded h-4',
  };

  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'animate-shimmer',
  };

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${animationClasses[animation]} ${className}`}
    />
  );
};

// Card Skeleton
export const CardSkeleton = () => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-2/3" variant="text" />
        <Skeleton className="h-6 w-6" variant="circular" />
      </div>
      <Skeleton className="h-4 w-full" variant="text" />
      <Skeleton className="h-4 w-5/6" variant="text" />
      <div className="flex items-center justify-between pt-2">
        <Skeleton className="h-6 w-16" variant="rectangular" />
        <Skeleton className="h-8 w-8" variant="circular" />
      </div>
    </div>
  );
};

// Task Card Skeleton
export const TaskCardSkeleton = () => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-3">
      <div className="flex items-start justify-between">
        <Skeleton className="h-5 w-3/4" variant="text" />
        <Skeleton className="h-5 w-5" variant="circular" />
      </div>
      <Skeleton className="h-3 w-full" variant="text" />
      <Skeleton className="h-3 w-4/5" variant="text" />
      <div className="flex items-center gap-2 pt-2">
        <Skeleton className="h-5 w-12" variant="rectangular" />
        <Skeleton className="h-5 w-16" variant="rectangular" />
      </div>
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-6" variant="circular" />
        <Skeleton className="h-3 w-20" variant="text" />
      </div>
    </div>
  );
};

// Table Row Skeleton
export const TableRowSkeleton = ({ columns = 4 }) => {
  return (
    <tr className="border-b border-gray-200 dark:border-gray-700">
      {Array.from({ length: columns }).map((_, index) => (
        <td key={index} className="px-6 py-4">
          <Skeleton className="h-4 w-full" variant="text" />
        </td>
      ))}
    </tr>
  );
};

// Table Skeleton
export const TableSkeleton = ({ rows = 5, columns = 4 }) => {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            {Array.from({ length: columns }).map((_, index) => (
              <th key={index} className="px-6 py-3">
                <Skeleton className="h-4 w-24" variant="text" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
          {Array.from({ length: rows }).map((_, index) => (
            <TableRowSkeleton key={index} columns={columns} />
          ))}
        </tbody>
      </table>
    </div>
  );
};

// List Skeleton
export const ListSkeleton = ({ items = 5 }) => {
  return (
    <div className="space-y-3">
      {Array.from({ length: items }).map((_, index) => (
        <div key={index} className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg">
          <Skeleton className="h-10 w-10" variant="circular" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" variant="text" />
            <Skeleton className="h-3 w-1/2" variant="text" />
          </div>
        </div>
      ))}
    </div>
  );
};

// Profile Skeleton
export const ProfileSkeleton = () => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-4">
      <div className="flex items-center gap-4">
        <Skeleton className="h-20 w-20" variant="circular" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-6 w-1/3" variant="text" />
          <Skeleton className="h-4 w-1/2" variant="text" />
        </div>
      </div>
      <div className="space-y-3 pt-4">
        <Skeleton className="h-10 w-full" variant="rectangular" />
        <Skeleton className="h-10 w-full" variant="rectangular" />
        <Skeleton className="h-10 w-full" variant="rectangular" />
      </div>
    </div>
  );
};

// Dashboard Stats Skeleton
export const StatsCardSkeleton = () => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-24" variant="text" />
        <Skeleton className="h-8 w-8" variant="circular" />
      </div>
      <Skeleton className="h-8 w-16" variant="text" />
      <Skeleton className="h-3 w-32" variant="text" />
    </div>
  );
};

// Kanban Column Skeleton
export const KanbanColumnSkeleton = () => {
  return (
    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-4 min-w-[300px]">
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-6 w-24" variant="text" />
        <Skeleton className="h-6 w-8" variant="rectangular" />
      </div>
      {Array.from({ length: 3 }).map((_, index) => (
        <TaskCardSkeleton key={index} />
      ))}
    </div>
  );
};

// Calendar Skeleton
export const CalendarSkeleton = () => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-4">
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-8 w-32" variant="text" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-8" variant="rectangular" />
          <Skeleton className="h-8 w-8" variant="rectangular" />
        </div>
      </div>
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: 35 }).map((_, index) => (
          <Skeleton key={index} className="h-20 w-full" variant="rectangular" />
        ))}
      </div>
    </div>
  );
};

// Activity Feed Skeleton
export const ActivityFeedSkeleton = ({ items = 5 }) => {
  return (
    <div className="space-y-4">
      {Array.from({ length: items }).map((_, index) => (
        <div key={index} className="flex gap-3">
          <Skeleton className="h-10 w-10 flex-shrink-0" variant="circular" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" variant="text" />
            <Skeleton className="h-3 w-1/2" variant="text" />
          </div>
        </div>
      ))}
    </div>
  );
};

// Form Skeleton
export const FormSkeleton = ({ fields = 4 }) => {
  return (
    <div className="space-y-4">
      {Array.from({ length: fields }).map((_, index) => (
        <div key={index} className="space-y-2">
          <Skeleton className="h-4 w-24" variant="text" />
          <Skeleton className="h-10 w-full" variant="rectangular" />
        </div>
      ))}
      <div className="flex gap-3 pt-4">
        <Skeleton className="h-10 w-24" variant="rectangular" />
        <Skeleton className="h-10 w-24" variant="rectangular" />
      </div>
    </div>
  );
};

export default {
  Skeleton,
  CardSkeleton,
  TaskCardSkeleton,
  TableSkeleton,
  TableRowSkeleton,
  ListSkeleton,
  ProfileSkeleton,
  StatsCardSkeleton,
  KanbanColumnSkeleton,
  CalendarSkeleton,
  ActivityFeedSkeleton,
  FormSkeleton,
};

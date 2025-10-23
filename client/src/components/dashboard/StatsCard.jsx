import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const StatsCard = ({ 
  title, 
  value, 
  previousValue, 
  icon: Icon, 
  color = 'blue',
  format = 'number',
  loading = false
}) => {
  const getColorClasses = (color) => {
    const colors = {
      blue: {
        bg: 'bg-blue-100',
        text: 'text-blue-600',
        icon: 'text-blue-600'
      },
      green: {
        bg: 'bg-green-100',
        text: 'text-green-600',
        icon: 'text-green-600'
      },
      yellow: {
        bg: 'bg-yellow-100',
        text: 'text-yellow-600',
        icon: 'text-yellow-600'
      },
      red: {
        bg: 'bg-red-100',
        text: 'text-red-600',
        icon: 'text-red-600'
      },
      purple: {
        bg: 'bg-purple-100',
        text: 'text-purple-600',
        icon: 'text-purple-600'
      },
      indigo: {
        bg: 'bg-indigo-100',
        text: 'text-indigo-600',
        icon: 'text-indigo-600'
      }
    };
    return colors[color] || colors.blue;
  };

  const formatValue = (val) => {
    if (format === 'currency') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(val);
    }
    if (format === 'percentage') {
      return `${val}%`;
    }
    return val.toLocaleString();
  };

  const calculateChange = () => {
    if (previousValue === null || previousValue === undefined || value === null || value === undefined) {
      return { percentage: 0, trend: 'neutral' };
    }

    if (previousValue === 0) {
      return { percentage: value > 0 ? 100 : 0, trend: value > 0 ? 'up' : 'neutral' };
    }

    const change = ((value - previousValue) / previousValue) * 100;
    const trend = change > 0 ? 'up' : change < 0 ? 'down' : 'neutral';
    
    return { 
      percentage: Math.abs(change).toFixed(1), 
      trend 
    };
  };

  const { percentage, trend } = calculateChange();
  const colorClasses = getColorClasses(color);

  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-3 w-3" />;
      case 'down':
        return <TrendingDown className="h-3 w-3" />;
      default:
        return <Minus className="h-3 w-3" />;
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
            <div className="h-8 bg-gray-200 rounded animate-pulse mb-2"></div>
            <div className="h-3 bg-gray-200 rounded animate-pulse w-24"></div>
          </div>
          <div className="ml-4">
            <div className="h-12 w-12 bg-gray-200 rounded-lg animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow border border-gray-200 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mb-2">
            {formatValue(value)}
          </p>
          
          {previousValue !== null && previousValue !== undefined && (
            <div className={`flex items-center text-sm ${getTrendColor()}`}>
              {getTrendIcon()}
              <span className="ml-1">
                {percentage}% from last period
              </span>
            </div>
          )}
        </div>
        
        {Icon && (
          <div className={`p-3 rounded-lg ${colorClasses.bg}`}>
            <Icon className={`h-6 w-6 ${colorClasses.icon}`} />
          </div>
        )}
      </div>
    </div>
  );
};

export default StatsCard;
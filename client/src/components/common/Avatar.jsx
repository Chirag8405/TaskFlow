import React from 'react';

const Avatar = ({ user, size = 'md', className = '', showOnlineStatus = false }) => {
  if (!user) return null;

  const sizeClasses = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
    xl: 'w-16 h-16 text-xl',
  };

  const getInitials = (name) => {
    if (!name) return '?';
    const words = name.trim().split(' ');
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const getColorFromName = (name) => {
    if (!name) return 'bg-gray-500';
    
    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-yellow-500',
      'bg-red-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-teal-500',
    ];
    
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return colors[Math.abs(hash) % colors.length];
  };

  const initials = user.initials || getInitials(user.name || user.email);
  const bgColor = getColorFromName(user.name || user.email);
  
  // Check if avatar exists and is a valid URL/path (not empty string)
  const hasValidAvatar = user.avatar && user.avatar.trim().length > 0;

  return (
    <div className={`relative inline-block ${className}`}>
      {hasValidAvatar ? (
        <img
          src={user.avatar}
          alt={user.name || 'User'}
          className={`${sizeClasses[size]} rounded-full object-cover`}
          onError={(e) => {
            // If image fails to load, hide it and show initials instead
            e.target.style.display = 'none';
            e.target.nextSibling.style.display = 'flex';
          }}
        />
      ) : null}
      
      <div
        className={`${sizeClasses[size]} ${bgColor} rounded-full flex items-center justify-center text-white font-semibold ${hasValidAvatar ? 'hidden' : ''}`}
        style={hasValidAvatar ? { display: 'none' } : {}}
      >
        {initials}
      </div>
      
      {showOnlineStatus && user.isOnline && (
        <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full bg-green-400 ring-2 ring-white"></span>
      )}
    </div>
  );
};

export default Avatar;

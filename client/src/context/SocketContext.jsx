import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import socketManager from '../utils/socket';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const { user, token } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [activeUsers, setActiveUsers] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');

  useEffect(() => {
    if (user && token) {
      // Connect to socket
      socketManager.connect(token);
      
      // Setup connection status listeners
      socketManager.on('connect', () => {
        setIsConnected(true);
        setConnectionStatus('connected');
        console.log('Socket connected successfully');
      });

      socketManager.on('disconnect', () => {
        setIsConnected(false);
        setConnectionStatus('disconnected');
        console.log('Socket disconnected');
      });

      socketManager.on('connect_error', () => {
        setConnectionStatus('error');
        console.log('Socket connection error');
      });

      // Listen for active users updates
      socketManager.on('active-users', (users) => {
        setActiveUsers(users);
      });

      socketManager.on('user-online', (userId) => {
        setActiveUsers(prev => [...new Set([...prev, userId])]);
      });

      socketManager.on('user-offline', (userId) => {
        setActiveUsers(prev => prev.filter(id => id !== userId));
      });

      return () => {
        socketManager.removeAllListeners('connect');
        socketManager.removeAllListeners('disconnect');
        socketManager.removeAllListeners('connect_error');
        socketManager.removeAllListeners('active-users');
        socketManager.removeAllListeners('user-online');
        socketManager.removeAllListeners('user-offline');
      };
    }
  }, [user, token]);

  const joinProject = (projectId) => {
    if (user && isConnected) {
      socketManager.joinProject(projectId, user._id);
    }
  };

  const leaveProject = (projectId) => {
    if (user && isConnected) {
      socketManager.leaveProject(projectId, user._id);
    }
  };

  const emitTaskCreated = (projectId, task) => {
    socketManager.emitTaskCreated(projectId, task);
  };

  const emitTaskUpdated = (projectId, task) => {
    socketManager.emitTaskUpdated(projectId, task);
  };

  const emitTaskDeleted = (projectId, taskId) => {
    socketManager.emitTaskDeleted(projectId, taskId);
  };

  const emitTaskMoved = (projectId, taskId, newStatus, task) => {
    socketManager.emitTaskMoved(projectId, taskId, newStatus, task);
  };

  const addEventListener = (event, callback) => {
    socketManager.on(event, callback);
  };

  const removeEventListener = (event, callback) => {
    socketManager.off(event, callback);
  };

  const value = {
    isConnected,
    connectionStatus,
    activeUsers,
    joinProject,
    leaveProject,
    emitTaskCreated,
    emitTaskUpdated,
    emitTaskDeleted,
    emitTaskMoved,
    addEventListener,
    removeEventListener,
    socket: socketManager.socket
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketContext;
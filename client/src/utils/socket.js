import { io } from 'socket.io-client';

class SocketManager {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectInterval = 1000;
  }

  // Initialize socket connection
  connect(token) {
    if (this.socket?.connected) {
      return this.socket;
    }

    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
    
    this.socket = io(socketUrl, {
      auth: {
        token
      },
      transports: ['websocket', 'polling'],
      timeout: 20000,
      forceNew: true
    });

    this.setupEventListeners();
    return this.socket;
  }

  // Disconnect socket
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  // Setup default event listeners
  setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket.id);
      this.isConnected = true;
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      this.isConnected = false;
      
      // Auto-reconnect logic
      if (reason === 'io server disconnect') {
        // Server disconnected, need manual reconnection
        this.handleReconnect();
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      this.handleReconnect();
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  }

  // Handle reconnection
  handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
      
      setTimeout(() => {
        if (this.socket && !this.socket.connected) {
          this.socket.connect();
        }
      }, this.reconnectInterval * this.reconnectAttempts);
    } else {
      console.error('Max reconnection attempts reached');
    }
  }

  // Join project room
  joinProject(projectId, userId) {
    if (this.socket?.connected) {
      this.socket.emit('join-project', projectId, userId);
    }
  }

  // Leave project room
  leaveProject(projectId, userId) {
    if (this.socket?.connected) {
      this.socket.emit('leave-project', projectId, userId);
    }
  }

  // Emit task events
  emitTaskCreated(projectId, task) {
    if (this.socket?.connected) {
      this.socket.emit('task-created', { projectId, task });
    }
  }

  emitTaskUpdated(projectId, task) {
    if (this.socket?.connected) {
      this.socket.emit('task-updated', { projectId, task });
    }
  }

  emitTaskDeleted(projectId, taskId) {
    if (this.socket?.connected) {
      this.socket.emit('task-deleted', { projectId, taskId });
    }
  }

  emitTaskMoved(projectId, taskId, newStatus, task) {
    if (this.socket?.connected) {
      this.socket.emit('task-moved', { projectId, taskId, newStatus, task });
    }
  }

  // Listen to events
  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  // Remove event listener
  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  // Remove all listeners for an event
  removeAllListeners(event) {
    if (this.socket) {
      this.socket.removeAllListeners(event);
    }
  }

  // Get connection status
  getConnectionStatus() {
    return {
      connected: this.isConnected,
      socketId: this.socket?.id,
      reconnectAttempts: this.reconnectAttempts
    };
  }
}

// Create and export singleton instance
const socketManager = new SocketManager();
export default socketManager;
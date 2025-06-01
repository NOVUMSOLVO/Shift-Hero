// NHS Care Homes - Frontend WebSocket Client Service
class WebSocketService {
  constructor() {
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.listeners = new Map();
    this.connectionStatus = 'disconnected';
    this.token = null;
    this.heartbeatInterval = null;
  }

  // Initialize WebSocket connection
  connect(token) {
    this.token = token;
    
    if (this.ws && (this.ws.readyState === WebSocket.CONNECTING || this.ws.readyState === WebSocket.OPEN)) {
      console.log('NHS Care: WebSocket already connected or connecting');
      return;
    }

    const wsUrl = `${process.env.REACT_APP_WS_URL || 'ws://localhost:5000'}/ws?token=${token}`;
    
    try {
      this.ws = new WebSocket(wsUrl);
      this.setupEventHandlers();
      this.connectionStatus = 'connecting';
    } catch (error) {
      console.error('NHS Care: Failed to create WebSocket connection:', error);
      this.handleConnectionError();
    }
  }

  // Setup WebSocket event handlers
  setupEventHandlers() {
    this.ws.onopen = (event) => {
      console.log('NHS Care: WebSocket connected');
      this.connectionStatus = 'connected';
      this.reconnectAttempts = 0;
      this.startHeartbeat();
      this.emit('connection_established', { timestamp: new Date().toISOString() });
    };

    this.ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        this.handleMessage(message);
      } catch (error) {
        console.error('NHS Care: Failed to parse WebSocket message:', error);
      }
    };

    this.ws.onclose = (event) => {
      console.log('NHS Care: WebSocket connection closed:', event.code, event.reason);
      this.connectionStatus = 'disconnected';
      this.stopHeartbeat();
      this.emit('connection_closed', { code: event.code, reason: event.reason });
      
      // Attempt to reconnect if not a normal closure
      if (event.code !== 1000 && event.code !== 1001) {
        this.handleReconnect();
      }
    };

    this.ws.onerror = (error) => {
      console.error('NHS Care: WebSocket error:', error);
      this.emit('connection_error', { error });
      this.handleConnectionError();
    };
  }

  // Handle incoming messages
  handleMessage(message) {
    const { type, data } = message;
    
    switch (type) {
      case 'connection_established':
        this.emit('connected', data);
        break;
      
      case 'new_message':
        this.emit('message_received', data);
        break;
      
      case 'notification':
        this.emit('notification', data);
        break;
      
      case 'medication_alert':
        this.emit('medication_alert', data);
        break;
      
      case 'staff_emergency':
        this.emit('staff_emergency', data);
        break;
      
      case 'resident_update':
        this.emit('resident_update', data);
        break;
      
      case 'user_joined_room':
        this.emit('user_joined_room', data);
        break;
      
      case 'user_left_room':
        this.emit('user_left_room', data);
        break;
      
      case 'typing_start':
        this.emit('typing_start', data);
        break;
      
      case 'typing_stop':
        this.emit('typing_stop', data);
        break;
      
      case 'user_status_change':
        this.emit('user_status_change', data);
        break;
      
      case 'room_joined':
        this.emit('room_joined', data);
        break;
      
      case 'room_left':
        this.emit('room_left', data);
        break;
      
      case 'message_sent':
        this.emit('message_sent', data);
        break;
      
      case 'status_response':
        this.emit('status_response', data);
        break;
      
      case 'error':
        this.emit('error', data);
        break;
      
      default:
        console.warn('NHS Care: Unknown message type:', type);
    }
  }

  // Send message to server
  send(type, data = {}) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const message = { type, data };
      this.ws.send(JSON.stringify(message));
      return true;
    } else {
      console.warn('NHS Care: WebSocket not connected, message not sent:', type);
      return false;
    }
  }

  // Room management
  joinRoom(roomId) {
    return this.send('join_room', { roomId });
  }

  leaveRoom(roomId) {
    return this.send('leave_room', { roomId });
  }

  // Messaging
  sendMessage(roomId, content, messageType = 'text', priority = 'normal') {
    return this.send('send_message', {
      roomId,
      content,
      messageType,
      priority
    });
  }

  // Alerts and notifications
  sendMedicationAlert(residentId, medicationId, alertType, priority = 'high') {
    return this.send('medication_alert', {
      residentId,
      medicationId,
      alertType,
      priority
    });
  }

  sendStaffEmergency(emergencyType, location, description) {
    return this.send('staff_emergency', {
      emergencyType,
      location,
      description
    });
  }

  sendResidentUpdate(residentId, updateType, details) {
    return this.send('resident_update', {
      residentId,
      updateType,
      details
    });
  }

  // Typing indicators
  startTyping(roomId) {
    return this.send('typing_start', { roomId });
  }

  stopTyping(roomId) {
    return this.send('typing_stop', { roomId });
  }

  // Request server status
  requestStatus() {
    return this.send('request_status');
  }

  // Event listener management
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`NHS Care: Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  // Connection management
  disconnect() {
    if (this.ws) {
      this.ws.close(1000, 'User initiated disconnect');
      this.ws = null;
    }
    this.stopHeartbeat();
    this.connectionStatus = 'disconnected';
  }

  // Reconnection logic
  handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1); // Exponential backoff
      
      console.log(`NHS Care: Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${delay}ms`);
      
      setTimeout(() => {
        if (this.token) {
          this.connect(this.token);
        }
      }, delay);
    } else {
      console.error('NHS Care: Max reconnection attempts reached');
      this.emit('reconnection_failed');
    }
  }

  handleConnectionError() {
    this.connectionStatus = 'error';
    this.stopHeartbeat();
  }

  // Heartbeat to keep connection alive
  startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.ping?.();
      }
    }, 30000); // Send ping every 30 seconds
  }

  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  // Utility methods
  isConnected() {
    return this.ws && this.ws.readyState === WebSocket.OPEN;
  }

  getConnectionStatus() {
    return this.connectionStatus;
  }

  // Cleanup
  destroy() {
    this.disconnect();
    this.listeners.clear();
  }
}

// Create singleton instance
const websocketService = new WebSocketService();

export default websocketService;

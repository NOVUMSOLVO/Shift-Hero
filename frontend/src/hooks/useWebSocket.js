// NHS Care Homes - React WebSocket Hook
import { useEffect, useRef, useCallback, useState } from 'react';
import websocketService from '../services/websocketService';

export const useWebSocket = (token) => {
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [lastMessage, setLastMessage] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [currentRooms, setCurrentRooms] = useState(new Set());
  const listenersRef = useRef(new Map());

  // Connection management
  useEffect(() => {
    if (token) {
      websocketService.connect(token);

      // Setup connection status listeners
      const handleConnectionEstablished = () => {
        setConnectionStatus('connected');
      };

      const handleConnectionClosed = () => {
        setConnectionStatus('disconnected');
      };

      const handleConnectionError = () => {
        setConnectionStatus('error');
      };

      const handleReconnectionFailed = () => {
        setConnectionStatus('failed');
      };

      websocketService.on('connection_established', handleConnectionEstablished);
      websocketService.on('connection_closed', handleConnectionClosed);
      websocketService.on('connection_error', handleConnectionError);
      websocketService.on('reconnection_failed', handleReconnectionFailed);

      return () => {
        websocketService.off('connection_established', handleConnectionEstablished);
        websocketService.off('connection_closed', handleConnectionClosed);
        websocketService.off('connection_error', handleConnectionError);
        websocketService.off('reconnection_failed', handleReconnectionFailed);
      };
    }
  }, [token]);

  // Message handling
  useEffect(() => {
    const handleNewMessage = (message) => {
      setLastMessage(message);
    };

    const handleNotification = (notification) => {
      setNotifications(prev => [notification, ...prev]);
      
      // Auto-remove notifications after 10 seconds for non-critical ones
      if (notification.priority !== 'critical') {
        setTimeout(() => {
          setNotifications(prev => prev.filter(n => n.id !== notification.id));
        }, 10000);
      }
    };

    const handleUserStatusChange = (data) => {
      const { userId, status } = data;
      setOnlineUsers(prev => {
        const newSet = new Set(prev);
        if (status === 'online') {
          newSet.add(userId);
        } else {
          newSet.delete(userId);
        }
        return newSet;
      });
    };

    const handleRoomJoined = (data) => {
      setCurrentRooms(prev => new Set([...prev, data.roomId]));
    };

    const handleRoomLeft = (data) => {
      setCurrentRooms(prev => {
        const newSet = new Set(prev);
        newSet.delete(data.roomId);
        return newSet;
      });
    };

    websocketService.on('message_received', handleNewMessage);
    websocketService.on('notification', handleNotification);
    websocketService.on('user_status_change', handleUserStatusChange);
    websocketService.on('room_joined', handleRoomJoined);
    websocketService.on('room_left', handleRoomLeft);

    return () => {
      websocketService.off('message_received', handleNewMessage);
      websocketService.off('notification', handleNotification);
      websocketService.off('user_status_change', handleUserStatusChange);
      websocketService.off('room_joined', handleRoomJoined);
      websocketService.off('room_left', handleRoomLeft);
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clean up all listeners
      listenersRef.current.forEach((handler, event) => {
        websocketService.off(event, handler);
      });
      listenersRef.current.clear();
    };
  }, []);

  // Messaging functions
  const sendMessage = useCallback((roomId, content, messageType = 'text', priority = 'normal') => {
    return websocketService.sendMessage(roomId, content, messageType, priority);
  }, []);

  const joinRoom = useCallback((roomId) => {
    return websocketService.joinRoom(roomId);
  }, []);

  const leaveRoom = useCallback((roomId) => {
    return websocketService.leaveRoom(roomId);
  }, []);

  // Alert functions
  const sendMedicationAlert = useCallback((residentId, medicationId, alertType, priority = 'high') => {
    return websocketService.sendMedicationAlert(residentId, medicationId, alertType, priority);
  }, []);

  const sendStaffEmergency = useCallback((emergencyType, location, description) => {
    return websocketService.sendStaffEmergency(emergencyType, location, description);
  }, []);

  const sendResidentUpdate = useCallback((residentId, updateType, details) => {
    return websocketService.sendResidentUpdate(residentId, updateType, details);
  }, []);

  // Typing indicators
  const startTyping = useCallback((roomId) => {
    return websocketService.startTyping(roomId);
  }, []);

  const stopTyping = useCallback((roomId) => {
    return websocketService.stopTyping(roomId);
  }, []);

  // Event listener management
  const addEventListener = useCallback((event, handler) => {
    websocketService.on(event, handler);
    listenersRef.current.set(event, handler);
    
    return () => {
      websocketService.off(event, handler);
      listenersRef.current.delete(event);
    };
  }, []);

  // Notification management
  const dismissNotification = useCallback((notificationId) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  return {
    // Connection state
    connectionStatus,
    isConnected: connectionStatus === 'connected',
    
    // Data state
    lastMessage,
    notifications,
    onlineUsers,
    currentRooms,
    
    // Messaging actions
    sendMessage,
    joinRoom,
    leaveRoom,
    
    // Alert actions
    sendMedicationAlert,
    sendStaffEmergency,
    sendResidentUpdate,
    
    // Typing actions
    startTyping,
    stopTyping,
    
    // Notification actions
    dismissNotification,
    clearAllNotifications,
    
    // Event management
    addEventListener,
    
    // Utility
    requestStatus: websocketService.requestStatus.bind(websocketService),
    disconnect: websocketService.disconnect.bind(websocketService)
  };
};

export default useWebSocket;

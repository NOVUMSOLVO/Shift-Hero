// NHS Care Homes - Real-Time Messaging Component
import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  Typography,
  Chip,
  Avatar,
  IconButton,
  Divider,
  Badge,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
  Paper,
  Tab,
  Tabs,
  InputAdornment
} from '@mui/material';
import {
  Send as SendIcon,
  Emergency as EmergencyIcon,
  Medication as MedicationIcon,
  Person as PersonIcon,
  Group as GroupIcon,
  Close as CloseIcon,
  Notifications as NotificationsIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { useWebSocket } from '../hooks/useWebSocket';

const RealTimeMessaging = ({ userToken, currentUser }) => {
  const {
    connectionStatus,
    isConnected,
    lastMessage,
    notifications,
    onlineUsers,
    currentRooms,
    sendMessage,
    joinRoom,
    leaveRoom,
    sendMedicationAlert,
    sendStaffEmergency,
    sendResidentUpdate,
    startTyping,
    stopTyping,
    dismissNotification,
    clearAllNotifications,
    addEventListener
  } = useWebSocket(userToken);

  // Local state
  const [messages, setMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [activeRoom, setActiveRoom] = useState('general');
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [emergencyDialogOpen, setEmergencyDialogOpen] = useState(false);
  const [medicationDialogOpen, setMedicationDialogOpen] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // Refs
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Emergency form state
  const [emergencyForm, setEmergencyForm] = useState({
    type: '',
    location: '',
    description: ''
  });

  // Medication alert form state
  const [medicationForm, setMedicationForm] = useState({
    residentId: '',
    medicationId: '',
    alertType: '',
    priority: 'high'
  });

  // Available rooms based on user role
  const availableRooms = {
    general: 'General',
    nursing_staff: 'Nursing Staff',
    care_staff: 'Care Staff',
    management: 'Management',
    all_staff: 'All Staff'
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle new messages
  useEffect(() => {
    if (lastMessage) {
      setMessages(prev => [...prev, lastMessage]);
    }
  }, [lastMessage]);

  // Setup typing indicators
  useEffect(() => {
    const removeTyping = addEventListener('typing_start', (data) => {
      if (data.roomId === activeRoom && data.userId !== currentUser?.id) {
        setTypingUsers(prev => new Set([...prev, data.userId]));
      }
    });

    const stopTypingHandler = addEventListener('typing_stop', (data) => {
      if (data.roomId === activeRoom) {
        setTypingUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(data.userId);
          return newSet;
        });
      }
    });

    return () => {
      removeTyping();
      stopTypingHandler();
    };
  }, [activeRoom, currentUser?.id, addEventListener]);

  // Join initial rooms
  useEffect(() => {
    if (isConnected) {
      joinRoom('general');
      if (currentUser?.role) {
        switch (currentUser.role) {
          case 'nurse':
            joinRoom('nursing_staff');
            joinRoom('all_staff');
            break;
          case 'care_assistant':
            joinRoom('care_staff');
            joinRoom('all_staff');
            break;
          case 'admin':
          case 'manager':
            joinRoom('management');
            joinRoom('all_staff');
            break;
        }
      }
    }
  }, [isConnected, currentUser?.role, joinRoom]);

  // Handle message sending
  const handleSendMessage = () => {
    if (currentMessage.trim() && isConnected) {
      sendMessage(activeRoom, currentMessage.trim());
      setCurrentMessage('');
      stopTyping(activeRoom);
    }
  };

  // Handle typing indicators
  const handleTyping = (value) => {
    setCurrentMessage(value);
    
    if (value.trim()) {
      startTyping(activeRoom);
      
      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Stop typing after 2 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        stopTyping(activeRoom);
      }, 2000);
    } else {
      stopTyping(activeRoom);
    }
  };

  // Handle room switching
  const handleRoomSwitch = (roomId) => {
    if (roomId !== activeRoom) {
      setActiveRoom(roomId);
      joinRoom(roomId);
      setMessages([]); // Clear messages for new room (in real app, load room history)
    }
  };

  // Handle emergency alert
  const handleEmergencyAlert = () => {
    if (emergencyForm.type && emergencyForm.location) {
      sendStaffEmergency(emergencyForm.type, emergencyForm.location, emergencyForm.description);
      setEmergencyDialogOpen(false);
      setEmergencyForm({ type: '', location: '', description: '' });
      setSnackbarMessage('Emergency alert sent!');
      setSnackbarOpen(true);
    }
  };

  // Handle medication alert
  const handleMedicationAlert = () => {
    if (medicationForm.residentId && medicationForm.alertType) {
      sendMedicationAlert(
        medicationForm.residentId,
        medicationForm.medicationId,
        medicationForm.alertType,
        medicationForm.priority
      );
      setMedicationDialogOpen(false);
      setMedicationForm({ residentId: '', medicationId: '', alertType: '', priority: 'high' });
      setSnackbarMessage('Medication alert sent!');
      setSnackbarOpen(true);
    }
  };

  // Tab panels
  const TabPanel = ({ children, value, index }) => (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Paper sx={{ p: 2, borderRadius: 0 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">
            Real-Time Communication
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Chip
              icon={<div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: isConnected ? '#4caf50' : '#f44336' }} />}
              label={connectionStatus}
              variant="outlined"
              size="small"
            />
            <Badge badgeContent={notifications.length} color="error">
              <NotificationsIcon />
            </Badge>
            <Chip
              icon={<GroupIcon />}
              label={`${onlineUsers.size} online`}
              variant="outlined"
              size="small"
            />
          </Box>
        </Box>
      </Paper>

      {/* Main content with tabs */}
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <Tabs
          value={tabValue}
          onChange={(e, newValue) => setTabValue(newValue)}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Messages" />
          <Tab label={`Notifications (${notifications.length})`} />
          <Tab label="Alerts" />
        </Tabs>

        {/* Messages Tab */}
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ display: 'flex', height: '60vh' }}>
            {/* Room selection */}
            <Box sx={{ width: 200, borderRight: 1, borderColor: 'divider', p: 1 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Rooms</Typography>
              <List dense>
                {Object.entries(availableRooms).map(([roomId, roomName]) => (
                  <ListItem
                    key={roomId}
                    button
                    selected={activeRoom === roomId}
                    onClick={() => handleRoomSwitch(roomId)}
                  >
                    <ListItemText primary={roomName} />
                    {currentRooms.has(roomId) && (
                      <Chip size="small" color="primary" label="Joined" />
                    )}
                  </ListItem>
                ))}
              </List>
            </Box>

            {/* Message area */}
            <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
              {/* Messages list */}
              <Box sx={{ flexGrow: 1, overflow: 'auto', p: 1 }}>
                <List>
                  {messages.map((msg, index) => (
                    <ListItem key={index} alignItems="flex-start">
                      <Avatar sx={{ mr: 2 }}>
                        <PersonIcon />
                      </Avatar>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="subtitle2">
                              User {msg.senderId}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {new Date(msg.timestamp).toLocaleTimeString()}
                            </Typography>
                          </Box>
                        }
                        secondary={msg.content}
                      />
                    </ListItem>
                  ))}
                </List>
                
                {/* Typing indicators */}
                {typingUsers.size > 0 && (
                  <Typography variant="caption" color="text.secondary" sx={{ pl: 2 }}>
                    {Array.from(typingUsers).join(', ')} {typingUsers.size === 1 ? 'is' : 'are'} typing...
                  </Typography>
                )}
                
                <div ref={messagesEndRef} />
              </Box>

              {/* Message input */}
              <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
                <TextField
                  fullWidth
                  value={currentMessage}
                  onChange={(e) => handleTyping(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder={`Message ${availableRooms[activeRoom]}...`}
                  disabled={!isConnected}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={handleSendMessage}
                          disabled={!currentMessage.trim() || !isConnected}
                        >
                          <SendIcon />
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                />
              </Box>
            </Box>
          </Box>
        </TabPanel>

        {/* Notifications Tab */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Notifications</Typography>
            <Button onClick={clearAllNotifications} disabled={notifications.length === 0}>
              Clear All
            </Button>
          </Box>
          
          <List>
            {notifications.map((notification, index) => (
              <Card key={notification.id || index} sx={{ mb: 1 }}>
                <CardContent sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                        {notification.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {notification.message}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(notification.timestamp).toLocaleString()}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip
                        size="small"
                        color={notification.priority === 'critical' ? 'error' : notification.priority === 'high' ? 'warning' : 'default'}
                        label={notification.priority}
                      />
                      <IconButton
                        size="small"
                        onClick={() => dismissNotification(notification.id)}
                      >
                        <CloseIcon />
                      </IconButton>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            ))}
            
            {notifications.length === 0 && (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 4 }}>
                No notifications
              </Typography>
            )}
          </List>
        </TabPanel>

        {/* Alerts Tab */}
        <TabPanel value={tabValue} index={2}>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              color="error"
              startIcon={<EmergencyIcon />}
              onClick={() => setEmergencyDialogOpen(true)}
              disabled={!isConnected}
            >
              Staff Emergency
            </Button>
            
            <Button
              variant="contained"
              color="warning"
              startIcon={<MedicationIcon />}
              onClick={() => setMedicationDialogOpen(true)}
              disabled={!isConnected}
            >
              Medication Alert
            </Button>
          </Box>
        </TabPanel>
      </Box>

      {/* Emergency Dialog */}
      <Dialog open={emergencyDialogOpen} onClose={() => setEmergencyDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Staff Emergency Alert</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Emergency Type"
            value={emergencyForm.type}
            onChange={(e) => setEmergencyForm({ ...emergencyForm, type: e.target.value })}
            margin="normal"
            placeholder="e.g., Medical Emergency, Security Issue"
          />
          <TextField
            fullWidth
            label="Location"
            value={emergencyForm.location}
            onChange={(e) => setEmergencyForm({ ...emergencyForm, location: e.target.value })}
            margin="normal"
            placeholder="e.g., Room 101, Main Lobby"
          />
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Description"
            value={emergencyForm.description}
            onChange={(e) => setEmergencyForm({ ...emergencyForm, description: e.target.value })}
            margin="normal"
            placeholder="Additional details..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEmergencyDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleEmergencyAlert}
            variant="contained"
            color="error"
            disabled={!emergencyForm.type || !emergencyForm.location}
          >
            Send Emergency Alert
          </Button>
        </DialogActions>
      </Dialog>

      {/* Medication Alert Dialog */}
      <Dialog open={medicationDialogOpen} onClose={() => setMedicationDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Medication Alert</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Resident ID"
            value={medicationForm.residentId}
            onChange={(e) => setMedicationForm({ ...medicationForm, residentId: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Medication ID"
            value={medicationForm.medicationId}
            onChange={(e) => setMedicationForm({ ...medicationForm, medicationId: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Alert Type"
            value={medicationForm.alertType}
            onChange={(e) => setMedicationForm({ ...medicationForm, alertType: e.target.value })}
            margin="normal"
            placeholder="e.g., Missed Dose, Adverse Reaction"
          />
          <TextField
            select
            fullWidth
            label="Priority"
            value={medicationForm.priority}
            onChange={(e) => setMedicationForm({ ...medicationForm, priority: e.target.value })}
            margin="normal"
            SelectProps={{ native: true }}
          >
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
            <option value="critical">Critical</option>
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMedicationDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleMedicationAlert}
            variant="contained"
            color="warning"
            disabled={!medicationForm.residentId || !medicationForm.alertType}
          >
            Send Alert
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for confirmations */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
      />
    </Box>
  );
};

export default RealTimeMessaging;

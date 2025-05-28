import { createSlice } from '@reduxjs/toolkit';

// Initial state
const initialState = {
  notifications: [],
  sidebarOpen: true,
  darkMode: localStorage.getItem('darkMode') === 'true',
  dialogOpen: false,
  dialogContent: null,
  dialogTitle: '',
};

// UI slice
const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    // Notification actions
    addNotification: (state, action) => {
      const notification = {
        id: Date.now(),
        ...action.payload,
        read: false,
      };
      state.notifications.push(notification);
    },
    removeNotification: (state, action) => {
      state.notifications = state.notifications.filter(
        (notification) => notification.id !== action.payload
      );
    },
    markNotificationAsRead: (state, action) => {
      const notification = state.notifications.find(
        (notification) => notification.id === action.payload
      );
      if (notification) {
        notification.read = true;
      }
    },
    clearAllNotifications: (state) => {
      state.notifications = [];
    },
    
    // Sidebar actions
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action) => {
      state.sidebarOpen = action.payload;
    },
    
    // Theme actions
    toggleDarkMode: (state) => {
      state.darkMode = !state.darkMode;
      localStorage.setItem('darkMode', state.darkMode);
    },
    setDarkMode: (state, action) => {
      state.darkMode = action.payload;
      localStorage.setItem('darkMode', action.payload);
    },
    
    // Dialog actions
    openDialog: (state, action) => {
      state.dialogOpen = true;
      state.dialogContent = action.payload.content;
      state.dialogTitle = action.payload.title || '';
    },
    closeDialog: (state) => {
      state.dialogOpen = false;
      state.dialogContent = null;
      state.dialogTitle = '';
    },
  },
});

export const {
  addNotification,
  removeNotification,
  markNotificationAsRead,
  clearAllNotifications,
  toggleSidebar,
  setSidebarOpen,
  toggleDarkMode,
  setDarkMode,
  openDialog,
  closeDialog,
} = uiSlice.actions;

export default uiSlice.reducer;

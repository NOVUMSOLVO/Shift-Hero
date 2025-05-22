import { configureStore } from '@reduxjs/toolkit';
import { combineReducers } from 'redux';
import authReducer from './slices/authSlice';
import projectsReducer from './slices/projectsSlice';
import dataSourcesReducer from './slices/dataSourcesSlice';
import uiReducer from './slices/uiSlice';

// Combine all reducers
const rootReducer = combineReducers({
  auth: authReducer,
  projects: projectsReducer,
  dataSources: dataSourcesReducer,
  ui: uiReducer,
});

// Configure the Redux store
const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
  devTools: process.env.NODE_ENV !== 'production',
});

export default store;

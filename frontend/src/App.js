import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box, CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import { Provider, useSelector, useDispatch } from 'react-redux';
import store from './redux/store';

// Components
import Layout from './components/Layout';
import Notification from './components/Notification';

// Pages
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import NewProject from './pages/NewProject';
import ProjectDetails from './pages/ProjectDetails';
import Mapping from './pages/Mapping';
import Analytics from './pages/Analytics';
import Login from './pages/Login';
import Register from './pages/Register';

// Create a theme instance
const createAppTheme = (darkMode) =>
  createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
      primary: {
        main: '#1976d2',
      },
      secondary: {
        main: '#dc004e',
      },
    },
  });

// Protected route component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useSelector((state) => state.auth);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// App content component
const AppContent = () => {
  const dispatch = useDispatch();
  const { darkMode } = useSelector((state) => state.ui);
  const theme = createAppTheme(darkMode);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex' }}>
        <Notification />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="projects" element={<Projects />} />
            <Route path="projects/new" element={<NewProject />} />
            <Route path="projects/:id" element={<ProjectDetails />} />
            <Route path="projects/:id/mapping" element={<Mapping />} />
            <Route path="analytics" element={<Analytics />} />
          </Route>
        </Routes>
      </Box>
    </ThemeProvider>
  );
};

// Main App component
function App() {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
}

export default App;

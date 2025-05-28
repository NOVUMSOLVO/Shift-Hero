import React from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Button,
  Card,
  CardContent,
  CardActions,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  Assessment as AssessmentIcon,
  Sync as SyncIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const navigate = useNavigate();

  // Mock data for dashboard
  const stats = {
    totalProjects: 5,
    activeProjects: 2,
    completedProjects: 3,
    successRate: 95,
  };

  const recentProjects = [
    {
      id: 1,
      name: 'CarePlanner Migration',
      status: 'In Progress',
      progress: 65,
      lastUpdated: '2023-10-15',
    },
    {
      id: 2,
      name: 'Nourish Care Migration',
      status: 'Completed',
      progress: 100,
      lastUpdated: '2023-10-10',
    },
    {
      id: 3,
      name: 'Person Centred Migration',
      status: 'Analyzing',
      progress: 25,
      lastUpdated: '2023-10-18',
    },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1">
          Dashboard
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/projects/new')}
        >
          New Migration Project
        </Button>
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              bgcolor: 'primary.light',
              color: 'white',
            }}
          >
            <Typography variant="h6" gutterBottom>
              Total Projects
            </Typography>
            <Typography variant="h3">{stats.totalProjects}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              bgcolor: 'warning.light',
              color: 'white',
            }}
          >
            <Typography variant="h6" gutterBottom>
              Active Projects
            </Typography>
            <Typography variant="h3">{stats.activeProjects}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              bgcolor: 'success.light',
              color: 'white',
            }}
          >
            <Typography variant="h6" gutterBottom>
              Completed Projects
            </Typography>
            <Typography variant="h3">{stats.completedProjects}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              bgcolor: 'info.light',
              color: 'white',
            }}
          >
            <Typography variant="h6" gutterBottom>
              Success Rate
            </Typography>
            <Typography variant="h3">{stats.successRate}%</Typography>
          </Paper>
        </Grid>
      </Grid>

      <Typography variant="h5" sx={{ mb: 2 }}>
        Recent Projects
      </Typography>
      <Grid container spacing={3}>
        {recentProjects.map((project) => (
          <Grid item xs={12} md={4} key={project.id}>
            <Card>
              <CardContent>
                <Typography variant="h6" component="div">
                  {project.name}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  {project.status === 'In Progress' ? (
                    <SyncIcon color="warning" />
                  ) : project.status === 'Completed' ? (
                    <CheckCircleIcon color="success" />
                  ) : (
                    <AssessmentIcon color="info" />
                  )}
                  <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                    {project.status}
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Progress: {project.progress}%
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Last updated: {project.lastUpdated}
                </Typography>
              </CardContent>
              <Divider />
              <CardActions>
                <Button
                  size="small"
                  onClick={() => navigate(`/projects/${project.id}`)}
                >
                  View Details
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

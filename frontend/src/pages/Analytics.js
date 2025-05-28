import React from 'react';
import { Container, Typography, Box, Breadcrumbs, Link } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import AnalyticsDashboard from '../components/AnalyticsDashboard';

const Analytics = () => {
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Breadcrumbs aria-label="breadcrumb">
          <Link component={RouterLink} to="/" color="inherit">
            Dashboard
          </Link>
          <Typography color="textPrimary">Analytics</Typography>
        </Breadcrumbs>
      </Box>
      
      <AnalyticsDashboard />
    </Container>
  );
};

export default Analytics;

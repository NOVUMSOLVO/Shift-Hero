import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  TextField,
  InputAdornment,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Visibility as VisibilityIcon,
  PlayArrow as PlayArrowIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Sync as SyncIcon,
  Map as MapIcon,
  Transform as TransformIcon,
  VerifiedUser as VerifiedUserIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

export default function Projects() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  // Mock data for projects
  const projects = [
    {
      id: 1,
      name: 'CarePlanner Migration',
      description: 'Migration from CarePlanner to Careunity',
      sourceSystem: 'CarePlanner',
      status: 'MAPPING',
      createdAt: '2023-10-15',
      updatedAt: '2023-10-18',
    },
    {
      id: 2,
      name: 'Nourish Care Migration',
      description: 'Migration from Nourish Care to Careunity',
      sourceSystem: 'Nourish Care',
      status: 'COMPLETED',
      createdAt: '2023-10-10',
      updatedAt: '2023-10-12',
    },
    {
      id: 3,
      name: 'Person Centred Migration',
      description: 'Migration from Person Centred Software to Careunity',
      sourceSystem: 'Person Centred',
      status: 'ANALYZING',
      createdAt: '2023-10-18',
      updatedAt: '2023-10-18',
    },
    {
      id: 4,
      name: 'Access Care Migration',
      description: 'Migration from Access Care to Careunity',
      sourceSystem: 'Access Care',
      status: 'TRANSFORMING',
      createdAt: '2023-10-05',
      updatedAt: '2023-10-15',
    },
    {
      id: 5,
      name: 'Legacy System Migration',
      description: 'Migration from custom legacy system to Careunity',
      sourceSystem: 'Custom System',
      status: 'FAILED',
      createdAt: '2023-09-28',
      updatedAt: '2023-10-02',
    },
  ];

  const filteredProjects = projects.filter(
    (project) =>
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.sourceSystem.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusIcon = (status) => {
    switch (status) {
      case 'CREATED':
        return <PlayArrowIcon />;
      case 'ANALYZING':
        return <SyncIcon />;
      case 'MAPPING':
        return <MapIcon />;
      case 'TRANSFORMING':
        return <TransformIcon />;
      case 'VALIDATING':
        return <VerifiedUserIcon />;
      case 'COMPLETED':
        return <CheckCircleIcon />;
      case 'FAILED':
        return <ErrorIcon />;
      default:
        return null;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'CREATED':
        return 'default';
      case 'ANALYZING':
        return 'info';
      case 'MAPPING':
        return 'primary';
      case 'TRANSFORMING':
        return 'secondary';
      case 'VALIDATING':
        return 'warning';
      case 'COMPLETED':
        return 'success';
      case 'FAILED':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1">
          Migration Projects
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/projects/new')}
        >
          New Project
        </Button>
      </Box>

      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search projects..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }} aria-label="projects table">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Source System</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Created</TableCell>
              <TableCell>Updated</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredProjects.map((project) => (
              <TableRow key={project.id}>
                <TableCell component="th" scope="row">
                  {project.name}
                </TableCell>
                <TableCell>{project.description}</TableCell>
                <TableCell>{project.sourceSystem}</TableCell>
                <TableCell>
                  <Chip
                    icon={getStatusIcon(project.status)}
                    label={project.status}
                    color={getStatusColor(project.status)}
                    size="small"
                  />
                </TableCell>
                <TableCell>{project.createdAt}</TableCell>
                <TableCell>{project.updatedAt}</TableCell>
                <TableCell>
                  <IconButton
                    color="primary"
                    onClick={() => navigate(`/projects/${project.id}`)}
                  >
                    <VisibilityIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

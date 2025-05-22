import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  Tabs,
  Tab,
  Chip,
  LinearProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Card,
  CardContent,
  Alert,
} from '@mui/material';
import {
  PlayArrow as PlayArrowIcon,
  Sync as SyncIcon,
  Map as MapIcon,
  Transform as TransformIcon,
  VerifiedUser as VerifiedUserIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  Storage as StorageIcon,
  TableChart as TableChartIcon,
  ViewColumn as ViewColumnIcon,
  Link as LinkIcon,
} from '@mui/icons-material';

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`project-tabpanel-${index}`}
      aria-labelledby={`project-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function ProjectDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app, this would be an API call
    // For now, we'll just simulate loading project data
    setTimeout(() => {
      setProject({
        id: parseInt(id),
        name: 'CarePlanner Migration',
        description: 'Migration from CarePlanner to Careunity',
        sourceSystem: 'CarePlanner',
        status: 'MAPPING',
        progress: 65,
        createdAt: '2023-10-15',
        updatedAt: '2023-10-18',
        tasks: [
          {
            id: 1,
            type: 'ANALYSIS',
            status: 'COMPLETED',
            startedAt: '2023-10-15T10:00:00',
            completedAt: '2023-10-15T10:15:00',
          },
          {
            id: 2,
            type: 'MAPPING',
            status: 'IN_PROGRESS',
            startedAt: '2023-10-15T10:20:00',
            completedAt: null,
          },
          {
            id: 3,
            type: 'TRANSFORMATION',
            status: 'PENDING',
            startedAt: null,
            completedAt: null,
          },
          {
            id: 4,
            type: 'VALIDATION',
            status: 'PENDING',
            startedAt: null,
            completedAt: null,
          },
        ],
        logs: [
          {
            id: 1,
            level: 'INFO',
            message: 'Migration project created',
            timestamp: '2023-10-15T09:55:00',
          },
          {
            id: 2,
            level: 'INFO',
            message: 'Analysis task started',
            timestamp: '2023-10-15T10:00:00',
          },
          {
            id: 3,
            level: 'INFO',
            message: 'Analysis task completed successfully',
            timestamp: '2023-10-15T10:15:00',
          },
          {
            id: 4,
            level: 'INFO',
            message: 'Mapping task started',
            timestamp: '2023-10-15T10:20:00',
          },
          {
            id: 5,
            level: 'WARNING',
            message: 'Some fields could not be automatically mapped',
            timestamp: '2023-10-15T10:25:00',
          },
        ],
        schema: {
          entities: [
            {
              name: 'Patients',
              fields: [
                { name: 'id', type: 'INTEGER', isPrimaryKey: true },
                { name: 'first_name', type: 'STRING' },
                { name: 'last_name', type: 'STRING' },
                { name: 'date_of_birth', type: 'DATE' },
                { name: 'gender', type: 'STRING' },
                { name: 'address', type: 'STRING' },
                { name: 'phone', type: 'STRING' },
                { name: 'email', type: 'STRING' },
              ],
            },
            {
              name: 'Medications',
              fields: [
                { name: 'id', type: 'INTEGER', isPrimaryKey: true },
                { name: 'patient_id', type: 'INTEGER' },
                { name: 'name', type: 'STRING' },
                { name: 'dosage', type: 'STRING' },
                { name: 'frequency', type: 'STRING' },
                { name: 'start_date', type: 'DATE' },
                { name: 'end_date', type: 'DATE' },
              ],
            },
            {
              name: 'Appointments',
              fields: [
                { name: 'id', type: 'INTEGER', isPrimaryKey: true },
                { name: 'patient_id', type: 'INTEGER' },
                { name: 'provider_id', type: 'INTEGER' },
                { name: 'date_time', type: 'DATETIME' },
                { name: 'reason', type: 'STRING' },
                { name: 'status', type: 'STRING' },
              ],
            },
          ],
          relationships: [
            {
              source: 'Medications',
              target: 'Patients',
              type: 'MANY_TO_ONE',
              sourceField: 'patient_id',
              targetField: 'id',
            },
            {
              source: 'Appointments',
              target: 'Patients',
              type: 'MANY_TO_ONE',
              sourceField: 'patient_id',
              targetField: 'id',
            },
          ],
        },
      });
      setLoading(false);
    }, 1000);
  }, [id]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

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

  const getLogIcon = (level) => {
    switch (level) {
      case 'INFO':
        return <InfoIcon color="info" />;
      case 'WARNING':
        return <WarningIcon color="warning" />;
      case 'ERROR':
        return <ErrorIcon color="error" />;
      default:
        return <InfoIcon />;
    }
  };

  if (loading) {
    return (
      <Box sx={{ width: '100%' }}>
        <LinearProgress />
      </Box>
    );
  }

  if (!project) {
    return (
      <Alert severity="error">Project not found</Alert>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1">
          {project.name}
        </Typography>
        <Box>
          <Button
            variant="outlined"
            sx={{ mr: 1 }}
            onClick={() => navigate('/projects')}
          >
            Back to Projects
          </Button>
          {project.status === 'MAPPING' && (
            <Button
              variant="contained"
              onClick={() => navigate(`/projects/${id}/mapping`)}
            >
              Continue Mapping
            </Button>
          )}
        </Box>
      </Box>

      <Paper sx={{ mb: 4 }}>
        <Box sx={{ p: 3 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="body1">
                <strong>Description:</strong> {project.description}
              </Typography>
              <Typography variant="body1" sx={{ mt: 1 }}>
                <strong>Source System:</strong> {project.sourceSystem}
              </Typography>
              <Typography variant="body1" sx={{ mt: 1 }}>
                <strong>Created:</strong> {project.createdAt}
              </Typography>
              <Typography variant="body1" sx={{ mt: 1 }}>
                <strong>Last Updated:</strong> {project.updatedAt}
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Typography variant="body1" sx={{ mr: 1 }}>
                  <strong>Status:</strong>
                </Typography>
                <Chip
                  icon={getStatusIcon(project.status)}
                  label={project.status}
                  color={getStatusColor(project.status)}
                />
              </Box>
              <Typography variant="body1" sx={{ mb: 1 }}>
                <strong>Progress:</strong>
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box sx={{ width: '100%', mr: 1 }}>
                  <LinearProgress variant="determinate" value={project.progress} />
                </Box>
                <Box sx={{ minWidth: 35 }}>
                  <Typography variant="body2" color="text.secondary">
                    {`${Math.round(project.progress)}%`}
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Paper>

      <Paper sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="project tabs">
            <Tab label="Overview" />
            <Tab label="Schema" />
            <Tab label="Logs" />
          </Tabs>
        </Box>
        <TabPanel value={tabValue} index={0}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Migration Tasks
          </Typography>
          <List>
            {project.tasks.map((task) => (
              <ListItem key={task.id}>
                <ListItemIcon>
                  {task.status === 'COMPLETED' ? (
                    <CheckCircleIcon color="success" />
                  ) : task.status === 'IN_PROGRESS' ? (
                    <SyncIcon color="primary" />
                  ) : (
                    <PlayArrowIcon color="disabled" />
                  )}
                </ListItemIcon>
                <ListItemText
                  primary={`${task.type} Task`}
                  secondary={`Status: ${task.status} ${
                    task.startedAt ? `| Started: ${task.startedAt}` : ''
                  } ${
                    task.completedAt ? `| Completed: ${task.completedAt}` : ''
                  }`}
                />
              </ListItem>
            ))}
          </List>
        </TabPanel>
        <TabPanel value={tabValue} index={1}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Source System Schema
          </Typography>
          <Grid container spacing={3}>
            {project.schema.entities.map((entity) => (
              <Grid item xs={12} md={6} key={entity.name}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <StorageIcon sx={{ mr: 1 }} />
                      <Typography variant="h6">{entity.name}</Typography>
                    </Box>
                    <Divider sx={{ mb: 2 }} />
                    <List dense>
                      {entity.fields.map((field) => (
                        <ListItem key={field.name}>
                          <ListItemIcon>
                            {field.isPrimaryKey ? (
                              <TableChartIcon color="primary" />
                            ) : (
                              <ViewColumnIcon />
                            )}
                          </ListItemIcon>
                          <ListItemText
                            primary={field.name}
                            secondary={`Type: ${field.type} ${
                              field.isPrimaryKey ? '| Primary Key' : ''
                            }`}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
          <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>
            Relationships
          </Typography>
          <List>
            {project.schema.relationships.map((rel, index) => (
              <ListItem key={index}>
                <ListItemIcon>
                  <LinkIcon />
                </ListItemIcon>
                <ListItemText
                  primary={`${rel.source} → ${rel.target}`}
                  secondary={`Type: ${rel.type} | ${rel.source}.${rel.sourceField} → ${rel.target}.${rel.targetField}`}
                />
              </ListItem>
            ))}
          </List>
        </TabPanel>
        <TabPanel value={tabValue} index={2}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Migration Logs
          </Typography>
          <List>
            {project.logs.map((log) => (
              <ListItem key={log.id}>
                <ListItemIcon>
                  {getLogIcon(log.level)}
                </ListItemIcon>
                <ListItemText
                  primary={log.message}
                  secondary={`${log.level} | ${log.timestamp}`}
                />
              </ListItem>
            ))}
          </List>
        </TabPanel>
      </Paper>
    </Box>
  );
}

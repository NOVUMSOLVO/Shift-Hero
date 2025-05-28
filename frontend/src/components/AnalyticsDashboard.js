import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Grid,
  Typography,
  CircularProgress,
  Paper,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  MenuItem,
  Select,
  FormControl,
  InputLabel
} from '@mui/material';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { useSelector, useDispatch } from 'react-redux';
import { fetchProjects } from '../redux/slices/projectsSlice';
import { fetchDataSources } from '../redux/slices/dataSourcesSlice';

// Mock data for charts
const migrationStatusData = [
  { name: 'Completed', value: 12, color: '#4caf50' },
  { name: 'In Progress', value: 5, color: '#2196f3' },
  { name: 'Failed', value: 2, color: '#f44336' },
  { name: 'Pending', value: 3, color: '#ff9800' }
];

const migrationTimeData = [
  { name: 'Project A', time: 45 },
  { name: 'Project B', time: 32 },
  { name: 'Project C', time: 78 },
  { name: 'Project D', time: 23 },
  { name: 'Project E', time: 56 }
];

const dataVolumeData = [
  { name: 'Jan', volume: 4000 },
  { name: 'Feb', volume: 3000 },
  { name: 'Mar', volume: 2000 },
  { name: 'Apr', volume: 2780 },
  { name: 'May', volume: 1890 },
  { name: 'Jun', volume: 2390 },
  { name: 'Jul', volume: 3490 }
];

const sourceSystemData = [
  { name: 'SQL DB', value: 8, color: '#8884d8' },
  { name: 'NoSQL DB', value: 3, color: '#82ca9d' },
  { name: 'API', value: 4, color: '#ffc658' },
  { name: 'Flat File', value: 2, color: '#ff8042' },
  { name: 'Person Centred', value: 5, color: '#0088fe' }
];

const AnalyticsDashboard = () => {
  const dispatch = useDispatch();
  const [tabValue, setTabValue] = useState(0);
  const [timeRange, setTimeRange] = useState('month');
  const { projects, loading: projectsLoading } = useSelector(state => state.projects);
  const { dataSources, loading: dataSourcesLoading } = useSelector(state => state.dataSources);
  
  useEffect(() => {
    dispatch(fetchProjects());
    dispatch(fetchDataSources());
  }, [dispatch]);
  
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  const handleTimeRangeChange = (event) => {
    setTimeRange(event.target.value);
  };
  
  const loading = projectsLoading || dataSourcesLoading;
  
  // Calculate statistics
  const totalProjects = projects?.length || 0;
  const completedProjects = projects?.filter(p => p.status === 'COMPLETED')?.length || 0;
  const inProgressProjects = projects?.filter(p => ['ANALYZING', 'MAPPING', 'TRANSFORMING', 'VALIDATING'].includes(p.status))?.length || 0;
  const failedProjects = projects?.filter(p => p.status === 'FAILED')?.length || 0;
  
  const totalDataSources = dataSources?.length || 0;
  const totalEntities = dataSources?.reduce((sum, ds) => sum + (ds.entities?.length || 0), 0) || 0;
  
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Analytics Dashboard
      </Typography>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* Summary Cards */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Total Projects
                  </Typography>
                  <Typography variant="h3">{totalProjects}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Completed Projects
                  </Typography>
                  <Typography variant="h3" color="success.main">{completedProjects}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    In Progress
                  </Typography>
                  <Typography variant="h3" color="info.main">{inProgressProjects}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Failed Projects
                  </Typography>
                  <Typography variant="h3" color="error.main">{failedProjects}</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
          
          {/* Tabs and Time Range Selector */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Paper sx={{ width: '100%' }}>
              <Tabs
                value={tabValue}
                onChange={handleTabChange}
                indicatorColor="primary"
                textColor="primary"
              >
                <Tab label="Overview" />
                <Tab label="Projects" />
                <Tab label="Data Sources" />
                <Tab label="Performance" />
              </Tabs>
            </Paper>
            
            <FormControl sx={{ minWidth: 120, ml: 2 }}>
              <InputLabel>Time Range</InputLabel>
              <Select
                value={timeRange}
                onChange={handleTimeRangeChange}
                label="Time Range"
              >
                <MenuItem value="week">Week</MenuItem>
                <MenuItem value="month">Month</MenuItem>
                <MenuItem value="quarter">Quarter</MenuItem>
                <MenuItem value="year">Year</MenuItem>
              </Select>
            </FormControl>
          </Box>
          
          {/* Tab Content */}
          <Box sx={{ mt: 3 }}>
            {/* Overview Tab */}
            {tabValue === 0 && (
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardHeader title="Migration Status" />
                    <Divider />
                    <CardContent>
                      <Box sx={{ height: 300 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={migrationStatusData}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            >
                              {migrationStatusData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardHeader title="Source System Distribution" />
                    <Divider />
                    <CardContent>
                      <Box sx={{ height: 300 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={sourceSystemData}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            >
                              {sourceSystemData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12}>
                  <Card>
                    <CardHeader title="Data Volume Over Time" />
                    <Divider />
                    <CardContent>
                      <Box sx={{ height: 300 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart
                            data={dataVolumeData}
                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="volume" stroke="#8884d8" activeDot={{ r: 8 }} />
                          </LineChart>
                        </ResponsiveContainer>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            )}
            
            {/* Projects Tab */}
            {tabValue === 1 && (
              <Card>
                <CardHeader title="Project Performance" />
                <Divider />
                <CardContent>
                  <Box sx={{ height: 400 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={migrationTimeData}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis label={{ value: 'Time (minutes)', angle: -90, position: 'insideLeft' }} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="time" fill="#8884d8" />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                  
                  <Box sx={{ mt: 4 }}>
                    <Typography variant="h6" gutterBottom>
                      Recent Projects
                    </Typography>
                    <TableContainer component={Paper}>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Project Name</TableCell>
                            <TableCell>Source System</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Created</TableCell>
                            <TableCell>Actions</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {projects.slice(0, 5).map((project) => (
                            <TableRow key={project.id}>
                              <TableCell>{project.name}</TableCell>
                              <TableCell>{project.source_system_type}</TableCell>
                              <TableCell>
                                <Chip
                                  label={project.status}
                                  color={
                                    project.status === 'COMPLETED' ? 'success' :
                                    project.status === 'FAILED' ? 'error' :
                                    'primary'
                                  }
                                  size="small"
                                />
                              </TableCell>
                              <TableCell>{new Date(project.created_at).toLocaleDateString()}</TableCell>
                              <TableCell>
                                <Button size="small" variant="outlined">View</Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>
                </CardContent>
              </Card>
            )}
            
            {/* Data Sources Tab */}
            {tabValue === 2 && (
              <Card>
                <CardHeader title="Data Sources Overview" />
                <Divider />
                <CardContent>
                  <Grid container spacing={3} sx={{ mb: 4 }}>
                    <Grid item xs={12} sm={6}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography color="textSecondary" gutterBottom>
                            Total Data Sources
                          </Typography>
                          <Typography variant="h3">{totalDataSources}</Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography color="textSecondary" gutterBottom>
                            Total Entities
                          </Typography>
                          <Typography variant="h3">{totalEntities}</Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>
                  
                  <Box sx={{ mt: 4 }}>
                    <Typography variant="h6" gutterBottom>
                      Data Sources
                    </Typography>
                    <TableContainer component={Paper}>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Name</TableCell>
                            <TableCell>Type</TableCell>
                            <TableCell>Entities</TableCell>
                            <TableCell>Fields</TableCell>
                            <TableCell>Actions</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {dataSources.map((source) => (
                            <TableRow key={source.id}>
                              <TableCell>{source.name}</TableCell>
                              <TableCell>{source.system_type}</TableCell>
                              <TableCell>{source.entities?.length || 0}</TableCell>
                              <TableCell>{source.fields_count || 'N/A'}</TableCell>
                              <TableCell>
                                <Button size="small" variant="outlined">View</Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>
                </CardContent>
              </Card>
            )}
            
            {/* Performance Tab */}
            {tabValue === 3 && (
              <Card>
                <CardHeader title="System Performance" />
                <Divider />
                <CardContent>
                  <Typography variant="body1" paragraph>
                    Performance metrics for the MigrateIQ system.
                  </Typography>
                  
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="h6" gutterBottom>
                            Average Migration Time
                          </Typography>
                          <Typography variant="h3">42.5 min</Typography>
                          <Typography variant="body2" color="textSecondary">
                            5% faster than last month
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="h6" gutterBottom>
                            Success Rate
                          </Typography>
                          <Typography variant="h3">94.2%</Typography>
                          <Typography variant="body2" color="textSecondary">
                            2.1% improvement
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            )}
          </Box>
        </>
      )}
    </Box>
  );
};

export default AnalyticsDashboard;

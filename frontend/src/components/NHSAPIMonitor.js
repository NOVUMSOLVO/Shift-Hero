import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  Typography, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper, 
  Chip, 
  Box, 
  Grid, 
  LinearProgress, 
  Alert, 
  Button, 
  TextField, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem,
  Tooltip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  CheckCircle as SuccessIcon,
  Timeline as TimelineIcon,
  Speed as SpeedIcon,
  Security as SecurityIcon,
  Visibility as ViewIcon
} from '@mui/icons-material';
import { nhsApiService } from '../services/nhsApiService';

const NHSAPIMonitor = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statistics, setStatistics] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [rateLimitStatus, setRateLimitStatus] = useState(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState('24h');
  const [selectedEndpoint, setSelectedEndpoint] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [detailDialog, setDetailDialog] = useState({ open: false, log: null });
  const [autoRefresh, setAutoRefresh] = useState(false);

  // Mock API monitoring service - in real implementation this would call backend
  const mockApiService = {
    async getStatistics(timeframe) {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return {
        totalRequests: Math.floor(Math.random() * 10000) + 1000,
        successfulRequests: Math.floor(Math.random() * 9000) + 800,
        failedRequests: Math.floor(Math.random() * 1000) + 50,
        averageResponseTime: Math.floor(Math.random() * 500) + 100,
        rateLimitHits: Math.floor(Math.random() * 50),
        uptime: 99.8,
        endpoints: {
          'patient-lookup': { requests: 3245, successRate: 98.2, avgTime: 234 },
          'exemption-check': { requests: 2156, successRate: 99.1, avgTime: 187 },
          'eligibility-verify': { requests: 1834, successRate: 97.8, avgTime: 298 },
          'prescription-list': { requests: 4521, successRate: 96.9, avgTime: 456 }
        },
        tenants: {
          'facility-001': { requests: 4234, quota: 10000, usage: 42.3 },
          'facility-002': { requests: 3456, quota: 8000, usage: 43.2 },
          'facility-003': { requests: 2134, quota: 5000, usage: 42.7 }
        }
      };
    },

    async getAuditLogs(filters) {
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const statuses = ['success', 'error', 'warning'];
      const endpoints = ['patient-lookup', 'exemption-check', 'eligibility-verify', 'prescription-list'];
      const facilities = ['facility-001', 'facility-002', 'facility-003'];
      
      return Array.from({ length: 50 }, (_, i) => ({
        id: `log-${i + 1}`,
        timestamp: new Date(Date.now() - Math.random() * 86400000).toISOString(),
        endpoint: endpoints[Math.floor(Math.random() * endpoints.length)],
        method: 'POST',
        status: statuses[Math.floor(Math.random() * statuses.length)],
        statusCode: Math.random() > 0.1 ? 200 : (Math.random() > 0.5 ? 400 : 500),
        responseTime: Math.floor(Math.random() * 1000) + 50,
        facilityId: facilities[Math.floor(Math.random() * facilities.length)],
        userId: `user-${Math.floor(Math.random() * 100) + 1}`,
        requestSize: Math.floor(Math.random() * 5000) + 100,
        responseSize: Math.floor(Math.random() * 10000) + 500,
        userAgent: 'NHS-Care-App/1.0',
        ipAddress: `192.168.1.${Math.floor(Math.random() * 254) + 1}`,
        errorMessage: Math.random() > 0.8 ? 'Rate limit exceeded' : null,
        requestId: `req-${Math.random().toString(36).substr(2, 9)}`
      })).filter(log => {
        if (filters.endpoint !== 'all' && log.endpoint !== filters.endpoint) return false;
        if (filters.status !== 'all' && log.status !== filters.status) return false;
        return true;
      });
    },

    async getRateLimitStatus() {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return {
        global: {
          limit: 10000,
          remaining: 8756,
          resetTime: new Date(Date.now() + 3600000).toISOString(),
          percentage: 87.56
        },
        perTenant: {
          'facility-001': { limit: 1000, remaining: 756, percentage: 75.6 },
          'facility-002': { limit: 800, remaining: 234, percentage: 29.25 },
          'facility-003': { limit: 500, remaining: 445, percentage: 89.0 }
        }
      };
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [stats, logs, rateLimit] = await Promise.all([
        mockApiService.getStatistics(selectedTimeframe),
        mockApiService.getAuditLogs({ 
          endpoint: selectedEndpoint, 
          status: selectedStatus 
        }),
        mockApiService.getRateLimitStatus()
      ]);

      setStatistics(stats);
      setAuditLogs(logs);
      setRateLimitStatus(rateLimit);
    } catch (err) {
      setError('Failed to load monitoring data: ' + err.message);
      console.error('Monitoring data load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedTimeframe, selectedEndpoint, selectedStatus]);

  useEffect(() => {
    let interval;
    if (autoRefresh) {
      interval = setInterval(loadData, 30000); // Refresh every 30 seconds
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, selectedTimeframe, selectedEndpoint, selectedStatus]);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success': return <SuccessIcon color="success" />;
      case 'warning': return <WarningIcon color="warning" />;
      case 'error': return <ErrorIcon color="error" />;
      default: return <InfoIcon color="info" />;
    }
  };

  const getStatusColor = (statusCode) => {
    if (statusCode >= 200 && statusCode < 300) return 'success';
    if (statusCode >= 400 && statusCode < 500) return 'warning';
    if (statusCode >= 500) return 'error';
    return 'default';
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const exportLogs = () => {
    const csvContent = [
      'Timestamp,Endpoint,Status,Status Code,Response Time,Facility,User,Request Size,Response Size,IP Address,Error Message',
      ...auditLogs.map(log => 
        `${log.timestamp},${log.endpoint},${log.status},${log.statusCode},${log.responseTime}ms,${log.facilityId},${log.userId},${formatBytes(log.requestSize)},${formatBytes(log.responseSize)},${log.ipAddress},"${log.errorMessage || ''}"`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = `nhs-api-logs-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          NHS API Monitor
        </Typography>
        <LinearProgress />
        <Typography variant="body2" sx={{ mt: 2 }}>
          Loading monitoring data...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          NHS API Monitor
        </Typography>
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
        <Button 
          onClick={loadData} 
          startIcon={<RefreshIcon />}
          sx={{ mt: 2 }}
        >
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          NHS API Monitor
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            onClick={() => setAutoRefresh(!autoRefresh)}
            variant={autoRefresh ? 'contained' : 'outlined'}
            size="small"
          >
            {autoRefresh ? 'Auto Refresh ON' : 'Auto Refresh OFF'}
          </Button>
          <Button
            onClick={loadData}
            startIcon={<RefreshIcon />}
            variant="outlined"
            size="small"
          >
            Refresh
          </Button>
          <Button
            onClick={exportLogs}
            startIcon={<DownloadIcon />}
            variant="outlined"
            size="small"
          >
            Export Logs
          </Button>
        </Box>
      </Box>

      {/* Statistics Overview */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TimelineIcon color="primary" />
                <Typography variant="h6">Total Requests</Typography>
              </Box>
              <Typography variant="h4" color="primary">
                {statistics?.totalRequests?.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Last {selectedTimeframe}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <SuccessIcon color="success" />
                <Typography variant="h6">Success Rate</Typography>
              </Box>
              <Typography variant="h4" color="success.main">
                {((statistics?.successfulRequests / statistics?.totalRequests) * 100).toFixed(1)}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {statistics?.successfulRequests?.toLocaleString()} successful
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <SpeedIcon color="info" />
                <Typography variant="h6">Avg Response</Typography>
              </Box>
              <Typography variant="h4" color="info.main">
                {statistics?.averageResponseTime}ms
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Response time
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <SecurityIcon color="warning" />
                <Typography variant="h6">Rate Limits</Typography>
              </Box>
              <Typography variant="h4" color="warning.main">
                {statistics?.rateLimitHits}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Hits today
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Rate Limit Status */}
      <Card sx={{ mb: 3 }}>
        <CardHeader 
          title="Rate Limit Status"
          avatar={<SecurityIcon />}
        />
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom>
                Global Rate Limit
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ flexGrow: 1 }}>
                  <LinearProgress 
                    variant="determinate" 
                    value={rateLimitStatus?.global?.percentage} 
                    color={rateLimitStatus?.global?.percentage > 80 ? 'error' : 'primary'}
                  />
                </Box>
                <Typography variant="body2">
                  {rateLimitStatus?.global?.remaining?.toLocaleString()} / {rateLimitStatus?.global?.limit?.toLocaleString()}
                </Typography>
              </Box>
              <Typography variant="caption" color="text.secondary">
                Resets: {new Date(rateLimitStatus?.global?.resetTime).toLocaleTimeString()}
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom>
                Per-Tenant Limits
              </Typography>
              {Object.entries(rateLimitStatus?.perTenant || {}).map(([tenantId, limit]) => (
                <Box key={tenantId} sx={{ mb: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2">{tenantId}</Typography>
                    <Typography variant="body2">
                      {limit.remaining} / {limit.limit}
                    </Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={limit.percentage} 
                    size="small"
                    color={limit.percentage > 80 ? 'error' : 'primary'}
                  />
                </Box>
              ))}
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Endpoint Performance */}
      <Card sx={{ mb: 3 }}>
        <CardHeader title="Endpoint Performance" />
        <CardContent>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Endpoint</TableCell>
                  <TableCell align="right">Requests</TableCell>
                  <TableCell align="right">Success Rate</TableCell>
                  <TableCell align="right">Avg Response Time</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Object.entries(statistics?.endpoints || {}).map(([endpoint, stats]) => (
                  <TableRow key={endpoint}>
                    <TableCell>{endpoint}</TableCell>
                    <TableCell align="right">{stats.requests?.toLocaleString()}</TableCell>
                    <TableCell align="right">
                      <Chip 
                        label={`${stats.successRate}%`}
                        color={stats.successRate >= 95 ? 'success' : stats.successRate >= 90 ? 'warning' : 'error'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">{stats.avgTime}ms</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardHeader title="Audit Log Filters" />
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Timeframe</InputLabel>
                <Select
                  value={selectedTimeframe}
                  onChange={(e) => setSelectedTimeframe(e.target.value)}
                  label="Timeframe"
                >
                  <MenuItem value="1h">Last Hour</MenuItem>
                  <MenuItem value="24h">Last 24 Hours</MenuItem>
                  <MenuItem value="7d">Last 7 Days</MenuItem>
                  <MenuItem value="30d">Last 30 Days</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Endpoint</InputLabel>
                <Select
                  value={selectedEndpoint}
                  onChange={(e) => setSelectedEndpoint(e.target.value)}
                  label="Endpoint"
                >
                  <MenuItem value="all">All Endpoints</MenuItem>
                  <MenuItem value="patient-lookup">Patient Lookup</MenuItem>
                  <MenuItem value="exemption-check">Exemption Check</MenuItem>
                  <MenuItem value="eligibility-verify">Eligibility Verify</MenuItem>
                  <MenuItem value="prescription-list">Prescription List</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  label="Status"
                >
                  <MenuItem value="all">All Statuses</MenuItem>
                  <MenuItem value="success">Success</MenuItem>
                  <MenuItem value="warning">Warning</MenuItem>
                  <MenuItem value="error">Error</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Audit Logs */}
      <Card>
        <CardHeader 
          title={`Audit Logs (${auditLogs.length} entries)`}
          action={
            <Typography variant="body2" color="text.secondary">
              Showing recent activity
            </Typography>
          }
        />
        <CardContent>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Time</TableCell>
                  <TableCell>Endpoint</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Response Time</TableCell>
                  <TableCell>Facility</TableCell>
                  <TableCell>User</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {auditLogs.slice(0, 20).map((log) => (
                  <TableRow key={log.id} hover>
                    <TableCell>
                      <Typography variant="body2">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(log.timestamp).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {log.endpoint}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {log.method}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {getStatusIcon(log.status)}
                        <Chip 
                          label={log.statusCode}
                          color={getStatusColor(log.statusCode)}
                          size="small"
                        />
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Typography 
                        variant="body2"
                        color={log.responseTime > 1000 ? 'error' : log.responseTime > 500 ? 'warning' : 'inherit'}
                      >
                        {log.responseTime}ms
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {log.facilityId}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {log.userId}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Tooltip title="View Details">
                        <IconButton 
                          size="small"
                          onClick={() => setDetailDialog({ open: true, log })}
                        >
                          <ViewIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          
          {auditLogs.length > 20 && (
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Showing 20 of {auditLogs.length} entries. Use filters to refine results.
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog 
        open={detailDialog.open} 
        onClose={() => setDetailDialog({ open: false, log: null })}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Request Details - {detailDialog.log?.requestId}
        </DialogTitle>
        <DialogContent>
          {detailDialog.log && (
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" gutterBottom>Basic Information</Typography>
                <Typography variant="body2"><strong>Timestamp:</strong> {new Date(detailDialog.log.timestamp).toLocaleString()}</Typography>
                <Typography variant="body2"><strong>Endpoint:</strong> {detailDialog.log.endpoint}</Typography>
                <Typography variant="body2"><strong>Method:</strong> {detailDialog.log.method}</Typography>
                <Typography variant="body2"><strong>Status Code:</strong> {detailDialog.log.statusCode}</Typography>
                <Typography variant="body2"><strong>Response Time:</strong> {detailDialog.log.responseTime}ms</Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" gutterBottom>Request Context</Typography>
                <Typography variant="body2"><strong>Facility:</strong> {detailDialog.log.facilityId}</Typography>
                <Typography variant="body2"><strong>User:</strong> {detailDialog.log.userId}</Typography>
                <Typography variant="body2"><strong>IP Address:</strong> {detailDialog.log.ipAddress}</Typography>
                <Typography variant="body2"><strong>User Agent:</strong> {detailDialog.log.userAgent}</Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" gutterBottom>Request Size</Typography>
                <Typography variant="body2">{formatBytes(detailDialog.log.requestSize)}</Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" gutterBottom>Response Size</Typography>
                <Typography variant="body2">{formatBytes(detailDialog.log.responseSize)}</Typography>
              </Grid>
              
              {detailDialog.log.errorMessage && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>Error Message</Typography>
                  <Alert severity="error">
                    {detailDialog.log.errorMessage}
                  </Alert>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailDialog({ open: false, log: null })}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default NHSAPIMonitor;

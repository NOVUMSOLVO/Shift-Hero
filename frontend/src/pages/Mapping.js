import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Card,
  CardContent,
  CardHeader,
  CardActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Chip,
  Alert,
  LinearProgress,
  Tooltip,
} from '@mui/material';
import {
  Storage as StorageIcon,
  ViewColumn as ViewColumnIcon,
  Link as LinkIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Help as HelpIcon,
  ArrowForward as ArrowForwardIcon,
  Save as SaveIcon,
  Refresh as RefreshIcon,
  AutoFixHigh as AutoFixHighIcon,
} from '@mui/icons-material';

export default function Mapping() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState(null);
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [mappings, setMappings] = useState({});
  const [autoMappingInProgress, setAutoMappingInProgress] = useState(false);

  useEffect(() => {
    // In a real app, this would be an API call
    // For now, we'll just simulate loading project data
    setTimeout(() => {
      const mockProject = {
        id: parseInt(id),
        name: 'CarePlanner Migration',
        sourceSystem: 'CarePlanner',
        status: 'MAPPING',
        sourceSchema: {
          entities: [
            {
              id: 1,
              name: 'Patients',
              fields: [
                { id: 1, name: 'id', type: 'INTEGER', isPrimaryKey: true },
                { id: 2, name: 'first_name', type: 'STRING' },
                { id: 3, name: 'last_name', type: 'STRING' },
                { id: 4, name: 'date_of_birth', type: 'DATE' },
                { id: 5, name: 'gender', type: 'STRING' },
                { id: 6, name: 'address', type: 'STRING' },
                { id: 7, name: 'phone', type: 'STRING' },
                { id: 8, name: 'email', type: 'STRING' },
              ],
            },
            {
              id: 2,
              name: 'Medications',
              fields: [
                { id: 9, name: 'id', type: 'INTEGER', isPrimaryKey: true },
                { id: 10, name: 'patient_id', type: 'INTEGER' },
                { id: 11, name: 'name', type: 'STRING' },
                { id: 12, name: 'dosage', type: 'STRING' },
                { id: 13, name: 'frequency', type: 'STRING' },
                { id: 14, name: 'start_date', type: 'DATE' },
                { id: 15, name: 'end_date', type: 'DATE' },
              ],
            },
            {
              id: 3,
              name: 'Appointments',
              fields: [
                { id: 16, name: 'id', type: 'INTEGER', isPrimaryKey: true },
                { id: 17, name: 'patient_id', type: 'INTEGER' },
                { id: 18, name: 'provider_id', type: 'INTEGER' },
                { id: 19, name: 'date_time', type: 'DATETIME' },
                { id: 20, name: 'reason', type: 'STRING' },
                { id: 21, name: 'status', type: 'STRING' },
              ],
            },
          ],
        },
        targetSchema: {
          entities: [
            {
              id: 101,
              name: 'Clients',
              fields: [
                { id: 101, name: 'client_id', type: 'INTEGER', isPrimaryKey: true },
                { id: 102, name: 'first_name', type: 'STRING' },
                { id: 103, name: 'last_name', type: 'STRING' },
                { id: 104, name: 'birth_date', type: 'DATE' },
                { id: 105, name: 'gender', type: 'STRING' },
                { id: 106, name: 'street_address', type: 'STRING' },
                { id: 107, name: 'city', type: 'STRING' },
                { id: 108, name: 'state', type: 'STRING' },
                { id: 109, name: 'zip_code', type: 'STRING' },
                { id: 110, name: 'phone_number', type: 'STRING' },
                { id: 111, name: 'email_address', type: 'STRING' },
              ],
            },
            {
              id: 102,
              name: 'Prescriptions',
              fields: [
                { id: 112, name: 'prescription_id', type: 'INTEGER', isPrimaryKey: true },
                { id: 113, name: 'client_id', type: 'INTEGER' },
                { id: 114, name: 'medication_name', type: 'STRING' },
                { id: 115, name: 'dosage_amount', type: 'STRING' },
                { id: 116, name: 'dosage_frequency', type: 'STRING' },
                { id: 117, name: 'start_date', type: 'DATE' },
                { id: 118, name: 'end_date', type: 'DATE' },
                { id: 119, name: 'notes', type: 'STRING' },
              ],
            },
            {
              id: 103,
              name: 'Visits',
              fields: [
                { id: 120, name: 'visit_id', type: 'INTEGER', isPrimaryKey: true },
                { id: 121, name: 'client_id', type: 'INTEGER' },
                { id: 122, name: 'caregiver_id', type: 'INTEGER' },
                { id: 123, name: 'visit_datetime', type: 'DATETIME' },
                { id: 124, name: 'visit_purpose', type: 'STRING' },
                { id: 125, name: 'visit_status', type: 'STRING' },
                { id: 126, name: 'notes', type: 'STRING' },
              ],
            },
          ],
        },
      };

      // Initialize mappings with AI-suggested mappings
      const initialMappings = {};
      mockProject.sourceSchema.entities.forEach((sourceEntity) => {
        const targetEntity = mockProject.targetSchema.entities.find(
          (e) => e.name.toLowerCase() === sourceEntity.name.toLowerCase() ||
                (sourceEntity.name === 'Patients' && e.name === 'Clients') ||
                (sourceEntity.name === 'Medications' && e.name === 'Prescriptions') ||
                (sourceEntity.name === 'Appointments' && e.name === 'Visits')
        );

        if (targetEntity) {
          initialMappings[sourceEntity.id] = {
            targetEntityId: targetEntity.id,
            fields: {},
            confidence: 0.85,
          };

          sourceEntity.fields.forEach((sourceField) => {
            let targetField = null;
            let confidence = 0;

            // Simple field mapping logic
            if (sourceField.name === targetField?.name) {
              confidence = 0.95;
            } else if (sourceField.name === 'id' && targetField?.name.endsWith('_id')) {
              confidence = 0.9;
            } else if (sourceField.name === 'first_name' && targetField?.name === 'first_name') {
              confidence = 0.95;
            } else if (sourceField.name === 'last_name' && targetField?.name === 'last_name') {
              confidence = 0.95;
            } else if (sourceField.name === 'date_of_birth' && targetField?.name === 'birth_date') {
              confidence = 0.85;
            } else if (sourceField.name === 'phone' && targetField?.name === 'phone_number') {
              confidence = 0.85;
            } else if (sourceField.name === 'email' && targetField?.name === 'email_address') {
              confidence = 0.85;
            } else if (sourceField.name === 'address' && targetField?.name === 'street_address') {
              confidence = 0.75;
            } else if (sourceField.name === 'name' && targetField?.name === 'medication_name') {
              confidence = 0.8;
            } else if (sourceField.name === 'dosage' && targetField?.name === 'dosage_amount') {
              confidence = 0.8;
            } else if (sourceField.name === 'frequency' && targetField?.name === 'dosage_frequency') {
              confidence = 0.8;
            } else if (sourceField.name === 'date_time' && targetField?.name === 'visit_datetime') {
              confidence = 0.85;
            } else if (sourceField.name === 'reason' && targetField?.name === 'visit_purpose') {
              confidence = 0.8;
            } else if (sourceField.name === 'status' && targetField?.name === 'visit_status') {
              confidence = 0.85;
            }

            // Find target field based on name similarity
            targetField = targetEntity.fields.find((f) => {
              if (sourceField.name === f.name) return true;
              if (sourceField.name === 'id' && f.name === `${targetEntity.name.toLowerCase().slice(0, -1)}_id`) return true;
              if (sourceField.name === 'patient_id' && f.name === 'client_id') return true;
              if (sourceField.name === 'provider_id' && f.name === 'caregiver_id') return true;
              if (sourceField.name === 'date_of_birth' && f.name === 'birth_date') return true;
              if (sourceField.name === 'phone' && f.name === 'phone_number') return true;
              if (sourceField.name === 'email' && f.name === 'email_address') return true;
              if (sourceField.name === 'address' && f.name === 'street_address') return true;
              if (sourceField.name === 'name' && f.name === 'medication_name') return true;
              if (sourceField.name === 'dosage' && f.name === 'dosage_amount') return true;
              if (sourceField.name === 'frequency' && f.name === 'dosage_frequency') return true;
              if (sourceField.name === 'date_time' && f.name === 'visit_datetime') return true;
              if (sourceField.name === 'reason' && f.name === 'visit_purpose') return true;
              if (sourceField.name === 'status' && f.name === 'visit_status') return true;
              return false;
            });

            if (targetField) {
              initialMappings[sourceEntity.id].fields[sourceField.id] = {
                targetFieldId: targetField.id,
                confidence,
                transformations: [],
              };
            }
          });
        }
      });

      setProject(mockProject);
      setMappings(initialMappings);
      setSelectedEntity(mockProject.sourceSchema.entities[0]);
      setLoading(false);
    }, 1000);
  }, [id]);

  const handleEntitySelect = (entity) => {
    setSelectedEntity(entity);
  };

  const handleTargetEntityChange = (sourceEntityId, targetEntityId) => {
    setMappings((prevMappings) => ({
      ...prevMappings,
      [sourceEntityId]: {
        ...prevMappings[sourceEntityId],
        targetEntityId,
        fields: {}, // Clear field mappings when entity changes
      },
    }));
  };

  const handleFieldMappingChange = (sourceEntityId, sourceFieldId, targetFieldId) => {
    setMappings((prevMappings) => ({
      ...prevMappings,
      [sourceEntityId]: {
        ...prevMappings[sourceEntityId],
        fields: {
          ...prevMappings[sourceEntityId]?.fields,
          [sourceFieldId]: {
            ...prevMappings[sourceEntityId]?.fields[sourceFieldId],
            targetFieldId,
            confidence: 1.0, // User-selected mapping has 100% confidence
          },
        },
      },
    }));
  };

  const handleAutoMapping = () => {
    setAutoMappingInProgress(true);
    
    // Simulate AI-powered auto-mapping
    setTimeout(() => {
      // In a real app, this would call the AI mapping service
      // For now, we'll just use our initial mappings
      setAutoMappingInProgress(false);
    }, 2000);
  };

  const handleSaveMappings = () => {
    // In a real app, this would save the mappings to the backend
    // For now, we'll just navigate back to the project details
    navigate(`/projects/${id}`);
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.9) return 'success';
    if (confidence >= 0.7) return 'info';
    if (confidence >= 0.5) return 'warning';
    return 'error';
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
          Field Mapping - {project.name}
        </Typography>
        <Box>
          <Button
            variant="outlined"
            sx={{ mr: 1 }}
            onClick={() => navigate(`/projects/${id}`)}
          >
            Back to Project
          </Button>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSaveMappings}
          >
            Save Mappings
          </Button>
        </Box>
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        Map fields from your source system to the target Careunity system. The AI has suggested mappings based on field names and data types.
      </Alert>

      <Grid container spacing={3}>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Source Entities
            </Typography>
            <List>
              {project.sourceSchema.entities.map((entity) => (
                <ListItem
                  button
                  key={entity.id}
                  selected={selectedEntity?.id === entity.id}
                  onClick={() => handleEntitySelect(entity)}
                >
                  <ListItemIcon>
                    <StorageIcon />
                  </ListItemIcon>
                  <ListItemText primary={entity.name} />
                </ListItem>
              ))}
            </List>
            <Divider sx={{ my: 2 }} />
            <Button
              fullWidth
              variant="contained"
              color="secondary"
              startIcon={<AutoFixHighIcon />}
              onClick={handleAutoMapping}
              disabled={autoMappingInProgress}
            >
              {autoMappingInProgress ? 'Mapping...' : 'Auto-Map All'}
            </Button>
            {autoMappingInProgress && (
              <LinearProgress sx={{ mt: 1 }} />
            )}
          </Paper>
        </Grid>
        <Grid item xs={12} md={9}>
          {selectedEntity && (
            <Paper sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6">
                  Mapping for: {selectedEntity.name}
                </Typography>
                <FormControl sx={{ minWidth: 200 }}>
                  <InputLabel>Target Entity</InputLabel>
                  <Select
                    value={mappings[selectedEntity.id]?.targetEntityId || ''}
                    onChange={(e) => handleTargetEntityChange(selectedEntity.id, e.target.value)}
                    label="Target Entity"
                  >
                    {project.targetSchema.entities.map((entity) => (
                      <MenuItem key={entity.id} value={entity.id}>
                        {entity.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              {mappings[selectedEntity.id]?.targetEntityId ? (
                <Grid container spacing={2}>
                  {selectedEntity.fields.map((sourceField) => {
                    const mapping = mappings[selectedEntity.id]?.fields[sourceField.id];
                    const targetEntity = project.targetSchema.entities.find(
                      (e) => e.id === mappings[selectedEntity.id]?.targetEntityId
                    );
                    
                    return (
                      <Grid item xs={12} key={sourceField.id}>
                        <Card variant="outlined">
                          <CardContent sx={{ pb: 1 }}>
                            <Grid container spacing={2} alignItems="center">
                              <Grid item xs={5}>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  <ViewColumnIcon sx={{ mr: 1 }} />
                                  <Typography variant="body1">
                                    <strong>{sourceField.name}</strong>
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                                    ({sourceField.type})
                                  </Typography>
                                  {sourceField.isPrimaryKey && (
                                    <Chip size="small" label="PK" color="primary" sx={{ ml: 1 }} />
                                  )}
                                </Box>
                              </Grid>
                              <Grid item xs={2} sx={{ textAlign: 'center' }}>
                                <ArrowForwardIcon color="action" />
                              </Grid>
                              <Grid item xs={5}>
                                <FormControl fullWidth size="small">
                                  <InputLabel>Target Field</InputLabel>
                                  <Select
                                    value={mapping?.targetFieldId || ''}
                                    onChange={(e) => handleFieldMappingChange(
                                      selectedEntity.id,
                                      sourceField.id,
                                      e.target.value
                                    )}
                                    label="Target Field"
                                    endAdornment={
                                      mapping?.confidence && mapping.confidence < 1 ? (
                                        <Tooltip title={`AI confidence: ${Math.round(mapping.confidence * 100)}%`}>
                                          <Chip
                                            size="small"
                                            label={`${Math.round(mapping.confidence * 100)}%`}
                                            color={getConfidenceColor(mapping.confidence)}
                                            sx={{ mr: 2 }}
                                          />
                                        </Tooltip>
                                      ) : null
                                    }
                                  >
                                    <MenuItem value="">
                                      <em>Not Mapped</em>
                                    </MenuItem>
                                    {targetEntity?.fields.map((field) => (
                                      <MenuItem key={field.id} value={field.id}>
                                        {field.name} ({field.type})
                                      </MenuItem>
                                    ))}
                                  </Select>
                                </FormControl>
                              </Grid>
                            </Grid>
                          </CardContent>
                        </Card>
                      </Grid>
                    );
                  })}
                </Grid>
              ) : (
                <Alert severity="warning">
                  Please select a target entity to map fields.
                </Alert>
              )}
            </Paper>
          )}
        </Grid>
      </Grid>
    </Box>
  );
}

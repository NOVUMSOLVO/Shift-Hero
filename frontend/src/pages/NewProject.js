import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Stepper,
  Step,
  StepLabel,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Grid,
  Alert,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';

// Step validation schemas
const projectDetailsSchema = Yup.object().shape({
  name: Yup.string().required('Project name is required'),
  description: Yup.string(),
});

const sourceSystemSchema = Yup.object().shape({
  sourceSystemType: Yup.string().required('Source system type is required'),
  host: Yup.string().when('sourceSystemType', {
    is: (type) => ['SQL_DB', 'NOSQL_DB'].includes(type),
    then: () => Yup.string().required('Host is required'),
  }),
  port: Yup.string().when('sourceSystemType', {
    is: (type) => ['SQL_DB', 'NOSQL_DB'].includes(type),
    then: () => Yup.string().required('Port is required'),
  }),
  database: Yup.string().when('sourceSystemType', {
    is: (type) => ['SQL_DB', 'NOSQL_DB'].includes(type),
    then: () => Yup.string().required('Database name is required'),
  }),
  username: Yup.string().when('sourceSystemType', {
    is: (type) => ['SQL_DB', 'NOSQL_DB'].includes(type),
    then: () => Yup.string().required('Username is required'),
  }),
  password: Yup.string().when('sourceSystemType', {
    is: (type) => ['SQL_DB', 'NOSQL_DB'].includes(type),
    then: () => Yup.string().required('Password is required'),
  }),
  apiUrl: Yup.string().when('sourceSystemType', {
    is: 'API',
    then: () => Yup.string().required('API URL is required'),
  }),
  apiKey: Yup.string().when('sourceSystemType', {
    is: 'API',
    then: () => Yup.string().required('API key is required'),
  }),
  filePath: Yup.string().when('sourceSystemType', {
    is: 'FLAT_FILE',
    then: () => Yup.string().required('File path is required'),
  }),
});

const targetSystemSchema = Yup.object().shape({
  targetHost: Yup.string().required('Target host is required'),
  targetPort: Yup.string().required('Target port is required'),
  targetDatabase: Yup.string().required('Target database name is required'),
  targetUsername: Yup.string().required('Target username is required'),
  targetPassword: Yup.string().required('Target password is required'),
});

export default function NewProject() {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    sourceSystemType: '',
    host: '',
    port: '',
    database: '',
    username: '',
    password: '',
    apiUrl: '',
    apiKey: '',
    filePath: '',
    targetHost: '',
    targetPort: '',
    targetDatabase: '',
    targetUsername: '',
    targetPassword: '',
  });

  const steps = ['Project Details', 'Source System', 'Target System', 'Review'];

  const getStepSchema = (step) => {
    switch (step) {
      case 0:
        return projectDetailsSchema;
      case 1:
        return sourceSystemSchema;
      case 2:
        return targetSystemSchema;
      default:
        return Yup.object();
    }
  };

  const handleNext = (values) => {
    setFormData({ ...formData, ...values });
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleSubmit = () => {
    // In a real app, this would be an API call to create the project
    // For now, we'll just navigate to the projects page
    navigate('/projects');
  };

  const getStepContent = (step) => {
    const currentSchema = getStepSchema(step);
    const initialValues = { ...formData };

    switch (step) {
      case 0:
        return (
          <Formik
            initialValues={initialValues}
            validationSchema={currentSchema}
            onSubmit={handleNext}
          >
            {({ errors, touched }) => (
              <Form>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <Field
                      as={TextField}
                      fullWidth
                      label="Project Name"
                      name="name"
                      variant="outlined"
                      error={touched.name && Boolean(errors.name)}
                      helperText={touched.name && errors.name}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Field
                      as={TextField}
                      fullWidth
                      label="Description"
                      name="description"
                      variant="outlined"
                      multiline
                      rows={4}
                    />
                  </Grid>
                </Grid>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                  <Button
                    variant="contained"
                    type="submit"
                  >
                    Next
                  </Button>
                </Box>
              </Form>
            )}
          </Formik>
        );
      case 1:
        return (
          <Formik
            initialValues={initialValues}
            validationSchema={currentSchema}
            onSubmit={handleNext}
          >
            {({ values, errors, touched, setFieldValue }) => (
              <Form>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <FormControl fullWidth error={touched.sourceSystemType && Boolean(errors.sourceSystemType)}>
                      <InputLabel>Source System Type</InputLabel>
                      <Field
                        as={Select}
                        name="sourceSystemType"
                        label="Source System Type"
                        onChange={(e) => {
                          setFieldValue('sourceSystemType', e.target.value);
                        }}
                      >
                        <MenuItem value="SQL_DB">SQL Database</MenuItem>
                        <MenuItem value="NOSQL_DB">NoSQL Database</MenuItem>
                        <MenuItem value="API">API</MenuItem>
                        <MenuItem value="FLAT_FILE">Flat File</MenuItem>
                        <MenuItem value="PERSON_CENTRED">Person Centred Software</MenuItem>
                        <MenuItem value="CARE_PLANNER">CarePlanner</MenuItem>
                        <MenuItem value="ACCESS_CARE">Access Care</MenuItem>
                        <MenuItem value="NOURISH_CARE">Nourish Care</MenuItem>
                        <MenuItem value="CUSTOM">Custom System</MenuItem>
                      </Field>
                      {touched.sourceSystemType && errors.sourceSystemType && (
                        <FormHelperText>{errors.sourceSystemType}</FormHelperText>
                      )}
                    </FormControl>
                  </Grid>

                  {/* Conditional fields based on source system type */}
                  {['SQL_DB', 'NOSQL_DB'].includes(values.sourceSystemType) && (
                    <>
                      <Grid item xs={12} md={6}>
                        <Field
                          as={TextField}
                          fullWidth
                          label="Host"
                          name="host"
                          variant="outlined"
                          error={touched.host && Boolean(errors.host)}
                          helperText={touched.host && errors.host}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Field
                          as={TextField}
                          fullWidth
                          label="Port"
                          name="port"
                          variant="outlined"
                          error={touched.port && Boolean(errors.port)}
                          helperText={touched.port && errors.port}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <Field
                          as={TextField}
                          fullWidth
                          label="Database Name"
                          name="database"
                          variant="outlined"
                          error={touched.database && Boolean(errors.database)}
                          helperText={touched.database && errors.database}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Field
                          as={TextField}
                          fullWidth
                          label="Username"
                          name="username"
                          variant="outlined"
                          error={touched.username && Boolean(errors.username)}
                          helperText={touched.username && errors.username}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Field
                          as={TextField}
                          fullWidth
                          label="Password"
                          name="password"
                          type="password"
                          variant="outlined"
                          error={touched.password && Boolean(errors.password)}
                          helperText={touched.password && errors.password}
                        />
                      </Grid>
                    </>
                  )}

                  {values.sourceSystemType === 'API' && (
                    <>
                      <Grid item xs={12}>
                        <Field
                          as={TextField}
                          fullWidth
                          label="API URL"
                          name="apiUrl"
                          variant="outlined"
                          error={touched.apiUrl && Boolean(errors.apiUrl)}
                          helperText={touched.apiUrl && errors.apiUrl}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <Field
                          as={TextField}
                          fullWidth
                          label="API Key"
                          name="apiKey"
                          variant="outlined"
                          error={touched.apiKey && Boolean(errors.apiKey)}
                          helperText={touched.apiKey && errors.apiKey}
                        />
                      </Grid>
                    </>
                  )}

                  {values.sourceSystemType === 'FLAT_FILE' && (
                    <Grid item xs={12}>
                      <Field
                        as={TextField}
                        fullWidth
                        label="File Path"
                        name="filePath"
                        variant="outlined"
                        error={touched.filePath && Boolean(errors.filePath)}
                        helperText={touched.filePath && errors.filePath}
                      />
                    </Grid>
                  )}
                </Grid>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
                  <Button onClick={handleBack}>Back</Button>
                  <Button variant="contained" type="submit">
                    Next
                  </Button>
                </Box>
              </Form>
            )}
          </Formik>
        );
      case 2:
        return (
          <Formik
            initialValues={initialValues}
            validationSchema={currentSchema}
            onSubmit={handleNext}
          >
            {({ errors, touched }) => (
              <Form>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Field
                      as={TextField}
                      fullWidth
                      label="Target Host"
                      name="targetHost"
                      variant="outlined"
                      error={touched.targetHost && Boolean(errors.targetHost)}
                      helperText={touched.targetHost && errors.targetHost}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Field
                      as={TextField}
                      fullWidth
                      label="Target Port"
                      name="targetPort"
                      variant="outlined"
                      error={touched.targetPort && Boolean(errors.targetPort)}
                      helperText={touched.targetPort && errors.targetPort}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Field
                      as={TextField}
                      fullWidth
                      label="Target Database Name"
                      name="targetDatabase"
                      variant="outlined"
                      error={touched.targetDatabase && Boolean(errors.targetDatabase)}
                      helperText={touched.targetDatabase && errors.targetDatabase}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Field
                      as={TextField}
                      fullWidth
                      label="Target Username"
                      name="targetUsername"
                      variant="outlined"
                      error={touched.targetUsername && Boolean(errors.targetUsername)}
                      helperText={touched.targetUsername && errors.targetUsername}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Field
                      as={TextField}
                      fullWidth
                      label="Target Password"
                      name="targetPassword"
                      type="password"
                      variant="outlined"
                      error={touched.targetPassword && Boolean(errors.targetPassword)}
                      helperText={touched.targetPassword && errors.targetPassword}
                    />
                  </Grid>
                </Grid>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
                  <Button onClick={handleBack}>Back</Button>
                  <Button variant="contained" type="submit">
                    Next
                  </Button>
                </Box>
              </Form>
            )}
          </Formik>
        );
      case 3:
        return (
          <Box>
            <Alert severity="info" sx={{ mb: 3 }}>
              Please review your project details before creating the migration project.
            </Alert>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6">Project Details</Typography>
                <Typography><strong>Name:</strong> {formData.name}</Typography>
                <Typography><strong>Description:</strong> {formData.description}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="h6">Source System</Typography>
                <Typography><strong>Type:</strong> {formData.sourceSystemType}</Typography>
                {['SQL_DB', 'NOSQL_DB'].includes(formData.sourceSystemType) && (
                  <>
                    <Typography><strong>Host:</strong> {formData.host}</Typography>
                    <Typography><strong>Port:</strong> {formData.port}</Typography>
                    <Typography><strong>Database:</strong> {formData.database}</Typography>
                    <Typography><strong>Username:</strong> {formData.username}</Typography>
                  </>
                )}
                {formData.sourceSystemType === 'API' && (
                  <>
                    <Typography><strong>API URL:</strong> {formData.apiUrl}</Typography>
                  </>
                )}
                {formData.sourceSystemType === 'FLAT_FILE' && (
                  <>
                    <Typography><strong>File Path:</strong> {formData.filePath}</Typography>
                  </>
                )}
              </Grid>
              <Grid item xs={12}>
                <Typography variant="h6">Target System</Typography>
                <Typography><strong>Host:</strong> {formData.targetHost}</Typography>
                <Typography><strong>Port:</strong> {formData.targetPort}</Typography>
                <Typography><strong>Database:</strong> {formData.targetDatabase}</Typography>
                <Typography><strong>Username:</strong> {formData.targetUsername}</Typography>
              </Grid>
            </Grid>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
              <Button onClick={handleBack}>Back</Button>
              <Button variant="contained" onClick={handleSubmit}>
                Create Project
              </Button>
            </Box>
          </Box>
        );
      default:
        return 'Unknown step';
    }
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" sx={{ mb: 4 }}>
        Create New Migration Project
      </Typography>

      <Paper sx={{ p: 3 }}>
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {getStepContent(activeStep)}
      </Paper>
    </Box>
  );
}

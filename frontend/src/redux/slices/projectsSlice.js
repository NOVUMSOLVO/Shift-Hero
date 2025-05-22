import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { projectsAPI } from '../../services/api';

// Initial state
const initialState = {
  projects: [],
  currentProject: null,
  loading: false,
  error: null,
  progress: null,
};

// Async thunks
export const fetchProjects = createAsyncThunk(
  'projects/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await projectsAPI.getAll();
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.detail || 'Failed to fetch projects'
      );
    }
  }
);

export const fetchProjectById = createAsyncThunk(
  'projects/fetchById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await projectsAPI.getById(id);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.detail || 'Failed to fetch project details'
      );
    }
  }
);

export const createProject = createAsyncThunk(
  'projects/create',
  async (projectData, { rejectWithValue }) => {
    try {
      const response = await projectsAPI.create(projectData);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.detail || 'Failed to create project'
      );
    }
  }
);

export const updateProject = createAsyncThunk(
  'projects/update',
  async ({ id, projectData }, { rejectWithValue }) => {
    try {
      const response = await projectsAPI.update(id, projectData);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.detail || 'Failed to update project'
      );
    }
  }
);

export const deleteProject = createAsyncThunk(
  'projects/delete',
  async (id, { rejectWithValue }) => {
    try {
      await projectsAPI.delete(id);
      return id;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.detail || 'Failed to delete project'
      );
    }
  }
);

export const startMigration = createAsyncThunk(
  'projects/startMigration',
  async (id, { rejectWithValue }) => {
    try {
      const response = await projectsAPI.start(id);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.detail || 'Failed to start migration'
      );
    }
  }
);

export const fetchMigrationProgress = createAsyncThunk(
  'projects/fetchProgress',
  async (id, { rejectWithValue }) => {
    try {
      const response = await projectsAPI.getProgress(id);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.detail || 'Failed to fetch migration progress'
      );
    }
  }
);

// Projects slice
const projectsSlice = createSlice({
  name: 'projects',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentProject: (state) => {
      state.currentProject = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch all projects
      .addCase(fetchProjects.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProjects.fulfilled, (state, action) => {
        state.loading = false;
        state.projects = action.payload;
      })
      .addCase(fetchProjects.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch project by ID
      .addCase(fetchProjectById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProjectById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentProject = action.payload;
      })
      .addCase(fetchProjectById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Create project
      .addCase(createProject.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createProject.fulfilled, (state, action) => {
        state.loading = false;
        state.projects.push(action.payload);
        state.currentProject = action.payload;
      })
      .addCase(createProject.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Update project
      .addCase(updateProject.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateProject.fulfilled, (state, action) => {
        state.loading = false;
        state.projects = state.projects.map(project => 
          project.id === action.payload.id ? action.payload : project
        );
        state.currentProject = action.payload;
      })
      .addCase(updateProject.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Delete project
      .addCase(deleteProject.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteProject.fulfilled, (state, action) => {
        state.loading = false;
        state.projects = state.projects.filter(project => project.id !== action.payload);
        if (state.currentProject && state.currentProject.id === action.payload) {
          state.currentProject = null;
        }
      })
      .addCase(deleteProject.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Start migration
      .addCase(startMigration.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(startMigration.fulfilled, (state, action) => {
        state.loading = false;
        // Update the project status if the response includes the updated project
        if (action.payload.project) {
          state.currentProject = action.payload.project;
          state.projects = state.projects.map(project => 
            project.id === action.payload.project.id ? action.payload.project : project
          );
        }
      })
      .addCase(startMigration.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch migration progress
      .addCase(fetchMigrationProgress.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMigrationProgress.fulfilled, (state, action) => {
        state.loading = false;
        state.progress = action.payload;
      })
      .addCase(fetchMigrationProgress.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, clearCurrentProject } = projectsSlice.actions;

export default projectsSlice.reducer;

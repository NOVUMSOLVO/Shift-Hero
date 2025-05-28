import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { sourceSystemAPI, entitiesAPI, fieldsAPI } from '../../services/api';

// Initial state
const initialState = {
  dataSources: [],
  currentDataSource: null,
  entities: [],
  currentEntity: null,
  fields: [],
  currentField: null,
  loading: false,
  error: null,
};

// Async thunks for data sources
export const fetchDataSources = createAsyncThunk(
  'dataSources/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await sourceSystemAPI.getAll();
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.detail || 'Failed to fetch data sources'
      );
    }
  }
);

export const fetchDataSourceById = createAsyncThunk(
  'dataSources/fetchById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await sourceSystemAPI.getById(id);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.detail || 'Failed to fetch data source details'
      );
    }
  }
);

export const fetchDataSourceSchema = createAsyncThunk(
  'dataSources/fetchSchema',
  async (id, { rejectWithValue }) => {
    try {
      const response = await sourceSystemAPI.getSchema(id);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.detail || 'Failed to fetch data source schema'
      );
    }
  }
);

// Async thunks for entities
export const fetchEntities = createAsyncThunk(
  'dataSources/fetchEntities',
  async (_, { rejectWithValue }) => {
    try {
      const response = await entitiesAPI.getAll();
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.detail || 'Failed to fetch entities'
      );
    }
  }
);

export const fetchEntityById = createAsyncThunk(
  'dataSources/fetchEntityById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await entitiesAPI.getById(id);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.detail || 'Failed to fetch entity details'
      );
    }
  }
);

export const fetchEntitySampleData = createAsyncThunk(
  'dataSources/fetchEntitySampleData',
  async (id, { rejectWithValue }) => {
    try {
      const response = await entitiesAPI.getSampleData(id);
      return { id, sampleData: response.data };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.detail || 'Failed to fetch entity sample data'
      );
    }
  }
);

// Async thunks for fields
export const fetchFields = createAsyncThunk(
  'dataSources/fetchFields',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fieldsAPI.getAll();
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.detail || 'Failed to fetch fields'
      );
    }
  }
);

export const fetchFieldById = createAsyncThunk(
  'dataSources/fetchFieldById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await fieldsAPI.getById(id);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.detail || 'Failed to fetch field details'
      );
    }
  }
);

export const fetchFieldStatistics = createAsyncThunk(
  'dataSources/fetchFieldStatistics',
  async (id, { rejectWithValue }) => {
    try {
      const response = await fieldsAPI.getStatistics(id);
      return { id, statistics: response.data };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.detail || 'Failed to fetch field statistics'
      );
    }
  }
);

// Data sources slice
const dataSourcesSlice = createSlice({
  name: 'dataSources',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentDataSource: (state) => {
      state.currentDataSource = null;
    },
    clearCurrentEntity: (state) => {
      state.currentEntity = null;
    },
    clearCurrentField: (state) => {
      state.currentField = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch all data sources
      .addCase(fetchDataSources.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDataSources.fulfilled, (state, action) => {
        state.loading = false;
        state.dataSources = action.payload;
      })
      .addCase(fetchDataSources.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch data source by ID
      .addCase(fetchDataSourceById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDataSourceById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentDataSource = action.payload;
      })
      .addCase(fetchDataSourceById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch data source schema
      .addCase(fetchDataSourceSchema.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDataSourceSchema.fulfilled, (state, action) => {
        state.loading = false;
        if (state.currentDataSource) {
          state.currentDataSource.schema = action.payload;
        }
      })
      .addCase(fetchDataSourceSchema.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch all entities
      .addCase(fetchEntities.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEntities.fulfilled, (state, action) => {
        state.loading = false;
        state.entities = action.payload;
      })
      .addCase(fetchEntities.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch entity by ID
      .addCase(fetchEntityById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEntityById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentEntity = action.payload;
      })
      .addCase(fetchEntityById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch entity sample data
      .addCase(fetchEntitySampleData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEntitySampleData.fulfilled, (state, action) => {
        state.loading = false;
        if (state.currentEntity && state.currentEntity.id === action.payload.id) {
          state.currentEntity.sampleData = action.payload.sampleData;
        }
      })
      .addCase(fetchEntitySampleData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch all fields
      .addCase(fetchFields.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFields.fulfilled, (state, action) => {
        state.loading = false;
        state.fields = action.payload;
      })
      .addCase(fetchFields.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch field by ID
      .addCase(fetchFieldById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFieldById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentField = action.payload;
      })
      .addCase(fetchFieldById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch field statistics
      .addCase(fetchFieldStatistics.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFieldStatistics.fulfilled, (state, action) => {
        state.loading = false;
        if (state.currentField && state.currentField.id === action.payload.id) {
          state.currentField.statistics = action.payload.statistics;
        }
      })
      .addCase(fetchFieldStatistics.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { 
  clearError, 
  clearCurrentDataSource, 
  clearCurrentEntity, 
  clearCurrentField 
} = dataSourcesSlice.actions;

export default dataSourcesSlice.reducer;

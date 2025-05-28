import authReducer, { clearError } from '../authSlice';

describe('Auth Slice', () => {
  const initialState = {
    user: null,
    token: null,
    isAuthenticated: false,
    loading: false,
    error: null,
  };

  test('should return the initial state', () => {
    expect(authReducer(undefined, { type: undefined })).toEqual({
      user: null,
      token: expect.any(String) || null,
      isAuthenticated: expect.any(Boolean),
      loading: false,
      error: null,
    });
  });

  test('should handle clearError', () => {
    const previousState = {
      ...initialState,
      error: 'Test error',
    };

    expect(authReducer(previousState, clearError())).toEqual({
      ...initialState,
      error: null,
    });
  });

  test('should handle login.pending', () => {
    expect(
      authReducer(initialState, { type: 'auth/login/pending' })
    ).toEqual({
      ...initialState,
      loading: true,
      error: null,
    });
  });

  test('should handle login.fulfilled', () => {
    const action = {
      type: 'auth/login/fulfilled',
      payload: {
        token: 'test-token',
        user: { id: 1, username: 'testuser' },
      },
    };

    expect(authReducer(initialState, action)).toEqual({
      ...initialState,
      loading: false,
      isAuthenticated: true,
      token: 'test-token',
      user: { id: 1, username: 'testuser' },
    });
  });

  test('should handle login.rejected', () => {
    const action = {
      type: 'auth/login/rejected',
      payload: 'Invalid credentials',
    };

    expect(authReducer(initialState, action)).toEqual({
      ...initialState,
      loading: false,
      error: 'Invalid credentials',
    });
  });

  test('should handle logout.fulfilled', () => {
    const previousState = {
      user: { id: 1, username: 'testuser' },
      token: 'test-token',
      isAuthenticated: true,
      loading: false,
      error: null,
    };

    expect(
      authReducer(previousState, { type: 'auth/logout/fulfilled' })
    ).toEqual({
      ...initialState,
      loading: false,
      isAuthenticated: false,
      token: null,
      user: null,
    });
  });
});

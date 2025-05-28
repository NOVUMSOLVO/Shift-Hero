import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import Notification from '../Notification';

// Create a mock store
const mockStore = configureStore([]);

describe('Notification Component', () => {
  let store;

  beforeEach(() => {
    // Initialize store with mock data
    store = mockStore({
      ui: {
        notifications: [
          {
            id: 1,
            type: 'success',
            message: 'Test success notification',
            duration: 3000
          },
          {
            id: 2,
            type: 'error',
            message: 'Test error notification',
            duration: 3000
          }
        ]
      }
    });
  });

  test('renders notifications from store', () => {
    render(
      <Provider store={store}>
        <Notification />
      </Provider>
    );

    // Check if notifications are rendered
    expect(screen.getByText('Test success notification')).toBeInTheDocument();
    expect(screen.getByText('Test error notification')).toBeInTheDocument();
  });

  test('renders empty when no notifications', () => {
    // Initialize store with no notifications
    store = mockStore({
      ui: {
        notifications: []
      }
    });

    const { container } = render(
      <Provider store={store}>
        <Notification />
      </Provider>
    );

    // The component should render an empty stack
    expect(container.firstChild).toBeEmptyDOMElement();
  });
});

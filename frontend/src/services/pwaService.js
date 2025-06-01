// PWA Service and Notification Manager
class PWAService {
  constructor() {
    this.swRegistration = null;
    this.isOnline = navigator.onLine;
    this.installPromptEvent = null;
    this.init();
  }

  async init() {
    // Register service worker
    if ('serviceWorker' in navigator) {
      try {
        this.swRegistration = await navigator.serviceWorker.register('/sw.js');
        console.log('NHS Care: Service Worker registered successfully');
        
        // Listen for SW updates
        this.swRegistration.addEventListener('updatefound', () => {
          this.handleServiceWorkerUpdate();
        });
      } catch (error) {
        console.error('NHS Care: Service Worker registration failed:', error);
      }
    }

    // Setup PWA install prompt
    this.setupInstallPrompt();
    
    // Setup offline/online detection
    this.setupNetworkDetection();
    
    // Request notification permission
    this.requestNotificationPermission();
    
    // Setup background sync
    this.setupBackgroundSync();
  }

  // Handle service worker updates
  handleServiceWorkerUpdate() {
    const newWorker = this.swRegistration.installing;
    
    newWorker.addEventListener('statechange', () => {
      if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
        // Show update available notification
        this.showUpdateNotification();
      }
    });
  }

  // Setup PWA install prompt
  setupInstallPrompt() {
    window.addEventListener('beforeinstallprompt', (event) => {
      event.preventDefault();
      this.installPromptEvent = event;
      
      // Show custom install button
      this.showInstallButton();
    });

    // Handle app installed
    window.addEventListener('appinstalled', () => {
      console.log('NHS Care: PWA installed successfully');
      this.hideInstallButton();
      this.trackEvent('pwa_installed');
    });
  }

  // Setup network detection
  setupNetworkDetection() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.handleOnlineStatusChange(true);
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.handleOnlineStatusChange(false);
    });
  }

  // Handle online/offline status changes
  handleOnlineStatusChange(isOnline) {
    const event = new CustomEvent('networkStatusChange', {
      detail: { isOnline }
    });
    
    window.dispatchEvent(event);
    
    if (isOnline) {
      this.showNotification('Connection Restored', {
        body: 'You are back online. Syncing data...',
        icon: '/static/media/icon-192x192.png',
        tag: 'network-status'
      });
      
      // Trigger background sync
      this.triggerBackgroundSync();
    } else {
      this.showNotification('Working Offline', {
        body: 'You are offline. Data will sync when connection is restored.',
        icon: '/static/media/icon-192x192.png',
        tag: 'network-status'
      });
    }
  }

  // Request notification permission
  async requestNotificationPermission() {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        console.log('NHS Care: Notification permission granted');
        this.setupPushNotifications();
      } else {
        console.log('NHS Care: Notification permission denied');
      }
    }
  }

  // Setup push notifications
  async setupPushNotifications() {
    if (!this.swRegistration) return;

    try {
      const subscription = await this.swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(process.env.REACT_APP_VAPID_PUBLIC_KEY)
      });

      // Send subscription to server
      await this.sendSubscriptionToServer(subscription);
    } catch (error) {
      console.error('NHS Care: Push subscription failed:', error);
    }
  }

  // Send push subscription to server
  async sendSubscriptionToServer(subscription) {
    try {
      await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(subscription)
      });
    } catch (error) {
      console.error('NHS Care: Failed to send subscription to server:', error);
    }
  }

  // Setup background sync
  setupBackgroundSync() {
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      navigator.serviceWorker.ready.then((registration) => {
        // Register sync events
        this.registerSyncEvent = (tag) => {
          return registration.sync.register(tag);
        };
      });
    }
  }

  // Trigger background sync
  async triggerBackgroundSync() {
    if (this.registerSyncEvent) {
      try {
        await this.registerSyncEvent('background-sync-medication');
        await this.registerSyncEvent('background-sync-staffing');
      } catch (error) {
        console.error('NHS Care: Background sync registration failed:', error);
      }
    }
  }

  // Show PWA install button
  showInstallButton() {
    const installButton = document.getElementById('pwa-install-button');
    if (installButton) {
      installButton.style.display = 'block';
    }
    
    // Dispatch custom event for React components
    const event = new CustomEvent('pwaInstallAvailable');
    window.dispatchEvent(event);
  }

  // Hide PWA install button
  hideInstallButton() {
    const installButton = document.getElementById('pwa-install-button');
    if (installButton) {
      installButton.style.display = 'none';
    }
    
    // Dispatch custom event for React components
    const event = new CustomEvent('pwaInstallComplete');
    window.dispatchEvent(event);
  }

  // Install PWA
  async installPWA() {
    if (this.installPromptEvent) {
      this.installPromptEvent.prompt();
      
      const result = await this.installPromptEvent.userChoice;
      
      if (result.outcome === 'accepted') {
        console.log('NHS Care: PWA install accepted');
        this.trackEvent('pwa_install_accepted');
      } else {
        console.log('NHS Care: PWA install dismissed');
        this.trackEvent('pwa_install_dismissed');
      }
      
      this.installPromptEvent = null;
    }
  }

  // Show update notification
  showUpdateNotification() {
    this.showNotification('Update Available', {
      body: 'A new version of NHS Care is available. Refresh to update.',
      icon: '/static/media/icon-192x192.png',
      tag: 'app-update',
      actions: [
        {
          action: 'update',
          title: 'Update Now'
        },
        {
          action: 'dismiss',
          title: 'Later'
        }
      ]
    });
  }

  // Show notification
  async showNotification(title, options = {}) {
    if ('Notification' in window && Notification.permission === 'granted') {
      if (this.swRegistration) {
        await this.swRegistration.showNotification(title, {
          badge: '/static/media/badge.png',
          vibrate: [200, 100, 200],
          ...options
        });
      } else {
        new Notification(title, options);
      }
    }
  }

  // Schedule medication reminder
  async scheduleMedicationReminder(medication) {
    if (!this.swRegistration) return;

    const reminderTime = new Date(medication.scheduledTime).getTime() - Date.now();
    
    if (reminderTime > 0) {
      setTimeout(async () => {
        await this.showNotification('Medication Reminder', {
          body: `Time to administer ${medication.name} to ${medication.residentName}`,
          icon: '/static/media/medication-icon.png',
          tag: `medication-${medication.id}`,
          data: {
            medicationId: medication.id,
            residentId: medication.residentId,
            url: '/medications'
          },
          actions: [
            {
              action: 'view_medication',
              title: 'View Details'
            },
            {
              action: 'mark_administered',
              title: 'Mark as Given'
            }
          ]
        });
      }, reminderTime);
    }
  }

  // Schedule staff shift reminder
  async scheduleStaffReminder(shift) {
    if (!this.swRegistration) return;

    const reminderTime = new Date(shift.startTime).getTime() - Date.now() - (30 * 60 * 1000); // 30 min before
    
    if (reminderTime > 0) {
      setTimeout(async () => {
        await this.showNotification('Shift Reminder', {
          body: `Your shift starts in 30 minutes at ${shift.location}`,
          icon: '/static/media/staff-icon.png',
          tag: `shift-${shift.id}`,
          data: {
            shiftId: shift.id,
            staffId: shift.staffId,
            url: '/staff'
          },
          actions: [
            {
              action: 'view_staff',
              title: 'View Schedule'
            }
          ]
        });
      }, reminderTime);
    }
  }

  // Send critical alert
  async sendCriticalAlert(alert) {
    await this.showNotification('Critical Alert', {
      body: alert.message,
      icon: '/static/media/icon-192x192.png',
      tag: `alert-${alert.id}`,
      requireInteraction: true,
      vibrate: [500, 200, 500, 200, 500],
      data: {
        alertId: alert.id,
        priority: 'critical',
        url: alert.url || '/dashboard'
      },
      actions: [
        {
          action: 'acknowledge',
          title: 'Acknowledge'
        },
        {
          action: 'view_details',
          title: 'View Details'
        }
      ]
    });
  }

  // Store data offline
  async storeOfflineData(key, data) {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('NHS-Care-Offline', 1);
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('offline-data')) {
          db.createObjectStore('offline-data', { keyPath: 'key' });
        }
      };
      
      request.onsuccess = (event) => {
        const db = event.target.result;
        const transaction = db.transaction(['offline-data'], 'readwrite');
        const store = transaction.objectStore('offline-data');
        
        store.put({ key, data, timestamp: Date.now() });
        
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  // Get offline data
  async getOfflineData(key) {
    return new Promise((resolve) => {
      const request = indexedDB.open('NHS-Care-Offline', 1);
      
      request.onsuccess = (event) => {
        const db = event.target.result;
        const transaction = db.transaction(['offline-data'], 'readonly');
        const store = transaction.objectStore('offline-data');
        const getRequest = store.get(key);
        
        getRequest.onsuccess = () => {
          resolve(getRequest.result?.data || null);
        };
      };
      
      request.onerror = () => resolve(null);
    });
  }

  // Track analytics events
  trackEvent(eventName, properties = {}) {
    // Send to analytics service when online
    if (this.isOnline) {
      fetch('/api/analytics/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          event: eventName,
          properties: {
            ...properties,
            timestamp: Date.now(),
            userAgent: navigator.userAgent,
            online: this.isOnline
          }
        })
      }).catch(console.error);
    }
  }

  // Utility function for VAPID key conversion
  urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  // Get app info
  getAppInfo() {
    return {
      isOnline: this.isOnline,
      isInstalled: window.matchMedia('(display-mode: standalone)').matches || 
                   window.navigator.standalone === true,
      hasServiceWorker: !!this.swRegistration,
      notificationPermission: 'Notification' in window ? Notification.permission : 'not-supported'
    };
  }
}

// Initialize PWA Service
const pwaService = new PWAService();

export default pwaService;

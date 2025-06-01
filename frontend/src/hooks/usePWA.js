import { useState, useEffect } from 'react';
import pwaService from '../services/pwaService';

export const usePWA = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    // Network status change handler
    const handleNetworkChange = (event) => {
      setIsOnline(event.detail.isOnline);
    };

    // PWA install available handler
    const handleInstallAvailable = () => {
      setIsInstallable(true);
    };

    // PWA install complete handler
    const handleInstallComplete = () => {
      setIsInstallable(false);
      setIsInstalled(true);
    };

    // Service worker update handler
    const handleUpdateAvailable = () => {
      setUpdateAvailable(true);
    };

    // Add event listeners
    window.addEventListener('networkStatusChange', handleNetworkChange);
    window.addEventListener('pwaInstallAvailable', handleInstallAvailable);
    window.addEventListener('pwaInstallComplete', handleInstallComplete);
    window.addEventListener('updateAvailable', handleUpdateAvailable);

    // Check initial install state
    setIsInstalled(
      window.matchMedia('(display-mode: standalone)').matches || 
      window.navigator.standalone === true
    );

    // Cleanup
    return () => {
      window.removeEventListener('networkStatusChange', handleNetworkChange);
      window.removeEventListener('pwaInstallAvailable', handleInstallAvailable);
      window.removeEventListener('pwaInstallComplete', handleInstallComplete);
      window.removeEventListener('updateAvailable', handleUpdateAvailable);
    };
  }, []);

  const installPWA = async () => {
    try {
      await pwaService.installPWA();
    } catch (error) {
      console.error('Failed to install PWA:', error);
    }
  };

  const scheduleNotification = async (type, data) => {
    try {
      switch (type) {
        case 'medication':
          await pwaService.scheduleMedicationReminder(data);
          break;
        case 'staff':
          await pwaService.scheduleStaffReminder(data);
          break;
        case 'critical':
          await pwaService.sendCriticalAlert(data);
          break;
        default:
          await pwaService.showNotification(data.title, data.options);
      }
    } catch (error) {
      console.error('Failed to schedule notification:', error);
    }
  };

  const storeOfflineData = async (key, data) => {
    try {
      await pwaService.storeOfflineData(key, data);
    } catch (error) {
      console.error('Failed to store offline data:', error);
    }
  };

  const getOfflineData = async (key) => {
    try {
      return await pwaService.getOfflineData(key);
    } catch (error) {
      console.error('Failed to get offline data:', error);
      return null;
    }
  };

  return {
    isOnline,
    isInstallable,
    isInstalled,
    updateAvailable,
    installPWA,
    scheduleNotification,
    storeOfflineData,
    getOfflineData,
    appInfo: pwaService.getAppInfo()
  };
};

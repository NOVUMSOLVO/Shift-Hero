import axios from 'axios';
import NotificationService, { InAppNotification } from '@/services/NotificationService';
import AuditService from '@/services/AuditService';

// Mock dependencies
jest.mock('axios');
jest.mock('@/services/AuditService');

// Mock localStorage for browser environment
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value.toString(); },
    clear: () => { store = {}; },
  };
})();
Object.defineProperty(global, 'localStorage', { value: localStorageMock });

describe('NotificationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
    localStorageMock.setItem('pharmacyOdsCode', 'F1234');
  });

  describe('External Notifications', () => {
    it('should send SMS notifications', async () => {
      // Mock axios response
      const mockResponse = {
        data: {
          id: 'notification-id',
          reference: 'reference-id',
          contentType: 'sms',
          status: 'created',
          createdAt: new Date().toISOString(),
        },
      };
      (axios.post as jest.Mock).mockResolvedValue(mockResponse);

      // Call the service
      const result = await NotificationService.sendSMS(
        '07700900000',
        'template-id',
        { name: 'John Smith' }
      );

      // Assertions
      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('notifications/sms'),
        expect.objectContaining({
          phone_number: '07700900000',
          template_id: 'template-id',
          personalisation: { name: 'John Smith' },
        }),
        expect.any(Object)
      );
      expect(result).toEqual(mockResponse.data);
      expect(AuditService.logAction).toHaveBeenCalled();
    });

    it('should send email notifications', async () => {
      // Mock axios response
      const mockResponse = {
        data: {
          id: 'notification-id',
          reference: 'reference-id',
          contentType: 'email',
          status: 'created',
          createdAt: new Date().toISOString(),
        },
      };
      (axios.post as jest.Mock).mockResolvedValue(mockResponse);

      // Call the service
      const result = await NotificationService.sendEmail(
        'test@example.com',
        'template-id',
        { name: 'John Smith' }
      );

      // Assertions
      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('notifications/email'),
        expect.objectContaining({
          email_address: 'test@example.com',
          template_id: 'template-id',
          personalisation: { name: 'John Smith' },
        }),
        expect.any(Object)
      );
      expect(result).toEqual(mockResponse.data);
      expect(AuditService.logAction).toHaveBeenCalled();
    });

    it('should send prescription reminders', async () => {
      // Mock patient and prescription data
      const patient = {
        id: 'patient-id',
        firstName: 'John',
        lastName: 'Smith',
        phoneNumber: '07700900000',
        email: 'john@example.com',
      };

      const prescription = {
        id: 'prescription-id',
        prescriptionNumber: 'RX12345',
        expiryDate: new Date('2023-12-31'),
        pharmacy: {
          name: 'Test Pharmacy',
          phoneNumber: '01234567890',
        },
      };

      // Mock sendSMS method
      const sendSMSSpy = jest.spyOn(NotificationService, 'sendSMS').mockResolvedValue({
        id: 'notification-id',
        contentType: 'sms',
        status: 'created',
        createdAt: new Date().toISOString(),
      });

      // Call the service
      await NotificationService.sendPrescriptionReminder(patient, prescription);

      // Assertions
      expect(sendSMSSpy).toHaveBeenCalledWith(
        '07700900000',
        expect.any(String),
        expect.objectContaining({
          firstName: 'John',
          lastName: 'Smith',
          prescriptionNumber: 'RX12345',
        })
      );
    });
  });

  describe('In-App Notifications', () => {
    it('should create and retrieve in-app notifications', () => {
      // Create a notification
      const prescription = {
        id: 'prescription-id',
        medicationReference: { display: 'Test Medication' },
      };

      // Call the service
      NotificationService.notifyPrescriptionStatusUpdate(
        prescription as any,
        'active',
        'completed'
      );

      // Get notifications
      const notifications = NotificationService.getNotifications();

      // Assertions
      expect(notifications.length).toBe(1);
      expect(notifications[0].type).toBe('update');
      expect(notifications[0].prescriptionId).toBe('prescription-id');
      expect(notifications[0].read).toBe(false);
    });

    it('should mark notifications as read', () => {
      // Create a notification
      const prescription = {
        id: 'prescription-id',
        medicationReference: { display: 'Test Medication' },
      };

      NotificationService.notifyPrescriptionStatusUpdate(
        prescription as any,
        'active',
        'completed'
      );

      // Get the notification ID
      const notifications = NotificationService.getNotifications();
      const notificationId = notifications[0].id;

      // Mark as read
      NotificationService.markAsRead(notificationId);

      // Get notifications again
      const updatedNotifications = NotificationService.getNotifications();

      // Assertions
      expect(updatedNotifications[0].read).toBe(true);
    });

    it('should mark all notifications as read', () => {
      // Create multiple notifications
      const prescription1 = {
        id: 'prescription-1',
        medicationReference: { display: 'Medication 1' },
      };

      const prescription2 = {
        id: 'prescription-2',
        medicationReference: { display: 'Medication 2' },
      };

      NotificationService.notifyPrescriptionStatusUpdate(
        prescription1 as any,
        'active',
        'completed'
      );

      NotificationService.notifyPrescriptionStatusUpdate(
        prescription2 as any,
        'active',
        'cancelled'
      );

      // Mark all as read
      NotificationService.markAllAsRead();

      // Get notifications
      const notifications = NotificationService.getNotifications();

      // Assertions
      expect(notifications.length).toBe(2);
      expect(notifications[0].read).toBe(true);
      expect(notifications[1].read).toBe(true);
    });

    it('should notify listeners when a new notification is created', () => {
      // Create a listener
      const listener = jest.fn();
      NotificationService.addListener(listener);

      // Create a notification
      const prescription = {
        id: 'prescription-id',
        medicationReference: { display: 'Test Medication' },
      };

      NotificationService.notifyPrescriptionStatusUpdate(
        prescription as any,
        'active',
        'completed'
      );

      // Assertions
      expect(listener).toHaveBeenCalledWith(expect.objectContaining({
        type: 'update',
        prescriptionId: 'prescription-id',
      }));

      // Remove the listener
      NotificationService.removeListener(listener);
    });
  });

  describe('Error Handling', () => {
    it('should handle errors when sending SMS notifications', async () => {
      // Mock axios error
      const mockError = {
        response: {
          status: 500,
          data: { message: 'Internal Server Error' },
        },
      };
      (axios.post as jest.Mock).mockRejectedValueOnce(mockError);

      // Call the service and expect it to throw
      await expect(
        NotificationService.sendSMS('07700900000', 'template-id', { name: 'John Smith' })
      ).rejects.toThrow('Internal Server Error');

      // Assertions
      expect(axios.post).toHaveBeenCalled();
      expect(AuditService.logAction).not.toHaveBeenCalled();
    });

    it('should handle errors when sending email notifications', async () => {
      // Mock axios error
      const mockError = {
        response: {
          status: 400,
          data: { message: 'Bad Request' },
        },
      };
      (axios.post as jest.Mock).mockRejectedValueOnce(mockError);

      // Call the service and expect it to throw
      await expect(
        NotificationService.sendEmail('test@example.com', 'template-id', { name: 'John Smith' })
      ).rejects.toThrow('Bad Request');

      // Assertions
      expect(axios.post).toHaveBeenCalled();
      expect(AuditService.logAction).not.toHaveBeenCalled();
    });
  });
});

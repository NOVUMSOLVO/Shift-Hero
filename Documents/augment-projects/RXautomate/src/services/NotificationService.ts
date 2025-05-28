import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import AuditService from './AuditService';
import { Prescription } from './EPSService';

/**
 * Unified Notification Service
 * 
 * This service handles both external notifications (SMS, email) via NHS Notify API
 * and in-app notifications for the RXautomate system.
 */

// Types for External Notifications
export interface ExternalNotificationResponse {
  id: string;
  reference?: string;
  contentType: 'sms' | 'email' | 'letter';
  status: 'created' | 'sending' | 'delivered' | 'permanent-failure' | 'temporary-failure' | 'technical-failure';
  createdAt: string;
  completedAt?: string;
}

// Types for In-App Notifications
export interface InAppNotification {
  id: string;
  type: 'new' | 'update' | 'expiring' | 'error' | 'inventory' | 'system' | 'appointment' | 'patient';
  title: string;
  message: string;
  prescriptionId?: string;
  inventoryItemId?: string;
  appointmentId?: string;
  patientId?: string;
  timestamp: Date;
  read: boolean;
  priority: 'low' | 'medium' | 'high';
  action?: {
    label: string;
    url: string;
  };
  category?: 'prescription' | 'inventory' | 'appointment' | 'patient' | 'system';
  icon?: string;
}

class NotificationService {
  // Singleton instance
  private static instance: NotificationService;
  
  // External notification properties
  private apiKey: string;
  private baseUrl: string;
  private headers: Record<string, string>;
  private templateIds: Record<string, string>;
  
  // In-app notification properties
  private listeners: Array<(notification: InAppNotification) => void> = [];
  private notifications: InAppNotification[] = [];
  private pollingInterval: NodeJS.Timeout | null = null;
  private lastCheckTime: Date = new Date();

  private constructor() {
    // External notification setup
    this.apiKey = process.env.SMS_API_KEY || '';
    this.baseUrl = 'https://api.notifications.service.gov.uk/v2/';
    this.headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`,
    };

    // Template IDs for different notification types
    this.templateIds = {
      prescriptionReady: process.env.TEMPLATE_PRESCRIPTION_READY || 'prescription-ready-template-id',
      prescriptionReminder: process.env.TEMPLATE_PRESCRIPTION_REMINDER || 'prescription-reminder-template-id',
      prescriptionExpiring: process.env.TEMPLATE_PRESCRIPTION_EXPIRING || 'prescription-expiring-template-id',
      appointmentReminder: process.env.TEMPLATE_APPOINTMENT_REMINDER || 'appointment-reminder-template-id',
      appointmentConfirmation: process.env.TEMPLATE_APPOINTMENT_CONFIRMATION || 'appointment-confirmation-template-id',
      exemptionExpiring: process.env.TEMPLATE_EXEMPTION_EXPIRING || 'exemption-expiring-template-id',
    };
  }

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * Generate a reference ID for notifications
   * @returns UUID v4 string
   */
  private generateReference(): string {
    return uuidv4();
  }

  /**
   * Add a listener for in-app notifications
   * @param listener - The listener function
   */
  public addListener(listener: (notification: InAppNotification) => void): void {
    this.listeners.push(listener);
  }

  /**
   * Remove a listener
   * @param listener - The listener function to remove
   */
  public removeListener(listener: (notification: InAppNotification) => void): void {
    this.listeners = this.listeners.filter(l => l !== listener);
  }

  /**
   * Notify all listeners of a new notification
   * @param notification - The notification to send
   */
  private notifyListeners(notification: InAppNotification): void {
    this.listeners.forEach(listener => listener(notification));
  }

  /**
   * Start polling for new prescriptions
   * @param intervalMs - Polling interval in milliseconds (default: 30000)
   */
  public startPolling(intervalMs: number = 30000): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }

    this.lastCheckTime = new Date();
    this.pollingInterval = setInterval(() => this.checkForNewPrescriptions(), intervalMs);
    console.log(`Started polling for new prescriptions every ${intervalMs / 1000} seconds`);
  }

  /**
   * Stop polling for new prescriptions
   */
  public stopPolling(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
      console.log('Stopped polling for new prescriptions');
    }
  }

  /**
   * Check for new prescriptions
   */
  private async checkForNewPrescriptions(): Promise<void> {
    try {
      // Get pharmacy ODS code from local storage or session
      const pharmacyOdsCode = localStorage.getItem('pharmacyOdsCode') || 'F1234'; // Default for testing

      // Get current time for comparison
      const currentTime = new Date();

      // Call the API to check for new prescriptions
      const response = await fetch(`/api/prescriptions/pharmacy/${pharmacyOdsCode}/check-new?since=${this.lastCheckTime.toISOString()}`);

      if (!response.ok) {
        throw new Error(`Error checking for new prescriptions: ${response.statusText}`);
      }

      const data = await response.json();

      // Update last check time
      this.lastCheckTime = currentTime;

      // Process new prescriptions
      if (data.newPrescriptions && data.newPrescriptions.length > 0) {
        this.notifyNewPrescriptions(data.newPrescriptions);
      }

      // Check for expiring prescriptions
      if (data.expiringPrescriptions && data.expiringPrescriptions.length > 0) {
        this.notifyExpiringPrescriptions(data.expiringPrescriptions);
      }
    } catch (error) {
      console.error('Error checking for new prescriptions:', error);
    }
  }

  /**
   * Notify about new prescriptions (in-app)
   * @param prescriptions - New prescriptions
   */
  private notifyNewPrescriptions(prescriptions: Prescription[]): void {
    const count = prescriptions.length;

    // Create a notification
    const notification: InAppNotification = {
      id: uuidv4(),
      type: 'new',
      title: 'New Prescriptions Available',
      message: `${count} new prescription${count > 1 ? 's' : ''} received.`,
      timestamp: new Date(),
      read: false,
      priority: 'medium',
      action: {
        label: 'View Prescriptions',
        url: '/prescriptions?tab=eps&status=active',
      },
    };

    // Add to notifications list
    this.notifications.push(notification);

    // Notify listeners
    this.notifyListeners(notification);

    // Log the event
    AuditService.logSystemEvent('NEW_PRESCRIPTIONS_NOTIFICATION', {
      count,
      prescriptionIds: prescriptions.map(p => p.id),
    });
  }

  /**
   * Notify about expiring prescriptions (in-app)
   * @param prescriptions - Expiring prescriptions
   */
  private notifyExpiringPrescriptions(prescriptions: Prescription[]): void {
    const count = prescriptions.length;

    // Create a notification
    const notification: InAppNotification = {
      id: uuidv4(),
      type: 'expiring',
      title: 'Expiring Prescriptions',
      message: `${count} prescription${count > 1 ? 's' : ''} will expire soon.`,
      timestamp: new Date(),
      read: false,
      priority: 'high',
      action: {
        label: 'View Expiring',
        url: '/prescriptions?tab=eps&expiring=true',
      },
    };

    // Add to notifications list
    this.notifications.push(notification);

    // Notify listeners
    this.notifyListeners(notification);

    // Log the event
    AuditService.logSystemEvent('EXPIRING_PRESCRIPTIONS_NOTIFICATION', {
      count,
      prescriptionIds: prescriptions.map(p => p.id),
    });
  }

  /**
   * Create a notification for a prescription status update (in-app)
   * @param prescription - The updated prescription
   * @param oldStatus - The previous status
   * @param newStatus - The new status
   */
  public notifyPrescriptionStatusUpdate(
    prescription: Prescription,
    oldStatus: string,
    newStatus: string
  ): void {
    // Create a notification
    const notification: InAppNotification = {
      id: uuidv4(),
      type: 'update',
      title: 'Prescription Status Updated',
      message: `Prescription for ${prescription.medicationReference?.display ||
                prescription.medicationCodeableConcept?.coding?.[0]?.display ||
                'medication'} changed from ${oldStatus} to ${newStatus}.`,
      prescriptionId: prescription.id,
      timestamp: new Date(),
      read: false,
      priority: 'low',
      action: {
        label: 'View Prescription',
        url: `/prescriptions/details/${prescription.id}`,
      },
    };

    // Add to notifications list
    this.notifications.push(notification);

    // Notify listeners
    this.notifyListeners(notification);

    // Log the event
    AuditService.logSystemEvent('PRESCRIPTION_STATUS_UPDATE_NOTIFICATION', {
      prescriptionId: prescription.id,
      oldStatus,
      newStatus,
    });
  }

  /**
   * Create a notification for a prescription error (in-app)
   * @param prescriptionId - The prescription ID
   * @param error - The error message
   */
  public notifyPrescriptionError(prescriptionId: string, error: string): void {
    // Create a notification
    const notification: InAppNotification = {
      id: uuidv4(),
      type: 'error',
      title: 'Prescription Error',
      message: `Error processing prescription: ${error}`,
      prescriptionId,
      timestamp: new Date(),
      read: false,
      priority: 'high',
      action: {
        label: 'View Prescription',
        url: `/prescriptions/details/${prescriptionId}`,
      },
      category: 'prescription',
      icon: 'alert-circle',
    };

    // Add to notifications list
    this.notifications.push(notification);

    // Notify listeners
    this.notifyListeners(notification);

    // Log the event
    AuditService.logSystemEvent('PRESCRIPTION_ERROR_NOTIFICATION', {
      prescriptionId,
      error,
    });
  }

  /**
   * Get all in-app notifications
   * @param limit - Maximum number of notifications to return
   * @returns List of notifications
   */
  public getNotifications(limit?: number): InAppNotification[] {
    // Sort notifications by timestamp (newest first)
    const sorted = [...this.notifications].sort((a, b) =>
      b.timestamp.getTime() - a.timestamp.getTime()
    );

    // Apply limit if specified
    return limit ? sorted.slice(0, limit) : sorted;
  }

  /**
   * Mark a notification as read
   * @param notificationId - The notification ID
   */
  public markAsRead(notificationId: string): void {
    this.notifications = this.notifications.map(notification =>
      notification.id === notificationId
        ? { ...notification, read: true }
        : notification
    );
  }

  /**
   * Mark all notifications as read
   */
  public markAllAsRead(): void {
    this.notifications = this.notifications.map(notification => ({
      ...notification,
      read: true,
    }));
  }

  /**
   * Send SMS notification (external)
   * @param phoneNumber - The recipient's phone number
   * @param templateId - The template ID to use
   * @param personalisation - Template personalisation data
   * @returns Notification response
   */
  async sendSMS(phoneNumber: string, templateId: string, personalisation: Record<string, string>): Promise<ExternalNotificationResponse> {
    try {
      const reference = this.generateReference();

      const response = await axios.post(
        `${this.baseUrl}notifications/sms`,
        {
          phone_number: phoneNumber,
          template_id: templateId,
          personalisation,
          reference,
        },
        { headers: this.headers }
      );

      // Log successful notification
      AuditService.logActivity({
        action: 'SEND_SMS',
        category: 'NOTIFICATION',
        details: JSON.stringify({
          templateId,
          reference,
          phoneNumber: phoneNumber.substring(0, 4) + '****' + phoneNumber.substring(phoneNumber.length - 4), // Mask phone number
          status: response.data.status,
          timestamp: new Date().toISOString(),
        }),
      });

      return response.data;
    } catch (error) {
      console.error('Error sending SMS:', error);

      // Log error
      AuditService.logActivity({
        action: 'NOTIFICATION_ERROR',
        category: 'NOTIFICATION',
        details: JSON.stringify({
          error: error.message,
          templateId,
          timestamp: new Date().toISOString(),
        }),
      });

      throw error;
    }
  }

  /**
   * Send email notification (external)
   * @param email - The recipient's email address
   * @param templateId - The template ID to use
   * @param personalisation - Template personalisation data
   * @returns Notification response
   */
  async sendEmail(email: string, templateId: string, personalisation: Record<string, string>): Promise<ExternalNotificationResponse> {
    try {
      const reference = this.generateReference();

      const response = await axios.post(
        `${this.baseUrl}notifications/email`,
        {
          email_address: email,
          template_id: templateId,
          personalisation,
          reference,
        },
        { headers: this.headers }
      );

      // Log successful notification
      AuditService.logActivity({
        action: 'SEND_EMAIL',
        category: 'NOTIFICATION',
        details: JSON.stringify({
          templateId,
          reference,
          email: email.substring(0, 2) + '****' + email.substring(email.indexOf('@')), // Mask email
          status: response.data.status,
          timestamp: new Date().toISOString(),
        }),
      });

      return response.data;
    } catch (error) {
      console.error('Error sending email:', error);

      // Log error
      AuditService.logActivity({
        action: 'NOTIFICATION_ERROR',
        category: 'NOTIFICATION',
        details: JSON.stringify({
          error: error.message,
          templateId,
          timestamp: new Date().toISOString(),
        }),
      });

      throw error;
    }
  }

  /**
   * Send prescription ready notification (external)
   * @param patient - The patient object
   * @param prescription - The prescription object
   * @returns Notification response
   */
  async sendPrescriptionReadyNotification(patient: any, prescription: any): Promise<ExternalNotificationResponse | null> {
    // Check if patient has contact details
    if (!patient.phoneNumber && !patient.email) {
      console.warn(`Cannot send notification to patient ${patient.id}: No contact details available`);
      return null;
    }

    const personalisation = {
      firstName: patient.firstName,
      lastName: patient.lastName,
      prescriptionNumber: prescription.prescriptionNumber || 'N/A',
      pharmacyName: prescription.pharmacy.name,
      pharmacyPhone: prescription.pharmacy.phoneNumber,
      expiryDate: prescription.expiryDate ? new Date(prescription.expiryDate).toLocaleDateString('en-GB') : 'N/A',
    };

    // Prefer SMS if available
    if (patient.phoneNumber) {
      return this.sendSMS(
        patient.phoneNumber,
        this.templateIds.prescriptionReady,
        personalisation
      );
    } else if (patient.email) {
      return this.sendEmail(
        patient.email,
        this.templateIds.prescriptionReady,
        personalisation
      );
    }

    return null;
  }

  /**
   * Send prescription reminder (external)
   * @param patient - The patient object
   * @param prescription - The prescription object
   * @returns Notification response
   */
  async sendPrescriptionReminder(patient: any, prescription: any): Promise<ExternalNotificationResponse | null> {
    // Check if patient has contact details
    if (!patient.phoneNumber && !patient.email) {
      console.warn(`Cannot send reminder to patient ${patient.id}: No contact details available`);
      return null;
    }

    const personalisation = {
      firstName: patient.firstName,
      lastName: patient.lastName,
      prescriptionNumber: prescription.prescriptionNumber || 'N/A',
      expiryDate: prescription.expiryDate ? new Date(prescription.expiryDate).toLocaleDateString('en-GB') : 'N/A',
      pharmacyName: prescription.pharmacy.name,
      pharmacyPhone: prescription.pharmacy.phoneNumber,
    };

    // Prefer SMS if available
    if (patient.phoneNumber) {
      return this.sendSMS(
        patient.phoneNumber,
        this.templateIds.prescriptionReminder,
        personalisation
      );
    } else if (patient.email) {
      return this.sendEmail(
        patient.email,
        this.templateIds.prescriptionReminder,
        personalisation
      );
    }

    return null;
  }
}

export default NotificationService.getInstance();

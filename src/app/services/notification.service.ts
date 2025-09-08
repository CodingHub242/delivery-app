import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Notification } from '../models/notification.model';
import { ModalController } from '@ionic/angular';
import { NotificationModalComponent } from '../notification-modal/notification-modal.component';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private readonly SEEN_NOTIFICATIONS_KEY = 'seen_notifications';
  private readonly LAST_CHECKED_KEY = 'last_notification_check';

  constructor(
    private apiService: ApiService,
    private modalController: ModalController
  ) {}

  /**
   * Check if we should show notifications to the user
   * Only show once per day per notification
   */
  async checkAndShowNotifications(): Promise<void> {
    // Check if we've already checked notifications today
    const lastChecked = this.getLastCheckedDate();
    const today = new Date().toDateString();
    
    if (lastChecked === today) {
      console.log('Already checked notifications today');
      return;
    }

    try {
      // Fetch active notifications from the backend
      const notifications = await this.apiService.getPromotionalNotifications().toPromise();
      
      if (notifications && notifications.length > 0) {
        // Filter out notifications that have already been seen today
        const unseenNotifications = this.filterUnseenNotifications(notifications);
        
        if (unseenNotifications.length > 0) {
          // Show the first unseen notification
          await this.showNotificationModal(unseenNotifications[0]);
          
          // Mark this notification as seen
          await this.markNotificationAsSeen(unseenNotifications[0].id);
        }
      }
      
      // Update last checked date
      this.setLastCheckedDate(today);
      
    } catch (error) {
      console.error('Error checking notifications:', error);
    }
  }

  /**
   * Filter out notifications that have already been seen today
   */
  private filterUnseenNotifications(notifications: Notification[]): Notification[] {
    const seenNotifications = this.getSeenNotifications();
    const today = new Date().toDateString();
    
    return notifications.filter(notification => {
      const seenDate = seenNotifications[notification.id];
      return !seenDate || seenDate !== today;
    });
  }

  /**
   * Show notification modal
   */
  private async showNotificationModal(notification: Notification): Promise<void> {
    const modal = await this.modalController.create({
      component: NotificationModalComponent,
      componentProps: {
        notification: notification
      },
      cssClass: 'notification-modal',
      backdropDismiss: false
    });
    
    await modal.present();
  }

  /**
   * Mark notification as seen and store in localStorage
   */
  private async markNotificationAsSeen(notificationId: number): Promise<void> {
    try {
      // Mark as seen in backend
      await this.apiService.markNotificationAsSeen(notificationId).toPromise();
      
      // Store in localStorage with today's date
      const seenNotifications = this.getSeenNotifications();
      seenNotifications[notificationId] = new Date().toDateString();
      localStorage.setItem(this.SEEN_NOTIFICATIONS_KEY, JSON.stringify(seenNotifications));
      
    } catch (error) {
      console.error('Error marking notification as seen:', error);
      // Still store locally even if backend call fails
      const seenNotifications = this.getSeenNotifications();
      seenNotifications[notificationId] = new Date().toDateString();
      localStorage.setItem(this.SEEN_NOTIFICATIONS_KEY, JSON.stringify(seenNotifications));
    }
  }

  /**
   * Get seen notifications from localStorage
   */
  private getSeenNotifications(): { [key: number]: string } {
    const stored = localStorage.getItem(this.SEEN_NOTIFICATIONS_KEY);
    return stored ? JSON.parse(stored) : {};
  }

  /**
   * Get last checked date from localStorage
   */
  private getLastCheckedDate(): string | null {
    return localStorage.getItem(this.LAST_CHECKED_KEY);
  }

  /**
   * Set last checked date in localStorage
   */
  private setLastCheckedDate(date: string): void {
    localStorage.setItem(this.LAST_CHECKED_KEY, date);
  }

  /**
   * Clear all notification data (for testing/debugging)
   */
  clearNotificationData(): void {
    localStorage.removeItem(this.SEEN_NOTIFICATIONS_KEY);
    localStorage.removeItem(this.LAST_CHECKED_KEY);
  }
}

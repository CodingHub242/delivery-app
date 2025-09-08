import { Component, OnInit } from '@angular/core';
import { 
  IonButton,
  IonSpinner,
  IonModal
} from '@ionic/angular/standalone';
import { ApiService } from '../../services/api.service';
import { Notification } from '../../models/notification.model';
import { CommonModule } from '@angular/common';
import { NotificationFormComponent } from '../notification-form/notification-form.component';

@Component({
  selector: 'app-notification-list',
  templateUrl: './notification-list.component.html',
  styleUrls: ['./notification-list.component.scss'],
  imports: [
    IonButton,
    IonSpinner,
    IonModal,
    CommonModule,
    NotificationFormComponent
  ]
})
export class NotificationListComponent implements OnInit {
  notifications: Notification[] = [];
  loading = false;
  saving = false; // Add saving state
  error = '';
  isModalOpen = false;
  currentNotification: Partial<Notification> = {
    title: '',
    message: '',
    is_active: true,
    image_url: '',
    start_date: '',
    end_date: ''
  };
  isEditMode = false;

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadNotifications();
  }

  loadNotifications(): void {
    this.loading = true;
    this.apiService.getAllNotifications().subscribe({
      next: (data:any) => {
        this.notifications = data.data;
        this.loading = false;
        console.log(this.notifications);
      },
      error: (err) => {
        this.error = 'Failed to load notifications';
        this.loading = false;
        console.error(err);
      }
    });
  }

  deleteNotification(id: number): void {
    if (confirm('Are you sure you want to delete this notification?')) {
      this.apiService.deleteNotification(id).subscribe({
        next: () => {
          this.notifications = this.notifications.filter(n => n.id !== id);
        },
        error: (err) => {
          alert('Failed to delete notification');
          console.error(err);
        }
      });
    }
  }

  editNotification(notification: Notification): void {
    this.currentNotification = { ...notification };
    this.isEditMode = true;
    this.isModalOpen = true;
  }

  openAddNotificationModal(): void {
    this.currentNotification = {
      title: '',
      message: '',
      is_active: true,
      image_url: '',
      start_date: '',
      end_date: ''
    };
    this.isEditMode = false;
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.currentNotification = {
      title: '',
      message: '',
      is_active: true,
      image_url: '',
      start_date: '',
      end_date: ''
    };
  }

  saveNotification(notificationData: Partial<Notification>): void {
    if (this.saving) return; // Prevent multiple submissions
    
    this.saving = true;
    
    if (this.isEditMode && this.currentNotification.id) {
      // Update existing notification
      this.apiService.updateNotification(this.currentNotification.id, notificationData).subscribe({
        next: (updatedNotification) => {
          const index = this.notifications.findIndex(n => n.id === updatedNotification.id);
          if (index !== -1) {
            this.notifications[index] = updatedNotification;
          }
          this.saving = false;
          this.closeModal();
        },
        error: (err) => {
          this.saving = false;
          alert('Failed to update notification');
          console.error(err);
        }
      });
    } else {
      // Create new notification
      this.apiService.createNotification(notificationData).subscribe({
        next: (newNotification) => {
          this.notifications.push(newNotification);
          this.saving = false;
          this.closeModal();
        },
        error: (err) => {
          this.saving = false;
          alert('Failed to create notification');
          console.error(err);
        }
      });
    }
  }
}

import { Component, CUSTOM_ELEMENTS_SCHEMA, Input } from '@angular/core';
import { 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonContent, 
  IonButton, 
  IonIcon,
  ModalController 
} from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { addIcons } from 'ionicons';
import { close } from 'ionicons/icons';
import { Notification } from '../models/notification.model';

@Component({
 schemas:[CUSTOM_ELEMENTS_SCHEMA],
  selector: 'app-notification-modal',
  templateUrl: './notification-modal.component.html',
  styleUrls: ['./notification-modal.component.scss'],
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonIcon,
    CommonModule
  ]
})
export class NotificationModalComponent {
  @Input() notification!: Notification;

  constructor(private modalController: ModalController) {
    addIcons({ close });
  }

  /**
   * Close the modal
   */
  closeModal(): void {
    this.modalController.dismiss();
  }

  /**
   * Check if notification has an image
   */
  hasImage(): boolean {
    return !!this.notification?.image_url;
  }
}

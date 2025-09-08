import { Component, Input, Output, EventEmitter } from '@angular/core';
import { 
  IonButton,
  IonInput,
  IonTextarea,
  IonToggle,
  IonDatetime,
  IonItem,
  IonLabel,
  IonModal
} from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Notification } from '../../models/notification.model';

@Component({
  selector: 'app-notification-form',
  templateUrl: './notification-form.component.html',
  styleUrls: ['./notification-form.component.scss'],
  imports: [
    IonButton,
    IonInput,
    IonTextarea,
    IonToggle,
    IonDatetime,
    IonItem,
    IonLabel,
    IonModal,
    CommonModule,
    FormsModule
  ]
})
export class NotificationFormComponent {
  @Input() notification: Partial<Notification> = {
    title: '',
    message: '',
    is_active: true,
    image_url: '',
    start_date: '',
    end_date: ''
  };

  @Input() isEditMode = false;
  @Input() saving = false; // Add saving state input
  @Output() save = new EventEmitter<Partial<Notification>>();
  @Output() cancel = new EventEmitter<void>();

  onSubmit(event: Event): void {
    event.preventDefault(); // Prevent default form submission
    this.save.emit(this.notification);
  }

  onCancel(): void {
    this.cancel.emit();
  }
}

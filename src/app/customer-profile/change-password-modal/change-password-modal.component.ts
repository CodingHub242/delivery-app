import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonContent, 
  IonButton, 
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonSpinner,
  ModalController 
} from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { addIcons } from 'ionicons';
import { close, checkmark, eyeOffOutline, eyeOutline } from 'ionicons/icons';
import { UserService } from '../../services/user.service';

@Component({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  selector: 'app-change-password-modal',
  templateUrl: './change-password-modal.component.html',
  styleUrls: ['./change-password-modal.component.scss'],
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonIcon,
    IonInput,
    IonItem,
    IonLabel,
    IonSpinner,
    CommonModule,
    FormsModule
  ]
})
export class ChangePasswordModalComponent {
  currentPassword = '';
  newPassword = '';
  confirmPassword = '';
  loading = false;
  error = '';
  showCurrentPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;

  constructor(
    private modalController: ModalController,
    private userService: UserService
  ) {
    addIcons({ close, checkmark, eyeOffOutline, eyeOutline });
  }

  /**
   * Close the modal
   */
  closeModal(): void {
    this.modalController.dismiss();
  }

  /**
   * Change password
   */
  async changePassword(): Promise<void> {
    if (!this.isFormValid()) {
      this.error = 'Please fill in all fields';
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.error = 'New passwords do not match';
      return;
    }

    if (this.newPassword.length < 6) {
      this.error = 'Password must be at least 6 characters long';
      return;
    }

    this.loading = true;
    this.error = '';

    try {
      await this.userService.changePassword({
        current_password: this.currentPassword,
        new_password: this.newPassword,
        confirm_password: this.confirmPassword
      }).toPromise();

      this.modalController.dismiss({ success: true }, 'success');
    } catch (error: any) {
      console.error('Error changing password:', error);
      this.error = error.error?.message || 'Failed to change password. Please try again.';
    } finally {
      this.loading = false;
    }
  }

  /**
   * Check if form is valid
   */
  public isFormValid(): boolean {
    return !!this.currentPassword && !!this.newPassword && !!this.confirmPassword;
  }

  /**
   * Toggle password visibility
   */
  togglePasswordVisibility(field: 'current' | 'new' | 'confirm'): void {
    switch (field) {
      case 'current':
        this.showCurrentPassword = !this.showCurrentPassword;
        break;
      case 'new':
        this.showNewPassword = !this.showNewPassword;
        break;
      case 'confirm':
        this.showConfirmPassword = !this.showConfirmPassword;
        break;
    }
  }
}

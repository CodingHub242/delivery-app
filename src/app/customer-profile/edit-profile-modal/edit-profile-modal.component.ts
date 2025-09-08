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
import { close, checkmark } from 'ionicons/icons';
import { User } from '../../models/user.model';
import { AuthService } from '../../services/auth.service';
import { UserService } from 'src/app/services/user.service';

@Component({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  selector: 'app-edit-profile-modal',
  templateUrl: './edit-profile-modal.component.html',
  styleUrls: ['./edit-profile-modal.component.scss'],
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
export class EditProfileModalComponent {
  user: User;
  loading = false;
  error = '';

  constructor(
    private modalController: ModalController,
    private authService: AuthService,
    private userService: UserService
  ) {
    addIcons({ close, checkmark });
    // Get current user from storage
    const currentUser = this.authService.getUserFromStorage();
    this.user = currentUser ? { ...currentUser } : {} as User;
  }

  /**
   * Close the modal
   */
  closeModal(): void {
    this.modalController.dismiss();
  }

  /**
   * Save profile changes
   */
  async saveProfile(): Promise<void> {
    if (!this.isFormValid()) {
      this.error = 'Please fill in all required fields';
      return;
    }

    this.loading = true;
    this.error = '';

    try {
      const updatedUser = await this.userService.updateProfile({
        name: this.user.name,
        email: this.user.email,
        phone: this.user.phone
      }).toPromise();

      this.modalController.dismiss(updatedUser, 'success');
    } catch (error: any) {
      console.error('Error updating profile:', error);
      this.error = error.error?.message || 'Failed to update profile. Please try again.';
    } finally {
      this.loading = false;
    }
  }

  /**
   * Check if form is valid
   */
  public isFormValid(): boolean {
    return !!this.user.name && !!this.user.email;
  }
}

import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonContent, 
  IonInput, 
  IonButton, 
  IonItem, 
  IonLabel,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonSelect,
  IonSelectOption
} from '@ionic/angular/standalone';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { RegisterRequest } from '../models/user.model';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  imports: [
    IonHeader, 
    IonToolbar, 
    IonTitle, 
    IonContent, 
    IonInput, 
    IonButton, 
    IonItem, 
    IonLabel,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
    IonSelect,
    IonSelectOption,
    FormsModule
  ]
})
export class RegisterPage {
  registerRequest: RegisterRequest = {
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'customer'
  };

  isLoading = false;
  errorMessage = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  async register() {
    this.isLoading = true;
    this.errorMessage = '';

    try {
      const response = await this.authService.register(this.registerRequest).toPromise();
      if (response) {
        // Store token using auth service
        this.authService.setToken(response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        
        this.router.navigate(['/home']);
      }
    } catch (error: any) {
      this.errorMessage = error.error?.message || 'Registration failed. Please try again.';
    } finally {
      this.isLoading = false;
    }
  }

  navigateToLogin() {
    this.router.navigate(['/login']);
  }
}

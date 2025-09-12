import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
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
  IonCardTitle
} from '@ionic/angular/standalone';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { LoginRequest } from '../models/user.model';
import { HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';

@Component({
  schemas:[CUSTOM_ELEMENTS_SCHEMA],
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  imports: [
    IonHeader, 
    IonToolbar, 
    IonTitle, 
    IonContent, 
    IonInput, 
    IonButton, 
    CommonModule,
    IonItem, 
    IonLabel,
    IonCard,
    HttpClientModule,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
    FormsModule
  ]
})
export class LoginPage {
  loginRequest: LoginRequest = {
    email: '',
    password: ''
  };

  isLoading = false;
  errorMessage = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  async login() {
    this.isLoading = true;
    this.errorMessage = '';

    try {
      const response = await this.authService.login(this.loginRequest).toPromise();
      if (response) {
        // Store token and user using auth service
        this.authService.setToken(response.token);
        this.authService.setUser(response.user);
        
        // Redirect based on user role
        if (response.user.role === 'admin') {
          this.router.navigate(['/admin-dashboard']);
        } else {
          this.router.navigate(['/home']);
        }
      }
    } catch (error: any) {
      this.errorMessage = error.error?.message || 'Login failed. Please try again.';
    } finally {
      this.isLoading = false;
    }
  }

  navigateToRegister() {
    this.router.navigate(['/register']);
  }

  navigateToWork() {
    this.router.navigate(['/worker-login']);
  }

  navigateToGuest() {
    this.router.navigate(['/home']);
  }
}

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
  IonText
} from '@ionic/angular/standalone';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { LoginRequest } from '../models/user.model';
import { HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-login',
  templateUrl: './admin-login.page.html',
  styleUrls: ['./admin-login.page.scss'],
  imports: [
    IonHeader, 
    IonToolbar, 
    IonTitle, 
    IonContent, 
    IonInput, 
    IonButton, 
    IonItem, 
    IonLabel,
    CommonModule,
    IonCard,
    HttpClientModule,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
    IonText,
    FormsModule
  ]
})
export class AdminLoginPage {
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
        
        // Check if user is actually an admin
        if (response.user.role === 'admin') {
          this.router.navigate(['/admin-dashboard']);
        } else {
          this.errorMessage = 'Access denied. Admin privileges required.';
          this.authService.completeLogout();
        }
      }
    } catch (error: any) {
      this.errorMessage = error.error?.message || 'Login failed. Please try again.';
    } finally {
      this.isLoading = false;
    }
  }

  navigateToRegularLogin() {
    this.router.navigate(['/login']);
  }

  navigateToRegister() {
    this.router.navigate(['/register']);
  }
}

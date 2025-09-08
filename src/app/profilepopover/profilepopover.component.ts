import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  schemas:[CUSTOM_ELEMENTS_SCHEMA],
  selector: 'app-profilepopover',
  templateUrl: './profilepopover.component.html',
  styleUrls: ['./profilepopover.component.scss'],
  imports: [CommonModule]
})
export class ProfilepopoverComponent  implements OnInit {
  currentUser: any;

  constructor(private router: Router, private authService: AuthService) { }

  ngOnInit() {
    this.currentUser = this.authService.getUserFromStorage();
  }

  navigateToProfile() {
    if (this.currentUser?.role === 'admin') {
      this.router.navigate(['/admin-dashboard']);
    } else if (this.currentUser?.role === 'worker') {
      this.router.navigate(['/driver-profile']);
    } else {
      this.router.navigate(['/customer-profile']);
    }
  }

  navigateToDashboard() {
    if (this.currentUser?.role === 'worker') {
      this.router.navigate(['/worker-dashboard']);
    }
  }

  logout() {
    this.authService.completeLogout();
    this.router.navigate(['/login']);
  }
}

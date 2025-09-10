import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit,Inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { PopoverController } from '@ionic/angular';
import { CommonModule } from '@angular/common';

@Component({
  schemas:[CUSTOM_ELEMENTS_SCHEMA],
  selector: 'app-profilepopover',
  templateUrl: './profilepopover.component.html',
  styleUrls: ['./profilepopover.component.scss'],
  providers:[PopoverController],
  imports: [CommonModule]
})
export class ProfilepopoverComponent  implements OnInit {
  currentUser: any;

  constructor(private router: Router, private authService: AuthService, @Inject(PopoverController)private poper:PopoverController) { }

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

    this.poper.dismiss();
  }

  navigateToDashboard() {
    if (this.currentUser?.role === 'worker') {
      this.router.navigate(['/worker-dashboard']);
    }
    this.poper.dismiss();
  }

  navigateToChat() {
    this.router.navigate(['/chat-support']);
    this.poper.dismiss();
  }

  logout() {
    this.authService.completeLogout();
    this.authService.currentUser = null;
     this.authService.removeToken();
    this.authService.removeUser();
    this.router.navigate(['/login']);
    this.poper.dismiss();
  }
}

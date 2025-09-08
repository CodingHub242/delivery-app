import { Component, CUSTOM_ELEMENTS_SCHEMA,Inject } from '@angular/core';
import { 
  IonApp, 
  IonRouterOutlet, 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonButtons, 
  IonButton, 
  IonIcon,
  IonList,
  IonItem,
  IonLabel
} from '@ionic/angular/standalone';
import { AuthService } from './services/auth.service';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import { PopoverController } from '@ionic/angular';
import { personCircle, chevronDown, person, logOut } from 'ionicons/icons';
import { ApiService } from './services/api.service';
import { CommonModule } from '@angular/common';
import { ProfilepopoverComponent } from './profilepopover/profilepopover.component';
import { CartIconComponent } from './cart-icon/cart-icon.component';
import $ from 'jquery';
import { RefreshService } from './services/refresh.service';

@Component({
  standalone: true,
  schemas:[CUSTOM_ELEMENTS_SCHEMA],
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  providers:[PopoverController],
  imports: [
    IonApp, 
    CartIconComponent,
    IonRouterOutlet,
    IonHeader,
    CommonModule,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonIcon,
    IonList,
    IonItem,
    IonLabel
  ],
})
export class AppComponent {
  currentUser: any = null;
  showDropdown: boolean = false;
  cartItems: any[] = [];

  constructor(
    private authService: AuthService,
    private router: Router,
    private apiService: ApiService,
    private refreshService: RefreshService,
    @Inject(PopoverController)private popoverController: PopoverController
  ) {
    addIcons({ personCircle, chevronDown, person, logOut });
    this.loadCurrentUser();
    this.cartItems = this.apiService.getCartItems();
  }

   ngOnInit() {
    this.loadCurrentUser();
    // Initialize cart when app starts
    if (this.authService.isLoggedIn() && this.authService.isCustomer()) {
      this.apiService.initializeCart();
    }

     this.refreshService.refresh$.subscribe(() => {
      this.refreshChildComponent();
      this.checkLogg();
    });
  }

  refreshChildComponent() {
    console.log('Refreshing child component...');
    this.apiService.initializeCart();
    //$('app-cart-icon').load('app-cart-icon');
    // Add your refresh logic here (e.g., reload data, reset state, etc.)
  }

  checkLogg(){
    this.authService.getUserFromStorage();
  }

  loadCurrentUser() {
    this.currentUser = this.authService.getUserFromStorage();
    if (this.currentUser) {
      this.apiService.initializeCart();
    }
  }

  toggleDropdown() {
    this.showDropdown = !this.showDropdown;
  }

  // navigateToProfile() {
  //   this.showDropdown = false;
  //   if (this.currentUser?.role === 'admin') {
  //     this.router.navigate(['/admin-dashboard']);
  //   } else if (this.currentUser?.role === 'worker') {
  //     this.router.navigate(['/driver-profile']);
  //   } else {
  //     this.router.navigate(['/customer-profile']);
  //   }
  // }

  // logout() {
  //   this.showDropdown = false;
  //   this.authService.completeLogout();
  //   this.router.navigate(['/login']);
  // }

  navigateToCart() {
    this.router.navigate(['/checkout']);
  }

  shouldShowHeader(): boolean {
    const currentRoute = this.router.url;
    return !['/login', '/register', '/admin-login'].includes(currentRoute);
  }

   async presentPopover(event: any) {
    const popover = await this.popoverController.create({
      component: ProfilepopoverComponent,
      event: event,
      translucent: true,
      cssClass: 'profile-popover'
    });
    return await popover.present();
  }
}

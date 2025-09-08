import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonContent, 
  IonCard, 
  IonCardHeader, 
  IonCardTitle, 
  IonCardContent,
  IonButton,
  IonGrid,
  IonRow,
  IonCol,
  IonIcon,
  IonButtons,
    IonSpinner,
    IonToast,
    IonBadge
} from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';
import { LocalizationService } from '../services/localization.service';
import { TranslationService } from '../services/translation.service';
import { Service, Product } from '../models/service.model';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { Platform } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { car, brush, construct, cart, person, chatbubble, logOut, basket } from 'ionicons/icons';
import { TranslatePipe } from '../pipes/translate.pipe';
import { CurrencyPipe } from '../pipes/currency.pipe';
import { CartIconComponent } from '../cart-icon/cart-icon.component';
import { RefreshService } from '../services/refresh.service';
import { NotificationService } from '../services/notification.service';


@Component({
  schemas:[CUSTOM_ELEMENTS_SCHEMA],
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  imports: [
    IonHeader, 
    IonToolbar, 
    IonTitle, 
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonButton,
    IonGrid,
    IonRow,
    IonCol,
    IonIcon,
    IonButtons,
    IonSpinner,
    IonBadge,
    CommonModule,
    HttpClientModule,
    TranslatePipe,
    CurrencyPipe
  ],
  providers: [ApiService,CartIconComponent]
})
export class HomePage implements OnInit {
  services: Service[] = [];
  shopProducts: Product[] = []; // New array for shop products
  loading: boolean = true;
  error: string = '';
  deliveryId: number = 0; // To be set from backend
  receiverId: number = 0; // To be set from backend
  currentUSer:any;
  showToast: boolean = false;
  toastMessage: string = '';
  itemCount: number = 0;

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private router: Router,
    private platform: Platform,
    private refreshService: RefreshService,
    private cartIconComponent: CartIconComponent,
    private localizationService: LocalizationService,
    private translationService: TranslationService,
    private notificationService: NotificationService
  ) {
    addIcons({ car, brush, construct, cart, person, chatbubble, logOut, basket });

  
  }

  async ngOnInit() {
    this.loadServices();
    this.loadShopProducts(); // Load shop products
    this.currentUSer = this.authService.getUserFromStorage();
    
    // Check for promotional notifications
    await this.notificationService.checkAndShowNotifications();

    this.triggerRefresh();
  }

  triggerRefresh() {
    this.refreshService.triggerRefresh();
  }

  loadServices() {
    this.loading = true;
    this.apiService.getServices().subscribe({
      next: (services) => {
        this.services = services;
        this.loading = false;

        // Only fetch user deliveries if user is logged in
        if (this.currentUSer && this.currentUSer.id) {
          this.apiService.getUserDeliveries(this.currentUSer.id).subscribe({
            next: (deliveries) => {
              if (deliveries.length > 0) {
                this.deliveryId = deliveries[0].id; // Set to the first delivery ID
                this.receiverId = deliveries[0].receiver_id; // Set to the corresponding receiver ID
              }
            },
            error: (error) => {
              console.error('Error loading user deliveries:', error);
            }
          });
        }
      },
      error: (error) => {
        this.error = this.translationService.translate('failed_load_services');
        this.loading = false;
        console.error('Error loading services:', error);
      }
    });
  }

  getServiceIcon(serviceName: string): string {
    const icons: { [key: string]: string } = {
      'delivery': 'car',
      'painting': 'brush',
      'plumbing': 'construct',
      'shopping': 'cart',
      'default': 'person'
    };
    
    const lowerName = serviceName.toLowerCase();
    return icons[lowerName] || icons['default'];
  }

  selectService(service: Service) {
   // console.log('Selected service:', service);
    this.router.navigate(['/service', service.id]);
  }

  navigateToChat() {
    this.router.navigate(['/chat-support']);
  }

  loadShopProducts() {
    this.apiService.getShopProducts().subscribe({
      next: (products) => {
        this.shopProducts = products; // Set the shop products
      },
      error: (error) => {
        console.error('Error loading shop products:', error);
      }
    });
  }

  addToCart(product: Product) {
    // Check if user is logged in
    if (!this.authService.isLoggedIn()) {
      this.toastMessage = 'Please login to add items to cart';
      this.showToast = true;
      this.router.navigate(['/login']);
      return;
    }

    if (product.stock_quantity !== undefined && product.stock_quantity <= 0) {
        this.toastMessage = `${product.name} is out of stock.`;
        this.showToast = true;
    }
    else{
       this.apiService.addToCart(product.id).subscribe({
      next: (response) => {
        console.log('Added to cart:', response);
        // Show success toast
        this.toastMessage = `${product.name} added to cart successfully!`;
        this.showToast = true;
        // Increment item count
        this.cartIconComponent.cartCount++;
         
       this.triggerRefresh();
        // Increment item count
       // this.itemCount++;
      // console.log('Current cart count:', this.apiService.getCartCount());
       // Optional: Manually trigger cart count update if needed
      setTimeout(() => {
        const currentCount = this.apiService.getCartCount();
      //  console.log('Cart count after timeout:', currentCount);
      }, 100);
      },
      error: (error) => {
        console.error('Error adding to cart:', error);
        // Show error toast
        this.toastMessage = 'Failed to add product to cart. Please try again.';
        this.showToast = true;
      }
    });
    }
  }

  logout() {
    this.authService.completeLogout();
    this.router.navigate(['/login']);
    this.triggerRefresh();
  }

  navigateToCart() {
    this.router.navigate(['/checkout']);
  }
}

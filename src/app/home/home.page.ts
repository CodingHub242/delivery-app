import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
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
import {StatusBar} from '@capacitor/status-bar';
// import 'assets/owl.carousel.css';
// import 'owl.carousel';
import {register} from 'swiper/element/bundle';
import $ from 'jquery';

// Add this declaration to extend JQuery with owlCarousel
// declare global {
//   interface JQuery {
//     owlCarousel(options?: any): JQuery;
//   }
// }

// Swiper imports
import Swiper from 'swiper';
import { SwiperOptions } from 'swiper/types';

register();

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
export class HomePage implements OnInit, AfterViewInit {
  @ViewChild('swiperContainer', { static: false }) swiperContainer!: ElementRef;
  swiper!: Swiper;
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

  infoCards = [
    {
      title: 'ACCESSIBLE CUSTOMER SERVICE',
      description: '',
      image: 'https://assets.bonappetit.com/photos/63e6c29840953eab0f1ffca3/16:9/w_2560%2Cc_limit/Best_cleaning_products.jpg'
    },
    {
      title: '1 YEAR WARRANTY, ONLY REPLACE NO REPAIR',
      description: '',
      image: 'https://assets.bonappetit.com/photos/63e6c29840953eab0f1ffca3/16:9/w_2560%2Cc_limit/Best_cleaning_products.jpg'
    },
    {
      title: 'FREE SHIPPING OVER ₵120 DOOR TO DOOR DELIVERY',
      description: '',
      image: 'https://assets.bonappetit.com/photos/63e6c29840953eab0f1ffca3/16:9/w_2560%2Cc_limit/Best_cleaning_products.jpg'
    },
    {
      title: 'ORAIMO AUTHENTICITY & BEST PRICE GUARANTEED',
      description: '',
      image: 'https://assets.bonappetit.com/photos/63e6c29840953eab0f1ffca3/16:9/w_2560%2Cc_limit/Best_cleaning_products.jpg'
    },
    {
      title: 'ESHOP EXCLUSIVE COMMUNITY EVENTS, SCAN TO JOIN O-CLUB GH NOW!',
      description: '',
      image: 'https://assets.bonappetit.com/photos/63e6c29840953eab0f1ffca3/16:9/w_2560%2Cc_limit/Best_cleaning_products.jpg'
    },
    {
      title: 'BUY TO GET ORAIMO EXPLORER POINTS, EXTRA POINTS FOR MEMBERS',
      description: '',
      image: 'https://via.placeholder.com/100?text=Explorer+Points'
    },
    {
      title: 'NATIONWIDE OFFLINE AFTER-SALES OUTLETS',
      description: '',
      image: 'https://via.placeholder.com/100?text=Carlcare+Service'
    }
  ];

  // Hero slider properties
  slides = [
    {
      title: 'CLEANING MADE SIMPLE',
      subtitle: 'variety of services',
      description: 'Choose from a wide range of cleaning services to suit your needs',
      bgColor: '#231F20', // dark blackish
      bgImage: '../assets/img/s1.jpg' // corrected path
    },
    {
      title: 'RELIABLE DELIVERY',
      subtitle: 'On-time and secure',
      description: 'We guarantee delivery on time',
      bgColor: '#426C95', // blue
      bgImage: '../assets/img/s2.jpg'
    },
    {
      title: 'AFFORDABLE PRICES',
      subtitle: 'Best value for your money',
      description: 'Competitive pricing without compromising on quality',
      bgColor: '#F15F4E', // red-orange
      bgImage: '../assets/img/s3.jpg'
    },
    // {
    //   title: 'EASY TO USE APP',
    //   subtitle: 'Simple and intuitive interface',
    //   bgColor: '#F4D550', // yellow
    //   bgImage: '../assets/img/s4.jpg'
    // },
    {
      title: 'CUSTOMER SATISFACTION',
      subtitle: 'We value our customers',
      description: 'Our top priority is ensuring our customers are satisfied with our services',
      bgColor: '#FAF7D8', // light cream
      bgImage: '../assets/img/s5.jpg'
    }
  ];

  swiperConfig: SwiperOptions = {
    autoplay: {
      delay: 5000,
      disableOnInteraction: false,
    },
    loop: true,
    pagination: {
      el: '.swiper-pagination',
      clickable: true,
    },
    navigation: {
      nextEl: '.swiper-button-next',
      prevEl: '.swiper-button-prev',
    },
  };

  constructor(
    private apiService: ApiService,
    public authService: AuthService,
    private router: Router,
    private platform: Platform,
    private refreshService: RefreshService,
    private cartIconComponent: CartIconComponent,
    private localizationService: LocalizationService,
    private translationService: TranslationService,
    private notificationService: NotificationService
  ) {
    addIcons({ car, brush, construct, cart, person, chatbubble, logOut, basket });

    StatusBar.setOverlaysWebView({ overlay: false });
    StatusBar.setBackgroundColor({ color: '#9f3a2e' });

    // $(document).ready(function(){
    //   $(".owl-carousel").owlCarousel();
    // });
  }

  async ngOnInit() {
    this.preloadSliderImages(); // Preload slider images to prevent loading delays
    this.loadServices();
    this.loadShopProducts(); // Load shop products
    this.authService.currentUser = this.authService.getUserFromStorage();

    if(this.authService.currentUser.role=='admin'){
      this.router.navigate(['/admin-dashboard']);
    }
    else if(this.authService.currentUser.role=='worker'){
      this.router.navigate(['/worker-dashboard']);
    }else{
      // Stay on home page for customers and guests
    } 

    // Check for promotional notifications
    await this.notificationService.checkAndShowNotifications();

    this.triggerRefresh();
  }

  preloadSliderImages() {
    this.slides.forEach(slide => {
      const img = new Image();
      img.src = slide.bgImage;
    });

    
  }

  ngAfterViewInit() {
    // Initialize Swiper if not automatically initialized
    const swiperEl = this.swiperContainer?.nativeElement;
    if (swiperEl && swiperEl.swiper) {
      // Swiper already initialized
    } else if (swiperEl) {
      Object.assign(swiperEl, this.swiperConfig);
      swiperEl.initialize();
    }

     // Assuming you have an array of carousel items
    const carouselItems = document.querySelectorAll('.carousel-item');
    const indicators = document.querySelectorAll('.carousel-indicators button');

    console.log('Carousel Items:', indicators);

    // Remove 'active' class from all items and indicators
    carouselItems.forEach(item => item.classList.remove('active'));
    indicators.forEach(indicator => indicator.classList.remove('active'));

    // Add 'active' class to the first item and its corresponding indicator
    if (carouselItems.length > 0) {
      carouselItems[0].classList.add('active');
      if (indicators.length > 0) {
        indicators[0].classList.add('active');
      }
    }
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
              // Assuming you have an array of carousel items
              const carouselItems = document.querySelectorAll('.carousel-item');
              const indicators = document.querySelectorAll('.carousel-indicators button');

              console.log('Carousel Items:', indicators);

              // Remove 'active' class from all items and indicators
              carouselItems.forEach(item => item.classList.remove('active'));
              indicators.forEach(indicator => indicator.classList.remove('active'));

              // Add 'active' class to the first item and its corresponding indicator
              if (carouselItems.length > 0) {
                carouselItems[0].classList.add('active');
                if (indicators.length > 0) {
                  indicators[0].classList.add('active');
                }
              }
            },
            error: (error) => {
              console.error('Error loading user deliveries:', error);

              // Assuming you have an array of carousel items
              const carouselItems = document.querySelectorAll('.carousel-item');
              const indicators = document.querySelectorAll('.carousel-indicators button');

              console.log('Carousel Items:', indicators);

              // Remove 'active' class from all items and indicators
              carouselItems.forEach(item => item.classList.remove('active'));
              indicators.forEach(indicator => indicator.classList.remove('active'));

              // Add 'active' class to the first item and its corresponding indicator
              if (carouselItems.length > 0) {
                carouselItems[0].classList.add('active');
                if (indicators.length > 0) {
                  indicators[0].classList.add('active');
                }
              }
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
   // this.ngOnInit();
  }

  ReloadServices() {
    this.ngOnInit();
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

import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

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
  IonIcon,
  IonButtons,
  IonBackButton,
  IonList,
  IonItem,
  IonLabel,
  IonBadge,
  IonSpinner,
  ModalController
} from '@ionic/angular/standalone';
import { AuthService } from '../services/auth.service';
import { ApiService } from '../services/api.service';
import { UserService } from '../services/user.service';
import { User } from '../models/user.model';
import { Order } from '../models/order.model';
import { ServiceRequest, SERVICE_REQUEST_STATUS } from '../models/service-request.model';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { addIcons } from 'ionicons';
import { camera, personOutline, mailOutline, callOutline, peopleOutline, calendarOutline, createOutline, lockClosedOutline, receiptOutline, chatbubbleEllipsesOutline, navigateOutline, timeOutline, closeOutline, documentTextOutline } from 'ionicons/icons';
import { TranslatePipe } from '../pipes/translate.pipe';
import { OrderDetailsModalComponent } from './order-details-modal/order-details-modal.component';
import { EditProfileModalComponent } from './edit-profile-modal/edit-profile-modal.component';
import { ChangePasswordModalComponent } from './change-password-modal/change-password-modal.component';

@Component({
  selector: 'app-customer-profile',
  templateUrl: './customer-profile.page.html',
  styleUrls: ['./customer-profile.page.scss'],
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
    IonIcon,
    IonButtons,
    IonBackButton,
    IonList,
    IonItem,
    IonLabel,
    IonBadge,
    IonSpinner,
    CommonModule,
    FormsModule,
    TranslatePipe
  ]
})
export class CustomerProfilePage implements OnInit {
  customer: User | null = null;
  profilePicture: File | null = null;
  profileImageUrl: string | null = null;
  orders: Order[] = [];
  loadingOrders: boolean = false;
  ordersError: string = '';
  
  serviceRequests: ServiceRequest[] = [];
  loadingServiceRequests: boolean = false;
  serviceRequestsError: string = '';
  activeTab: 'orders' | 'service-requests' = 'orders';

  constructor(
    private authService: AuthService,
    private apiService: ApiService,
    private userService: UserService,
    private router: Router,
    private modalController: ModalController
  ) {
    addIcons({ 
      camera, 
      personOutline, 
      mailOutline, 
      callOutline, 
      peopleOutline, 
      calendarOutline, 
      createOutline, 
      lockClosedOutline, 
      receiptOutline, 
      chatbubbleEllipsesOutline,
      navigateOutline,
      timeOutline,
      closeOutline
    });
  }

  ngOnInit() {
    this.loadCustomerDetails();
    this.loadOrders();
  }

  switchTab(tab: 'orders' | 'service-requests') {
    this.activeTab = tab;
    if (tab === 'service-requests' && this.serviceRequests.length === 0) {
      this.loadServiceRequests();
    }
  }

  loadServiceRequests() {
    if (!this.customer?.id) return;

    this.loadingServiceRequests = true;
    this.serviceRequestsError = '';

    const customerId = this.customer.id;

    // Try the primary method first
    this.apiService.getUserServiceRequests(customerId).subscribe({
      next: (requests) => {
        this.serviceRequests = requests.data.data;
        console.log('Loaded service requests:', requests);
        this.loadingServiceRequests = false;
      },
      error: (error) => {
        console.warn('Primary service requests endpoint failed, trying alternative:', error);
        // Fallback to alternative method
        this.apiService.getServiceRequestsByUser(customerId).subscribe({
          next: (requests) => {
            this.serviceRequests = requests;
            this.loadingServiceRequests = false;
          },
          error: (fallbackError) => {
            this.serviceRequestsError = 'Failed to load service requests. Please try again later.';
            this.loadingServiceRequests = false;
            console.error('Both service request endpoints failed:', fallbackError);
          }
        });
      }
    });
  }

  loadCustomerDetails() {
    this.customer = this.authService.getUserFromStorage();
    // Load profile picture from localStorage if available
    const profilePic = localStorage.getItem('profile_picture');
    if (profilePic) {
      this.profileImageUrl = profilePic;
    }
  }

  loadOrders() {
    if (!this.customer?.id) return;
    
    this.loadingOrders = true;
    this.ordersError = '';
    
    //this.apiService.getUserDeliveries(this.customer.id).subscribe({
     this.apiService.getUserOrders(this.customer.id).subscribe({
      next: (deliveries) => {
        this.orders = deliveries.data.data;
        this.loadingOrders = false;
      },
      error: (error) => {
        this.ordersError = 'Failed to load order history. Please try again later.';
        this.loadingOrders = false;
        console.error('Error loading orders:', error);
      }
    });
  }

  isCurrentOrder(order: Order): boolean {
    const currentStatuses = ['preparing', 'in_transit', 'out_for_delivery', 'picked_up','accepted'];
    return currentStatuses.includes(order.status?.toLowerCase());
  }

  trackOrder(orderId: number) {
    this.router.navigate(['/delivery-tracking'], { 
      queryParams: { orderId: orderId } 
    });
  }

  async viewOrderDetails(order: Order) {
    const modal = await this.modalController.create({
      component: OrderDetailsModalComponent,
      componentProps: {
        order: order
      },
      cssClass: 'order-details-modal'
    });
    
    await modal.present();
  }

  async viewServiceRequestDetails(request: ServiceRequest) {
    // Navigate to service details page with the request ID
    this.router.navigate(['/service-details', request.id]);
  }

  getStatusBadgeColor(status: string): string {
    const statusLower = status.toLowerCase();
    switch (statusLower) {
      case 'delivered':
        return 'success';
      case 'cancelled':
        return 'danger';
      case 'preparing':
      case 'in_transit':
      case 'out_for_delivery':
        return 'warning';
      default:
        return 'primary';
    }
  }

  getServiceRequestStatusBadgeColor(status: string): string {
    const statusLower = status.toLowerCase();
    switch (statusLower) {
      case 'completed':
        return 'success';
      case 'cancelled':
      case 'rejected':
        return 'danger';
      case 'pending':
        return 'warning';
      case 'accepted':
      case 'in_progress':
        return 'primary';
      default:
        return 'medium';
    }
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  }

  onProfilePictureChange(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.profilePicture = file;
      
      // Preview the image
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.profileImageUrl = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  async uploadProfilePicture() {
    if (!this.profilePicture) return;

    try {
      await this.userService.uploadProfilePicture(this.profilePicture).toPromise();
      alert('Profile picture updated successfully!');
      // Update localStorage with new image URL
      if (this.profileImageUrl) {
        localStorage.setItem('profile_picture', this.profileImageUrl);
      }
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      alert('Failed to upload profile picture. Please try again.');
    }
  }

  async editProfile() {
    const modal = await this.modalController.create({
      component: EditProfileModalComponent,
      cssClass: 'edit-profile-modal'
    });

    modal.onDidDismiss().then((result:any) => {
      if (result.success === 'true' && result.user) {
        this.customer = result.user;
        if (this.customer) {
          this.authService.setUser(this.customer);
        }
      }
      location.reload();
    });

    await modal.present();
  }

  async changePassword() {
    const modal = await this.modalController.create({
      component: ChangePasswordModalComponent,
      cssClass: 'change-password-modal'
    });

    modal.onDidDismiss().then((result) => {
      if (result.role === 'success') {
        alert('Password changed successfully!');
      }
    });

    await modal.present();
  }

  viewOrderHistory() {
    // Placeholder for order history functionality
    alert('Order history functionality will be implemented here');
  }

  contactSupport() {
    // Placeholder for contact support functionality
    alert('Contact support functionality will be implemented here');
  }
}

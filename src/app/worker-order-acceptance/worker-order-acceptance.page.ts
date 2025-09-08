import { Component, OnInit, OnDestroy, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardHeader,
         IonCardTitle, IonCardContent, IonButton, IonIcon, IonSpinner,
         IonText, IonBadge, IonAlert, IonToast, IonRefresher,
         IonRefresherContent, IonList, IonItem, IonLabel, IonChip } from '@ionic/angular/standalone';
import { checkmarkCircle, closeCircle, location, time, person, call, cash, cube, navigate, documentTextOutline, chatbubble } from 'ionicons/icons';
import { addIcons } from 'ionicons';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';
import { Subscription, interval } from 'rxjs';
import { Geolocation } from '@capacitor/geolocation';
import { Router } from '@angular/router';

interface Order {
  id: number;
  tracking_id: string;
  pickup_location: string;
  delivery_location: string;
  status: string;
  estimated_cost: number;
  scheduled_time: string;
  created_at: string;
  user: {
    id: number;
    name: string;
    email: string;
    profile_picture?: string;
  };
  package_description?: string;
  notes?: string;
}

@Component({
  schemas:[CUSTOM_ELEMENTS_SCHEMA],
  selector: 'app-worker-order-acceptance',
  templateUrl: './worker-order-acceptance.page.html',
  styleUrls: ['./worker-order-acceptance.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardHeader,
           IonCardTitle, IonCardContent, IonButton, IonIcon, IonSpinner,
           IonText, IonBadge, IonAlert, IonToast, IonRefresher,
           IonRefresherContent, IonList, IonItem, IonLabel, IonChip,
           CommonModule, FormsModule]
})
export class WorkerOrderAcceptancePage implements OnInit, OnDestroy {
  orders: Order[] = [];
  isLoading = false;
  isRefreshing = false;
  hasLocationPermission = false;
  currentLocation: { latitude: number; longitude: number } | null = null;

  // Alert and toast
  alertButtons = [
    {
      text: 'Cancel',
      role: 'cancel',
    },
    {
      text: 'Reject',
      role: 'confirm',
      handler: () => this.confirmReject(),
    },
  ];

  selectedOrderId: number | null = null;
  showRejectAlert = false;
  rejectReason = '';

  toastMessage = '';
  showToast = false;
  toastColor: 'success' | 'danger' | 'warning' = 'success';

  private refreshSubscription?: Subscription;
  private locationWatchId?: string;
  private lastLocationUpdate = 0;
  private readonly LOCATION_UPDATE_INTERVAL = 10000; // 10 seconds minimum between updates
  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private router:Router
  ) {
    addIcons({
      checkmarkCircle,
      closeCircle,
      location,
      time,
      person,
      call,
      cash,
      cube,
      navigate,
      documentTextOutline,
      chatbubble
    });
  }

  async ngOnInit() {
    await this.requestLocationPermission();
    await this.loadAssignedOrders();

    // Auto-refresh orders every 30 seconds
    this.refreshSubscription = interval(30000).subscribe(() => {
      this.loadAssignedOrders(true);
    });

    console.log(this.authService.getUser())
  }

  ngOnDestroy() {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
    if (this.locationWatchId) {
      Geolocation.clearWatch({ id: this.locationWatchId });
    }
  }

  async requestLocationPermission(): Promise<void> {
    try {
      console.log('🔍 Requesting location permission...');
      const permission = await Geolocation.requestPermissions();
      console.log('📋 Permission result:', permission);
      this.hasLocationPermission = permission.location === 'granted';
      console.log('✅ Location permission granted:', this.hasLocationPermission);

      if (this.hasLocationPermission) {
        console.log('🚀 Starting location tracking...');
        await this.startLocationTracking();
      } else {
        console.log('❌ Location permission denied');
      }
    } catch (error) {
      console.error('❌ Error requesting location permission:', error);
      this.showToastMessage('Location permission is required for order acceptance', 'warning');
    }
  }

  async startLocationTracking(): Promise<void> {
    try {
      // Get current position
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000
      });

      this.currentLocation = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      };

      // Start watching position for real-time updates
      this.locationWatchId = await Geolocation.watchPosition({
        enableHighAccuracy: true,
        timeout: 10000
      }, async (position, error) => {
        if (position) {
          const newLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };

          // Update local location
          this.currentLocation = newLocation;

          // Throttle location updates to backend (every 10 seconds minimum)
          const now = Date.now();
          if (now - this.lastLocationUpdate >= this.LOCATION_UPDATE_INTERVAL) {
            this.lastLocationUpdate = now;
            console.log(`📍 Location changed: ${newLocation.latitude}, ${newLocation.longitude}`);
            await this.updateWorkerLocation(newLocation.latitude, newLocation.longitude);
          } else {
            console.log(`📍 Location changed but throttled: ${newLocation.latitude}, ${newLocation.longitude}`);
          }
        }
      });
    } catch (error) {
      console.error('Error getting location:', error);
      this.showToastMessage('Unable to get your location', 'danger');
    }
  }

  async loadAssignedOrders(silent = false): Promise<void> {
    if (!silent) {
      this.isLoading = true;
    }

    try {
      const response = await this.apiService.getAssignedOrders().toPromise();
      if (response && response.success) {
        this.orders = response.data || [];
      }
    } catch (error) {
      console.error('Error loading assigned orders:', error);
      this.showToastMessage('Failed to load orders', 'danger');
    } finally {
      this.isLoading = false;
      this.isRefreshing = false;
    }
  }

  async doRefresh(event: any): Promise<void> {
    this.isRefreshing = true;
    await this.loadAssignedOrders();
    event.target.complete();
  }

  async acceptOrder(orderId: number): Promise<void> {
    if (!this.hasLocationPermission) {
      this.showToastMessage('Location permission is required to accept orders', 'warning');
      await this.requestLocationPermission();
      return;
    }

    try {
      const response = await this.apiService.acceptOrder(orderId).toPromise();
      if (response && response.success) {
        this.showToastMessage('Order accepted successfully!', 'success');
        await this.loadAssignedOrders(true);

        // Update worker location if available
        if (this.currentLocation) {
          await this.updateWorkerLocation();
        }
      }
    } catch (error) {
      console.error('Error accepting order:', error);
      this.showToastMessage('Failed to accept order', 'danger');
    }
  }

  showRejectDialog(orderId: number): void {
    this.selectedOrderId = orderId;
    this.rejectReason = '';
    this.showRejectAlert = true;
  }

  confirmReject(): void {
    if (this.selectedOrderId) {
      this.rejectOrder(this.selectedOrderId, this.rejectReason);
    }
  }

  async rejectOrder(orderId: number, reason: string): Promise<void> {
    try {
      const response = await this.apiService.rejectOrder(orderId, reason).toPromise();
      if (response && response.success) {
        this.showToastMessage('Order rejected successfully', 'success');
        await this.loadAssignedOrders(true);
      }
    } catch (error) {
      console.error('Error rejecting order:', error);
      this.showToastMessage('Failed to reject order', 'danger');
    } finally {
      this.showRejectAlert = false;
      this.selectedOrderId = null;
      this.rejectReason = '';
    }
  }

  async updateWorkerLocation(latitude?: number, longitude?: number): Promise<void> {
    const locationToUpdate = latitude !== undefined && longitude !== undefined
      ? { latitude, longitude }
      : this.currentLocation;

    if (!locationToUpdate) {
      console.log('⚠️ No location data available to update');
      return;
    }

    try {
      console.log('🔍 Getting current user details...');
      const userDetails = await this.authService.getUserFromStorage();//().toPromise();
      console.log('👤 User details response:', userDetails);

      // Try to extract worker_id from nested user object if present
      let workerId = userDetails?.id;
      if (!workerId && userDetails && userDetails.id) {
        workerId = userDetails.id;
      }

      if (workerId) {
        console.log(`📡 Updating worker ${workerId} location: ${locationToUpdate.latitude}, ${locationToUpdate.longitude}`);
        try {
          const updateResponse = await this.apiService.updateWorkerLocation(
            workerId,
            locationToUpdate.latitude,
            locationToUpdate.longitude
          ).toPromise();
          console.log('✅ Worker location update response:', JSON.stringify(updateResponse, null, 2));
          if (!updateResponse || !updateResponse.success) {
            console.error('❌ Worker location update failed:', JSON.stringify(updateResponse, null, 2));
          }
          console.log(`✅ Worker location updated: ${locationToUpdate.latitude}, ${locationToUpdate.longitude}`);
        } catch (error) {
          console.error('❌ Error during worker location update API call:', error);
        }
      } else {
        console.error('❌ User details not found or missing worker_id:', userDetails);
        // Try fallback to getWorkerDetails
        console.log('🔄 Trying fallback method...');
        const workerDetails = await this.apiService.getWorkerDetails().toPromise();
        console.log('👷 Worker details fallback response:', workerDetails);

        if (workerDetails && workerDetails.id) {
          console.log(`📡 Updating worker ${workerDetails.id} location (fallback): ${locationToUpdate.latitude}, ${locationToUpdate.longitude}`);
          const updateResponse = await this.apiService.updateWorkerLocation(
            workerDetails.id,
            locationToUpdate.latitude,
            locationToUpdate.longitude
          ).toPromise();
          console.log('✅ Worker location update response (fallback):', JSON.stringify(updateResponse, null, 2));
          console.log(`✅ Worker location updated (fallback): ${locationToUpdate.latitude}, ${locationToUpdate.longitude}`);
        } else {
          console.error('❌ Both methods failed - no worker ID available');
        }
      }
    } catch (error) {
      console.error('❌ Error updating worker location:', error);
      const err = error as any;
      console.error('❌ Error details:', {
        message: err?.message,
        status: err?.status,
        statusText: err?.statusText,
        url: err?.url
      });
    }
  }

  getStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
      'pending': 'warning',
      'assigned': 'primary',
      'accepted': 'success',
      'picked_up': 'secondary',
      'in_transit': 'tertiary',
      'out_for_delivery': 'tertiary',
      'delivered': 'success',
      'cancelled': 'danger'
    };
    return colors[status] || 'medium';
  }

  getStatusText(status: string): string {
    const texts: { [key: string]: string } = {
      'pending': 'Pending',
      'assigned': 'Assigned',
      'accepted': 'Accepted',
      'picked_up': 'Picked Up',
      'in_transit': 'In Transit',
      'out_for_delivery': 'Out for Delivery',
      'delivered': 'Delivered',
      'cancelled': 'Cancelled'
    };
    return texts[status] || status;
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleString();
  }

  canAcceptOrder(order: Order): boolean {
    return ['pending', 'assigned'].includes(order.status);
  }

  canRejectOrder(order: Order): boolean {
    return ['pending', 'assigned'].includes(order.status);
  }

  private showToastMessage(message: string, color: 'success' | 'danger' | 'warning' = 'success'): void {
    this.toastMessage = message;
    this.toastColor = color;
    this.showToast = true;

    // Auto-hide toast after 3 seconds
    setTimeout(() => {
      this.showToast = false;
    }, 3000);
  }

  async trackNow(orderId: number): Promise<void> {
    try {
      // Get current location before starting delivery
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000
      });

      const currentLocation = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      };

      console.log(`📍 Starting delivery with location: ${currentLocation.latitude}, ${currentLocation.longitude}`);

      const userDetails = this.authService.getUserFromStorage();//?.toPromise();

      // Try to extract worker_id from nested user object if present
      let workerId:any = userDetails?.id;
      // Update worker location on backend
      try {
        const updateResponse = await this.apiService.updateWorkerLocation(workerId, currentLocation.latitude, currentLocation.longitude).toPromise();
        console.log('✅ Worker location update response:', JSON.stringify(updateResponse, null, 2));
        if (!updateResponse || !updateResponse.success) {
          console.error('❌ Worker location update failed:', JSON.stringify(updateResponse, null, 2));
        }
      } catch (error) {
        console.error('❌ Error during worker location update API call:', error);
      }

      // Navigate to delivery tracking page
       this.router.navigate(['/delivery-tracking'], { queryParams: { orderId: orderId, isWorker: true } });

    } catch (error) {
      console.error('❌ Error getting location for delivery start:', error);
      this.showToastMessage('Unable to get your location. Please try again.', 'danger');

      // Still navigate to tracking page even if location fails
      this.router.navigate(['/delivery-tracking'], { queryParams: { orderId: orderId, isWorker: true } });
    }
  }
}

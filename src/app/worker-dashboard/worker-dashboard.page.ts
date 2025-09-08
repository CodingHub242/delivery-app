import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardHeader,
         IonCardTitle, IonCardContent, IonButton, IonIcon, IonSpinner,
         IonBadge, IonToggle, IonList, IonItem, IonLabel,
         IonGrid, IonRow, IonCol, IonRefresher, IonRefresherContent } from '@ionic/angular/standalone';
import { checkmarkCircle, closeCircle, location, time, person, call,
         statsChart, wallet, star, car, navigate } from 'ionicons/icons';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

interface WorkerStats {
  totalOrders: number;
  completedOrders: number;
  totalEarnings: number;
  averageRating: number;
  isAvailable: boolean;
}

interface RecentOrder {
  id: number;
  tracking_id: string;
  status: string;
  estimated_cost: number;
  created_at: string;
  user: {
    name: string;
  };
}

@Component({
  selector: 'app-worker-dashboard',
  templateUrl: './worker-dashboard.page.html',
  styleUrls: ['./worker-dashboard.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardHeader,
           IonCardTitle, IonCardContent, IonButton, IonIcon, IonSpinner,
           IonBadge, IonToggle, IonList, IonItem, IonLabel,
           IonGrid, IonRow, IonCol, IonRefresher, IonRefresherContent,
           CommonModule, FormsModule]
})
export class WorkerDashboardPage implements OnInit, OnDestroy {
  workerStats: WorkerStats = {
    totalOrders: 0,
    completedOrders: 0,
    totalEarnings: 0,
    averageRating: 0,
    isAvailable: false
  };

  recentOrders: RecentOrder[] = [];
  isLoading = false;
  workerDetails: any = null;

  private refreshSubscription?: Subscription;

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private router: Router
  ) {}

  async ngOnInit() {
    await this.loadWorkerDetails();
    await this.loadWorkerStats();
    await this.loadRecentOrders();
  }

  ngOnDestroy() {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
  }

  getLatitude(): string {
    if (this.workerDetails && !isNaN(Number(this.workerDetails.current_latitude))) {
      return Number(this.workerDetails.current_latitude).toFixed(6);
    }
    return '';
  }

  getLongitude(): string {
    if (this.workerDetails && !isNaN(Number(this.workerDetails.current_longitude))) {
      return Number(this.workerDetails.current_longitude).toFixed(6);
    }
    return '';
  }

  async loadWorkerDetails(): Promise<void> {
    try {
      const response = await this.apiService.getWorkerDetails().toPromise();
      if (response) {
        this.workerDetails = response.data;
        this.workerStats.isAvailable = response.data.is_available || false;
      }
    } catch (error) {
      console.error('Error loading worker details:', error);
    }
  }

  async loadWorkerStats(): Promise<void> {
    if (!this.workerDetails || !this.workerDetails.id) {
      console.warn('Worker details not loaded yet');
      return;
    }

    this.isLoading = true;
    try {
      // Load assigned orders to get stats
      const response = await this.apiService.getWorkerOrders(this.workerDetails.id).toPromise();
      if (response && response.success) {
        const orders = response.data.data || [];
        this.workerStats.totalOrders = orders.length;
        this.workerStats.completedOrders = orders.filter((order: any) =>
          order.status === 'delivered'
        ).length;

        // Calculate earnings from completed orders
        this.workerStats.totalEarnings = orders
          .filter((order: any) => order.status === 'delivered')
          .reduce((total: number, order: any) => total + (order.actual_cost || order.estimated_cost || 0), 0);

        // For now, set a default rating (you might want to fetch from API)
        this.workerStats.averageRating = 4.5;
      }
    } catch (error) {
      console.error('Error loading worker stats:', error);
    } finally {
      this.isLoading = false;
    }
  }

  async loadRecentOrders(): Promise<void> {
    if (!this.workerDetails || !this.workerDetails.id) {
      console.warn('Worker details not loaded yet');
      return;
    }

    try {
      const response = await this.apiService.getWorkerOrders(this.workerDetails.id).toPromise();
      if (response && response.success) {
        this.recentOrders = (response.data.data || [])
          .slice(0, 5) // Get last 5 orders
          .map((order: any) => ({
            id: order.id,
            tracking_id: order.tracking_id,
            status: order.status,
            estimated_cost: order.estimated_cost,
            created_at: order.created_at,
            user: order.user
          }));
      }
    } catch (error) {
      console.error('Error loading recent orders:', error);
    }
  }

  async toggleAvailability(): Promise<void> {
    if (!this.workerDetails) return;

    try {
      const response = await this.apiService.updateWorkerAvailability(
        this.workerDetails.id,
        !this.workerStats.isAvailable
      ).toPromise();

      if (response && response.success) {
        this.workerStats.isAvailable = !this.workerStats.isAvailable;
      }
    } catch (error) {
      console.error('Error updating availability:', error);
    }
  }

  navigateToOrderAcceptance(): void {
    this.router.navigate(['/worker-order-acceptance']);
  }

  async doRefresh(event: any): Promise<void> {
    await Promise.all([
      this.loadWorkerStats(),
      this.loadRecentOrders()
    ]);
    event.target.complete();
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

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'GHS'
    }).format(amount);
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString();
  }
}

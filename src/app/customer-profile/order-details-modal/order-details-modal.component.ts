import { Component, CUSTOM_ELEMENTS_SCHEMA, Input } from '@angular/core';
import { ModalController } from '@ionic/angular/standalone';
import { Order } from '../../models/order.model';
import { ApiService } from '../../services/api.service';
import { UserService } from '../../services/user.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonIcon,
  IonButtons,
  IonList,
  IonItem,
  IonLabel,
  IonBadge,
  IonSpinner
} from '@ionic/angular/standalone';
import { RatingComponent } from '../../shared/components/rating/rating.component';
import { RatingModalComponent } from '../../shared/components/rating-modal/rating-modal.component';
import { addIcons } from 'ionicons';
import { closeOutline, timeOutline, navigateOutline, cashOutline, receiptOutline, starOutline } from 'ionicons/icons';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  schemas:[CUSTOM_ELEMENTS_SCHEMA],
  selector: 'app-order-details-modal',
  templateUrl: './order-details-modal.component.html',
  styleUrls: ['./order-details-modal.component.scss'],
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonIcon,
    IonButtons,
    IonList,
    IonItem,
    IonLabel,
    IonBadge,
    IonSpinner,
    CommonModule,
    FormsModule,
    TranslatePipe,
    RatingComponent
  ]
})
export class OrderDetailsModalComponent {
  @Input() order!: Order;
  loadingDetails: boolean = false;
  orderDetails: any = null;
  error: string = '';

  constructor(
    private modalController: ModalController,
    private apiService: ApiService,
    private userService: UserService
  ) {
    addIcons({ closeOutline, timeOutline, navigateOutline, cashOutline, receiptOutline, starOutline });
  }

  ngOnInit() {
    this.loadOrderDetails();
  }

  loadOrderDetails() {
    this.loadingDetails = true;
    this.error = '';
    
    // this.apiService.getDelivery(this.order.id).subscribe({
    this.apiService.getOrder(this.order.id).subscribe({
      next: (details) => {
        this.orderDetails = details.data;
        this.loadingDetails = false;
      },
      error: (error) => {
        this.error = 'Failed to load order details. Please try again later.';
        this.loadingDetails = false;
        console.error('Error loading order details:', error);
      }
    });
  }

  closeModal() {
    this.modalController.dismiss();
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

  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  async openRatingModal() {
    if (!this.orderDetails?.worker) {
      alert('Worker information not available for rating.');
      return;
    }

    const modal = await this.modalController.create({
      component: RatingModalComponent,
      componentProps: {
        worker: this.orderDetails.worker,
        orderId: this.order.id
      }
    });

    modal.onDidDismiss().then((result) => {
      if (result.role === 'submit' && result.data) {
        this.submitRating(result.data);
      }
    });

    return await modal.present();
  }

  private submitRating(ratingData: any) {
    this.userService.submitWorkerRating(
      ratingData.workerId,
      ratingData.rating,
      ratingData.review,
      ratingData.orderId
    ).subscribe({
      next: (response) => {
        alert('Thank you for your rating!');
        // Refresh order details to show updated rating
        this.loadOrderDetails();
      },
      error: (error) => {
        console.error('Error submitting rating:', error);
        alert('Failed to submit rating. Please try again.');
      }
    });
  }

  canRateOrder(): boolean {
    return this.orderDetails?.status?.toLowerCase() === 'delivered';
  }
}

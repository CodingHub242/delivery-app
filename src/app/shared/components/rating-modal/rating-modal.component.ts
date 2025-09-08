import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonTextarea,
  IonLabel,
  IonItem,
  IonText,
  ModalController
} from '@ionic/angular/standalone';
import { RatingComponent } from '../rating/rating.component';
import { Worker } from '../../../models/worker.model';

@Component({
  selector: 'app-rating-modal',
  templateUrl: './rating-modal.component.html',
  styleUrls: ['./rating-modal.component.scss'],
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonTextarea,
    IonLabel,
    IonItem,
    IonText,
    RatingComponent
  ],
  standalone: true
})
export class RatingModalComponent {
  @Input() worker!: Worker;
  @Input() orderId?: number;
  @Input() serviceRequestId?: number;

  rating: number = 0;
  review: string = '';
  isSubmitting: boolean = false;

  constructor(private modalController: ModalController) {}

  onRatingChange(newRating: number) {
    this.rating = newRating;
  }

  async submitRating() {
    if (this.rating === 0) {
      alert('Please select a rating before submitting.');
      return;
    }

    this.isSubmitting = true;

    try {
      // Here we would call the rating service
      // For now, we'll just close the modal with the rating data
      await this.modalController.dismiss({
        rating: this.rating,
        review: this.review.trim() || null,
        workerId: this.worker.id,
        orderId: this.orderId,
        serviceRequestId: this.serviceRequestId
      }, 'submit');
    } catch (error) {
      console.error('Error submitting rating:', error);
      alert('Failed to submit rating. Please try again.');
    } finally {
      this.isSubmitting = false;
    }
  }

  dismiss() {
    this.modalController.dismiss(null, 'cancel');
  }
}

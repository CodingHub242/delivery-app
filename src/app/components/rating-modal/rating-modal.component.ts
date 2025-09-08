import { Component, Input } from '@angular/core';
import { ModalController } from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonButtons,
  IonItem,
  IonLabel,
  IonTextarea,
  IonSpinner,
  IonText
} from '@ionic/angular/standalone';
import { RatingComponent } from '../rating/rating.component';
import { UserService } from '../../services/user.service';

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
    IonButtons,
    IonItem,
    IonLabel,
    IonTextarea,
    IonSpinner,
    IonText,
    RatingComponent
  ],
  standalone: true
})
export class RatingModalComponent {
  @Input() workerId!: number;
  @Input() workerName!: string;
  @Input() orderId?: number;
  @Input() serviceRequestId?: number;

  rating: number = 0;
  review: string = '';
  submitting: boolean = false;

  constructor(
    private modalController: ModalController,
    private userService: UserService
  ) {}

  onRatingChange(newRating: number) {
    this.rating = newRating;
  }

  async submitRating() {
    if (this.rating === 0) {
      alert('Please select a rating before submitting.');
      return;
    }

    this.submitting = true;

    try {
      await this.userService.submitWorkerRating(
        this.workerId,
        this.rating,
        this.review || undefined,
        this.orderId,
        this.serviceRequestId
      ).toPromise();

      this.modalController.dismiss({
        success: true,
        rating: this.rating,
        review: this.review
      });
    } catch (error) {
      console.error('Error submitting rating:', error);
      alert('Failed to submit rating. Please try again.');
    } finally {
      this.submitting = false;
    }
  }

  dismiss() {
    this.modalController.dismiss({
      success: false
    });
  }
}

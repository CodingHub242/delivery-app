import { Component, OnInit } from '@angular/core';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonItem,
  IonLabel,
  IonBadge,
  IonSpinner,
  IonBackButton,
  IonButtons,
  IonIcon,
  ModalController
} from '@ionic/angular/standalone';

import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../services/api.service';
import { Worker } from '../models/worker.model';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../pipes/translate.pipe';
import { CurrencyPipe } from '../pipes/currency.pipe';
import { RatingComponent } from '../components/rating/rating.component';
import { RatingModalComponent } from '../components/rating-modal/rating-modal.component';
import { addIcons } from 'ionicons';
import { call, car, document, warning } from 'ionicons/icons';

@Component({
  schemas:[CUSTOM_ELEMENTS_SCHEMA],
  selector: 'app-driver-profile',
  templateUrl: './driver-profile.page.html',
  styleUrls: ['./driver-profile.page.scss'],
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    IonItem,
    IonLabel,
    IonBadge,
    IonSpinner,
    IonBackButton,
    IonButtons,
    IonIcon,
    CommonModule,
    TranslatePipe,
    CurrencyPipe,
    RatingComponent
  ]
})
export class DriverProfilePage implements OnInit {
  worker: Worker | null = null;
  loading: boolean = true;
  error: string = '';

  constructor(
    private route: ActivatedRoute,
    private apiService: ApiService,
    private modalController: ModalController
  ) {
    addIcons({ call, car, document, warning });
  }

  ngOnInit() {
    const workerId = this.route.snapshot.paramMap.get('id');
    if (workerId) {
      this.loadWorker(parseInt(workerId));
    }
  }

  loadWorker(id: number) {
    this.loading = true;
    this.apiService.getWorker(id).subscribe({
      next: (worker) => {
        this.worker = worker;
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Failed to load worker details. Please try again later.';
        this.loading = false;
        console.error('Error loading worker:', error);
      }
    });
  }

  async openRatingModal() {
    if (!this.worker) return;

    const modal = await this.modalController.create({
      component: RatingModalComponent,
      componentProps: {
        workerId: this.worker.id,
        workerName: this.worker.name
      }
    });

    modal.onDidDismiss().then((result: any) => {
      if (result.data?.success) {
        alert('Thank you for your rating!');
        // Optionally refresh worker data to update rating display
        this.loadWorker(this.worker!.id);
      }
    });

    await modal.present();
  }
}

import { Component, Input } from '@angular/core';
import { ModalController } from '@ionic/angular/standalone';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonItem, IonLabel, IonText } from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-worker-password-setup-modal',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Worker Password Setup</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="dismiss()">Close</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <div class="setup-info">
        <h2>Worker Created Successfully!</h2>

        <ion-item>
          <ion-label>
            <h3>{{ workerData.name }}</h3>
            <p>{{ workerData.phone_number }}</p>
          </ion-label>
        </ion-item>

        <div class="setup-details" *ngIf="setupInfo">
          <h3>Password Setup Information:</h3>

          <ion-item>
            <ion-label>
              <h4>Setup Token:</h4>
              <ion-text color="primary">{{ setupInfo.setup_token }}</ion-text>
            </ion-label>
          </ion-item>

          <ion-item>
            <ion-label>
              <h4>Setup URL:</h4>
              <ion-text color="primary">{{ setupInfo.setup_url }}</ion-text>
            </ion-label>
          </ion-item>

          <div class="instructions">
            <p><strong>Instructions:</strong></p>
            <ol>
              <li>Copy the setup URL above</li>
              <li>Send it to the worker via SMS, email, or any preferred method</li>
              <li>The worker will use this URL to set their password</li>
              <li>The setup token is required for password setup</li>
            </ol>
          </div>
        </div>

        <div class="actions">
          <ion-button expand="block" (click)="copySetupUrl()" *ngIf="setupInfo">
            Copy Setup URL
          </ion-button>
          <ion-button expand="block" fill="outline" (click)="dismiss()">
            Done
          </ion-button>
        </div>
      </div>
    </ion-content>
  `,
  styles: [`
    .setup-info {
      max-width: 500px;
      margin: 0 auto;
    }

    .setup-details {
      margin-top: 20px;
    }

    .instructions {
      margin-top: 20px;
      padding: 15px;
      background: #f8f9fa;
      border-radius: 8px;
    }

    .instructions ol {
      padding-left: 20px;
    }

    .instructions li {
      margin-bottom: 8px;
    }

    .actions {
      margin-top: 30px;
    }

    ion-item {
      --border-radius: 8px;
      margin-bottom: 10px;
    }
  `],
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonItem, IonLabel, IonText, CommonModule]
})
export class WorkerPasswordSetupModalComponent {
  @Input() workerData: any;
  @Input() setupInfo: any;

  constructor(private modalController: ModalController) {}

  dismiss() {
    this.modalController.dismiss();
  }

  copySetupUrl() {
    if (this.setupInfo && this.setupInfo.setup_url) {
      navigator.clipboard.writeText(this.setupInfo.setup_url).then(() => {
        alert('Setup URL copied to clipboard!');
      }).catch(err => {
        console.error('Failed to copy URL:', err);
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = this.setupInfo.setup_url;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        alert('Setup URL copied to clipboard!');
      });
    }
  }
}

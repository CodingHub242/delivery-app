import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { WorkerPasswordSetupService } from '../services/worker-password-setup.service';
import { AlertController, LoadingController } from '@ionic/angular';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonItem, IonLabel, IonInput, IonButton, IonText } from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-worker-password-setup',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Set Your Password</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <ion-card>
        <ion-card-header>
          <ion-card-title>Worker Password Setup</ion-card-title>
        </ion-card-header>

        <ion-card-content>
          <form [formGroup]="passwordForm" (ngSubmit)="onSubmit()">
            <ion-item>
              <ion-label position="floating">Setup Token</ion-label>
              <ion-input
                formControlName="token"
                placeholder="Enter your setup token"
                required>
              </ion-input>
            </ion-item>

            <ion-item>
              <ion-label position="floating">New Password</ion-label>
              <ion-input
                formControlName="password"
                type="password"
                placeholder="Enter your new password"
                required>
              </ion-input>
            </ion-item>

            <ion-item>
              <ion-label position="floating">Confirm Password</ion-label>
              <ion-input
                formControlName="password_confirmation"
                type="password"
                placeholder="Confirm your new password"
                required>
              </ion-input>
            </ion-item>

            <div class="error-message" *ngIf="errorMessage">
              <ion-text color="danger">{{ errorMessage }}</ion-text>
            </div>

            <ion-button
              expand="block"
              type="submit"
              [disabled]="passwordForm.invalid || isLoading"
              class="ion-margin-top">
              <span *ngIf="isLoading">Setting up password...</span>
              <span *ngIf="!isLoading">Set Password</span>
            </ion-button>
          </form>
        </ion-card-content>
      </ion-card>
    </ion-content>
  `,
  styles: [`
    ion-card {
      max-width: 400px;
      margin: 20px auto;
    }

    .error-message {
      margin-top: 10px;
      text-align: center;
    }
  `],
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonItem,
    IonLabel,
    IonInput,
    IonButton,
    IonText,
    CommonModule,
    ReactiveFormsModule
  ]
})
export class WorkerPasswordSetupPage implements OnInit {
  passwordForm: FormGroup;
  isLoading = false;
  errorMessage = '';

  constructor(
    private formBuilder: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private passwordSetupService: WorkerPasswordSetupService,
    private alertController: AlertController,
    private loadingController: LoadingController
  ) {
    this.passwordForm = this.formBuilder.group({
      token: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      password_confirmation: ['', [Validators.required]]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  ngOnInit() {
    // Check if token is provided in URL params
    this.route.queryParams.subscribe(params => {
      if (params['token']) {
        this.passwordForm.patchValue({ token: params['token'] });
      }
    });
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('password_confirmation');

    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ mismatch: true });
      return { mismatch: true };
    }

    return null;
  }

  async onSubmit() {
    if (this.passwordForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';

      const loading = await this.loadingController.create({
        message: 'Setting up your password...'
      });
      await loading.present();

      const formData = this.passwordForm.value;

      this.passwordSetupService.setupPassword(
        formData.token,
        formData.password,
        formData.password_confirmation
      ).subscribe({
        next: async (response) => {
          await loading.dismiss();
          this.isLoading = false;

          const alert = await this.alertController.create({
            header: 'Success!',
            message: 'Your password has been set up successfully. You can now log in with your phone number and password.',
            buttons: [{
              text: 'Go to Login',
              handler: () => {
                this.router.navigate(['/worker-login']);
              }
            }]
          });

          await alert.present();
        },
        error: async (error) => {
          await loading.dismiss();
          this.isLoading = false;

          this.errorMessage = error.error?.message || 'Failed to set up password. Please check your token and try again.';
        }
      });
    }
  }
}

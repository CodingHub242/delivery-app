import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-worker-register',
  templateUrl: './worker-register.page.html',
  styleUrls: ['./worker-register.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, ReactiveFormsModule]
})
export class WorkerRegisterPage {
  registerForm: FormGroup;
  errorMessage: string = '';
  services: any[] = [];

  constructor(
    private authService: AuthService,
    private router: Router,
    private fb: FormBuilder,
    private apiService:ApiService
  ) {
    this.registerForm = this.fb.group({
      name: ['', [Validators.required]],
      phone_number: ['', [Validators.required]],
      worker_type: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      password_confirmation: ['', [Validators.required]],
      vehicle_type: [''],
      vehicle_registration: [''],
      service_type: [''],
      role: ['worker']
    }, { validators: this.passwordMatchValidator });

    // Add conditional validation for vehicle fields when worker type is delivery_driver
    this.registerForm.get('worker_type')?.valueChanges.subscribe(value => {
      const vehicleTypeControl = this.registerForm.get('vehicle_type');
      const vehicleRegControl = this.registerForm.get('vehicle_registration');
      const serviceTypeControl = this.registerForm.get('service_type');

      if (value === 'delivery_driver') {
        vehicleTypeControl?.setValidators([Validators.required]);
        vehicleRegControl?.setValidators([Validators.required]);
        serviceTypeControl?.clearValidators();
      } else if (value === 'service_worker') {
        serviceTypeControl?.setValidators([Validators.required]);
        vehicleTypeControl?.clearValidators();
        vehicleRegControl?.clearValidators();
      } else {
        vehicleTypeControl?.clearValidators();
        vehicleRegControl?.clearValidators();
        serviceTypeControl?.clearValidators();
      }

      vehicleTypeControl?.updateValueAndValidity();
      vehicleRegControl?.updateValueAndValidity();
      serviceTypeControl?.updateValueAndValidity();
    });
  }

  ngOnInit() {
    this.loadServices();
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

  loadServices() {
    this.apiService.getServices().subscribe({
      next: (services: any) => {
        this.services = services;
      },
      error: (error) => {
        console.error('Error loading services:', error);
      }
    });
  }

  onSubmit() {
    if (this.registerForm.invalid) {
      return;
    }
    const workerData = this.registerForm.value;
    delete workerData.password_confirmation; // Remove confirmation field

    this.authService.workerRegister(workerData).subscribe({
      next: (res:any) => {
        this.authService.setToken(res.data.token);
        this.authService.setUser(res.data.user);
        this.router.navigate(['/worker-dashboard']);
      },
      error: (err) => {
        this.errorMessage = err.error.message || 'Registration failed';
      }
    });
  }
}

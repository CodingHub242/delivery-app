import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class WorkerPasswordSetupService {
  private apiUrl = 'https://delivery.codepps.online/api'; // Laravel backend URL

  constructor(private http: HttpClient) {}

  /**
   * Set up password for a worker using setup token
   */
  setupPassword(token: string, password: string, password_confirmation: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/workers/setup-password`, {
      token,
      password,
      password_confirmation
    }).pipe(
      catchError((error) => {
        console.error('Error setting up worker password:', error);
        throw error;
      })
    );
  }

  /**
   * Resend password setup instructions to worker
   */
  resendSetupInstructions(phone_number: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/workers/resend-setup-instructions`, {
      phone_number
    }).pipe(
      catchError((error) => {
        console.error('Error resending setup instructions:', error);
        throw error;
      })
    );
  }
}

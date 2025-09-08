import { Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { User } from '../models/user.model';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  constructor(
    private apiService: ApiService,
    private authService: AuthService
  ) {}

  // Profile management methods
  updateProfile(userData: any): Observable<User> {
    return this.apiService.updateUserProfile(userData).pipe(
      tap((updatedUser:any) => {
        //console.log('Updated user data:', updatedUser);
        this.authService.setUser(updatedUser.user);
      })
    );
  }

  changePassword(passwordData: any): Observable<any> {
    return this.apiService.changePassword(passwordData);
  }

  uploadProfilePicture(file: File): Observable<any> {
    return this.apiService.uploadProfilePicture(file).pipe(
      tap((response: any) => {
        if (response.user) {
          this.authService.setUser(response.user);
        }
      })
    );
  }

  // Rating methods
  submitWorkerRating(workerId: number, rating: number, review?: string, orderId?: number, serviceRequestId?: number): Observable<any> {
    return this.apiService.submitWorkerRating(workerId, rating, review, orderId, serviceRequestId);
  }

  getWorkerRatings(workerId: number): Observable<any> {
    return this.apiService.getWorkerRatings(workerId);
  }

  getUserRatings(userId: number): Observable<any> {
    return this.apiService.getUserRatings(userId);
  }
}

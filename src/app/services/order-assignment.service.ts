import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { AuthService } from './auth.service';
import { HttpUtilsService } from './http-utils.service';

@Injectable({
  providedIn: 'root'
})
export class OrderAssignmentService {
  private apiUrl = 'https://delivery.codepps.online/api'; // Laravel backend URL

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private httpUtils: HttpUtilsService
  ) {}

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return this.httpUtils.getHeaders(token);
  }

  // Order assignment methods
  assignWorkerToOrder(orderId: number, workerId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/orders/${orderId}/assign-worker`, {
      worker_id: workerId
    }, { headers: this.getHeaders() }).pipe(
      catchError((error) => {
        console.error('Error assigning worker to order:', error);
        throw error;
      })
    );
  }

  unassignWorkerFromOrder(orderId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/orders/${orderId}/unassign-worker`, {}, { headers: this.getHeaders() }).pipe(
      catchError((error) => {
        console.error('Error unassigning worker from order:', error);
        throw error;
      })
    );
  }

  getPendingOrders(): Observable<any> {
    return this.http.get(`${this.apiUrl}/orders?status=pending`, { headers: this.getHeaders() }).pipe(
      catchError((error) => {
        console.error('Error fetching pending orders:', error);
        return of([]);
      })
    );
  }

  getAssignedOrders(): Observable<any> {
    return this.http.get(`${this.apiUrl}/orders/assigned`, { headers: this.getHeaders() }).pipe(
      catchError((error) => {
        console.error('Error fetching assigned orders:', error);
        return of([]);
      })
    );
  }

  getAllOrders(): Observable<any> {
    return this.http.get(`${this.apiUrl}/orders`, { headers: this.getHeaders() }).pipe(
      catchError((error) => {
        console.error('Error fetching all orders:', error);
        return of([]);
      })
    );
  }
}

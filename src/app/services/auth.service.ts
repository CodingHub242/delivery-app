import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { LoginRequest, RegisterRequest, AuthResponse, User } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'https://delivery.codepps.online/api/auth'; // Update with your backend URL

  constructor(
    private http: HttpClient
  ) {}

  login(request: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, request);
  }

  register(request: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, request);
  }

  workerLogin(credentials: { phone_number: string; password: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/worker/login`, credentials);
  }

  workerRegister(workerData: any): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/worker/register`, workerData);
  }

  logout(): Observable<any> {
    return this.http.post(`${this.apiUrl}/logout`, {});
  }

  getUser(): Observable<any> {
    const headers = this.getHeaders();
    return this.http.get(`${this.apiUrl}/user`, { headers });
  }

  private getHeaders(): HttpHeaders {
    const token = this.getToken();
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  }

  // Helper methods for token management
  setToken(token: string): void {
    localStorage.setItem('auth_token', token);
  }

  getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  removeToken(): void {
    localStorage.removeItem('auth_token');
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  // User management methods
  setUser(user: User): void {
    localStorage.setItem('user', JSON.stringify(user));
  }

  getUserFromStorage(): User | null {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  removeUser(): void {
    localStorage.removeItem('user');
  }

  // Role checking methods
  isAdmin(): boolean {
    const user = this.getUserFromStorage();
    return user?.role === 'admin';
  }

  isWorker(): boolean {
    const user = this.getUserFromStorage();
    return user?.role === 'worker';
  }

  isCustomer(): boolean {
    const user = this.getUserFromStorage();
    return user?.role === 'customer';
  }

  // Complete logout
  completeLogout(): void {
    this.removeToken();
    this.removeUser();
  }
}

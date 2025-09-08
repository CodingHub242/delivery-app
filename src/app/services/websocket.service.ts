import { Injectable } from '@angular/core';
import { Observable, Subject, interval } from 'rxjs';
import { AuthService } from './auth.service';
import { ApiService } from './api.service';
import { SendMessageRequest } from '../models/message.model';

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private messageSubject = new Subject<any>();
  private connectionStateSubject = new Subject<string>();
  public messages$ = this.messageSubject.asObservable();
  public connectionState$ = this.connectionStateSubject.asObservable();
  
  private isConnected = false;
  private pollingInterval: any;

  constructor(
    private authService: AuthService,
    private apiService: ApiService
  ) {}

  connect(): void {
    if (this.isConnected) {
      console.log('WebSocket service already connected');
      return;
    }

    console.log('WebSocket service connecting...');
    this.isConnected = true;
    this.connectionStateSubject.next('CONNECTING');
    
    // Simulate connection process
    setTimeout(() => {
      this.connectionStateSubject.next('CONNECTED');
      console.log('WebSocket service connected successfully');
      
      // Start polling for messages if needed
      this.startPolling();
    }, 1000);
  }

  private startPolling(): void {
    // Use polling to check for new messages
    this.pollingInterval = setInterval(() => {
      console.log('Polling for new messages...');
      // In a real implementation, you would fetch new messages from the API
      // For now, we'll just log that polling is happening
    }, 5000);
  }

sendMessage(deliveryId: number, receiverId: number, message: string): Observable<any> {
    const messageData: SendMessageRequest = {
        delivery_id: deliveryId,
        receiver_id: receiverId,
        message: message
    };
    console.log('Sending message via API service:', messageData);
    return this.apiService.sendMessage(messageData);
}

  disconnect(): void {
    if (!this.isConnected) {
      console.log('WebSocket service already disconnected');
      return;
    }

    console.log('WebSocket service disconnecting...');
    this.isConnected = false;
    this.connectionStateSubject.next('DISCONNECTING');
    
    // Clear polling interval
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
    
    // Simulate disconnection process
    setTimeout(() => {
      this.connectionStateSubject.next('DISCONNECTED');
      console.log('WebSocket service disconnected successfully');
    }, 500);
  }

  getConnectionState(): string {
    if (!this.isConnected) return 'DISCONNECTED';
    return 'CONNECTED';
  }

  // Simulate receiving a message (for testing/demo purposes)
  simulateMessageReceived(message: any): void {
    this.messageSubject.next(message);
  }
}

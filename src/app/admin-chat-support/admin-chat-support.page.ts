import { Component, OnInit, ViewChild, ElementRef, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';
import { WebSocketService } from '../services/websocket.service';
import { Message } from '../models/message.model';
import { interval, Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import $ from 'jquery';

@Component({
  schemas:[CUSTOM_ELEMENTS_SCHEMA],
  selector: 'app-admin-chat-support',
  templateUrl: './admin-chat-support.page.html',
  styleUrls: ['./admin-chat-support.page.scss'],
  imports:[CommonModule]
})
export class AdminChatSupportPage implements OnInit {
  @ViewChild('messageContainer', { static: false }) messageContainer!: ElementRef;

  messages: Message[] = [];
  newMessage: string = '';
  currentUserId: number = 0;
  deliveryId: number = 0;
  receiverId: number = 0;
  loading: boolean = true;
  isUserTyping: boolean = false;
  isAdminTyping: boolean = false;
  typingTimeout: any;
  adminTypingTimeout: any;
  pollingSubscription!: Subscription;
  selectedUser: any = null;
  users: any[] = [];

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private webSocketService: WebSocketService,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    const user = this.authService.getUserFromStorage();
    if (user) {
      console.log('Current admin user:', user);
      this.currentUserId = user.id;
      
      // For support chat, we'll use a fixed deliveryId (0 for support messages)
      this.deliveryId = 0; // Use 0 for support chat
      
      // For support chat, receiverId will be set to 0 initially
      // When sending messages, we'll let the backend handle admin assignment
      this.receiverId = 0; // Set to 0 to indicate support chat
      
      this.loadMessages();
      this.loadUsers();
      
      // Try WebSocket connection
      this.webSocketService.connect();

      // Listen for incoming messages from WebSocket
      this.webSocketService.messages$.subscribe({
        next: (message: Message) => {
          this.messages.push(message);
          this.scrollToBottom();
        },
        error: (error) => {
          console.log('WebSocket not available, falling back to polling');
          // Fall back to polling if WebSocket fails
          this.startPolling();
        }
      });
    }
  }

  ngOnDestroy() {
    this.webSocketService.disconnect();
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
    }
  }

  loadMessages() {
    this.loading = true;
    this.apiService.getAllSupportMessages().subscribe({
      next: (messages) => {
        this.messages = messages;
        this.loading = false;
        this.scrollToBottom();
        this.markMessagesAsRead();
        this.checkAdminTyping();
        this.groupMessagesByUser();
      },
      error: (error) => {
        console.error('Error loading support messages:', error);
        this.loading = false;
      }
    });
  }

  loadUsers() {
    // Get unique users from messages
    this.apiService.getAdmins().subscribe({
      next: (admins) => {
        this.users = admins;
      },
      error: (error) => {
        console.error('Error loading admins:', error);
      }
    });
  }

  groupMessagesByUser() {
    // Group messages by user for easier management
    const userMessages = new Map();
    this.messages.forEach(message => {
      const userId = message.sender_id;
      if (!userMessages.has(userId)) {
        userMessages.set(userId, []);
      }
      userMessages.get(userId).push(message);
    });
    
    // Convert to array for easier handling
    this.users = Array.from(userMessages.keys()).map(userId => ({
      id: userId,
      name: this.messages.find(m => m.sender_id === userId)?.sender?.name || 'Unknown User',
      messages: userMessages.get(userId)
    }));
  }

  checkAdminTyping() {
    // Check if admin is typing based on recent messages
    const recentMessages = this.messages.slice(-3); // Check last 3 messages
    const adminMessages = recentMessages.filter(msg => !this.isMyMessage(msg.sender_id));
    
    if (adminMessages.length > 0) {
      const lastAdminMessage = adminMessages[adminMessages.length - 1];
      const messageTime = new Date(lastAdminMessage.created_at).getTime();
      const currentTime = new Date().getTime();
      
      // If admin sent a message within the last 5 seconds, show typing indicator
      if (currentTime - messageTime < 5000) {
        this.isAdminTyping = true;
        clearTimeout(this.adminTypingTimeout);
        this.adminTypingTimeout = setTimeout(() => {
          this.isAdminTyping = false;
        }, 3000);
      }
    }
  }

  onUserTyping() {
    this.isUserTyping = true;
    clearTimeout(this.typingTimeout);
    this.typingTimeout = setTimeout(() => {
      this.isUserTyping = false;
    }, 2000); // Consider user stopped typing after 2 seconds of inactivity
  }

  onEnterKey(event: Event) {
    const keyboardEvent = event as KeyboardEvent;
    if (keyboardEvent.key === 'Enter') {
      this.sendMessage();
      event.preventDefault(); // Prevent default behavior (like adding a new line)
    }
  }

  sendMessage() {
    this.newMessage = $('#messageInput').val() as string;
    if (!this.newMessage.trim()) return;

    console.log('Sending message:', this.newMessage);
    // Use the support message sending method
    const messageData = {
      delivery_id: 0, // Always use 0 for support messages
      message: this.newMessage.trim(),
      receiver_id: this.selectedUser?.id || 0
    };
    this.apiService.sendSupportMessage(messageData).subscribe({
      next: (message) => {
        console.log('Message sent successfully:', message);
        this.newMessage = '';
        this.scrollToBottom();
        this.isUserTyping = false;
        
        // Reload messages to show the newly sent message
        this.loadMessages();
      },
      error: (error) => {
        console.error('Error sending message:', error);
      }
    });
  }

  markMessagesAsRead() {
    const unreadMessageIds = this.messages
      .filter(msg => msg.receiver_id === this.currentUserId && !msg.read_at)
      .map(msg => msg.id);

    if (unreadMessageIds.length > 0) {
      this.apiService.markMessagesAsRead(unreadMessageIds).subscribe();
    }
  }

  startPolling() {
    this.pollingSubscription = interval(7000).subscribe(() => {
      if (!this.isUserTyping) {
        this.loadMessages();
      }
    });
  }

  scrollToBottom() {
    setTimeout(() => {
      if (this.messageContainer) {
        this.messageContainer.nativeElement.scrollTop = this.messageContainer.nativeElement.scrollHeight;
      }
    }, 100);
  }

  formatTime(timestamp: string): string {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  isMyMessage(senderId: number): boolean {
    return senderId === this.currentUserId;
  }

  getSenderName(message: Message): string {
    if (message.sender_id === this.currentUserId) {
      return 'You';
    }
    return message.sender?.name || 'Support Agent';
  }

  selectUser(user: any) {
    this.selectedUser = user;
    // Filter messages for selected user
    this.messages = user.messages || [];
  }
}
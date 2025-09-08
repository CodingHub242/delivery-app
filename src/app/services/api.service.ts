import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable,BehaviorSubject } from 'rxjs';
import { Service, Product } from '../models/service.model';
import { Message, SendMessageRequest } from '../models/message.model';
import { Notification, NotificationSeenResponse } from '../models/notification.model';
import { AuthService } from './auth.service';
import { CartResponse, CartItem } from '../models/cart.model';
import { User } from '../models/user.model';
import { tap,catchError,switchMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { HttpUtilsService } from './http-utils.service';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = 'https://delivery.codepps.online/api'; // Laravel backend URL
  private cartItems: any[] = [];

  private cartItemsSubject = new BehaviorSubject<any[]>([]);
  public cartItems$ = this.cartItemsSubject.asObservable();

  private cartCountSubject = new BehaviorSubject<number>(0);
  public cartCount$ = this.cartCountSubject.asObservable();

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private httpUtils: HttpUtilsService
  ) {}

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return this.httpUtils.getHeaders(token);
  }

  // Worker methods
  createWorker(workerData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/workers`, workerData, { headers: this.getHeaders() });
  }

  deleteWorker(workerId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/workers/${workerId}`, { headers: this.getHeaders() });
  }

  getWorkers(): Observable<any> {
    return this.http.get(`${this.apiUrl}/workers`, { headers: this.getHeaders() });
  }

  getWorker(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/workers/${id}`, { headers: this.getHeaders() });
  }

  updateWorkerAvailability(id: number, isAvailable: boolean): Observable<any> {
    return this.http.put(`${this.apiUrl}/workers/${id}/availability`, {
      is_available: isAvailable
    }, { headers: this.getHeaders() });
  }

  updateWorkerLocation(id: number, latitude: number, longitude: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/workers/${id}/location/new`, {
      current_latitude: latitude,
      current_longitude: longitude
    }, { headers: this.getHeaders() });
  }

  // Worker rating methods
  submitWorkerRating(workerId: number, rating: number, review?: string, orderId?: number, serviceRequestId?: number): Observable<any> {
    const payload: any = { rating };
    if (review) payload.review = review;
    if (orderId) payload.order_id = orderId;
    if (serviceRequestId) payload.service_request_id = serviceRequestId;
    return this.http.post(`${this.apiUrl}/workers/${workerId}/ratings`, payload, { headers: this.getHeaders() });
  }

  getWorkerRatings(workerId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/workers/${workerId}/ratings`, { headers: this.getHeaders() });
  }

  getUserRatings(userId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/users/${userId}/ratings`, { headers: this.getHeaders() });
  }

  // Service methods
  getServices(): Observable<Service[]> {
    return this.http.get<Service[]>(`${this.apiUrl}/services`, { headers: this.getHeaders() });
  }

  getService(id: number): Observable<Service> {
    return this.http.get<Service>(`${this.apiUrl}/services/${id}`, { headers: this.getHeaders() });
  }

  createService(serviceData: any): Observable<Service> {
    return this.http.post<Service>(`${this.apiUrl}/services`, serviceData, { headers: this.getHeaders() });
  }

  updateService(id: number, serviceData: any): Observable<Service> {
    return this.http.put<Service>(`${this.apiUrl}/services/${id}`, serviceData, { headers: this.getHeaders() });
  }

  deleteService(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/services/${id}`, { headers: this.getHeaders() });
  }

  calculatePrice(serviceId: number, distance: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/services/${serviceId}/calculate-price`, {
      distance: distance
    }, { headers: this.getHeaders() });
  }

  // Delivery methods
  createDelivery(deliveryData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/deliveries`, deliveryData, { headers: this.getHeaders() });
  }

  getDelivery(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/deliveries/${id}`, { headers: this.getHeaders() });
  }

  updateDeliveryStatus(id: number, status: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/deliveries/${id}/status`, {
      status: status
    }, { headers: this.getHeaders() });
  }

  updateDeliveryLocation(id: number, latitude: number, longitude: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/deliveries/${id}/location`, {
      latitude: latitude,
      longitude: longitude
    }, { headers: this.getHeaders() });
  }

  getUserDeliveries(userId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/deliveries/user/${userId}`, { headers: this.getHeaders() });
  }

  getWorkerDeliveries(workerId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/deliveries/worker/${workerId}`, { headers: this.getHeaders() });
  }

  getDeliveries(): Observable<any> {
    return this.http.get(`${this.apiUrl}/deliveries`, { headers: this.getHeaders() });
  }

  getWorkerDetails(): Observable<any> {
    // Get the current user's worker details
    return this.http.get(`${this.apiUrl}/worker/me`, { headers: this.getHeaders() });
  }

  // Chat methods
  getMessages(deliveryId: number): Observable<Message[]> {
    return this.http.get<Message[]>(`${this.apiUrl}/chat/messages/${deliveryId}`, { headers: this.getHeaders() });
  }

  sendMessage(messageData: SendMessageRequest): Observable<Message> {
    return this.http.post<Message>(`${this.apiUrl}/chat/send`, messageData, { headers: this.getHeaders() });
  }

  markMessagesAsRead(messageIds: number[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/chat/mark-read`, { message_ids: messageIds }, { headers: this.getHeaders() });
  }

  getUnreadCount(): Observable<{ unread_count: number }> {
    return this.http.get<{ unread_count: number }>(`${this.apiUrl}/chat/unread-count`, { headers: this.getHeaders() });
  }

  getAdmins(): Observable<any> {
    return this.http.get(`${this.apiUrl}/chat/admins`, { headers: this.getHeaders() });
  }

  // Support chat methods
  getSupportMessages(): Observable<any> {
    return this.http.get(`${this.apiUrl}/chat/support-messages`, { headers: this.getHeaders() });
  }

  getAllSupportMessages(): Observable<any> {
    return this.http.get(`${this.apiUrl}/chat/all-support-messages`, { headers: this.getHeaders() });
  }

  sendSupportMessage(messageData: SendMessageRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/chat/support-send`, messageData, { headers: this.getHeaders() });
  }

  // Service request methods
  requestService(requestData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/service-requests`, requestData, { headers: this.getHeaders() });
  }

  getServiceRequests(): Observable<any> {
    return this.http.get(`${this.apiUrl}/service-requests`, { headers: this.getHeaders() });
  }

  getAllOrders(): Observable<any> {
    return this.http.get(`${this.apiUrl}/orders`, { headers: this.getHeaders() });
  }

  assignWorkerToOrder(orderId: number, workerId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/orders/${orderId}/assign-worker`, {
      worker_id: workerId
    }, { headers: this.getHeaders() });
  }

  assignWorkerToServiceRequest(serviceRequestId: number, workerId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/service-requests/${serviceRequestId}/assign-worker`, {
      worker_id: workerId
    }, { headers: this.getHeaders() });
  }

  getUserServiceRequests(userId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/service-requests/user/${userId}`, { headers: this.getHeaders() });
  }
  
  // Fix for missing route: add alternative method to get service requests by user
  getServiceRequestsByUser(userId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/service-requests?user_id=${userId}`, { headers: this.getHeaders() });
  }

  // Shop products methods
  getShopProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}/shop/products`, { headers: this.getHeaders() });
  }

  createProduct(productData: any): Observable<Product> {
    return this.http.post<Product>(`${this.apiUrl}/shop/products`, productData, { headers: this.getHeaders() });
  }

  updateProduct(id: number, productData: any): Observable<Product> {
    return this.http.put<Product>(`${this.apiUrl}/shop/products/${id}`, productData, { headers: this.getHeaders() });
  }

  deleteProduct(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/shop/products/${id}`, { headers: this.getHeaders() });
  }

  addToCart(productId: number, quantity: number = 1): Observable<any> {
    return this.http.post(`${this.apiUrl}/shop/cart/add`, {
      product_id: productId,
      quantity: quantity
    }, { headers: this.getHeaders() }).pipe(
       switchMap((response) => {
      console.log('Add to cart response:', response);
      // After successful add, immediately fetch updated cart
      return this.getCart().pipe(
        tap((cart) => {
          console.log('Cart refreshed after adding item:', cart);
          // Ensure the cart count is updated immediately
          const items = cart?.cart_items || [];
          const newCount = items.reduce((total, item) => total + (item?.quantity || 0), 0);
          console.log('New cart count after add:', newCount);
          this.cartCountSubject.next(newCount);
        }),
        switchMap(() => of(response)) // Return original response
      );
    }),
      catchError((error) => {
        console.error('Error adding to cart:', error);
        return of(null);
      })
    );
  }

  removeFromCart(productId: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/shop/cart/remove`, { product_id: productId }, { headers: this.getHeaders() }).pipe(
    switchMap((response) => {
        // After successful remove, immediately fetch updated cart
        return this.getCart().pipe(
          tap(() => console.log('Cart refreshed after removing item')),
          switchMap(() => of(response)) // Return original response
        );
      }),
      catchError((error) => {
        console.error('Error removing from cart:', error);
        return of(null);
      })  
    );
  }

   updateCartItemQuantity(itemId: number, quantity: number): Observable<any> {
    console.log('Updating cart item quantity - Item ID:', itemId, 'New Quantity:', quantity);
    return this.http.put(`${this.apiUrl}/shop/cart/update/update`, {
      item_id: itemId,
      quantity: quantity
    }, { headers: this.getHeaders() }).pipe(
     switchMap((response) => {
      console.log('Update quantity response:', response);
      // After successful update, immediately fetch updated cart
      return this.getCart().pipe(
        tap((cart) => {
          console.log('Cart refreshed after updating quantity:', cart);
          const items = cart?.cart_items || [];
          const newCount = items.reduce((total, item) => total + (item?.quantity || 0), 0);
          console.log('New cart count after quantity update:', newCount);
          this.cartCountSubject.next(newCount);
        }),
        switchMap(() => of(response)) // Return original response
      );
    }),
      catchError((error) => {
        console.error('Error updating cart quantity:', error);
        return of(null);
      })  
    );
  }

  // Add method to check stock availability
checkStockAvailability(productId: number, requestedQuantity: number): Observable<any> {
  return this.http.post(`${this.apiUrl}/shop/check-stock`, {
    product_id: productId,
    quantity: requestedQuantity
  }, { headers: this.getHeaders() });
}

  getCart(): Observable<CartResponse> {
    return this.http.get<CartResponse>(`${this.apiUrl}/shop/cart`, { headers: this.getHeaders() }).pipe(
      tap((cart: CartResponse) => {
        console.log('Cart response received:', cart);
        // Safely access cart_items with fallback
        const items = cart?.cart_items || [];
        this.cartItemsSubject.next(items);
        this.updateCartCount(items);
        console.log('Cart items updated:', items.length, 'cart count:', this.getCartCount());
      }),
      catchError((error) => {
        console.error('Error fetching cart:', error);
        // Return empty cart on error
        const emptyCart: CartResponse = { cart_items: [] };
        this.cartItemsSubject.next([]);
        this.updateCartCount([]);
        return of(emptyCart);
      })
    );
  }

  private updateCartCount(items: any[]): void {
     const count = items.reduce((total, item) => {
      return total + (item?.quantity || 0); 
    }, 0);
    console.log('Updating cart count to:', count);
    this.cartCountSubject.next(count);

     // Force emit the current value to ensure all subscribers get the update
  setTimeout(() => {
    this.cartCountSubject.next(count);
  }, 0);
  }

  private refreshCart(): void {
     this.getCart().subscribe({
      next: (cart) => {
        // Cart state is already updated in the tap operator
      },
      error: (error) => {
        console.error('Error refreshing cart:', error);
      }
    });
  }

  getCartCount(): number {
    return this.cartCountSubject.value;
  }


  checkout(cartData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/orders`, cartData, { headers: this.getHeaders() });
  }

  // Order methods
  createOrder(orderData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/orders`, orderData, { headers: this.getHeaders() });
  }

  getOrder(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/orders/${id}`, { headers: this.getHeaders() });
  }

  getOrderByTrackingId(trackingId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/orders/tracking/${trackingId}`, { headers: this.getHeaders() });
  }

  updateOrderStatus(id: number, status: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/orders/${id}`, { status: status }, { headers: this.getHeaders() });
  }

  getUserOrders(userId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/orders/user/${userId}`, { headers: this.getHeaders() });
  }

  getWorkerOrders(workerId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/orders/worker/${workerId}`, { headers: this.getHeaders() });
  }

  // Invoice methods
  getInvoices(): Observable<any> {
    return this.http.get(`${this.apiUrl}/invoices`, { headers: this.getHeaders() });
  }

  createInvoice(invoiceData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/invoices`, invoiceData, { headers: this.getHeaders() });
  }

  getInvoice(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/invoices/${id}`, { headers: this.getHeaders() });
  }

  updateInvoice(id: number, invoiceData: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/invoices/${id}`, invoiceData, { headers: this.getHeaders() });
  }

  deleteInvoice(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/invoices/${id}`, { headers: this.getHeaders() });
  }

  markInvoiceAsPaid(id: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/invoices/${id}/mark-paid`, {}, { headers: this.getHeaders() });
  }

  markInvoiceAsOverdue(id: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/invoices/${id}/mark-overdue`, {}, { headers: this.getHeaders() });
  }

  getCartItems(): any[] {
    // return this.cartItems;
    return this.cartItemsSubject.value;
  }

  initializeCart(): void {
    this.getCart().subscribe({
      next: (cart) => {
        console.log('Cart initialized successfully');
      },
      error: (error) => {
        console.error('Error initializing cart:', error);
      }
    });
  }

  // Analytics methods
  getServiceRequestAnalytics(timePeriod: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/analytics/service-requests/${timePeriod}`, { headers: this.getHeaders() });
  }

  getDeliveryAnalytics(timePeriod: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/analytics/deliveries/${timePeriod}`, { headers: this.getHeaders() });
  }

  getLocationAnalytics(): Observable<any> {
    return this.http.get(`${this.apiUrl}/analytics/locations`, { headers: this.getHeaders() });
  }

  // Notification methods
  getPromotionalNotifications(): Observable<Notification[]> {
    return this.http.get<Notification[]>(`${this.apiUrl}/promotional-notifications`, { headers: this.getHeaders() }).pipe(
      catchError((error) => {
        console.error('Error fetching promotional notifications:', error);
        return of([]);
      })
    );
  }

  markNotificationAsSeen(notificationId: number): Observable<NotificationSeenResponse> {
    return this.http.post<NotificationSeenResponse>(
      `${this.apiUrl}/promotional-notifications/${notificationId}/mark-seen`,
      {},
      { headers: this.getHeaders() }
    ).pipe(
      catchError((error) => {
        console.error('Error marking notification as seen:', error);
        return of({ success: false, message: 'Failed to mark notification as seen' });
      })
    );
  }

  // Admin notification management methods
  getAllNotifications(): Observable<Notification[]> {
    return this.http.get<Notification[]>(`${this.apiUrl}/admin/promotional-notifications`, { headers: this.getHeaders() }).pipe(
      catchError((error) => {
        console.error('Error fetching all notifications:', error);
        return of([]);
      })
    );
  }

  createNotification(notificationData: any): Observable<Notification> {
    return this.http.post<Notification>(
      `${this.apiUrl}/admin/promotional-notifications`,
      notificationData,
      { headers: this.getHeaders() }
    ).pipe(
      catchError((error) => {
        console.error('Error creating notification:', error);
        throw error;
      })
    );
  }

  updateNotification(id: number, notificationData: any): Observable<Notification> {
    return this.http.put<Notification>(
      `${this.apiUrl}/admin/promotional-notifications/${id}`,
      notificationData,
      { headers: this.getHeaders() }
    ).pipe(
      catchError((error) => {
        console.error('Error updating notification:', error);
        throw error;
      })
    );
  }

  deleteNotification(id: number): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/admin/promotional-notifications/${id}`,
      { headers: this.getHeaders() }
    ).pipe(
      catchError((error) => {
        console.error('Error deleting notification:', error);
        throw error;
      })
    );
  }

  // User profile methods
  updateUserProfile(userData: any): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/user/profile`, userData, { 
      headers: this.getHeaders() 
    }).pipe(
      catchError((error) => {
        console.error('Error updating user profile:', error);
        throw error;
      })
    );
  }

  changePassword(passwordData: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/user/password`, passwordData, { 
      headers: this.getHeaders() 
    }).pipe(
      catchError((error) => {
        console.error('Error changing password:', error);
        throw error;
      })
    );
  }

  uploadProfilePicture(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('profile_picture', file);

    return this.http.post(`${this.apiUrl}/user/profile-picture`, formData, {
      headers: this.getHeaders()
    }).pipe(
      catchError((error) => {
        console.error('Error uploading profile picture:', error);
        throw error;
      })
    );
  }

  // Shop location methods
  getShopLocation(): Observable<any> {
    return this.http.get(`${this.apiUrl}/shop/location`, { headers: this.getHeaders() }).pipe(
      catchError((error) => {
        console.error('Error fetching shop location:', error);
        throw error;
      })
    );
  }

  setShopLocation(locationData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/shop/location`, locationData, { headers: this.getHeaders() }).pipe(
      catchError((error) => {
        console.error('Error setting shop location:', error);
        throw error;
      })
    );
  }

  updateShopLocation(locationData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/shop/location`, locationData, { headers: this.getHeaders() }).pipe(
      catchError((error) => {
        console.error('Error updating shop location:', error);
        throw error;
      })
    );
  }

  // Worker order management methods
  acceptOrder(orderId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/orders/${orderId}/accept`, {}, { headers: this.getHeaders() }).pipe(
      catchError((error) => {
        console.error('Error accepting order:', error);
        throw error;
      })
    );
  }

  rejectOrder(orderId: number, reason?: string): Observable<any> {
    const payload = reason ? { reason } : {};
    return this.http.post(`${this.apiUrl}/orders/${orderId}/reject`, payload, { headers: this.getHeaders() }).pipe(
      catchError((error) => {
        console.error('Error rejecting order:', error);
        throw error;
      })
    );
  }

  getAssignedOrders(): Observable<any> {
    return this.http.get(`${this.apiUrl}/orders/assigned/assigned`, { headers: this.getHeaders() }).pipe(
      catchError((error) => {
        console.error('Error fetching assigned orders:', error);
        throw error;
      })
    );
  }

  updateOrderStatusForWorker(orderId: number, status: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/orders/${orderId}/status`, { status }, { headers: this.getHeaders() }).pipe(
      catchError((error) => {
        console.error('Error updating order status:', error);
        throw error;
      })
    );
  }
}

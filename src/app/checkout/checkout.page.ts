import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonContent, 
  IonCard, 
  IonCardHeader, 
  IonCardTitle, 
  IonCardContent,
  IonButton,
  IonInput,
  IonItem,
  IonLabel,
  IonIcon, // Add this import
  IonTextarea,
  IonSpinner,
  AlertController
} from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '../pipes/translate.pipe';
import { CurrencyPipe } from '../pipes/currency.pipe';
import { Geolocation } from '@capacitor/geolocation';
import * as L from 'leaflet';
import { addIcons } from 'ionicons'; // Add this import
import { removeCircleOutline, addCircleOutline } from 'ionicons/icons'; // Add these icon imports
import { Subscription } from 'rxjs';

@Component({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  selector: 'app-checkout',
  templateUrl: './checkout.page.html',
  styleUrls: ['./checkout.page.scss'],
  imports: [
    IonHeader, 
    IonToolbar, 
    IonTitle, 
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonButton,
    IonInput,
    IonItem,
    IonLabel,
    IonIcon, // Add this to imports array
    IonTextarea,
    IonSpinner,
    CommonModule,
    FormsModule,
    TranslatePipe,
    CurrencyPipe
  ]
})
export class CheckoutPage implements OnInit {
  cartItems: any[] = [];
  loading: boolean = false;
  deliveryAddress: string = '';
  deliveryInstructions: string = '';
  totalAmount: number = 0;
  shopLocation: any = {
    address: '',
    latitude: 0,
    longitude: 0
  };

  private map: L.Map | null = null;
  private deliveryMarker: L.Marker | null = null;
  private deliveryCoords: L.LatLng | null = null;

  private cartSubscription?: Subscription;

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    public router: Router,
    private alertController: AlertController
  ) {
    // Add the icons to the registry
    addIcons({ removeCircleOutline, addCircleOutline });
  }

  ngOnInit() {
    this.loadCart();
    this.fetchShopLocation();

    this.cartSubscription = this.apiService.cartItems$.subscribe(
      items => {
        this.cartItems = items;
        this.calculateTotal();
      }
    );
  }

  fetchShopLocation() {
    this.apiService.getShopLocation().subscribe({
      next: (location) => {
        if (location) {
          this.shopLocation.address = location.data.address || '';
          this.shopLocation.latitude = location.data.latitude || 0;
          this.shopLocation.longitude = location.data.longitude || 0;
        }
      },
      error: (error) => {
        console.error('Error fetching shop location:', error);
      }
    });
  }

  ngAfterViewInit() {
    // this.initMapWithCurrentUserLocation();
  }

   async initMapWithCurrentUserLocation() {
    try {
      const position = await Geolocation.getCurrentPosition();
      const { latitude, longitude } = position.coords;
      this.deliveryCoords = L.latLng(latitude, longitude);
      this.reverseGeocode(this.deliveryCoords);

      this.initializeMap(this.deliveryCoords);
    } catch (error) {
      console.error('Error getting current location, falling back to default', error);
      // Fallback to a default location if geolocation fails
      const defaultCoords = L.latLng(51.505, -0.09);
      this.deliveryCoords = defaultCoords;
      this.reverseGeocode(defaultCoords);
      this.initializeMap(defaultCoords);
    }
  }

  initializeMap(center: L.LatLng) {
    // Use setTimeout to ensure the map container is rendered
    setTimeout(() => {
      this.map = L.map('checkout-mapp').setView(center, 13);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© Benlee Delivery - OpenStreetMap'
      }).addTo(this.map);

      this.deliveryMarker = L.marker(center, { draggable: true }).addTo(this.map);

      this.deliveryMarker.on('dragend', (event) => {
        const newCoords = event.target.getLatLng();
        this.deliveryCoords = newCoords;
        this.reverseGeocode(newCoords);
      });

      this.map.on('click', (event) => {
        this.deliveryCoords = event.latlng;
        this.deliveryMarker?.setLatLng(event.latlng);
        this.reverseGeocode(event.latlng);
      });
    }, 500); // A small delay might be necessary
  }

  async reverseGeocode(coords: L.LatLng) {
    // This uses a free public service (Nominatim). 
    // For production, consider a dedicated geocoding service.
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.lat}&lon=${coords.lng}`;
    try {
      const response = await fetch(url);
      const data = await response.json();
      if (data && data.display_name) {
        this.deliveryAddress = data.display_name;
      } else {
        this.deliveryAddress = `Lat: ${coords.lat.toFixed(5)}, Lng: ${coords.lng.toFixed(5)}`;
      }
    } catch (error) {
      console.error('Error with reverse geocoding:', error);
      this.deliveryAddress = `Lat: ${coords.lat.toFixed(5)}, Lng: ${coords.lng.toFixed(5)}`;
    }
  }

  loadCart() {
   
    // this.cartItems = this.apiService.getCartItems();
    // this.calculateTotal();
    this.apiService.getCart().subscribe({
      next: (cart) => {
        this.cartItems = cart.cart_items || [];
        this.calculateTotal();
      },
      error: (error) => {
        console.error('Error loading cart:', error);
      }
    });
  }

  calculateTotal() {
    this.totalAmount = this.cartItems.reduce((total, item) => {
      return total + (item.product.base_price * item.quantity);
    }, 0);

    this.initMapWithCurrentUserLocation();
  }

  async proceedToCheckout() {
    if (!this.deliveryAddress) {
      const alert = await this.alertController.create({
        header: 'Error',
        message: 'Please enter a delivery address',
        buttons: ['OK']
      });
      await alert.present();
      return;
    }

    this.loading = true;

    // Format cart items for order creation
    const formattedItems = this.cartItems.map(item => ({
      product_id: item.product_id,
      quantity: item.quantity,
      price: item.product.base_price,
      name: item.product.name
    }));

    const orderData = {
      items: formattedItems,
      delivery_address: this.deliveryAddress,
      delivery_instructions: this.deliveryInstructions,
      total_amount: this.totalAmount,
      delivery_latitude: this.deliveryCoords?.lat,
      delivery_longitude: this.deliveryCoords?.lng,
      payment_method: 'cash', // Default payment method
      store_location: this.shopLocation.address, // Pass the store location from admin dashboard
      picklat: this.shopLocation.latitude,
      picklng: this.shopLocation.longitude
    };

    this.apiService.createOrder(orderData).subscribe({
      next: async (response) => {
        this.loading = false;

        if (response.success) {
          // Clear cart after successful order
          this.cartItems = [];
          // The cart subscription will handle updating the UI

          const alert = await this.alertController.create({
            header: 'Order Placed Successfully!',
            message: `Your order has been placed successfully!\n\nTracking ID: ${response.data.tracking_id}\n\nYou can track your order in the delivery tracking section.`,
            buttons: [
              {
                text: 'Track Order',
                handler: () => {
                  this.router.navigate(['/delivery-tracking'], {
                    queryParams: { orderId: response.data.id, trackingId: response.data.tracking_id }
                  });
                }
              },
              {
                text: 'OK',
                handler: () => {
                  this.router.navigate(['/home']);
                }
              }
            ]
          });
          await alert.present();
        } else {
          throw new Error(response.message || 'Failed to create order');
        }
      },
      error: async (error) => {
        this.loading = false;
        console.error('Error during checkout:', error);

        let errorMessage = 'Failed to place order. Please try again.';
        if (error.error && error.error.message) {
          errorMessage = error.error.message;
        }

        const alert = await this.alertController.create({
          header: 'Error',
          message: errorMessage,
          buttons: ['OK']
        });
        await alert.present();
      }
    });
  }

  removeFromCart(itemId: number) {
    this.apiService.removeFromCart(itemId).subscribe({
      next: () => {
        // On success, reload the cart data to update the view
        this.loadCart();
      },
      error: async (error) => {
        console.error('Error removing item from cart:', error);
        const alert = await this.alertController.create({
          header: 'Error',
          message: 'Failed to remove item from cart. Please try again.',
          buttons: ['OK']
        });
        await alert.present();
      }
    });
  }

   updateQuantity(itemId: number, newQuantity: number) {
     if (newQuantity < 1) {
          this.removeFromCart(itemId);
        return;
      }

      // Find the cart item to get product information
      const cartItem = this.cartItems.find(item => item.id === itemId);
      if (!cartItem) {
        console.error('Cart item not found');
        return;
      }

      // Check if we're increasing quantity and validate stock
      if (newQuantity > cartItem.quantity) {
        this.validateAndUpdateQuantity(cartItem, newQuantity);
      } else {
        // Direct update for quantity decrease
        this.performQuantityUpdate(itemId, newQuantity);
      }

    // this.apiService.updateCartItemQuantity(itemId, newQuantity).subscribe({
    //   next: () => {
    //     this.loadCart(); // Reload cart to reflect the new quantity and total
    //   },
    //   error: async (error) => {
    //     console.error('Error updating quantity:', error);
    //     const alert = await this.alertController.create({
    //       header: 'Error',
    //       message: 'Failed to update item quantity. Please try again.',
    //       buttons: ['OK']
    //     });
    //     await alert.present();
    //   }
    // });
  }

private async validateAndUpdateQuantity(cartItem: any, newQuantity: number) {
  const maxStock = cartItem.product.stock_quantity || 0;
  const maxPerOrder = cartItem.product.max_quantity || 999;
  
  // Check stock availability
  if (newQuantity > maxStock) {
    const alert = await this.alertController.create({
      header: 'Insufficient Stock',
      message: `Only ${maxStock} items available in stock.`,
      buttons: ['OK']
    });
    await alert.present();
    return;
  }
  // Check maximum per order limit
  if (newQuantity > maxPerOrder) {
    const alert = await this.alertController.create({
      header: 'Quantity Limit Exceeded',
      message: `Maximum ${maxPerOrder} items allowed per order.`,
      buttons: ['OK']
    });
    await alert.present();
    return;
  }

  // Validate with backend
  this.apiService.checkStockAvailability(cartItem.product.id, newQuantity).subscribe({
    next: (stockResponse) => {
      if (stockResponse.available) {
        this.performQuantityUpdate(cartItem.id, newQuantity);
      } else {
        this.showStockError(stockResponse.message || 'Insufficient stock available');
      }
    },
    error: (error) => {
      console.error('Error checking stock:', error);
      // Fallback to local validation
      this.performQuantityUpdate(cartItem.id, newQuantity);
    }
  });
}

private performQuantityUpdate(itemId: number, quantity: number) {
  this.apiService.updateCartItemQuantity(itemId, quantity).subscribe({
    next: (response) => {
      console.log('Quantity updated successfully:', response);
      this.loadCart(); // Reload cart to reflect the new quantity and total
    },
    error: async (error) => {
      console.error('Error updating quantity:', error);
      
      let errorMessage = 'Failed to update item quantity. Please try again.';
      
      // Handle specific error messages from backend
      if (error.error && error.error.message) {
        errorMessage = error.error.message;
      } else if (error.status === 422) {
        errorMessage = 'Invalid quantity. Please check stock availability.';
      }
      
      const alert = await this.alertController.create({
        header: 'Error',
        message: errorMessage,
        buttons: ['OK']
      });
      await alert.present();
    }
  });
}

private async showStockError(message: string) {
  const alert = await this.alertController.create({
    header: 'Stock Unavailable',
    message: message,
    buttons: ['OK']
  });
  await alert.present();
}

// Add method to increase quantity by 1
increaseQuantity(itemId: number) {
  const cartItem = this.cartItems.find(item => item.id === itemId);
  if (cartItem) {
    this.updateQuantity(itemId, cartItem.quantity + 1);
  }
}

// Add method to decrease quantity by 1
decreaseQuantity(itemId: number) {
  const cartItem = this.cartItems.find(item => item.id === itemId);
  if (cartItem) {
    this.updateQuantity(itemId, cartItem.quantity - 1);
  }
}

  ngOnDestroy() {
    if (this.cartSubscription) {
      this.cartSubscription.unsubscribe();
    }
  }

}

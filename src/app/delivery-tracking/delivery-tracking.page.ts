import { Component, OnInit, OnDestroy, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonItem,
  IonLabel,
  IonBadge,
  IonSpinner
} from '@ionic/angular/standalone';
import { GoogleMapsModule } from '@angular/google-maps';
import { ApiService } from '../services/api.service';
import { Subscription, interval } from 'rxjs';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../pipes/translate.pipe';
import { CurrencyPipe } from '../pipes/currency.pipe';
import { ActivatedRoute } from '@angular/router';
import { Geolocation } from '@capacitor/geolocation';

@Component({
  schemas:[CUSTOM_ELEMENTS_SCHEMA],
  selector: 'app-delivery-tracking',
  templateUrl: './delivery-tracking.page.html',
  styleUrls: ['./delivery-tracking.page.scss'],
  imports: [
    IonHeader, 
    IonToolbar, 
    IonTitle, 
    IonContent,
    IonButton,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonItem,
    IonLabel,
    IonBadge,
    IonSpinner,
    CommonModule,
    TranslatePipe,
    CurrencyPipe,
    GoogleMapsModule
  ]
})
export class DeliveryTrackingPage implements OnInit, OnDestroy {
  mapOptions: any = {
    zoom: 14,
    disableDefaultUI: true,
    zoomControl: true,
    gestureHandling: 'greedy',
    mapTypeId: 'roadmap'
  };
  map: any = null;
  driverMarker: any = null;
  pickupMarker: any = null;
  deliveryMarker: any = null;
  routePolyline: any = null;
  private locationPollingSubscription: Subscription | null = null;
  
  deliveryStatus = 'pending'; // pending, accepted, picked_up, in_transit, out_for_delivery, delivered, cancelled
  estimatedTime = '15-20 minutes';
  isTrackingActive = false;
  loading = false;
  lastLocationUpdate = new Date();
  connectionStatus = 'connecting'; // connecting, connected, disconnected, processing
  locationAccuracy = 0;
  updateCount = 0;
  workerStartedDelivery = false; // Track if worker has started delivery
  isWorker = false; // Flag to differentiate worker vs user view

  driverInfo = {
    name: 'John Driver',
    phone: '+1234567890',
    rating: 4.8,
    vehicle: 'Toyota Corolla',
    licensePlate: 'ABC123',
    currentLatitude: 0,
    currentLongitude: 0
  };

  customerInfo = {
    name: 'Customer Name',
    email: 'customer@example.com',
    phone: '',
    profile_picture: '',
    delivery_address: ''
  };

  deliveryDetails = {
    from: '',
    to: '',
    distance: '',
    items: [] as string[],
    deliveryId: 0,
    worker_id: 0
  };

  // Shop location for default pickup
  shopLocation: any = {
    address: '',
    latitude: 0,
    longitude: 0
  };

  // Delivery coordinates from backend
  pickupLocation: google.maps.LatLngLiteral = { lat: 51.5, lng: -0.09 }; // Default fallback
  destinationLocation: google.maps.LatLngLiteral = { lat: 51.51, lng: -0.1 }; // Default fallback

  constructor(private apiService: ApiService, private route: ActivatedRoute) {}

  ngOnDestroy() {
    this.stopLocationTracking();
  }

  startLocationTracking() {
    this.isTrackingActive = true;
    this.connectionStatus = 'connecting';

    console.log('🚀 Starting location tracking...');
    console.log('📋 Delivery details:', {
      deliveryId: this.deliveryDetails.deliveryId,
      worker_id: this.deliveryDetails.worker_id,
      driverName: this.driverInfo.name
    });

    // More frequent updates for better real-time feel (every 3 seconds)
    this.locationPollingSubscription = interval(3000).subscribe(() => {
      console.log('🔄 Polling for location update...');

      // Check if we have a valid worker ID
      if (this.deliveryDetails.worker_id && this.deliveryDetails.worker_id > 0) {
        console.log('👷 Fetching worker data for ID:', this.deliveryDetails.worker_id);

        // Get the assigned worker's details for this delivery
        this.apiService.getWorker(this.deliveryDetails.worker_id).subscribe({
          next: (response) => {
            console.log('📡 Worker API response:', response);

            const worker = response.data || response;
            console.log('👷 Worker data:', worker);

            if (worker) {
              // Check if worker has valid location data (allow 0 values)
              const hasValidLocation = worker.current_latitude !== null &&
                                     worker.current_longitude !== null &&
                                     worker.current_latitude !== undefined &&
                                     worker.current_longitude !== undefined &&
                                     !isNaN(worker.current_latitude) &&
                                     !isNaN(worker.current_longitude);

              if (hasValidLocation) {
                this.connectionStatus = 'connected';
                this.workerStartedDelivery = true; // Worker has started sharing location
                this.lastLocationUpdate = new Date();
                this.updateCount++;

                // Calculate location accuracy (simulate based on update frequency)
                this.locationAccuracy = Math.max(5, Math.min(50, 50 - (this.updateCount % 10) * 5));

                // Update driver info with worker data
                this.driverInfo.name = worker.name || this.driverInfo.name;
                this.driverInfo.phone = worker.phone || worker.phone_number || this.driverInfo.phone;
                this.driverInfo.vehicle = worker.vehicle_type || this.driverInfo.vehicle;
                this.driverInfo.currentLatitude = parseFloat(worker.current_latitude);
                this.driverInfo.currentLongitude = parseFloat(worker.current_longitude);

                this.updateDriverLocation(parseFloat(worker.current_latitude), parseFloat(worker.current_longitude));

                console.log(`📍 Real-time update #${this.updateCount}: Driver at ${worker.current_latitude}, ${worker.current_longitude}`);
              } else {
                console.log('⚠️ Worker data incomplete - missing location:', {
                  hasWorker: !!worker,
                  hasLat: worker.current_latitude !== null && worker.current_latitude !== undefined && !isNaN(worker.current_latitude),
                  hasLng: worker.current_longitude !== null && worker.current_longitude !== undefined && !isNaN(worker.current_longitude),
                  lat: worker.current_latitude,
                  lng: worker.current_longitude,
                  workerData: worker
                });

                // Check if worker hasn't started delivery yet (no location data)
                // vs actual disconnection (API errors, network issues)
                if (!this.workerStartedDelivery && this.deliveryStatus === 'accepted') {
                  this.connectionStatus = 'processing'; // Worker assigned but hasn't started
                  console.log('📦 Worker assigned but hasn\'t started delivery yet');
                } else {
                  this.connectionStatus = 'disconnected'; // Actual disconnection
                }

                // Use pickup location as fallback
                this.updateDriverLocation(this.pickupLocation.lat, this.pickupLocation.lng);
              }
            } else {
              console.log('⚠️ No worker data returned from API');
              this.connectionStatus = 'disconnected';
              this.updateDriverLocation(this.pickupLocation.lat, this.pickupLocation.lng);
            }
          },
          error: (error) => {
            console.error('❌ Error fetching worker location:', error);
            console.error('❌ Error details:', {
              status: error.status,
              statusText: error.statusText,
              message: error.message,
              url: error.url
            });
            this.connectionStatus = 'disconnected';

            // If worker details not available, use pickup location
            this.updateDriverLocation(this.pickupLocation.lat, this.pickupLocation.lng);

            // Try to reconnect after 10 seconds of errors
            setTimeout(() => {
              if (this.connectionStatus === 'disconnected') {
                this.connectionStatus = 'connecting';
              }
            }, 10000);
          }
        });
      } else {
        console.log('⏳ No assigned worker yet or delivery not ready:', {
          hasDeliveryId: !!this.deliveryDetails.deliveryId,
          workerId: this.deliveryDetails.worker_id,
          driverName: this.driverInfo.name,
          isPreparing: this.driverInfo.name === 'Your delivery is being prepared'
        });

        // No assigned worker yet, position at pickup location
        this.updateDriverLocation(this.pickupLocation.lat, this.pickupLocation.lng);
        this.connectionStatus = 'connecting';
      }
    });
  }

  stopLocationTracking() {
    if (this.locationPollingSubscription) {
      this.locationPollingSubscription.unsubscribe();
      this.isTrackingActive = false;
    }
  }

  async ngOnInit() {
    // Get query parameters first
    this.route.queryParams.subscribe(async (params) => {
      const orderId = params['orderId'];
      const trackingId = params['trackingId'];
      this.isWorker = params['isWorker'] === 'true';

      console.log('👷 Worker view:', this.isWorker);

      if (trackingId) {
        await this.fetchOrderByTrackingId(trackingId);
      } else if (orderId) {
        await this.fetchOrderById(orderId);
      } else {
        // Fallback to demo data if no parameters provided
        await this.fetchDeliveryDetails(orderId);
      }

      // Automatically start live tracking after order details are loaded
      await this.autoStartLiveTracking();
    });

    // Load shop location and initialize map after it's loaded
    this.loadShopLocationAndInitializeMap();
  }

  fetchOrderById(orderId: number) {
    this.loading = true;
    this.apiService.getOrder(orderId).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.success) {
          this.updateOrderData(response.data);
        }
      },
      error: (error) => {
        this.loading = false;
        console.error('Error fetching order:', error);
        // Fallback to demo data
        this.fetchDeliveryDetails(orderId);
      }
    });
  }

  fetchOrderByTrackingId(trackingId: string) {
    this.loading = true;
    this.apiService.getOrderByTrackingId(trackingId).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.success) {
          this.updateOrderData(response.data);
        }
      },
      error: (error) => {
        this.loading = false;
        console.error('Error fetching order by tracking ID:', error);
        // Fallback to demo data
        this.fetchDeliveryDetails(Number(trackingId));
      }
    });
  }

  updateOrderData(order: any) {
    // Update delivery status
    this.deliveryStatus = order.status || 'pending';

    // Set delivery ID for tracking
    this.deliveryDetails.deliveryId = order.id;
    this.deliveryDetails.worker_id = order.worker_id;

    // Update coordinates
    if (order.pickup_latitude && order.pickup_longitude) {
      this.pickupLocation = { lat: parseFloat(order.pickup_latitude), lng: parseFloat(order.pickup_longitude) };
    }
    if (order.delivery_latitude && order.delivery_longitude) {
      this.destinationLocation = { lat: parseFloat(order.delivery_latitude), lng: parseFloat(order.delivery_longitude) };
    }

    // Update delivery details
    this.deliveryDetails.from = order.pickup_location || 'Store Location';
    this.deliveryDetails.to = order.delivery_location || 'Delivery Address';
    this.deliveryDetails.distance = order.distance ? `${order.distance} km` : 'Calculating...';
    this.deliveryDetails.items = order.package_description ? [order.package_description] : ['Order items'];

    // Update customer info if user data is available
    if (order.user) {
      this.customerInfo.name = order.user.name || 'Customer';
      this.customerInfo.email = order.user.email || '';
      this.customerInfo.phone = order.user.phone || '';
      this.customerInfo.profile_picture = order.user.profile_picture || '';
      this.customerInfo.delivery_address = order.delivery_location || '';
    }

    // Update driver info if worker is assigned
    if (order.worker) {
      this.driverInfo.name = order.worker.name;
      this.driverInfo.phone = order.worker.phone || this.driverInfo.phone;
      this.driverInfo.vehicle = order.worker.vehicle_type || this.driverInfo.vehicle;
    } else {
      // No driver assigned yet - show preparation message
      this.driverInfo.name = 'Your delivery is being prepared';
      this.driverInfo.phone = '';
      this.driverInfo.vehicle = '';
    }

    // Update map markers with new coordinates if map is initialized
    if (this.map) {
      this.createMarkers();
      this.fitMapBounds();
    }
  }

  fetchDeliveryDetails(orderId: number) {
    // For demo purposes, get the first delivery
    this.apiService.getDelivery(orderId).subscribe(delivery => {
      if (delivery.pickup_latitude && delivery.pickup_longitude) {
        this.pickupLocation = { lat: delivery.pickup_latitude, lng: delivery.pickup_longitude };
      }
      if (delivery.destination_latitude && delivery.destination_longitude) {
        this.destinationLocation = { lat: delivery.destination_latitude, lng: delivery.destination_longitude };
      }

      // Update delivery details
      this.deliveryDetails.from = delivery.pickup_address || 'Pickup Location';
      this.deliveryDetails.to = delivery.destination_address || 'Delivery Location';
      this.deliveryDetails.distance = delivery.distance ? `${delivery.distance} miles` : 'Calculating...';
      this.deliveryDetails.items = delivery.description ? [delivery.description] : ['Delivery items'];

      // Reinitialize map if already initialized
      if (this.map) {
        this.createMarkers();
        this.fitMapBounds();
      }
    });
  }

  loadShopLocationAndInitializeMap() {
    this.apiService.getShopLocation().subscribe({
      next: (location) => {
        if (location && location.data) {
          this.shopLocation = location.data;
          console.log('Loaded shop location:', this.shopLocation.address);

          // Set shop location as default pickup location
          if (this.shopLocation.latitude && this.shopLocation.longitude &&
              this.shopLocation.latitude !== '' && this.shopLocation.longitude !== '') {
            this.pickupLocation = { lat: parseFloat(this.shopLocation.latitude), lng: parseFloat(this.shopLocation.longitude) };
            this.deliveryDetails.from = this.shopLocation.address || 'Shop Location';
            console.log('Updated pickup location to shop coordinates:', this.pickupLocation);
          }

          // Initialize map after shop location is loaded
          // Map will be initialized by the template when ready
        } else {
          console.log('No shop location data received, using defaults');
          // Map will be initialized by the template when ready
        }
      },
      error: (error) => {
        console.error('Error loading shop location:', error);
        // Map will be initialized by the template when ready
      }
    });
  }

  loadShopLocation() {
    this.apiService.getShopLocation().subscribe({
      next: (location) => {
        if (location) {
          this.shopLocation = location.data;
          console.log('Loaded shop location:', this.shopLocation.address);
          // Set shop location as default pickup location
          if (this.shopLocation.latitude != '' && this.shopLocation.longitude != '') {
            this.pickupLocation = { lat: parseFloat(this.shopLocation.latitude), lng: parseFloat(this.shopLocation.longitude) };
            this.deliveryDetails.from = this.shopLocation.address || 'Shop Location';

            // Update map if it's already initialized
            if (this.map) {
              this.createMarkers();
              this.fitMapBounds();
            }
          }
        }
      },
      error: (error) => {
        console.error('Error loading shop location:', error);
        // Keep default coordinates if shop location is not available
      }
    });
  }

  updateMapWithShopLocation() {
    if (!this.map) return;

    // Clear existing markers and polyline
    if (this.driverMarker) {
      this.driverMarker.setMap(null);
    }
    if (this.pickupMarker) {
      this.pickupMarker.setMap(null);
    }
    if (this.deliveryMarker) {
      this.deliveryMarker.setMap(null);
    }
    if (this.routePolyline) {
      this.routePolyline.setMap(null);
    }

    // Recreate markers
    this.createMarkers();
    this.fitMapBounds();
  }

  // fetchWorkerDetails() {
  //   this.apiService.getWorkerDetails().subscribe(worker => {
  //     this.driverInfo.vehicle = worker.vehicle_type;
  //     this.driverInfo.licensePlate = worker.vehicle_registration;

  //     // Start driver at pickup location instead of worker's current location
  //     this.updateDriverLocation(this.pickupLocation[0], this.pickupLocation[1]);
  //   });
  // }

  onMapInitialized(map: google.maps.Map) {
    console.log('Google Maps initialized');
    this.map = map;

    // Create markers
    this.createMarkers();

    // Fit bounds to show all markers
    this.fitMapBounds();
  }

  private createMarkers() {
    if (!this.map) return;

    // Create pickup marker
    this.pickupMarker = new google.maps.Marker({
      position: this.pickupLocation,
      map: this.map,
      title: 'Pickup Location',
      icon: {
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
          <svg width="30" height="30" viewBox="0 0 30 30" xmlns="http://www.w3.org/2000/svg">
            <circle cx="15" cy="15" r="12" fill="#10b981" stroke="white" stroke-width="3"/>
            <text x="15" y="20" text-anchor="middle" fill="white" font-size="16" font-weight="bold">📦</text>
          </svg>
        `),
        scaledSize: new google.maps.Size(30, 30),
        anchor: new google.maps.Point(15, 30)
      }
    });

    // Create delivery marker
    this.deliveryMarker = new google.maps.Marker({
      position: this.destinationLocation,
      map: this.map,
      title: 'Delivery Location',
      icon: {
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
          <svg width="30" height="30" viewBox="0 0 30 30" xmlns="http://www.w3.org/2000/svg">
            <circle cx="15" cy="15" r="12" fill="#ef4444" stroke="white" stroke-width="3"/>
            <text x="15" y="20" text-anchor="middle" fill="white" font-size="16" font-weight="bold">🏠</text>
          </svg>
        `),
        scaledSize: new google.maps.Size(30, 30),
        anchor: new google.maps.Point(15, 30)
      }
    });

    // Create driver marker
    const vehicleIcon = this.driverInfo.vehicle.toLowerCase().includes('motor') ? '🏍️' : '🚗';
    this.driverMarker = new google.maps.Marker({
      position: this.pickupLocation,
      map: this.map,
      title: 'Driver Location',
      icon: {
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
          <svg width="38" height="38" viewBox="0 0 38 38" xmlns="http://www.w3.org/2000/svg">
            <circle cx="19" cy="19" r="16" fill="#3b82f6" stroke="white" stroke-width="3"/>
            <text x="19" y="25" text-anchor="middle" fill="white" font-size="18">${vehicleIcon}</text>
          </svg>
        `),
        scaledSize: new google.maps.Size(38, 38),
        anchor: new google.maps.Point(19, 38)
      },
      animation: google.maps.Animation.DROP
    });

    // Route will be created dynamically when driver starts moving
    // Only show route when delivery is in progress
  }

  private fitMapBounds() {
    if (!this.map) return;

    const bounds = new google.maps.LatLngBounds();
    bounds.extend(this.pickupLocation);
    bounds.extend(this.destinationLocation);

    this.map.fitBounds(bounds, 60);
  }

  updateDriverLocation(lat: number, lng: number) {
    if (this.driverMarker && this.map) {
      // Validate coordinates before updating
      if (typeof lat === 'number' && typeof lng === 'number' &&
          !isNaN(lat) && !isNaN(lng) &&
          lat >= -90 && lat <= 90 &&
          lng >= -180 && lng <= 180) {

        this.driverMarker.setPosition({ lat, lng });
        this.map.panTo({ lat, lng });

        // Update the route from current driver location to destination
        this.updateRoute(lat, lng);
      } else {
        console.error('❌ Invalid coordinates provided to updateDriverLocation:', { lat, lng });
        // Fallback to pickup location
        this.driverMarker.setPosition(this.pickupLocation);
        this.map.panTo(this.pickupLocation);
        this.updateRoute(this.pickupLocation.lat, this.pickupLocation.lng);
      }
    }
  }

  private updateRoute(driverLat: number, driverLng: number) {
    if (!this.map) return;

    // Clear existing route
    if (this.routePolyline) {
      this.routePolyline.setMap(null);
    }

    // Show route for workers immediately, or for users when delivery is in progress
    const shouldShowRoute = this.isWorker ||
      (this.deliveryStatus === 'in_transit' || this.deliveryStatus === 'out_for_delivery' || this.deliveryStatus === 'picked_up');

    if (shouldShowRoute) {
      // Create dynamic route from current driver location to destination
      this.routePolyline = new google.maps.Polyline({
        path: [
          { lat: driverLat, lng: driverLng },
          this.destinationLocation
        ],
        geodesic: true,
        strokeColor: '#3b82f6',
        strokeOpacity: 0.8,
        strokeWeight: 6,
        map: this.map,
        icons: [{
          icon: {
            path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
            scale: 3,
            strokeColor: '#3b82f6'
          },
          offset: '50%'
        }]
      });

      console.log(`🛣️ Updated route: Driver (${driverLat.toFixed(6)}, ${driverLng.toFixed(6)}) → Destination (${this.destinationLocation.lat.toFixed(6)}, ${this.destinationLocation.lng.toFixed(6)})`);
    }
  }

  async autoStartLiveTracking(): Promise<void> {
    console.log('🚀 Auto-starting live tracking...');

    // Wait for map to be initialized
    let attempts = 0;
    const maxAttempts = 10;

    while (!this.map && attempts < maxAttempts) {
      console.log(`⏳ Waiting for map initialization (attempt ${attempts + 1}/${maxAttempts})`);
      await new Promise(resolve => setTimeout(resolve, 500));
      attempts++;
    }

    if (!this.map) {
      console.error('❌ Map failed to initialize after multiple attempts');
      this.connectionStatus = 'disconnected';
      return;
    }

    // Wait for driver marker to be initialized
    attempts = 0;
    while (!this.driverMarker && attempts < maxAttempts) {
      console.log(`⏳ Waiting for driver marker initialization (attempt ${attempts + 1}/${maxAttempts})`);
      await new Promise(resolve => setTimeout(resolve, 300));
      attempts++;
    }

    if (!this.driverMarker) {
      console.error('❌ Driver marker failed to initialize');
      this.connectionStatus = 'disconnected';
      return;
    }

    // Send worker's current location to backend when starting delivery tracking
    if (this.isWorker && this.deliveryDetails.worker_id) {
      await this.sendWorkerLocationToBackend();
    }

    // Start live location tracking automatically
    if (!this.isTrackingActive) {
      this.startLocationTracking();
      console.log('✅ Live tracking auto-started successfully');

      // Update status if preparing
      if (this.deliveryStatus === 'accepted' && this.driverInfo.name !== 'Your delivery is being prepared') {
        await this.updateOrderStatus('in_transit');
        this.deliveryStatus = 'in_transit';
      }
    } else {
      console.log('ℹ️ Live tracking already active');
    }
  }

  startLiveTracking() {
    console.log('Track Delivery button clicked - Starting live tracking');

    // Check if map is initialized
    if (!this.map) {
      console.error('Map not initialized');
      alert('Map is not ready. Please wait for the page to load completely.');
      return;
    }

    // Check if driver marker exists
    if (!this.driverMarker) {
      console.error('Driver marker not initialized');
      alert('Driver location not available. Please refresh the page.');
      return;
    }

    // Start live location tracking
    if (!this.isTrackingActive) {
      this.startLocationTracking();
      console.log('Live tracking started');
    } else {
      console.log('Live tracking already active');
    }

    // Update status if preparing
    if (this.deliveryStatus === 'accepted' && this.driverInfo.name !== 'Your delivery is being prepared') {
      this.deliveryStatus = 'in_transit';
    }
  }

  // Demo function to switch between vehicle types
  switchVehicleType() {
    if (this.driverInfo.vehicle.toLowerCase().includes('motor')) {
      this.driverInfo.vehicle = 'Toyota Corolla';
    } else {
      this.driverInfo.vehicle = 'Honda Motorcycle';
    }

    // Update markers with new vehicle icon
    if (this.map && this.driverMarker) {
      this.createMarkers();
    }
  }

  // Debug function to simulate worker location updates (for testing)
  simulateWorkerLocation() {
    if (!this.deliveryDetails.worker_id || this.deliveryDetails.worker_id <= 0) {
      console.log('⚠️ No worker assigned to simulate location for');
      return;
    }

    // Simulate moving the worker towards the destination
    const currentLat = this.driverInfo.currentLatitude || this.pickupLocation.lat;
    const currentLng = this.driverInfo.currentLongitude || this.pickupLocation.lng;
    const targetLat = this.destinationLocation.lat;
    const targetLng = this.destinationLocation.lng;

    // Calculate movement (small steps towards destination)
    const latDiff = (targetLat - currentLat) * 0.1;
    const lngDiff = (targetLng - currentLng) * 0.1;

    const newLat = currentLat + latDiff;
    const newLng = currentLng + lngDiff;

    console.log(`🎯 Simulating worker movement from (${currentLat.toFixed(6)}, ${currentLng.toFixed(6)}) to (${newLat.toFixed(6)}, ${newLng.toFixed(6)})`);

    // Update the worker's location in the backend (if API supports it)
    this.apiService.updateWorkerLocation(this.deliveryDetails.worker_id, newLat, newLng).subscribe({
      next: (response) => {
        console.log('✅ Worker location updated in backend:', response);
        // Update local state
        this.driverInfo.currentLatitude = newLat;
        this.driverInfo.currentLongitude = newLng;
        this.updateDriverLocation(newLat, newLng);
        this.connectionStatus = 'connected';
        this.lastLocationUpdate = new Date();
      },
      error: (error) => {
        console.error('❌ Failed to update worker location:', error);
        // Still update local state for demo purposes
        this.driverInfo.currentLatitude = newLat;
        this.driverInfo.currentLongitude = newLng;
        this.updateDriverLocation(newLat, newLng);
        this.connectionStatus = 'connected';
        this.lastLocationUpdate = new Date();
      }
    });
  }

  // Added method: manual trigger to simulate worker movement for testing
  manualSimulateWorkerMovement() {
    console.log('Manual simulation of worker movement triggered');
    this.simulateWorkerLocation();
  }

  // Added debug logging for key state variables
  logDebugInfo() {
    console.log('DEBUG INFO:');
    console.log('Worker ID:', this.deliveryDetails.worker_id);
    console.log('Delivery Status:', this.deliveryStatus);
    console.log('Driver Location:', this.driverInfo.currentLatitude, this.driverInfo.currentLongitude);
    console.log('Tracking Active:', this.isTrackingActive);
  }

  // Function to manually refresh connection status
  refreshConnectionStatus() {
    console.log('🔄 Manually refreshing connection status...');

    if (this.deliveryDetails.worker_id && this.deliveryDetails.worker_id > 0) {
      this.connectionStatus = 'connecting';

      this.apiService.getWorker(this.deliveryDetails.worker_id).subscribe({
        next: (response) => {
          const worker = response.data || response;
          if (worker && worker.current_latitude !== null && worker.current_longitude !== null) {
            this.connectionStatus = 'connected';
            this.lastLocationUpdate = new Date();
            console.log('✅ Connection refreshed - Worker found with valid location');
          } else {
            this.connectionStatus = 'disconnected';
            console.log('⚠️ Connection refreshed - Worker found but no location data');
          }
        },
        error: (error) => {
          this.connectionStatus = 'disconnected';
          console.error('❌ Connection refresh failed:', error);
        }
      });
    } else {
      console.log('⚠️ No worker assigned - cannot refresh connection');
      this.connectionStatus = 'disconnected';
    }
  }

  callDriver() {
    if (this.isWorker) {
      console.log('Calling customer:', this.customerInfo.phone);
      // Implement actual calling functionality
      alert(`Calling ${this.customerInfo.name} at ${this.customerInfo.phone}`);
    } else {
      console.log('Calling driver:', this.driverInfo.phone);
      // Implement actual calling functionality
      alert(`Calling ${this.driverInfo.name} at ${this.driverInfo.phone}`);
    }
  }

  getStatusColor(): string {
    switch (this.deliveryStatus) {
      case 'pending': return 'warning';
      case 'accepted': return 'secondary';
      case 'picked_up': return 'tertiary';
      case 'in_transit': return 'primary';
      case 'out_for_delivery': return 'primary';
      case 'delivered': return 'success';
      case 'cancelled': return 'danger';
      default: return 'medium';
    }
  }

  getStatusText(): string {
    switch (this.deliveryStatus) {
      case 'pending': return 'Order Placed';
      case 'accepted': return 'Driver Assigned';
      case 'picked_up': return 'Package Picked Up';
      case 'in_transit': return 'In Transit';
      case 'out_for_delivery': return 'Out for Delivery';
      case 'delivered': return 'Delivered';
      case 'cancelled': return 'Order Cancelled';
      default: return 'Status Unknown';
    }
  }

  getTimeSinceLastUpdate(): string {
    if (!this.lastLocationUpdate) return 'Never';

    const now = new Date();
    const diffMs = now.getTime() - this.lastLocationUpdate.getTime();
    const diffSec = Math.floor(diffMs / 1000);

    if (diffSec < 60) {
      return `${diffSec}s ago`;
    } else if (diffSec < 3600) {
      const minutes = Math.floor(diffSec / 60);
      return `${minutes}m ago`;
    } else {
      const hours = Math.floor(diffSec / 3600);
      return `${hours}h ago`;
    }
  }

  async updateOrderStatus(status: string): Promise<void> {
    if (!this.deliveryDetails.deliveryId) {
      console.error('❌ No delivery ID available to update status');
      return;
    }

    try {
      console.log(`📝 Updating order ${this.deliveryDetails.deliveryId} status to ${status}`);
      const response = await this.apiService.updateOrderStatus(this.deliveryDetails.deliveryId, status).toPromise();
      if (response && response.success) {
        console.log('✅ Order status updated successfully');
        this.deliveryStatus = status;
      } else {
        console.error('❌ Failed to update order status:', response);
      }
    } catch (error) {
      console.error('❌ Error updating order status:', error);
    }
  }

  async sendWorkerLocationToBackend(): Promise<void> {
    if (!this.deliveryDetails.worker_id) {
      console.log('⚠️ No worker ID available to send location');
      return;
    }

    try {
      // Get current location using Capacitor Geolocation
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000
      });

      const currentLocation = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      };

      console.log(`📍 Sending worker location to backend: ${currentLocation.latitude}, ${currentLocation.longitude}`);

      // Send location to backend
      const response = await this.apiService.updateWorkerLocation(
        this.deliveryDetails.worker_id,
        currentLocation.latitude,
        currentLocation.longitude
      ).toPromise();

      if (response) {
        console.log('✅ Worker location sent to backend successfully');
        // Update local state
        this.driverInfo.currentLatitude = currentLocation.latitude;
        this.driverInfo.currentLongitude = currentLocation.longitude;
      } else {
        console.error('❌ Failed to send worker location to backend');
      }
    } catch (error) {
      console.error('❌ Error sending worker location to backend:', error);
    }
  }

  async markDeliveryCompleted(): Promise<void> {
    if (!this.deliveryDetails.deliveryId) {
      console.error('❌ No delivery ID available to mark completed');
      alert('Delivery ID not available. Please refresh the page.');
      return;
    }

    try {
      console.log(`📝 Marking delivery ${this.deliveryDetails.deliveryId} as completed`);
      const response = await this.apiService.updateOrderStatus(this.deliveryDetails.deliveryId, 'delivered').toPromise();

      if (response && response.success) {
        console.log('✅ Delivery marked as completed successfully');
        this.deliveryStatus = 'delivered';
        alert('Delivery has been marked as completed!');

        // Stop location tracking since delivery is complete
        this.stopLocationTracking();

        // Update UI to reflect completed status
        // The status badge and button text will update automatically due to data binding
      } else {
        console.error('❌ Failed to mark delivery as completed:', response);
        alert('Failed to mark delivery as completed. Please try again.');
      }
    } catch (error) {
      console.error('❌ Error marking delivery as completed:', error);
      alert('Error marking delivery as completed. Please check your connection and try again.');
    }
  }
}

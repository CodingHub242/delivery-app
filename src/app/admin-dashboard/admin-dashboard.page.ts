import { Component, OnInit, OnDestroy, AfterViewInit, CUSTOM_ELEMENTS_SCHEMA, ViewChild } from '@angular/core';
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
  IonGrid,
  IonRow,
  IonCol,
  IonIcon,
  IonButtons,
  IonList,
  IonItem,
  IonLabel,
  IonBadge,
  IonInput,
  IonTextarea,
  IonModal,
  IonSelect,
  IonRadioGroup,
  IonRadio
} from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { Platform } from '@ionic/angular';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { addIcons } from 'ionicons';
import { person, chatbubble, time, arrowBack, add, create, trash, document as documentIcon, location, car, cash, informationCircle, personCircle } from 'ionicons/icons';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType,Chart,Title,registerables } from 'chart.js';
import { NotificationListComponent } from './notification-list/notification-list.component';

@Component({
  schemas:[CUSTOM_ELEMENTS_SCHEMA],
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.page.html',
  styleUrls: ['./admin-dashboard.page.scss'],
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
    IonGrid,
    IonRow,
    IonCol,
    IonIcon,
    IonButtons,
    IonList,

    IonItem,
    IonLabel,
    IonBadge,
    IonInput,
    IonTextarea,
    IonModal,
    IonSelect,
    IonRadioGroup,
    IonRadio,
    CommonModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    BaseChartDirective,
    NotificationListComponent
  ]
})
export class AdminDashboardPage implements OnInit, OnDestroy, AfterViewInit {
  sidebarCollapsed: boolean = false;
  activeMenu: string = 'dashboard';

  conversations: any[] = [];
  services: any[] = [];
  workers: any[] = [];
  products: any[] = [];
  serviceRequests: any[] = [];
  deliveries: any[] = [];
  invoices: any[] = [];
  orders: any[] = [];
  loadingOrders: boolean = false;
  loadingServiceRequests: boolean = false;
  serviceRequestChart: any = {};
  deliveryChart: any = {};
  serviceRequestAnalytics: any = {};
  deliveryAnalytics: any = {};
  locationAnalytics: any = {};
  isMobilePlatform: boolean = false; // New property to track mobile platform

// Chart data
  serviceRequestsChartData: ChartData<'bar'> = {
    labels: [],
    datasets: [
      {
        data: [],
        label: 'Service Requests',
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1
      }
    ]
  };

  deliveriesChartData: ChartData<'bar'> = {
    labels: [],
    datasets: [
      {
        data: [],
        label: 'Deliveries',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 1
      }
    ]
  };

  serviceRequestsChartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    scales: {
      y: {
        beginAtZero: true
      }
    }
  };

  deliveriesChartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    scales: {
      y: {
        beginAtZero: true
      }
    }
  };
  newWorker: any = {
    name: '',
    email: '',
    phone: '',
    worker_type: '',
    vehicle_type: '',
    vehicle_plate: '',
    service_type: ''
  };
  newService: any = {
    name: '',
    description: '',
    base_price: 0,
    distance_rate: 0,
    admin_latitude: 0,
    admin_longitude: 0,
  };
  newProduct: any = {
    name: '',
    description: '',
    base_price: 0,
    stock_quantity: 0,
    image_url: ''
  };
  shopLocation: any = {
    address: '',
    latitude: 0,
    longitude: 0
  };
  shopLocationLoading: boolean = false;
  loading: boolean = true;
  error: string = '';
  currentUser: any = null;
  activeTab: string = 'conversations';

  // Expanded state for "See More" functionality
  servicesExpanded: boolean = false;
  workersExpanded: boolean = false;
  productsExpanded: boolean = false;
  serviceRequestsExpanded: boolean = false;
  ordersExpanded: boolean = false;
  deliveriesExpanded: boolean = false;

  // Loading states for add operations
  addingService: boolean = false;
  addingWorker: boolean = false;
  addingProduct: boolean = false;

  @ViewChild('addServiceModal') addServiceModal!: IonModal;
  @ViewChild('addWorkerModal') addWorkerModal!: IonModal;
  @ViewChild('addProductModal') addProductModal!: IonModal;

  workerForm!: FormGroup;
  workerErrorMessage: string = '';

  constructor(
    private apiService: ApiService,
    public authService: AuthService,
    private router: Router,
    private formBuilder: FormBuilder,
    private platform: Platform
  ) {
    addIcons({ person, chatbubble, time, arrowBack, add, create, trash, document: documentIcon, location, car, cash, informationCircle, personCircle });
    Chart.register(...registerables);
    this.initializeWorkerForm();
  }

  initializeWorkerForm() {
    this.workerForm = this.formBuilder.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      phone_number: ['', [Validators.required, Validators.pattern(/^[\+]?[0-9][\d]{0,14}$/)]],
      worker_type: ['', Validators.required],
      vehicle_type: [''],
      vehicle_registration: [''],
      service_type: [''],
      role: ['worker']
    });

     window.addEventListener('storage', (event) => {
      if (event.key === 'user') {
        this.loadCurrentUser();
      }
    });
  }


  // Modal methods
  openAddServiceModal() {
    this.addServiceModal?.present();
  }

  closeAddServiceModal() {
    this.addServiceModal?.dismiss();
  }

  openAddWorkerModal() {
    this.newWorker = {
      name: '',
      email: '',
      phone: '',
      worker_type: '',
      vehicle_type: '',
      vehicle_registration: '',
      service_type: ''
    };
    this.workerForm.reset();
    this.addWorkerModal?.present();
  }

  closeAddWorkerModal() {
    this.addWorkerModal?.dismiss();
  }

  openAddProductModal() {
    this.addProductModal?.present();
  }

  closeAddProductModal() {
    this.addProductModal?.dismiss();
  }

  onWorkerTypeChange(event: any) {
    const workerType = event.detail.value;
    this.workerForm.patchValue({
      worker_type: workerType
    });

    // Clear conditional fields when worker type changes
    if (workerType === 'delivery_driver') {
      this.workerForm.patchValue({
        service_type: '',
        vehicle_type: '',
        vehicle_registration: ''
      });
      this.workerForm.get('vehicle_type')?.setValidators([Validators.required]);
      this.workerForm.get('vehicle_registration')?.setValidators([Validators.required]);
      this.workerForm.get('service_type')?.clearValidators();
    } else if (workerType === 'service_worker') {
      this.workerForm.patchValue({
        vehicle_type: '',
        vehicle_registration: ''
      });
      this.workerForm.get('service_type')?.setValidators([Validators.required]);
      this.workerForm.get('vehicle_type')?.clearValidators();
      this.workerForm.get('vehicle_registration')?.clearValidators();
    } else {
      this.workerForm.get('vehicle_type')?.clearValidators();
      this.workerForm.get('vehicle_registration')?.clearValidators();
      this.workerForm.get('service_type')?.clearValidators();
    }

    // Update validity
    this.workerForm.get('vehicle_type')?.updateValueAndValidity();
    this.workerForm.get('vehicle_registration')?.updateValueAndValidity();
    this.workerForm.get('service_type')?.updateValueAndValidity();
  }

  navigateToChatSupport() {
    this.router.navigate(['/admin-chat-support']);
  }

  ngOnInit() {
    this.isMobilePlatform = this.platform.is('mobile');

    this.loadConversations();
    this.loadServices();
    this.loadWorkers();
    this.loadProducts();
    this.loadServiceRequests();
    this.loadDeliveries();
    this.loadInvoices();
    this.loadOrders();
    this.loadAnalytics();
    this.loadShopLocation();
  }

  ionViewWillEnter() {
     this.loadCurrentUser();
  }

  ngOnDestroy() {
    // Clean up any subscriptions if needed
  }



  loadCurrentUser() {
     this.authService.currentUser = this.authService.getUserFromStorage();
    // .subscribe({
    //   next: (user) => {
    //     this.currentUser = user;
    //   },
    //   error: (error) => {
    //     console.error('Error loading current user:', error);
    //   }
    // });
  }

  loadConversations() {
    this.loading = true;
    // For demo purposes, we'll use delivery ID 1 to get messages
    this.apiService.getMessages(1).subscribe({
      next: (messages: any) => {
        // Group messages by sender to create conversation threads
        const conversationsMap = new Map();

        messages.forEach((message: any) => {

          const senderId = message.sender_id;
          const receiverId = message.receiver_id;

          // Create conversation key (always sort IDs to avoid duplicates)
          const key = [senderId, receiverId].sort().join('-');

          if (!conversationsMap.has(key)) {
            conversationsMap.set(key, {
              participants: [senderId, receiverId],
              lastMessage: message,
              unreadCount: 0,
              messages: [message]
            });
          } else {
            const conversation = conversationsMap.get(key);
            conversation.messages.push(message);
            if (message.created_at > conversation.lastMessage.created_at) {
              conversation.lastMessage = message;
            }
          }
        });

        this.conversations = Array.from(conversationsMap.values());
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Failed to load conversations. Please try again later.';
        this.loading = false;

        console.error('Error loading conversations:', error);
      }
    });
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

  loadWorkers() {
    this.apiService.getWorkers().subscribe({
      next: (workers: any) => {
        this.workers = workers.data;
      },
      error: (error) => {
        console.error('Error loading workers:', error);
      }
    });
  }

  loadProducts() {
    this.apiService.getShopProducts().subscribe({
      next: (products: any) => {
        this.products = products;
      },
      error: (error) => {
        console.error('Error loading products:', error);
      }
    });
  }

  loadServiceRequests() {
    this.loadingServiceRequests = true;
    this.apiService.getServiceRequests().subscribe({
      next: (serviceRequests: any) => {
        this.serviceRequests = serviceRequests.data.data || serviceRequests;
        this.loadingServiceRequests = false;
      },
      error: (error) => {
        console.error('Error loading service requests:', error);
        this.loadingServiceRequests = false;
      }
    });
  }

  updateDeliveryStatus(deliveryId: number) {
    // For now, we'll just show an alert with options
    // In a real implementation, you would open a modal or form for updating status
    const delivery = this.deliveries.find(d => d.id === deliveryId);
    if (delivery) {
      const newStatus = prompt(`Update status for delivery #${deliveryId}:\nCurrent status: ${delivery.status || 'Pending'}`, delivery.status || 'pending');
      if (newStatus !== null) {
        this.apiService.updateDeliveryStatus(deliveryId, newStatus).subscribe({
          next: (updatedDelivery: any) => {
            // Update the delivery in the list
            const index = this.deliveries.findIndex(d => d.id === deliveryId);
            if (index !== -1) {
              this.deliveries[index] = updatedDelivery;
            }
          },
          error: (error) => {
            console.error('Error updating delivery status:', error);
            alert('Failed to update delivery status. Please try again.');
          }
        });
      }
    }
  }

  trackDelivery(deliveryId: number) {
    // Navigate to delivery tracking page with the delivery ID
    this.router.navigate(['/delivery-tracking'], {
      queryParams: { orderId: deliveryId }
    });
  }

  loadOrders() {
    this.loadingOrders = true;
    this.apiService.getAllOrders().subscribe({
      next: (orders: any) => {
        this.orders = orders.data.data || orders;
        this.loadingOrders = false;
      },
      error: (error) => {
        console.error('Error loading orders:', error);
        this.loadingOrders = false;
      }
    });
  }

  assignWorkerToOrder(orderId: number, workerId: number) {
    this.apiService.assignWorkerToOrder(orderId, workerId).subscribe({
      next: (response: any) => {
        alert('Worker assigned to order successfully');
        this.loadOrders();
      },
      error: (error) => {
        console.error('Error assigning worker to order:', error);
        alert('Failed to assign worker to order');
      }
    });
  }

  assignWorkerToServiceRequest(serviceRequestId: number, workerId: number) {
    this.apiService.assignWorkerToServiceRequest(serviceRequestId, workerId).subscribe({
      next: (response: any) => {
        alert('Worker assigned to service request successfully');
        this.loadServiceRequests();
      },
      error: (error) => {
        console.error('Error assigning worker to service request:', error);
        alert('Failed to assign worker to service request');
      }
    });
  }

  loadDeliveries() {
    this.apiService.getDeliveries().subscribe({
      next: (deliveries: any) => {
        this.deliveries = deliveries;
      },
      error: (error) => {
        console.error('Error loading deliveries:', error);
      }
    });
  }

  loadInvoices() {
    this.apiService.getInvoices().subscribe({
      next: (invoices: any) => {
        this.invoices = invoices;
      },
      error: (error) => {
        console.error('Error loading invoices:', error);
      }
    });
  }

  addService() {
    this.addingService = true;
    this.apiService.createService(this.newService).subscribe({
      next: (service: any) => {
        this.services.push(service);
        this.newService = {
          name: '',
          description: '',
          base_price: 0,
          distance_rate: 0,
          admin_latitude: 0,
          admin_longitude: 0,
        };
        this.closeAddServiceModal();
        this.addingService = false;
      },
      error: (error) => {
        console.error('Error adding service:', error);
        this.addingService = false;
      }
    });
  }

  addProduct() {
    this.addingProduct = true;
    this.apiService.createProduct(this.newProduct).subscribe({
      next: (product: any) => {
        this.products.push(product);
        this.newProduct = {
          name: '',
          description: '',
          base_price: 0,
          stock_quantity: 0,
          image_url: ''
        };
        this.closeAddProductModal();
        this.addingProduct = false;
      },
      error: (error) => {
        console.error('Error adding product:', error);
        this.addingProduct = false;
      }
    });
  }

  deleteProduct(productId: number) {
    if (confirm('Are you sure you want to delete this product?')) {
      this.apiService.deleteProduct(productId).subscribe({
        next: () => {
          this.products = this.products.filter(product => product.id !== productId);
        },
        error: (error) => {
          console.error('Error deleting product:', error);
        }
      });
    }
  }

  updateProduct(productId: number) {
    // For now, we'll just show an alert
    // In a real implementation, you would open a modal or form for editing
    const product = this.products.find(p => p.id === productId);
    if (product) {
      alert(`Update functionality for product: ${product.name}\nThis would open an edit form in a real implementation.`);
    }
  }

  addWorker() {
    if (this.workerForm.valid) {
      this.addingWorker = true;
      const formData = this.workerForm.value;
      const workerData = {
        name: formData.name,
        phone_number: formData.phone_number,
        role: formData.role,
        worker_type: formData.worker_type,
        vehicle_type: formData.vehicle_type || null,
        vehicle_registration: formData.vehicle_registration || null,
        service_type: formData.service_type || null
      };

      this.apiService.createWorker(workerData).subscribe({
        next: (worker: any) => {
          this.workers.push(worker);
          this.workerForm.reset();
          this.closeAddWorkerModal();
          this.addingWorker = false;
          alert('Worker added successfully! They will receive SMS/Email to set their password.');
        },
        error: (error: any) => {
          console.error('Error adding worker:', error);
          this.workerErrorMessage = error.error?.message || 'Failed to add worker. Please try again.';
          this.addingWorker = false;
        }
      });
    } else {
      this.workerErrorMessage = 'Please fill in all required fields correctly.';
    }
  }

  deleteService(serviceId: number) {
    if (confirm('Are you sure you want to delete this service?')) {
      this.apiService.deleteService(serviceId).subscribe({
        next: () => {
          this.services = this.services.filter(service => service.id !== serviceId);
        },
        error: (error) => {
          console.error('Error deleting service:', error);
        }
      });
    }
  }

  deleteWorker(workerId: number) {
    if (confirm('Are you sure you want to delete this worker?')) {
      this.apiService.deleteWorker(workerId).subscribe({
        next: () => {
          this.workers = this.workers.filter(worker => worker.id !== workerId);
        },
        error: (error:any) => {
          console.error('Error deleting worker:', error);
        }
      });
    }
  }

  updateService(serviceId: number) {
    // For now, we'll just show an alert
    // In a real implementation, you would open a modal or form for editing
    const service = this.services.find(s => s.id === serviceId);
    if (service) {
      alert(`Update functionality for service: ${service.name}\nThis would open an edit form in a real implementation.`);
    }
  }

  updateWorker(workerId: number) {
    // For now, we'll just show an alert
    // In a real implementation, you would open a modal or form for editing
    const worker = this.workers.find(w => w.id === workerId);
    if (worker) {
      alert(`Update functionality for worker: ${worker.name}\nThis would open an edit form in a real implementation.`);
    }
  }

  openConversation(conversation: any) {
    // Find the other participant (not the current admin)
    const otherParticipantId = conversation.participants.find((id: number) => id !== this.currentUser?.id);
    
    if (otherParticipantId) {
      // Navigate to chat with the selected user
      this.router.navigate(['/chat-support', 1, otherParticipantId]); // Using deliveryId=1 for demo
    }
  }

  getTimeAgo(timestamp: string): string {
    const now = new Date();
    const messageTime = new Date(timestamp);
   
    const diffInMinutes = Math.floor((now.getTime() - messageTime.getTime()) / (1000 * 60));
    
   
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  }

  setActiveTab(tab: string) {
    this.activeTab = tab;
  }

  toggleSidebar() {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  setActiveMenu(menu: string) {
    this.activeMenu = menu;

    // Smooth scroll to the corresponding section
    const sectionId = this.getSectionId(menu);
    if (sectionId) {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    }
  }

  private getSectionId(menu: string): string | null {
    const sectionMap: { [key: string]: string } = {
      'dashboard': 'hero-section',
      'worker-management': 'worker-management',
      'product-management': 'product-management',
      'management': 'service-management', // Default to service management
      'notifications': 'notifications',
      'service-requests': 'service-requests',
      'orders-management': 'orders-management',
      'shop-location': 'shop-location',
      'statistics': 'statistics'
    };

    return sectionMap[menu] || null;
  }

  toggleWorkerAvailability(workerId: number) {
    const worker = this.workers.find(w => w.id === workerId);
    if (worker) {
      const newAvailability = !worker.is_available;
      this.apiService.updateWorkerAvailability(workerId, newAvailability).subscribe({
        next: (updatedWorker: any) => {
          // Update the worker in the list
          const index = this.workers.findIndex(w => w.id === workerId);
          if (index !== -1) {
            this.workers[index] = updatedWorker;
          }
          alert(`Worker availability updated to: ${newAvailability ? 'Available' : 'Not Available'}`);
        },
        error: (error) => {
          console.error('Error updating worker availability:', error);
          alert('Failed to update worker availability. Please try again.');
        }
      });
    }
  }

  createInvoice(invoiceData: any) {
    this.apiService.createInvoice(invoiceData).subscribe({
      next: (invoice: any) => {
        this.invoices.push(invoice);
        alert('Invoice created successfully!');
      },
      error: (error) => {
        console.error('Error creating invoice:', error);
        alert('Failed to create invoice. Please try again.');
      }
    });
  }

  updateInvoice(invoiceId: number, invoiceData: any) {
    this.apiService.updateInvoice(invoiceId, invoiceData).subscribe({
      next: (updatedInvoice: any) => {
        // Update the invoice in the list
        const index = this.invoices.findIndex(i => i.id === invoiceId);
        if (index !== -1) {
          this.invoices[index] = updatedInvoice;
        }
        alert('Invoice updated successfully!');
      },
      error: (error) => {
        console.error('Error updating invoice:', error);
        alert('Failed to update invoice. Please try again.');
      }
    });
  }

  deleteInvoice(invoiceId: number) {
    if (confirm('Are you sure you want to delete this invoice?')) {
      this.apiService.deleteInvoice(invoiceId).subscribe({
        next: () => {
          this.invoices = this.invoices.filter(invoice => invoice.id !== invoiceId);
          alert('Invoice deleted successfully!');
        },
        error: (error) => {
          console.error('Error deleting invoice:', error);
          alert('Failed to delete invoice. Please try again.');
        }
      });
    }
  }

  loadAnalytics() {
    // Load service request analytics for different time periods
    this.apiService.getServiceRequestAnalytics('daily').subscribe({
      next: (data) => {
        this.serviceRequestAnalytics.daily = data;
        // Update chart data
        this.updateServiceRequestsChartData();
      },
      error: (error) => {
        console.error('Error loading daily service request analytics:', error);
      }
    });

    this.apiService.getServiceRequestAnalytics('monthly').subscribe({
      next: (data) => {
        this.serviceRequestAnalytics.monthly = data;
        // Update chart data
        this.updateServiceRequestsChartData();
      },
      error: (error) => {
        console.error('Error loading monthly service request analytics:', error);
      }
    });

    this.apiService.getServiceRequestAnalytics('yearly').subscribe({
      next: (data) => {
        this.serviceRequestAnalytics.yearly = data;
        // Update chart data
        this.updateServiceRequestsChartData();
      },
      error: (error) => {
        console.error('Error loading yearly service request analytics:', error);
      }
    });

    // Load delivery analytics for different time periods
    this.apiService.getDeliveryAnalytics('daily').subscribe({
      next: (data) => {
        this.deliveryAnalytics.daily = data;
        // Update chart data
        this.updateDeliveriesChartData();
      },
      error: (error) => {
        console.error('Error loading daily delivery analytics:', error);
      }
    });

    this.apiService.getDeliveryAnalytics('monthly').subscribe({
      next: (data) => {
        this.deliveryAnalytics.monthly = data;
        // Update chart data
        this.updateDeliveriesChartData();
      },
      error: (error) => {
        console.error('Error loading monthly delivery analytics:', error);
      }
    });

    this.apiService.getDeliveryAnalytics('yearly').subscribe({
      next: (data) => {
        this.deliveryAnalytics.yearly = data;
        // Update chart data
        this.updateDeliveriesChartData();
      },
      error: (error) => {
        console.error('Error loading yearly delivery analytics:', error);
      }
    });

    // Load location analytics
    this.apiService.getLocationAnalytics().subscribe({
      next: (data) => {
        this.locationAnalytics = data;
      },
      error: (error) => {
        console.error('Error loading location analytics:', error);
      }
    });
  }

  updateServiceRequestsChartData() {
    // Create labels for the chart (daily, monthly, yearly)
    const labels = ['Daily', 'Monthly', 'Yearly'];
    
    // Extract data values
    const dailyTotal = this.serviceRequestAnalytics.daily || 0;
    const monthlyTotal = this.serviceRequestAnalytics.monthly || 0;
    const yearlyTotal = this.serviceRequestAnalytics.yearly || 0;
    
    // Update chart data
    this.serviceRequestsChartData.labels = labels;
    if (this.serviceRequestsChartData.datasets && this.serviceRequestsChartData.datasets.length > 0) {
      this.serviceRequestsChartData.datasets[0].data = [dailyTotal, monthlyTotal, yearlyTotal];
    }
  }

  updateDeliveriesChartData() {
    // Create labels for the chart (daily, monthly, yearly)
    const labels = ['Daily', 'Monthly', 'Yearly'];

    // Extract data values
    const dailyTotal = this.deliveryAnalytics.daily || 0;
    const monthlyTotal = this.deliveryAnalytics.monthly || 0;
    const yearlyTotal = this.deliveryAnalytics.yearly || 0;

    // Update chart data
    this.deliveriesChartData.labels = labels;
    if (this.deliveriesChartData.datasets && this.deliveriesChartData.datasets.length > 0) {
      this.deliveriesChartData.datasets[0].data = [dailyTotal, monthlyTotal, yearlyTotal];
    }
  }

  // Shop location methods
  loadShopLocation() {
    this.shopLocationLoading = true;
    this.apiService.getShopLocation().subscribe({
      next: (location: any) => {
        if (location) {
          this.shopLocation = {
            address: location.data.address || '',
            latitude: location.data.latitude || 0,
            longitude: location.data.longitude || 0
          };
        }
        this.shopLocationLoading = false;
      },
      error: (error) => {
        console.error('Error loading shop location:', error);
        this.shopLocationLoading = false;
      }
    });
  }

  saveShopLocation() {
    if (!this.shopLocation.address || this.shopLocation.latitude === 0 || this.shopLocation.longitude === 0) {
      alert('Please provide a valid address and coordinates for the shop location.');
      return;
    }

    this.shopLocationLoading = true;
    const locationData = {
      address: this.shopLocation.address,
      latitude: this.shopLocation.latitude,
      longitude: this.shopLocation.longitude
    };

    if(this.shopLocation && this.shopLocation.address && this.shopLocation.address !== "No active shop location found")
    {
      this.apiService.updateShopLocation(locationData).subscribe({
        next: (response: any) => {
          alert('Shop location updated successfully!');
          this.shopLocationLoading = false;
        },
        error: (error) => {
          console.error('Error updating shop location:', error);
          alert('Failed to update shop location. Please try again.');
          this.shopLocationLoading = false;
        }
      });
    }
    else{
      this.apiService.setShopLocation(locationData).subscribe({
        next: (response: any) => {
          alert('Shop location created successfully!');
          this.shopLocationLoading = false;
        },
        error: (error) => {
          console.error('Error creating shop location:', error);
          alert('Failed to create shop location. Please try again.');
          this.shopLocationLoading = false;
        }
      });
    }

   
  }

  onMapClick(event: any) {
    // This method will be called when user clicks on the map
    // Update the shop location coordinates
    console.log(event)
    //this.shopLocation.latitude = event.latLng.lat();
    //this.shopLocation.longitude = event.latLng.lng();
    this.shopLocation.address = ''; // Clear address on map click
  }

  initializeMap() {
    // Load Google Maps script dynamically if not already loaded
    if (!(window as any).google) {
      const script = document.createElement('script');
      // Note: Replace with your actual Google Maps API key
      const apiKey = 'AIzaSyCDY-7WZpFnqvRIftjFOFeu2TPk650d-Hg'; // Replace this with your actual API key
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initMapCallback`;
      script.async = true;
      script.defer = true;

      // Define global callback function
      (window as any).initMapCallback = () => {
        console.log('Google Maps API loaded successfully');
        this.loadMap();
      };

      script.onerror = (error: any) => {
        console.error('Failed to load Google Maps API:', error);
        this.showMapError('Failed to load Google Maps. Please check your API key and ensure Places API is enabled.');
      };

      ((window as any).document as Document).head.appendChild(script);
    } else {
      this.loadMap();
    }
  }

  showMapError(message: string) {
    const mapElement = ((window as any).document as Document).getElementById('map');
    if (mapElement) {
      mapElement.innerHTML = `
        <div style="padding: 20px; text-align: center; color: #666; background: #f8f9fa; border-radius: 8px;">
          <h4 style="color: #dc3545; margin-bottom: 10px;">⚠️ Map Loading Error</h4>
          <p style="margin-bottom: 15px;">${message}</p>
          <div style="background: #fff3cd; padding: 10px; border-radius: 4px; margin-bottom: 10px;">
            <strong>Common Solutions:</strong>
            <ul style="text-align: left; margin-top: 5px;">
              <li>Enable Places API in Google Cloud Console</li>
              <li>Check API key restrictions</li>
              <li>Verify billing is enabled</li>
              <li>Ensure correct API key is used</li>
            </ul>
          </div>
          <button onclick="location.reload()" style="padding: 8px 16px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">
            Retry
          </button>
        </div>
      `;
    }
  }

  loadMap() {
    try {
      const mapOptions = {
        center: new (window as any).google.maps.LatLng(this.shopLocation.latitude || 5.6037, this.shopLocation.longitude || -0.1870), // Default to Accra, Ghana
        zoom: 15,
        mapTypeControl: true,
        streetViewControl: true,
        fullscreenControl: true
      };

      const map = new (window as any).google.maps.Map(((window as any).document as Document).getElementById('map'), mapOptions);

      // Initialize markers array to track all markers
      let markers: any[] = [];

      // Check if Places library is available
      if (!(window as any).google.maps.places) {
        console.warn('Google Maps Places library not available. Place search will be disabled.');
        this.setupBasicMapInteraction(map, markers);
        return;
      }

      // Create search box for places
      const input = ((window as any).document as Document).createElement('input');
      input.type = 'text';
      input.placeholder = 'Search for a location...';
      input.style.cssText = `
        position: absolute;
        top: 10px;
        left: 10px;
        width: 300px;
        padding: 8px 12px;
        border: 1px solid #ccc;
        border-radius: 4px;
        font-size: 14px;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        z-index: 1000;
      `;

      map.controls[(window as any).google.maps.ControlPosition.TOP_LEFT].push(input);

      const searchBox = new (window as any).google.maps.places.SearchBox(input);

      // Bias the SearchBox results towards current map's viewport
      map.addListener('bounds_changed', () => {
        searchBox.setBounds(map.getBounds() as any);
      });

      // Listen for the event fired when the user selects a prediction and retrieve
      // more details for that place
      searchBox.addListener('places_changed', () => {
        const places = searchBox.getPlaces();

        if (places.length === 0) {
          return;
        }

        // Clear out the old markers
        markers.forEach(marker => {
          marker.setMap(null);
        });
        markers = [];

        // For each place, get the icon, name and location
        const bounds = new (window as any).google.maps.LatLngBounds();
        places.forEach((place: any) => {
          if (!place.geometry || !place.geometry.location) {
            console.log('Returned place contains no geometry');
            return;
          }

          // Update shop location with selected place
          this.shopLocation.latitude = place.geometry.location.lat();
          this.shopLocation.longitude = place.geometry.location.lng();
          this.shopLocation.address = place.formatted_address || place.name;

          // Update form inputs
          this.updateFormInputs();

          const icon = {
            url: place.icon,
            size: new (window as any).google.maps.Size(71, 71),
            origin: new (window as any).google.maps.Point(0, 0),
            anchor: new (window as any).google.maps.Point(17, 34),
            scaledSize: new (window as any).google.maps.Size(25, 25)
          };

          // Create a marker for each place
          const marker = new (window as any).google.maps.Marker({
            map,
            icon,
            title: place.name,
            position: place.geometry.location,
            draggable: true
          });

          // Update coordinates when marker is dragged
          marker.addListener('dragend', (event: any) => {
            this.shopLocation.latitude = event.latLng.lat();
            this.shopLocation.longitude = event.latLng.lng();
            this.updateFormInputs();
          });

          markers.push(marker);

          if (place.geometry.viewport) {
            // Only geocodes have viewport
            bounds.union(place.geometry.viewport);
          } else {
            bounds.extend(place.geometry.location);
          }
        });
        map.fitBounds(bounds);
      });

      this.setupBasicMapInteraction(map, markers);

    } catch (error) {
      console.error('Error loading map:', error);
      this.showMapError('Error initializing map. Please check your Google Maps configuration.');
    }
  }

  setupBasicMapInteraction(map: any, markers: any[] = []) {
    // Create initial marker if location exists (check for valid coordinates, not just truthy values)
    if (this.shopLocation.latitude !== undefined && this.shopLocation.longitude !== undefined &&
        this.shopLocation.latitude !== 0 && this.shopLocation.longitude !== 0) {
      const marker = new (window as any).google.maps.Marker({
        position: { lat: this.shopLocation.latitude, lng: this.shopLocation.longitude },
        map: map,
        draggable: true,
        title: 'Shop Location'
      });

      // Update coordinates when marker is dragged
      marker.addListener('dragend', (event: any) => {
        this.shopLocation.latitude = event.latLng.lat();
        this.shopLocation.longitude = event.latLng.lng();
        this.updateFormInputs();
      });

      markers.push(marker);
    }

    // Update coordinates when map is clicked
    map.addListener('click', (event: any) => {
      
      this.shopLocation.latitude = event.latLng.lat();
      this.shopLocation.longitude = event.latLng.lng();
      console.log('Map clicked at:', event);
      const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${this.shopLocation.latitude},${this.shopLocation.longitude}&key=AIzaSyCDY-7WZpFnqvRIftjFOFeu2TPk650d-Hg&sensor=true`;
      // Fetch the place name
      fetch(url)
      .then(response => response.json())
      .then(data => {
          if (data.status === "OK") {
          //console.log(data.status);
          const placeName = data.results[0].formatted_address;
         this.shopLocation.address = placeName;
          } else {
          // console.log(data.status);
          }
      })
      .catch(error => {
          console.error('Error:', error);
      });
      this.updateFormInputs();

      // Move existing marker or create new one
      if (markers.length > 0) {
        markers[0].setPosition(event.latLng);
      } else {
        const marker = new (window as any).google.maps.Marker({
          position: event.latLng,
          map: map,
          draggable: true,
          title: 'Shop Location'
        });

        marker.addListener('dragend', (event: any) => {
          this.shopLocation.latitude = event.latLng.lat();
          this.shopLocation.longitude = event.latLng.lng();
          this.updateFormInputs();
        });

        markers.push(marker);
      }
    });
  }

  updateFormInputs() {
    const addressInput = ((window as any).document as Document).querySelector('ion-input[placeholder="Enter shop address"]') as any;
    const latInput = ((window as any).document as Document).querySelector('ion-input[placeholder="Enter latitude"]') as any;
    const lngInput = ((window as any).document as Document).querySelector('ion-input[placeholder="Enter longitude"]') as any;

    if (addressInput) addressInput.value = this.shopLocation.address;
    if (latInput) latInput.value = this.shopLocation.latitude.toString();
    if (lngInput) lngInput.value = this.shopLocation.longitude.toString();
  }

  // See More methods for expanding item lists
  seeMoreServices() {
    this.servicesExpanded = !this.servicesExpanded;
  }

  seeMoreWorkers() {
    this.workersExpanded = !this.workersExpanded;
  }

  seeMoreProducts() {
    this.productsExpanded = !this.productsExpanded;
  }

  seeMoreServiceRequests() {
    this.serviceRequestsExpanded = !this.serviceRequestsExpanded;
  }

  seeMoreOrders() {
    this.ordersExpanded = !this.ordersExpanded;
  }

  seeMoreDeliveries() {
    this.deliveriesExpanded = !this.deliveriesExpanded;
  }

  ngAfterViewInit() {
    this.initializeMap();

    // Existing chart initialization code...
    this.serviceRequestChart = new Chart('service-request-chart', {
      type: 'bar',
      data: {
        labels: ['Daily', 'Monthly', 'Yearly'],
        datasets: [{
          label: 'Service Requests',
          data: this.serviceRequestAnalytics.daily ? [this.serviceRequestAnalytics.daily, this.serviceRequestAnalytics.monthly, this.serviceRequestAnalytics.yearly] : [0, 0, 0],
          backgroundColor: [
            'rgba(255, 99, 132, 0.2)',
            'rgba(54, 162, 235, 0.2)',
            'rgba(255, 206, 86, 0.2)'
          ],
          borderColor: [
            'rgba(255, 99, 132, 1)',
            'rgba(54, 162, 235, 1)',
            'rgba(255, 206, 86, 1)'
          ],
          borderWidth: 1
        }]
      },
      options: {
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });

    this.deliveryChart = new Chart('delivery-chart', {
      type: 'line',
      data: {
        labels: ['Daily', 'Monthly', 'Yearly'],
        datasets: [{
          label: 'Deliveries',
          data: [0, 0, 0],
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 1
        }]
      },
      options: {
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });
  }
}





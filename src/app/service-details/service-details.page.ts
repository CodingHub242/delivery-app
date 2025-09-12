import { Component, OnInit } from '@angular/core';
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
  IonSpinner,
  IonBackButton,
  IonButtons,
  AlertController
} from '@ionic/angular/standalone';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';
import { Service } from '../models/service.model';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../pipes/translate.pipe';
import { CurrencyPipe } from '../pipes/currency.pipe';
import { addIcons } from 'ionicons';
import { car, brush, construct, cart, person, arrowBack } from 'ionicons/icons';

@Component({
  selector: 'app-service-details',
  templateUrl: './service-details.page.html',
  styleUrls: ['./service-details.page.scss'],
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
    IonSpinner,
    IonBackButton,
    IonButtons,
    CommonModule,
    TranslatePipe,
    CurrencyPipe
  ]
})
export class ServiceDetailsPage implements OnInit {
  service: Service | null = null;
  loading: boolean = true;
  error: string = '';
  otherServices: Service[] = [];

  constructor(
    private route: ActivatedRoute,
    public router: Router,
    private apiService: ApiService,
    private authService: AuthService,
    private alertController: AlertController
  ) {
    addIcons({ car, brush, construct, cart, person, arrowBack });
  }

  ngOnInit() {
    const serviceId = this.route.snapshot.paramMap.get('id');
    if (serviceId) {
      const idNum = parseInt(serviceId);
      this.loadService(idNum);
      this.loadOtherServices(idNum);
    }
  }

  loadService(id: number) {
    this.loading = true;
    this.apiService.getService(id).subscribe({
      next: (service) => {
        this.service = service;
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Failed to load service details. Please try again later.';
        this.loading = false;
        console.error('Error loading service:', error);
      }
    });
  }

  loadOtherServices(currentServiceId: number) {
    this.apiService.getServices().subscribe({
      next: (services) => {
        this.otherServices = services.filter(s => s.id !== currentServiceId);
      },
      error: (error) => {
        console.error('Error loading other services:', error);
      }
    });
  }

  getServiceIcon(serviceName: string): string {
    const icons: { [key: string]: string } = {
      'delivery': 'car',
      'painting': 'brush',
      'plumbing': 'construct',
      'shopping': 'cart',
      'default': 'person'
    };
    
    const lowerName = serviceName.toLowerCase();
    return icons[lowerName] || icons['default'];
  }

  async requestService() {
    if (this.service) {
      // Check if user is logged in
      if (!this.authService.isLoggedIn()) {
        const alert = await this.alertController.create({
          header: 'Login Required',
          message: 'Please login or create an account to request this service.',
          buttons: [
            {
              text: 'Cancel',
              role: 'cancel'
            },
            {
              text: 'Login',
              handler: () => {
                this.router.navigate(['/login']);
              }
            },
            {
              text: 'Register',
              handler: () => {
                this.router.navigate(['/register']);
              }
            }
          ]
        });
        await alert.present();
        return;
      }

      console.log('Requesting service:', this.service);
      
      // Prepare the request data
      const user = this.authService.getUserFromStorage();
      const requestData = {
        service_id: this.service.id,
        user_id: user?.id // User ID from authenticated user
      };

      // Call the API to request the service
      this.apiService.requestService(requestData).subscribe({
        next: async (response) => {
          console.log('Service requested successfully:', response);
          const alert = await this.alertController.create({
            header: 'Success',
            message: `Service ${this.service?.name} requested successfully!`,
            buttons: ['OK']
          });
          await alert.present();
        },
        error: async (error) => {
          console.error('Error requesting service:', error);
          const alert = await this.alertController.create({
            header: 'Error',
            message: 'Failed to request service. Please try again later.',
            buttons: ['OK']
          });
          await alert.present();
        }
      });
    }
  }
}

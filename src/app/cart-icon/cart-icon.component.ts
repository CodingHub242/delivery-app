import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { IonIcon, IonBadge, IonButton } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { basket } from 'ionicons/icons';
import { ApiService } from '../services/api.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-cart-icon',
  template: `
    <ion-button fill="clear" (click)="goToCart()" class="cart-button">
      <ion-icon name="basket" slot="icon-only"></ion-icon>
      <ion-badge 
        *ngIf="cartCount > 0" 
        color="danger" 
        class="cart-badge"
      >
        {{ cartCount }}
      </ion-badge>
    </ion-button>
  `,
  styles: [`
    .cart-button {
      position: relative;
      --color:#751930;
    }
    
    .cart-badge {
      position: absolute;
      top: -5px;
      right: -5px;
      min-width: 18px;
      height: 18px;
      font-size: 12px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  `],
  standalone: true,
  imports: [IonIcon, IonBadge, IonButton,CommonModule]
})
export class CartIconComponent implements OnInit, OnDestroy {
  public cartCount = 0;
  private cartSubscription?: Subscription;

  constructor(
    private apiService: ApiService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    addIcons({ basket });
  }

  ngOnInit() {
    console.log('Cart icon component initialized');
    
    // Subscribe to cart count changes
    this.cartSubscription = this.apiService.cartCount$.subscribe(
      count => {
        console.log('Cart count updated in icon component:', count);
        this.cartCount = count;
        this.cdr.detectChanges(); // Update the UI immediately
      }
    );

    // Get initial cart count
    this.cartCount = this.apiService.getCartCount();
     console.log('Initial cart count:', this.cartCount);
  }

  ngOnDestroy() {
    if (this.cartSubscription) {
      this.cartSubscription.unsubscribe();
    }
  }

  goToCart() {
    this.router.navigate(['/checkout']);
  }
}
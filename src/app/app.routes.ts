import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
import { AdminGuard } from './guards/admin.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./login/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'register',
    loadComponent: () => import('./register/register.page').then((m) => m.RegisterPage),
  },
  {
    path: 'home',
    loadComponent: () => import('./home/home.page').then((m) => m.HomePage)
  },
  {
    path: 'service/:id',
    loadComponent: () => import('./service-details/service-details.page').then((m) => m.ServiceDetailsPage)
  },
  {
    path: 'driver-profile/:id',
    loadComponent: () => import('./driver-profile/driver-profile.page').then((m) => m.DriverProfilePage)
  },
  {
    path: 'delivery-tracking',
    loadComponent: () => import('./delivery-tracking/delivery-tracking.page').then((m) => m.DeliveryTrackingPage)
  },
  {
    path: 'chat-support',
    loadComponent: () => import('./chat-support/chat-support.page').then((m) => m.ChatSupportPage),
    canActivate: [AuthGuard]
  },
  {
    path: 'admin-login',
    loadComponent: () => import('./admin-login/admin-login.page').then((m) => m.AdminLoginPage),
  },
  {
    path: 'admin-dashboard',
    loadComponent: () => import('./admin-dashboard/admin-dashboard.page').then((m) => m.AdminDashboardPage),
    canActivate: [AuthGuard, AdminGuard]
  },
  {
    path: 'admin-chat-support',
    loadComponent: () => import('./admin-chat-support/admin-chat-support.page').then((m) => m.AdminChatSupportPage),
    canActivate: [AuthGuard, AdminGuard]
  },
  {
    path: 'customer-profile',
    loadComponent: () => import('./customer-profile/customer-profile.page').then((m) => m.CustomerProfilePage),
    canActivate: [AuthGuard]
  },
  {
    path: 'checkout',
    loadComponent: () => import('./checkout/checkout.page').then((m) => m.CheckoutPage),
    canActivate: [AuthGuard]
  },
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
  {
    path: 'worker-order-acceptance',
    loadComponent: () => import('./worker-order-acceptance/worker-order-acceptance.page').then( m => m.WorkerOrderAcceptancePage)
  },
  {
    path: 'worker-dashboard',
    loadComponent: () => import('./worker-dashboard/worker-dashboard.page').then( m => m.WorkerDashboardPage),
    canActivate: [AuthGuard]
  },
  {
    path: 'worker-login',
    loadComponent: () => import('./worker-login/worker-login.page').then( m => m.WorkerLoginPage)
  },
  {
    path: 'worker-register',
    loadComponent: () => import('./worker-register/worker-register.page').then( m => m.WorkerRegisterPage)
  },
  {
    path: 'worker-password-setup',
    loadComponent: () => import('./worker-password-setup/worker-password-setup.page').then( m => m.WorkerPasswordSetupPage)
  },
];

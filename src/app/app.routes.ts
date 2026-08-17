import { Routes } from '@angular/router';
import {
  hasBookingSelectionsGuard,
  hasSelectedPackageGuard,
} from './features/booking/booking-flow.guards';

export const routes: Routes = [
  {
    path: '',
    title: 'SmartClinic | Your health check, made simple',
    loadComponent: () =>
      import('./features/home/home-page.component').then(
        (component) => component.HomePageComponent,
      ),
  },
  {
    path: 'health-check/packages',
    title: 'Choose a Smart Health Check | SmartClinic',
    loadComponent: () =>
      import('./features/health-check/package-selection-page.component').then(
        (component) => component.PackageSelectionPageComponent,
      ),
  },
  {
    path: 'book/fulfilment',
    title: 'Choose fulfilment | SmartClinic',
    canActivate: [hasSelectedPackageGuard],
    loadComponent: () =>
      import('./features/booking/fulfilment-selection-page.component').then(
        (component) => component.FulfilmentSelectionPageComponent,
      ),
  },
  {
    path: 'book/details',
    title: 'Booking details | SmartClinic',
    canActivate: [hasBookingSelectionsGuard],
    loadComponent: () =>
      import('./features/booking/booking-details-page.component').then(
        (component) => component.BookingDetailsPageComponent,
      ),
  },
  {
    path: '**',
    title: 'Page not found | SmartClinic',
    loadComponent: () =>
      import('./features/not-found/not-found-page.component').then(
        (component) => component.NotFoundPageComponent,
      ),
  },
];

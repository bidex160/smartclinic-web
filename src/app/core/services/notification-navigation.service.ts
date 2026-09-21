import { Injectable } from '@angular/core';
import { Notification, NotificationDestination, NotificationUserRole } from '../models/notification.model';

@Injectable({ providedIn: 'root' })
export class NotificationNavigationService {
  destination(notification: Notification, role: NotificationUserRole | null): NotificationDestination | null {
    const reference = notification.entityReference;
    if (!role) return null;

    if (role === 'USER') {
      switch (notification.entityType) {
        case 'CARE_REQUEST': return reference ? ['/me/care', reference] : ['/me/care'];
        case 'CARE_APPOINTMENT': return reference ? ['/me/care/appointments', reference] : ['/me/appointments'];
        default: return null;
      }
    }

    switch (notification.entityType) {
      case 'CARE_REQUEST': return reference ? ['/provider/care-requests', reference] : ['/provider/care-requests'];
      case 'CARE_APPOINTMENT': return reference ? ['/provider/care-appointments', reference] : ['/provider/care-appointments'];
      case 'PROVIDER_PROFILE': return ['/provider/profile'];
      default: return null;
    }
  }
}

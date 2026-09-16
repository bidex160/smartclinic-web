import { Injectable } from '@angular/core';
import { Notification, NotificationDestination, NotificationUserRole } from '../models/notification.model';

@Injectable({ providedIn: 'root' })
export class NotificationNavigationService {
  destination(notification: Notification, role: NotificationUserRole | null): NotificationDestination | null {
    const reference = notification.entityReference;
    if (!reference || !role) return null;

    if (role === 'USER') {
      switch (notification.entityType) {
        case 'CARE_REQUEST': return ['/me/care', reference];
        case 'CARE_APPOINTMENT': return ['/me/care/appointments', reference];
        default: return null;
      }
    }

    switch (notification.entityType) {
      case 'CARE_REQUEST': return ['/provider/care-requests', reference];
      case 'CARE_APPOINTMENT': return ['/provider/care-appointments', reference];
      case 'PROVIDER_PROFILE': return ['/provider/profile'];
      default: return null;
    }
  }
}

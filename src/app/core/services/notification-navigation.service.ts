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
        case 'CARE_APPOINTMENT': return reference ? ['/me/care/appointments', reference] : ['/me/care'];
        case 'HEALTH_CHECK': return reference ? ['/me/health-checks', reference] : ['/me/health-checks'];
        case 'GUIDED_SELF_CHECK':
        case 'SELF_CHECK': return reference ? ['/me/self-checks', reference] : ['/me/self-checks'];
        case 'CLINICAL_ORDER':
        case 'PATIENT_ORDER':
        case 'DIAGNOSTIC_ORDER':
        case 'LAB_ORDER':
        case 'RADIOLOGY_ORDER':
        case 'REFERRAL':
        case 'PROCEDURE_ORDER': return reference ? ['/me/orders', reference] : ['/me/orders'];
        case 'PROVIDER_CONNECTION': return reference ? ['/me/providers', reference] : ['/me/providers'];
        case 'PAYMENT':
        case 'BILL': return ['/me/care'];
        default: return ['/me/notifications'];
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

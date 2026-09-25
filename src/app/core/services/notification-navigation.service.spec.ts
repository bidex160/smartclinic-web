import { TestBed } from '@angular/core/testing';
import { Notification } from '../models/notification.model';
import { NotificationNavigationService } from './notification-navigation.service';

const item = (entityType: Notification['entityType']): Notification => ({ reference: 'N', type: 'FUTURE', title: 'Title', message: 'Message', entityType, entityReference: 'CR-1', actionType: 'VIEW', metadata: null, readAt: null, createdAt: new Date().toISOString() });

describe('NotificationNavigationService', () => {
  let mapper: NotificationNavigationService;
  beforeEach(() => { TestBed.configureTestingModule({}); mapper = TestBed.inject(NotificationNavigationService); });
  it('maps patient and provider care requests to their own routes', () => {
    expect(mapper.destination(item('CARE_REQUEST'), 'USER')).toEqual(['/me/care', 'CR-1']);
    expect(mapper.destination(item('CARE_REQUEST'), 'PROVIDER')).toEqual(['/provider/care-requests', 'CR-1']);
  });
  it('keeps patient notifications actionable with safe fallbacks', () => {
    expect(mapper.destination(item('CARE_REQUEST'), null)).toBeNull();
    expect(mapper.destination(item('HEALTH_CHECK'), 'USER')).toEqual(['/me/health-checks', 'CR-1']);
    expect(mapper.destination(item('PATIENT_ORDER'), 'USER')).toEqual(['/me/orders', 'CR-1']);
    expect(mapper.destination(item('PROVIDER_CONNECTION'), 'USER')).toEqual(['/me/providers', 'CR-1']);
    expect(mapper.destination(item('FUTURE_ENTITY'), 'USER')).toEqual(['/me/notifications']);
  });
});

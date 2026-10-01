import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { describe, expect, it } from 'vitest';

import { CareAppointment } from '../../core/models/find-care.model';
import { CareAppointmentsApiService } from '../../core/services/care-appointments-api.service';
import { VisitDayCardComponent } from './visit-day-card.component';

describe('VisitDayCardComponent', () => {
  const now = new Date('2026-10-01T07:00:00Z'); // 08:00 in Lagos
  const appointment = (overrides: Partial<CareAppointment> = {}): CareAppointment => ({
    appointmentReference: 'SC-APT-AAAA',
    careRequestReference: 'SC-CARE-1',
    status: 'CONFIRMED',
    deliveryMode: 'IN_PERSON',
    service: { code: 'GP', name: 'GP consultation' },
    provider: { providerReference: 'SCPR-1', displayName: 'Medford Hospital', providerType: 'HOSPITAL' },
    providerLocation: {
      locationReference: 'LOC-1', name: 'Medford Main', addressLine1: '12 Allen Avenue', addressLine2: null,
      city: 'Ikeja', stateOrRegion: 'Lagos', postalCode: null, countryCode: 'NG',
    },
    scheduledDate: '2026-10-01',
    scheduledTimeFrom: '10:30:00',
    scheduledTimeTo: '11:00:00',
    timezone: 'Africa/Lagos',
    notes: null,
    meetingUrl: null,
    createdAt: '2026-09-28T10:00:00Z',
    updatedAt: '2026-09-28T10:00:00Z',
    ...overrides,
  });

  async function setup(items: CareAppointment[] | 'error') {
    await TestBed.configureTestingModule({
      imports: [VisitDayCardComponent],
      providers: [
        provideRouter([]),
        {
          provide: CareAppointmentsApiService,
          useValue: { list: () => (items === 'error' ? throwError(() => new Error('down')) : of({ items, page: 1, limit: 20, total: items.length, totalPages: 1 })) },
        },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(VisitDayCardComponent);
    fixture.componentInstance.load(now);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('turns into a visit companion on the day of an in-person appointment', async () => {
    const element = await setup([appointment()]);
    const card = element.querySelector('[data-visit-day]')!;
    expect(card.textContent).toContain('Your visit today');
    expect(card.textContent).toContain('GP consultation at Medford Hospital');
    expect(card.textContent).toContain('10:30–11:00');
    expect(card.textContent).toContain('12 Allen Avenue, Ikeja, Lagos');
    expect(card.querySelector('[data-directions]')!.getAttribute('href')).toBe(
      'https://www.google.com/maps/search/?api=1&query=Medford%20Main%2C%2012%20Allen%20Avenue%2C%20Ikeja%2C%20Lagos%2C%20NG',
    );
    expect(card.querySelector('a[href="/me/card"]')).not.toBeNull();
    expect(card.querySelector('a[href="/me/care/appointments/SC-APT-AAAA"]')).not.toBeNull();
    expect(card.textContent).toContain('What to bring');
  });

  it('offers to join an online consultation instead of directions', async () => {
    const element = await setup([appointment({ deliveryMode: 'VIRTUAL', providerLocation: null, meetingUrl: 'https://meet.example/abc' })]);
    const card = element.querySelector('[data-visit-day]')!;
    expect(card.querySelector('a[href="https://meet.example/abc"]')!.textContent).toContain('Join consultation');
    expect(card.querySelector('[data-directions]')).toBeNull();
    expect(card.textContent).not.toContain('What to bring');
  });

  it('stays hidden for other days, cancelled visits and when appointments fail to load', async () => {
    let element = await setup([
      appointment({ scheduledDate: '2026-10-02' }),
      appointment({ appointmentReference: 'SC-APT-B', status: 'CANCELLED' }),
      appointment({ appointmentReference: 'SC-APT-C', status: 'COMPLETED' }),
    ]);
    expect(element.querySelector('[data-visit-day]')).toBeNull();

    TestBed.resetTestingModule();
    element = await setup('error');
    expect(element.querySelector('[data-visit-day]')).toBeNull();
  });

  it('prefers the visit that is already in progress', async () => {
    const element = await setup([
      appointment({ appointmentReference: 'SC-APT-EARLY', scheduledTimeFrom: '09:00:00', scheduledTimeTo: '09:30:00' }),
      appointment({ appointmentReference: 'SC-APT-NOW', status: 'IN_PROGRESS', scheduledTimeFrom: '09:30:00', scheduledTimeTo: '10:00:00' }),
    ]);
    const card = element.querySelector('[data-visit-day]')!;
    expect(card.textContent).toContain('Your visit is in progress');
    expect(card.querySelector('a[href="/me/care/appointments/SC-APT-NOW"]')).not.toBeNull();
  });
});

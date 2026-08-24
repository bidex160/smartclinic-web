import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { AuthSessionService } from '../../core/services/auth-session.service';
import { ProviderOffersApiService } from '../../core/services/provider-offers-api.service';
import { offer } from './provider-offers-page.component.spec';
import { ProviderAppointmentsPageComponent } from './provider-appointments-page.component';

describe('ProviderAppointmentsPageComponent', () => {
  it('requests confirmed work and renders human-readable appointment timing', async () => {
    const getOffers = vi.fn(() =>
      of([
        offer({
          status: 'CONFIRMED',
          confirmedSchedule: {
            date: '2026-08-25',
            timeFrom: '15:20:00',
            timeTo: '15:35:00',
            timezone: 'Africa/Lagos',
            providerLocationName: 'Ikeja clinic',
          },
        }),
      ]),
    );
    await TestBed.configureTestingModule({
      imports: [ProviderAppointmentsPageComponent],
      providers: [
        provideRouter([]),
        { provide: ProviderOffersApiService, useValue: { getOffers } },
        { provide: AuthSessionService, useValue: { logout: () => of(true) } },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(ProviderAppointmentsPageComponent);
    fixture.detectChanges();
    expect(getOffers).toHaveBeenCalledWith('CONFIRMED');
    expect(fixture.nativeElement.textContent).toContain('25 Aug 2026 · 3:20 PM–3:35 PM');
    expect(fixture.nativeElement.textContent).not.toContain('15:20:00');
  });
});

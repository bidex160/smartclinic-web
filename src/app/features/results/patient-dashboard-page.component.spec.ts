import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { HealthCheckResultsApiService } from '../../core/services/health-check-results-api.service';
import { PatientDashboardPageComponent } from './patient-dashboard-page.component';

describe('PatientDashboardPageComponent', () => {
  it('renders the safe patient reference and backend portal categories', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
    const api = {
      getMyProfile: vi.fn(() =>
        of({
          user: { displayName: 'Ada Okafor', email: 'ada@example.test' },
          patient: {
            patientReference: 'SCP-8K4M-27QD',
            givenName: 'Ada',
            familyName: 'Okafor',
            phone: null,
          },
        }),
      ),
      getMyHealthChecks: vi.fn(() =>
        of({
          items: [{ portalCategory: 'AWAITING_PAYMENT' }, { portalCategory: 'COMPLETED_HISTORY' }],
          page: 1,
          limit: 50,
          total: 2,
          totalPages: 1,
        }),
      ),
    };
    await TestBed.configureTestingModule({
      imports: [PatientDashboardPageComponent],
      providers: [provideRouter([]), { provide: HealthCheckResultsApiService, useValue: api }],
    }).compileComponents();
    const fixture = TestBed.createComponent(PatientDashboardPageComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Welcome, Ada');
    expect(fixture.nativeElement.textContent).toContain('SCP-8K4M-27QD');
    await fixture.componentInstance.copyPatientId();
    fixture.detectChanges();
    expect(writeText).toHaveBeenCalledWith('SCP-8K4M-27QD');
    expect(fixture.nativeElement.textContent).toContain('Patient ID copied');
    expect(fixture.nativeElement.textContent).not.toContain('balance');
  });
});

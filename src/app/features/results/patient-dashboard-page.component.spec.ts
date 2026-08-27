import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { HealthCheckResultsApiService } from '../../core/services/health-check-results-api.service';
import { ReferralsApiService } from '../../core/services/referrals-api.service';
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
      providers: [provideRouter([]), { provide: HealthCheckResultsApiService, useValue: api }, { provide: ReferralsApiService, useValue: { summary: () => of({ availablePoints: 340, levelProgress: { currentLevel: { code: 'LEVEL_2', name: 'Level 2', ordinal: 2 }, nextLevel: { code: 'LEVEL_3', name: 'Level 3', ordinal: 3 }, highestLevelAchieved: 2, requirements: [{ targetType: 'PATIENT', qualified: 22, required: 30, remaining: 8, completed: false }], highestConfiguredLevelReached: false, qualifiedCounts: { PATIENT: 22, CLINIC: 5, LABORATORY: 4, PHARMACY: 4 } } }) } }],
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
    expect(fixture.nativeElement.textContent).toContain('340 points');
    expect(fixture.nativeElement.textContent).toContain('Level 2 achieved');
    expect(fixture.nativeElement.textContent).toContain('Next: Level 3');
    expect(fixture.nativeElement.textContent).toContain('Patients 22/30');
  });
});

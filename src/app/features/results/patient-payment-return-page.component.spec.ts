import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { HealthCheckResultsApiService } from '../../core/services/health-check-results-api.service';
import { PatientPaymentReturnPageComponent } from './patient-payment-return-page.component';

describe('PatientPaymentReturnPageComponent', () => {
  it('verifies by trusted route reference and refreshes authoritative status/detail', async () => {
    const api = { verifyMyHealthCheckPayment: vi.fn(() => of({})), getMyHealthCheckPayment: vi.fn(() => of({ bookingReference: 'SC-1', bookingStatus: 'PENDING_PROVIDER_MATCH', fundingStatus: 'SETTLED', paymentStatus: 'SUCCEEDED' })), getMyHealthCheck: vi.fn(() => of({ bookingReference: 'SC-1' })) };
    await TestBed.configureTestingModule({ imports: [PatientPaymentReturnPageComponent], providers: [provideRouter([]), { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ reference: 'SC-1' }), queryParamMap: convertToParamMap({ trxref: 'untrusted' }) } } }, { provide: HealthCheckResultsApiService, useValue: api }] }).compileComponents();
    const fixture = TestBed.createComponent(PatientPaymentReturnPageComponent); fixture.detectChanges();
    expect(api.verifyMyHealthCheckPayment).toHaveBeenCalledWith('SC-1');
    expect(api.verifyMyHealthCheckPayment).not.toHaveBeenCalledWith('untrusted');
    expect(api.getMyHealthCheckPayment).toHaveBeenCalledWith('SC-1');
    expect(fixture.nativeElement.textContent).toContain('Payment confirmed');
  });
});

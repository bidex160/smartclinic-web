import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { HealthCheckResultsApiService } from '../../core/services/health-check-results-api.service';
import { PatientPaymentReturnPageComponent } from './patient-payment-return-page.component';
import { FastTrackApiService } from '../../core/services/fasttrack-api.service';
import { CareRequestsApiService } from '../../core/services/care-requests-api.service';
import { PatientProviderConnectionsApiService } from '../../core/services/patient-provider-connections-api.service';

describe('PatientPaymentReturnPageComponent', () => {
  it('verifies by trusted route reference and refreshes authoritative status/detail', async () => {
    const api = {
      verifyMyHealthCheckPayment: vi.fn(() => of({})),
      getMyHealthCheckPayment: vi.fn(() =>
        of({
          bookingReference: 'SC-1',
          bookingStatus: 'PENDING_PROVIDER_MATCH',
          fundingStatus: 'SETTLED',
          paymentStatus: 'SUCCEEDED',
        }),
      ),
      getMyHealthCheck: vi.fn(() => of({ bookingReference: 'SC-1' })),
    };
    await TestBed.configureTestingModule({
      imports: [PatientPaymentReturnPageComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap({ reference: 'SC-1' }),
              queryParamMap: convertToParamMap({ trxref: 'untrusted' }),
            },
          },
        },
        { provide: HealthCheckResultsApiService, useValue: api },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(PatientPaymentReturnPageComponent);
    fixture.detectChanges();
    expect(api.verifyMyHealthCheckPayment).toHaveBeenCalledWith('SC-1');
    expect(api.verifyMyHealthCheckPayment).not.toHaveBeenCalledWith('untrusted');
    expect(api.getMyHealthCheckPayment).toHaveBeenCalledWith('SC-1');
    expect(fixture.nativeElement.textContent).toContain('Payment confirmed');
  });
  it('dispatches FastTrack callbacks by trusted route reference, not Paystack query hints', async () => {
    const fast = {
      verifyPayment: vi.fn(() =>
        of({
          fastTrackReference: 'SC-FT-ABCDEF0123456789',
          fastTrackStatus: 'CONFIRMED',
          feeMinor: 5000,
          amount: '50.00',
          currency: 'NGN',
          paymentReady: false,
          paymentAttemptStatus: 'SUCCEEDED',
          paymentReference: 'provider-secret',
          checkoutUrl: null,
          accessCode: null,
          paidAt: '2026-08-28T00:00:00Z',
        }),
      ),
    };
    await TestBed.configureTestingModule({
      imports: [PatientPaymentReturnPageComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap({ reference: 'SC-FT-ABCDEF0123456789' }),
              queryParamMap: convertToParamMap({ reference: 'untrusted-paystack-value' }),
            },
          },
        },
        { provide: HealthCheckResultsApiService, useValue: {} },
        { provide: FastTrackApiService, useValue: fast },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(PatientPaymentReturnPageComponent);
    fixture.detectChanges();
    expect(fast.verifyPayment).toHaveBeenCalledWith('SC-FT-ABCDEF0123456789');
    expect(fast.verifyPayment).not.toHaveBeenCalledWith('untrusted-paystack-value');
    expect(fixture.nativeElement.textContent).toContain('FastTrack request is confirmed');
  });
  it('dispatches General Care callbacks by the trusted CareRequest reference', async () => {
    const care = { verifyLatestFunding: vi.fn(() => of({ careRequestReference: 'SC-CARE-ABCDEF012345', fundingStatus: 'PAID', paid: true })) };
    await TestBed.configureTestingModule({ imports: [PatientPaymentReturnPageComponent], providers: [provideRouter([]), { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ reference: 'SC-CARE-ABCDEF012345' }), queryParamMap: convertToParamMap({ reference: 'untrusted' }) } } }, { provide: HealthCheckResultsApiService, useValue: {} }, { provide: CareRequestsApiService, useValue: care }] }).compileComponents();
    const fixture = TestBed.createComponent(PatientPaymentReturnPageComponent);
    fixture.detectChanges();
    expect(care.verifyLatestFunding).toHaveBeenCalledWith('SC-CARE-ABCDEF012345');
    expect(care.verifyLatestFunding).not.toHaveBeenCalledWith('untrusted');
    expect(fixture.nativeElement.textContent).toContain('Payment confirmed');
    expect(fixture.nativeElement.textContent).toContain('View Care Request');
  });
  it('dispatches Patient Connection callbacks by the trusted SC-PPC reference', async () => {
    const connections={verifyFunding:vi.fn(()=>of({connectionReference:'SC-PPC-A1B2C3D4E5F6',status:'SUBMITTED',fundings:[],fundingSatisfied:true}))};
    await TestBed.configureTestingModule({imports:[PatientPaymentReturnPageComponent],providers:[provideRouter([]),{provide:ActivatedRoute,useValue:{snapshot:{paramMap:convertToParamMap({reference:'SC-PPC-A1B2C3D4E5F6'}),queryParamMap:convertToParamMap({reference:'untrusted'})}}},{provide:HealthCheckResultsApiService,useValue:{}},{provide:PatientProviderConnectionsApiService,useValue:connections}]}).compileComponents();
    const fixture=TestBed.createComponent(PatientPaymentReturnPageComponent);fixture.detectChanges();expect(connections.verifyFunding).toHaveBeenCalledWith('SC-PPC-A1B2C3D4E5F6');expect(connections.verifyFunding).not.toHaveBeenCalledWith('untrusted');expect(fixture.nativeElement.textContent).toContain('Payment confirmed');expect(fixture.nativeElement.textContent).toContain('View Provider connection');
  });
});

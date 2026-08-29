import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { CareRequest, CareRequestFunding } from '../../core/models/find-care.model';
import { CareChatApiService } from '../../core/services/care-chat-api.service';
import { CareRequestsApiService } from '../../core/services/care-requests-api.service';
import { FastTrackApiService } from '../../core/services/fasttrack-api.service';
import { FindCareApiService } from '../../core/services/find-care-api.service';
import { CareDetailPageComponent } from './care-detail-page.component';

describe('CareDetailPageComponent funding', () => {
  const reference = 'SC-CARE-ABCDEF012345';
  function request(status = 'PROVIDER_ACCEPTED', fundingStatus: CareRequest['funding'] = { status: 'PENDING', satisfied: false }, deliveryMode: CareRequest['deliveryMode'] = 'VIRTUAL'): CareRequest {
    return { reference, status: status as CareRequest['status'], service: { code: 'GENERAL', name: 'General consultation', price: { priceMinor: 2000000, currency: 'NGN' } }, deliveryMode, geography: { countryCode: 'NG', stateOrRegion: 'Lagos', city: 'Yaba' }, preferredProvider: null, assignedProvider: { providerReference: 'SCPR-ABCDEF0123456789', displayName: 'Yaba Clinic', providerType: 'CLINIC', location: { city: 'Yaba', stateOrRegion: 'Lagos', countryCode: 'NG' } }, preferredDate: null, preferredTime: null, contactMethod: 'EMAIL', notes: null, funding: fundingStatus, appointment: null, createdAt: '2026-08-28T00:00:00Z', updatedAt: '2026-08-28T00:00:00Z' };
  }
  function funding(status: CareRequestFunding['fundingStatus'] = 'PENDING', amountMinor = 2000000): CareRequestFunding {
    return { careRequestReference: reference, fundingRequired: amountMinor > 0, amountMinor, currency: 'NGN', fundingStatus: status, paid: status === 'PAID' || status === 'SATISFIED_FREE', initializationAllowed: true, paymentAttemptStatus: status === 'PAID' ? 'SUCCEEDED' : null, paymentReference: null, checkoutUrl: null, accessCode: status === 'PENDING' ? 'care-access-code' : null, paidAt: status === 'PAID' ? '2026-08-28T10:00:00Z' : null };
  }
  async function setup(status = 'PROVIDER_ACCEPTED', initialFunding = funding(), deliveryMode: CareRequest['deliveryMode'] = 'VIRTUAL') {
    let authoritative = initialFunding;
    let care = request(status, initialFunding.fundingStatus ? { status: initialFunding.fundingStatus, satisfied: initialFunding.paid } : null, deliveryMode);
    const api = { get: vi.fn(() => of(care)), getFunding: vi.fn(() => of(authoritative)), initializeFunding: vi.fn(() => of({ ...authoritative, accessCode: 'care-access-code' })), verifyLatestFunding: vi.fn(() => { authoritative = funding('PAID'); care = request('PROVIDER_ACCEPTED', { status: 'PAID', satisfied: true }, deliveryMode); return of(authoritative); }), cancel: vi.fn() };
    await TestBed.configureTestingModule({ imports: [CareDetailPageComponent], providers: [provideRouter([]), { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ reference }) } } }, { provide: CareRequestsApiService, useValue: api }, { provide: CareChatApiService, useValue: { getChat: vi.fn(() => of({ unreadCount: 1 })) } }, { provide: FindCareApiService, useValue: { getProvider: vi.fn(() => of({ services: [] })) } }, { provide: FastTrackApiService, useValue: { createForCareRequest: vi.fn() } }] }).compileComponents();
    const fixture = TestBed.createComponent(CareDetailPageComponent);
    const resume = vi.fn();
    fixture.componentInstance.popup.resumeTransaction = resume;
    fixture.detectChanges();
    return { fixture, component: fixture.componentInstance, api, resume };
  }

  it('shows the immutable accepted-care snapshot and Pay now for pending funding', async () => {
    const { fixture, api } = await setup();
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('₦20,000');
    expect(text).toContain('Awaiting payment');
    expect(text).toContain('Pay now');
    expect(api.getFunding).toHaveBeenCalledWith(reference);
  });
  it('does not expose payment before provider acceptance', async () => {
    const { fixture, api } = await setup('AWAITING_PROVIDER_RESPONSE', { ...funding(), initializationAllowed: false });
    expect(fixture.nativeElement.textContent).not.toContain('Pay now');
    expect(api.getFunding).not.toHaveBeenCalled();
  });
  it.each([['PAID', 'Paid'], ['SATISFIED_FREE', 'Free']] as const)('renders %s without initializing Paystack', async (status, label) => {
    const value = funding(status, status === 'SATISFIED_FREE' ? 0 : 2000000);
    const { fixture, component, api } = await setup('PROVIDER_ACCEPTED', value);
    expect(fixture.nativeElement.textContent).toContain(label);
    expect(fixture.nativeElement.textContent).not.toContain('Pay now');
    component.payNow();
    expect(api.initializeFunding).not.toHaveBeenCalled();
  });
  it('initializes by reference only and verifies before showing Paid', async () => {
    const { fixture, component, api, resume } = await setup();
    component.payNow();
    expect(api.initializeFunding).toHaveBeenCalledWith(reference);
    expect(resume).toHaveBeenCalledWith('care-access-code', expect.any(Object));
    expect(fixture.nativeElement.textContent).not.toContain('Payment confirmed');
    const callbacks = resume.mock.calls[0][1];
    callbacks.onSuccess();
    fixture.detectChanges();
    expect(api.verifyLatestFunding).toHaveBeenCalledWith(reference);
    expect(api.getFunding).toHaveBeenCalledTimes(2);
    expect(fixture.nativeElement.textContent).toContain('Payment confirmed');
  });
  it('keeps pending funding retryable when the popup is cancelled', async () => {
    const { fixture, component, resume } = await setup();
    component.payNow();
    resume.mock.calls[0][1].onError();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('not completed');
    expect(fixture.nativeElement.textContent).toContain('Pay now');
  });
});

import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { PatientProviderConnectionsApiService } from '../../core/services/patient-provider-connections-api.service';
import { ProviderConnectionDetailPageComponent } from './provider-connection-detail-page.component';
vi.mock('@paystack/inline-js', () => ({ default: class {} }));
describe('ProviderConnectionDetailPageComponent', () => {
  const view = { provider: { reference: 'provider', displayName: 'Test Hospital' }, connection: {}, requests: [], nextAction: { kind: 'NO_ACTION', title: 'Up to date' }, consolidatedPayment: { available: false, itemCount: 0, amountMinor: null, currency: null } };
  async function setup(status = 'CONNECTED', fail = false) {
    const api = {
      getMine: vi.fn(() => of({ reference: 'connection', status, createdAt: '2026-09-22T00:00:00Z', provider: { displayName: 'Test Hospital', providerReference: 'provider' }, funding: [], currentPath: 'EXISTING_PATIENT_LINK' })),
      funding: vi.fn(() => of({ fundings: [], fundingSatisfied: true })),
      directory: vi.fn(() => of({ items: [] })),
      companion: vi.fn(() => fail ? throwError(() => new Error('offline')) : of(view)),
      settleWallet: vi.fn(),
    };
    await TestBed.configureTestingModule({ imports: [ProviderConnectionDetailPageComponent], providers: [provideRouter([]),
      { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ reference: 'connection' }), queryParamMap: convertToParamMap({}) } } },
      { provide: PatientProviderConnectionsApiService, useValue: api },
    ] }).compileComponents();
    const fixture = TestBed.createComponent(ProviderConnectionDetailPageComponent);
    fixture.detectChanges();
    return { fixture, api };
  }
  it('loads the companion automatically after a connected hospital opens', async () => {
    const { fixture, api } = await setup();
    expect(api.companion).toHaveBeenCalledWith('connection');
    expect(fixture.nativeElement.textContent).toContain('Up to date');
    expect(fixture.nativeElement.textContent).not.toContain('temporarily unavailable');
  });
  it('offers retry after an error and recovers the companion', async () => {
    const { fixture, api } = await setup('CONNECTED', true);
    expect(fixture.nativeElement.textContent).toContain('temporarily unavailable');
    api.companion.mockReturnValue(of(view));
    const retry = Array.from(fixture.nativeElement.querySelectorAll('button')).find((b: any) => b.textContent.includes('Try again')) as HTMLButtonElement;
    retry.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Up to date');
    expect(api.companion).toHaveBeenCalledTimes(2);
  });
  it('does not load a companion for an unconfirmed connection', async () => {
    const { api } = await setup('SUBMITTED');
    expect(api.companion).not.toHaveBeenCalled();
  });
  it('does not initiate a grouped wallet payment when the API marks it unavailable', async () => {
    const { fixture, api } = await setup();
    fixture.componentInstance.payAllWallet();
    expect(api.settleWallet).not.toHaveBeenCalled();
  });
});

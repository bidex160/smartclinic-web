import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { PharmacyFulfillmentApiService } from '../../core/services/pharmacy-fulfillment-api.service';
import { ProviderPharmacyOrderDetailPageComponent } from './provider-pharmacy-order-detail-page.component';

describe('ProviderPharmacyOrderDetailPageComponent authorization boundary', () => {
  it('loads dispensing state from the provider-authorized fulfillment response', async () => {
    const row = {
      reference: 'SC-ORF-1', status: 'ACCEPTED',
      clinicalOrder: { reference: 'SC-ORD-1', type: 'PRESCRIPTION', issuedAt: new Date().toISOString(), clinicalNote: null, orderingProvider: { providerReference: 'SCPR-1', displayName: 'UCH' }, prescription: { notes: null, items: [] } },
      patient: { patientReference: 'SC-PAT-1', givenName: 'Ada', familyName: 'Okafor' },
      fulfiller: { providerReference: 'SCPR-2', displayName: 'Prime', serviceUnitReference: 'SC-PSU-1', serviceUnitName: 'Prime Pharmacy' },
      recommendedServiceUnit: null, acceptedAt: new Date().toISOString(), cancelledAt: null,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      funding: { status: 'PAID', amountMinor: 200000, currency: 'NGN', satisfied: true },
      dispensing: { status: 'READY_TO_DISPENSE', fulfillmentMethod: 'PICKUP', startedAt: null, readyAt: null, completedAt: null },
    };
    const api = {
      getFulfillment: vi.fn(() => of(row)),
      listQuotes: vi.fn(() => of([])),
      getPatientFulfillment: vi.fn(),
    };
    await TestBed.configureTestingModule({
      imports: [ProviderPharmacyOrderDetailPageComponent],
      providers: [
        provideRouter([]),
        { provide: PharmacyFulfillmentApiService, useValue: api },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => row.reference } } } },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(ProviderPharmacyOrderDetailPageComponent);
    fixture.detectChanges();

    expect(fixture.componentInstance.patientState()?.dispensing?.status).toBe('READY_TO_DISPENSE');
    expect(api.getPatientFulfillment).not.toHaveBeenCalled();
  });
});

import { TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { PharmacyFulfillmentApiService } from '../../core/services/pharmacy-fulfillment-api.service';
import { PrescriptionDetailPageComponent } from './prescription-detail-page.component';

describe('PrescriptionDetailPageComponent reload state', () => {
  it('rediscovers the authoritative patient fulfillment from the Clinical Order summary', async () => {
    const fulfillment = {
      reference: 'SC-ORF-RELOAD', status: 'SELECTED', clinicalOrder: { reference: 'SC-ORD-1', type: 'PRESCRIPTION', status: 'ISSUED', prescription: { notes: null, items: [] } },
      pharmacy: { providerReference: 'SCPR-1', displayName: 'Prime Pharmacy', serviceUnitReference: 'SC-PSU-1', serviceUnitName: 'Prime Pharmacy' },
      quote: null, funding: null, dispensing: null,
    };
    const api = {
      getPatientOrder: vi.fn(() => of({
        reference: 'SC-ORD-1', type: 'PRESCRIPTION', status: 'ISSUED', clinicalNote: null,
        orderingProvider: { providerReference: 'SCPR-2', displayName: 'UCH' },
        careRequestReference: 'SC-CARE-1', careAppointmentReference: 'SC-APT-1',
        issuedAt: new Date().toISOString(), cancelledAt: null, cancellationReason: null,
        prescription: { notes: null, items: [] }, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
        fulfillment: { reference: fulfillment.reference, status: 'SELECTED' },
      })),
      getPatientFulfillment: vi.fn(() => of(fulfillment)),
      searchPharmacies: vi.fn(() => of({ items: [], page: 1, limit: 20, total: 0, totalPages: 0 })),
    };
    await TestBed.configureTestingModule({
      imports: [PrescriptionDetailPageComponent],
      providers: [
        { provide: PharmacyFulfillmentApiService, useValue: api },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => 'SC-ORD-1' } } } },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(PrescriptionDetailPageComponent);
    fixture.detectChanges();

    expect(api.getPatientFulfillment).toHaveBeenCalledWith('SC-ORF-RELOAD');
    expect(fixture.componentInstance.fulfillment()?.reference).toBe('SC-ORF-RELOAD');
    expect(api.searchPharmacies).not.toHaveBeenCalled();
  });

  it('lets the patient confirm the clinician-recommended pharmacy', async () => {
    const proposed = {
      reference: 'SC-ORF-RECOMMENDED', status: 'PROPOSED', clinicalOrder: { reference: 'SC-ORD-1', type: 'PRESCRIPTION', status: 'ISSUED', prescription: { notes: null, items: [] } },
      pharmacy: { providerReference: 'SCPR-1', displayName: 'Prime Pharmacy', serviceUnitReference: 'SC-PSU-1', serviceUnitName: 'Main Pharmacy' },
      quote: null, funding: null, dispensing: null,
    };
    const selected = { ...proposed, status: 'SELECTED' };
    const api = {
      getPatientOrder: vi.fn(() => of({
        reference: 'SC-ORD-1', type: 'PRESCRIPTION', status: 'ISSUED', clinicalNote: null,
        orderingProvider: { providerReference: 'SCPR-2', displayName: 'UCH' },
        careRequestReference: 'SC-CARE-1', careAppointmentReference: 'SC-APT-1', issuedAt: new Date().toISOString(),
        cancelledAt: null, cancellationReason: null, prescription: { notes: null, items: [] },
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
        fulfillment: { reference: proposed.reference, status: 'PROPOSED' },
      })),
      getPatientFulfillment: vi.fn().mockReturnValueOnce(of(proposed)).mockReturnValueOnce(of(selected)),
      selectPharmacy: vi.fn(() => of({ reference: proposed.reference, status: 'SELECTED' })),
    };
    await TestBed.configureTestingModule({
      imports: [PrescriptionDetailPageComponent],
      providers: [
        { provide: PharmacyFulfillmentApiService, useValue: api },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => 'SC-ORD-1' } } } },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(PrescriptionDetailPageComponent); fixture.detectChanges();

    fixture.componentInstance.confirmRecommendedPharmacy(proposed as any);

    expect(api.selectPharmacy).toHaveBeenCalledWith('SC-ORD-1', 'SC-PSU-1');
    expect(fixture.componentInstance.fulfillment()?.status).toBe('SELECTED');
  });
});

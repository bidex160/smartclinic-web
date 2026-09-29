import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { PharmacyFulfillmentApiService } from '../../core/services/pharmacy-fulfillment-api.service';
import { ProviderPrescriptionSectionComponent } from './provider-prescription-section.component';
import { ServiceCatalogueApiService } from '../../core/services/service-catalogue-api.service';

describe('ProviderPrescriptionSectionComponent form UX', () => {
  it('uses clinical placeholders and keeps Create Prescription local until Save draft', async () => {
    const api = {
      listAppointmentOrders: vi.fn(() => of({ items: [], page: 1, limit: 20, total: 0, totalPages: 0 })),
      createPrescription: vi.fn(() => of({})),
    };
    await TestBed.configureTestingModule({
      imports: [ProviderPrescriptionSectionComponent],
      providers: [{ provide: PharmacyFulfillmentApiService, useValue: api }, { provide: ServiceCatalogueApiService, useValue: { providerList: vi.fn(() => of([])) } }],
    }).compileComponents();
    const fixture = TestBed.createComponent(ProviderPrescriptionSectionComponent);
    fixture.componentRef.setInput('appointmentReference', 'SC-APT-1');
    fixture.componentRef.setInput('appointmentStatus', 'IN_PROGRESS');
    fixture.detectChanges();

    fixture.componentInstance.startPrescription();
    fixture.detectChanges();

    const controls = fixture.nativeElement.querySelectorAll('input, textarea') as NodeListOf<Element>;
    const placeholders = Array.from(controls).map((control) => control.getAttribute('placeholder'));
    expect(placeholders).toEqual(expect.arrayContaining([
      'Add relevant clinical context', 'Add notes for the patient or pharmacy',
      'e.g. Amoxicillin', 'e.g. 500 mg', 'e.g. 1 capsule', 'e.g. 3 times daily',
      'e.g. 7 days', 'e.g. 21 capsules', 'e.g. Oral', 'e.g. Take after meals',
    ]));
    expect(api.createPrescription).not.toHaveBeenCalled();
  });

  it('loads common medicines through the provider-authorized catalogue', async () => {
    const api = { listAppointmentOrders: vi.fn(() => of({ items: [], page: 1, limit: 20, total: 0, totalPages: 0 })) };
    const catalogue = { providerList: vi.fn(() => of([{ code: 'MED_AMOXICILLIN_500', name: 'Amoxicillin 500 mg', requiresPrescription: true }])) };
    await TestBed.configureTestingModule({ imports: [ProviderPrescriptionSectionComponent], providers: [{ provide: PharmacyFulfillmentApiService, useValue: api }, { provide: ServiceCatalogueApiService, useValue: catalogue }] }).compileComponents();
    const fixture = TestBed.createComponent(ProviderPrescriptionSectionComponent); fixture.componentRef.setInput('appointmentReference','SC-APT-1'); fixture.componentRef.setInput('appointmentStatus','IN_PROGRESS'); fixture.detectChanges();
    fixture.componentInstance.searchMedicines('amoxi');
    expect(catalogue.providerList).toHaveBeenCalledWith('MEDICATION');
    expect(fixture.componentInstance.medicineCatalogue()[0]?.name).toBe('Amoxicillin 500 mg');
  });

  it('adds a catalogue medicine into the existing blank row instead of creating an invalid extra row', async () => {
    const api = { listAppointmentOrders: vi.fn(() => of({ items: [], page: 1, limit: 20, total: 0, totalPages: 0 })) };
    await TestBed.configureTestingModule({ imports: [ProviderPrescriptionSectionComponent], providers: [{ provide: PharmacyFulfillmentApiService, useValue: api }, { provide: ServiceCatalogueApiService, useValue: { providerList: vi.fn(() => of([])) } }] }).compileComponents();
    const fixture = TestBed.createComponent(ProviderPrescriptionSectionComponent); fixture.componentRef.setInput('appointmentReference','SC-APT-1'); fixture.componentRef.setInput('appointmentStatus','IN_PROGRESS'); fixture.detectChanges();
    const component = fixture.componentInstance;

    component.startPrescription();
    expect(component.items.length).toBe(1);
    component.addCatalogueMedicine({ code: 'MED_PARACETAMOL_500', name: 'Paracetamol 500 mg', requiresPrescription: false } as any);

    expect(component.items.length).toBe(1);
    expect(component.items.at(0).controls.medicationName.value).toBe('Paracetamol 500 mg');
  });

  it('prefills a suggested medication locally without saving or issuing it', async () => {
    const api = {
      listAppointmentOrders: vi.fn(() => of({ items: [], page: 1, limit: 20, total: 0, totalPages: 0 })),
      createPrescription: vi.fn(() => of({})),
    };
    await TestBed.configureTestingModule({ imports: [ProviderPrescriptionSectionComponent], providers: [{ provide: PharmacyFulfillmentApiService, useValue: api }, { provide: ServiceCatalogueApiService, useValue: { providerList: vi.fn(() => of([])) } }] }).compileComponents();
    const fixture = TestBed.createComponent(ProviderPrescriptionSectionComponent); fixture.componentRef.setInput('appointmentReference','SC-APT-1'); fixture.componentRef.setInput('appointmentStatus','IN_PROGRESS'); fixture.detectChanges();
    expect(fixture.componentInstance.addSuggestedMedication('Amoxicillin 500 mg')).toBe(true);
    expect(fixture.componentInstance.creatingPrescription()).toBe(true);
    expect(fixture.componentInstance.items.at(0).controls.medicationName.value).toBe('Amoxicillin 500 mg');
    expect(api.createPrescription).not.toHaveBeenCalled();
  });

  it('lets the doctor recommend a pharmacy without selecting or paying for the patient', async () => {
    const recommended = { reference: 'SC-ORF-1', status: 'PROPOSED' as const };
    const api = {
      listAppointmentOrders: vi.fn()
        .mockReturnValueOnce(of({ items: [issuedPrescription(null)], page: 1, limit: 20, total: 1, totalPages: 1 }))
        .mockReturnValueOnce(of({ items: [issuedPrescription(recommended)], page: 1, limit: 20, total: 1, totalPages: 1 })),
      searchFulfillmentProvidersForProvider: vi.fn(() => of({ items: [pharmacy()], page: 1, limit: 10, total: 1, totalPages: 1 })),
      recommendPharmacy: vi.fn(() => of(recommended)),
    };
    await TestBed.configureTestingModule({ imports: [ProviderPrescriptionSectionComponent], providers: [{ provide: PharmacyFulfillmentApiService, useValue: api }, { provide: ServiceCatalogueApiService, useValue: { providerList: vi.fn(() => of([])) } }] }).compileComponents();
    const fixture = TestBed.createComponent(ProviderPrescriptionSectionComponent); fixture.componentRef.setInput('appointmentReference','SC-APT-1'); fixture.componentRef.setInput('appointmentStatus','IN_PROGRESS'); fixture.detectChanges();
    const component=fixture.componentInstance; component.openPharmacyHandoff(); expect(api.searchFulfillmentProvidersForProvider).toHaveBeenCalledWith('PRESCRIPTION',{q:'',page:1,limit:10});
    component.recommendPharmacy('SC-ORD-1', pharmacy()); expect(api.recommendPharmacy).toHaveBeenCalledWith('SC-ORD-1','SC-PSU-1'); expect(component.order()?.fulfillment).toEqual(recommended);
    expect(component.patientPrescriptionUrl('SC-ORD-1')).toContain('/me/prescriptions/SC-ORD-1');
  });
});

function pharmacy(){return {providerReference:'SCPR-1',displayName:'Prime Pharmacy',providerType:'PHARMACY',providerServiceUnitReference:'SC-PSU-1',unitName:'Main Pharmacy',capabilityType:'PHARMACY' as const,location:{city:'Abuja',stateOrRegion:'FCT',countryCode:'NG'}};}
function issuedPrescription(fulfillment:{reference:string;status:'PROPOSED'}|null){return {reference:'SC-ORD-1',type:'PRESCRIPTION' as const,status:'ISSUED' as const,clinicalNote:null,orderingProvider:{providerReference:'SCPR-HOSPITAL',displayName:'Hospital'},careRequestReference:'SC-CARE-1',careAppointmentReference:'SC-APT-1',issuedAt:'2026-09-28T00:00:00Z',cancelledAt:null,cancellationReason:null,prescription:{notes:null,items:[{medicationName:'Amoxicillin',strength:'500 mg',dosage:'1 capsule',frequency:'three times daily',duration:'5 days',quantity:'15',route:'Oral',instructions:null,sortOrder:0}]},createdAt:'2026-09-28T00:00:00Z',updatedAt:'2026-09-28T00:00:00Z',fulfillment};}

import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { PharmacyFulfillmentApiService } from '../../core/services/pharmacy-fulfillment-api.service';
import { ProviderPrescriptionSectionComponent } from './provider-prescription-section.component';

describe('ProviderPrescriptionSectionComponent form UX', () => {
  it('uses clinical placeholders and keeps Create Prescription local until Save draft', async () => {
    const api = {
      listAppointmentOrders: vi.fn(() => of({ items: [], page: 1, limit: 20, total: 0, totalPages: 0 })),
      createPrescription: vi.fn(() => of({})),
    };
    await TestBed.configureTestingModule({
      imports: [ProviderPrescriptionSectionComponent],
      providers: [{ provide: PharmacyFulfillmentApiService, useValue: api }],
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
});

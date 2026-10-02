import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { AuthStateService } from '../../core/services/auth-state.service';
import { HospitalBillPaymentsApiService } from '../../core/services/hospital-bill-payments-api.service';
import { PatientPayBillsPageComponent } from './patient-pay-bills-page.component';

describe('PatientPayBillsPageComponent', () => {
  const hospital = { hospitalCode: 'AKTH', name: 'AKTH', logo: '/akth.svg', patientReference: 'SCP-1', externalPatientReference: '146' };
  const invoice = { hospital, patient: { displayName: 'Ada Patient', externalReference: '146' }, reference: '1467709', date: null, currency: 'NGN', total: '150.00', outstanding: '150.00', items: [{ itemReference: 'A', description: 'Consultation', amount: '100.00', payable: true }, { itemReference: 'B', description: 'Paid item', amount: '50.00', payable: false }] };
  async function setup() {
    const api = { getHospitals: vi.fn(() => of([hospital])), getInvoice: vi.fn(() => of(invoice)), initializePayment: vi.fn(() => of({ reference: 'SC-HBP-1', hospitalCode: 'AKTH', invoiceReference: '1467709', amount: '100.00', currency: 'NGN', status: 'PENDING', provider: 'PAYSTACK', checkoutUrl: null, accessCode: null })), verifyPayment: vi.fn(() => of({})) };
    await TestBed.configureTestingModule({ imports: [PatientPayBillsPageComponent], providers: [provideRouter([]), { provide: HospitalBillPaymentsApiService, useValue: api }, { provide: AuthStateService, useValue: { currentUser: () => ({ email: 'patient@example.test' }) } }] }).compileComponents();
    return { fixture: TestBed.createComponent(PatientPayBillsPageComponent), api };
  }
  it('loads connected hospitals and then the invoice with invoiceReference', async () => {
    const { fixture, api } = await setup(); fixture.detectChanges();
    expect(api.getHospitals).toHaveBeenCalled(); fixture.componentInstance.selectHospital(hospital); fixture.componentInstance.invoiceReference.set('1467709'); fixture.componentInstance.loadInvoice();
    expect(api.getInvoice).toHaveBeenCalledWith('AKTH', '1467709');
  });
  it('selects only payable items and calculates the display total', async () => {
    const { fixture } = await setup(); fixture.detectChanges(); fixture.componentInstance.selectHospital(hospital); fixture.componentInstance.invoice.set(invoice); fixture.componentInstance.toggleItem(invoice.items[0]); fixture.componentInstance.toggleItem(invoice.items[1]);
    expect(fixture.componentInstance.selectedItems()).toEqual(['A']); expect(fixture.componentInstance.selectedTotal()).toBe('100.00');
  });
  it('initializes with item references rather than wallet fields', async () => {
    const { fixture, api } = await setup(); fixture.detectChanges(); fixture.componentInstance.selectHospital(hospital); fixture.componentInstance.invoice.set(invoice); fixture.componentInstance.toggleItem(invoice.items[0]); fixture.componentInstance.pay();
    expect(api.initializePayment).toHaveBeenCalledWith(expect.objectContaining({ hospitalCode: 'AKTH', invoiceReference: '1467709', items: [{ itemReference: 'A' }] }));
  });
});

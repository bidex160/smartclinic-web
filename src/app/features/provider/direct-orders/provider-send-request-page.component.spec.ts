import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';

import { signal } from '@angular/core';

import { DirectOrdersApiService } from '../../../core/services/direct-orders-api.service';
import { ProviderMembershipService } from '../../../core/services/provider-membership.service';
import { normaliseSmartClinicId } from './direct-order-quick-picks';
import { ProviderSendRequestPageComponent } from './provider-send-request-page.component';

const sentOrder = (overrides: Record<string, unknown> = {}) => ({
  reference: 'SC-ORD-ABCDEF123456',
  type: 'LABORATORY',
  status: 'ISSUED',
  origin: 'DIRECT',
  patientResponse: 'PENDING',
  clinicalNote: null,
  orderingProvider: { providerReference: 'SCPR-1', displayName: 'Dr Bisi Clinic' },
  patient: { patientReference: 'SCP-ABCD-1234', displayName: 'Adaeze O.' },
  careRequestReference: null,
  careAppointmentReference: null,
  issuedAt: '2026-10-01T10:00:00Z',
  cancelledAt: null,
  cancellationReason: null,
  prescription: null,
  diagnosticItems: [{ name: 'Full blood count (FBC)', code: null, instructions: null, resultText: null, resultValue: null, resultUnit: null, referenceRange: null, resultFlag: null, resultedAt: null, sortOrder: 0 }],
  createdAt: '2026-10-01T10:00:00Z',
  updatedAt: '2026-10-01T10:00:00Z',
  ...overrides,
});

async function setup(api: Partial<Record<keyof DirectOrdersApiService, unknown>> = {}, awaitingApproval = false) {
  const mock = {
    lookupPatient: vi.fn(() => of({ patientReference: 'SCP-ABCD-1234', displayName: 'Adaeze O.' })),
    send: vi.fn(() => of(sentOrder())),
    listSent: vi.fn(() => of({ items: [], page: 1, limit: 30, total: 0, totalPages: 0 })),
    ...api,
  };
  await TestBed.configureTestingModule({
    imports: [ProviderSendRequestPageComponent],
    providers: [
      provideRouter([]),
      { provide: DirectOrdersApiService, useValue: mock },
      { provide: ProviderMembershipService, useValue: { awaitingApproval: signal(awaitingApproval) } },
    ],
  }).compileComponents();
  const fixture = TestBed.createComponent(ProviderSendRequestPageComponent);
  fixture.detectChanges();
  return { fixture, page: fixture.componentInstance, api: mock, el: fixture.nativeElement as HTMLElement };
}

describe('normaliseSmartClinicId', () => {
  it('accepts the ways people type an ID', () => {
    expect(normaliseSmartClinicId('scp-abcd-1234')).toBe('SCP-ABCD-1234');
    expect(normaliseSmartClinicId('ABCD1234')).toBe('SCP-ABCD-1234');
    expect(normaliseSmartClinicId(' SCP ABCD 1234 ')).toBe('SCP-ABCD-1234');
    expect(normaliseSmartClinicId('ABC123')).toBeNull();
  });
});

describe('ProviderSendRequestPageComponent', () => {
  it('confirms the patient by first name and initial after looking up their ID', async () => {
    const { fixture, page, api, el } = await setup();
    page.idControl.setValue('abcd1234');
    page.lookUp();
    fixture.detectChanges();

    expect(api.lookupPatient).toHaveBeenCalledWith('SCP-ABCD-1234');
    expect(el.querySelector('[data-patient-confirmed]')?.textContent).toContain('Adaeze O.');
  });

  it('looks up the ID when the form is submitted from the keyboard or the Find button', async () => {
    const { fixture, api, el } = await setup();
    const input = el.querySelector('input[placeholder="SCP-ABCD-1234"]') as HTMLInputElement;
    input.value = 'abcd 1234';
    input.dispatchEvent(new Event('input'));
    const form = input.closest('form') as HTMLFormElement;
    const submit = new Event('submit', { cancelable: true });
    form.dispatchEvent(submit);
    fixture.detectChanges();
    expect(submit.defaultPrevented).toBe(true);
    expect(api.lookupPatient).toHaveBeenCalledWith('SCP-ABCD-1234');
  });

  it('explains an unknown or mistyped ID', async () => {
    const { fixture, page, api } = await setup({ lookupPatient: vi.fn(() => throwError(() => ({ status: 404 }))) });
    page.idControl.setValue('12');
    page.lookUp();
    expect(api.lookupPatient).not.toHaveBeenCalled();
    expect(page.lookupError()).toContain('8 letters and numbers');

    page.idControl.setValue('SCP-ZZZZ-9999');
    page.lookUp();
    fixture.detectChanges();
    expect(page.lookupError()).toContain('No SmartClinic patient has this ID');
  });

  it('sends lab tests picked with one tap, with instructions', async () => {
    const { fixture, page, api, el } = await setup();
    page.patient.set({ patientReference: 'SCP-ABCD-1234', displayName: 'Adaeze O.' });
    page.chooseType('LABORATORY');
    page.toggleTest('Full blood count (FBC)');
    page.toggleTest('Malaria parasite (MP)');
    page.toggleTest('Malaria parasite (MP)');
    page.setInstructions(0, 'Fasting');
    page.clinicalNote.setValue('  Fever for 3 days ');
    fixture.detectChanges();

    (el.querySelector('[data-send]') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(api.send).toHaveBeenCalledWith({
      patientReference: 'SCP-ABCD-1234',
      type: 'LABORATORY',
      clinicalNote: 'Fever for 3 days',
      diagnosticItems: [{ name: 'Full blood count (FBC)', instructions: 'Fasting' }],
    });
    expect(el.querySelector('[data-sent]')?.textContent).toContain('Lab test request sent to Adaeze O.');
  });

  it('only sends a prescription once each medicine has a dose and frequency', async () => {
    const { page, api } = await setup({ send: vi.fn(() => of(sentOrder({ type: 'PRESCRIPTION' }))) });
    page.patient.set({ patientReference: 'SCP-ABCD-1234', displayName: 'Adaeze O.' });
    page.chooseType('PRESCRIPTION');
    expect(page.canSend()).toBe(false);

    page.medicines.at(0).patchValue({ medicationName: 'Paracetamol', strength: '500 mg', dosage: '2 tablets', frequency: 'Three times daily', duration: '3 days' });
    expect(page.canSend()).toBe(true);
    page.send();

    expect(api.send).toHaveBeenCalledWith(expect.objectContaining({
      type: 'PRESCRIPTION',
      prescriptionItems: [{ medicationName: 'Paracetamol', strength: '500 mg', dosage: '2 tablets', frequency: 'Three times daily', duration: '3 days', quantity: null, route: null, instructions: null }],
    }));
  });

  it('sends a specialist referral once a reason is given', async () => {
    const { page, api } = await setup({ send: vi.fn(() => of(sentOrder({ type: 'REFERRAL', diagnosticItems: [] }))) });
    page.patient.set({ patientReference: 'SCP-ABCD-1234', displayName: 'Adaeze O.' });
    page.chooseType('REFERRAL');
    expect(page.canSend()).toBe(false);
    page.chooseSpecialty('Cardiology');
    page.clinicalNote.setValue(page.clinicalNote.value + 'new murmur, please assess');
    expect(page.canSend()).toBe(true);
    page.send();
    expect(api.send).toHaveBeenCalledWith({ patientReference: 'SCP-ABCD-1234', type: 'REFERRAL', clinicalNote: 'Cardiology: new murmur, please assess' });
  });

  it('shares on WhatsApp without naming medicines or tests', async () => {
    const { page } = await setup();
    page.patient.set({ patientReference: 'SCP-ABCD-1234', displayName: 'Adaeze O.' });
    const link = decodeURIComponent(page.whatsAppLink(sentOrder() as never));
    expect(link).toContain('Hello Adaeze');
    expect(link).toContain('/me/orders/SC-ORD-ABCDEF123456');
    expect(link).not.toContain('blood count');
  });

  it('copies tests from a recent request', async () => {
    const { page } = await setup({ listSent: vi.fn(() => of({ items: [sentOrder()], page: 1, limit: 30, total: 1, totalPages: 1 })) });
    page.patient.set({ patientReference: 'SCP-ABCD-1234', displayName: 'Adaeze O.' });
    page.chooseType('LABORATORY');
    expect(page.recentOfType()).toHaveLength(1);
    page.copyFrom('SC-ORD-ABCDEF123456');
    expect(page.tests()).toEqual([{ name: 'Full blood count (FBC)', instructions: '' }]);
  });
  it('explains that sending opens once the facility is verified', async () => {
    const { el } = await setup({}, true);
    expect(el.textContent).toContain('Sending prescriptions and tests opens once SmartClinic has verified your facility.');
  });

  it('shows no verification notice for an approved facility', async () => {
    const { el } = await setup();
    expect(el.textContent).not.toContain('opens once SmartClinic has verified');
  });
});

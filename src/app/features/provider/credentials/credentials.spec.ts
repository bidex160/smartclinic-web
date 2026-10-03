import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it } from 'vitest';

import { API_CONFIG } from '../../../core/config/api-config.token';
import { ProviderCredentialReviewComponent } from '../../admin/provider-credential-review.component';
import { ProviderCredentialsCardComponent } from './provider-credentials-card.component';
import { SpecialtyPickerComponent } from './specialty-picker.component';

const CATALOGUE = [
  { code: 'GENERAL_PRACTICE', name: 'General Practice / Family Medicine', group: 'Primary care' },
  { code: 'CARDIOLOGY', name: 'Cardiology', group: 'Medicine' },
  { code: 'PEDIATRICS', name: 'Pediatrics', group: 'Children' },
  { code: 'DERMATOLOGY', name: 'Dermatology', group: 'Skin' },
];

const view = (over: Record<string, unknown> = {}) => ({
  providerType: 'INDIVIDUAL', specialtyRequired: true, maxSpecialties: 3, specialties: [],
  regulators: [{ code: 'MDCN', name: 'Medical and Dental Council of Nigeria' }, { code: 'OTHER', name: 'Another regulator' }],
  credential: null, verified: false, uploadsAvailable: false, blockers: ['SPECIALTY_MISSING', 'LICENCE_MISSING'], ...over,
});

function providers() {
  return [provideHttpClient(), provideHttpClientTesting(), { provide: API_CONFIG, useValue: { baseUrl: '/api/v1' } }];
}

describe('Specialty picker', () => {
  it('finds specialties by everyday words, caps the number and keeps a main one', () => {
    TestBed.configureTestingModule({ imports: [SpecialtyPickerComponent] });
    const f = TestBed.createComponent(SpecialtyPickerComponent);
    f.componentRef.setInput('specialties', CATALOGUE);
    f.componentRef.setInput('max', 2);
    f.detectChanges();
    const el = f.nativeElement as HTMLElement;
    const search = el.querySelector('[data-specialty-search]') as HTMLInputElement;
    search.value = 'heart';
    search.dispatchEvent(new Event('input'));
    f.detectChanges();
    expect(Array.from(el.querySelectorAll('[data-specialty]')).map((b) => b.getAttribute('data-specialty'))).toEqual(['CARDIOLOGY']);
    search.value = '';
    search.dispatchEvent(new Event('input'));
    f.detectChanges();
    (el.querySelector('[data-specialty="PEDIATRICS"]') as HTMLButtonElement).click();
    (el.querySelector('[data-specialty="CARDIOLOGY"]') as HTMLButtonElement).click();
    f.detectChanges();
    expect(f.componentInstance.selected()).toEqual(['PEDIATRICS', 'CARDIOLOGY']);
    expect(f.componentInstance.primary()).toBe('PEDIATRICS');
    expect((el.querySelector('[data-specialty="DERMATOLOGY"]') as HTMLButtonElement).disabled).toBe(true);
    (el.querySelectorAll('[data-make-primary]')[1] as HTMLButtonElement).click();
    expect(f.componentInstance.primary()).toBe('CARDIOLOGY');
    f.componentInstance.toggle('CARDIOLOGY');
    expect(f.componentInstance.primary()).toBe('PEDIATRICS');
  });
});

describe('Provider licence card', () => {
  afterEach(() => TestBed.inject(HttpTestingController).verify());

  it('saves specialties and sends the licence for checking', () => {
    TestBed.configureTestingModule({ imports: [ProviderCredentialsCardComponent], providers: providers() });
    const f = TestBed.createComponent(ProviderCredentialsCardComponent);
    const http = TestBed.inject(HttpTestingController);
    f.detectChanges();
    http.expectOne('/api/v1/public/provider-directory/specialties').flush(CATALOGUE);
    http.expectOne('/api/v1/provider/credentials').flush(view());
    f.detectChanges();
    const el = f.nativeElement as HTMLElement;
    expect(el.querySelector('[data-credential-status]')!.textContent).toContain('Not added yet');
    (el.querySelector('[data-specialty="GENERAL_PRACTICE"]') as HTMLButtonElement).click();
    f.detectChanges();
    (el.querySelector('[data-save-specialties]') as HTMLButtonElement).click();
    const put = http.expectOne('/api/v1/provider/credentials/specialties');
    expect(put.request.body).toEqual({ codes: ['GENERAL_PRACTICE'], primary: 'GENERAL_PRACTICE' });
    put.flush(view({ specialties: [{ code: 'GENERAL_PRACTICE', name: 'General Practice / Family Medicine', isPrimary: true }], blockers: ['LICENCE_MISSING'] }));
    f.detectChanges();
    expect(f.componentInstance.regulator()).toBe('MDCN');
    const lic0 = el.querySelector('[data-licence]') as HTMLInputElement;
    lic0.value = 'MDCN/R/12345';
    lic0.dispatchEvent(new Event('input'));
    f.detectChanges();
    (el.querySelector('[data-save-licence]') as HTMLButtonElement).click();
    const lic = http.expectOne('/api/v1/provider/credentials/licence');
    expect(lic.request.body).toEqual({ regulator: 'MDCN', licenceNumber: 'MDCN/R/12345' });
    lic.flush(view({ credential: { regulator: 'MDCN', licenceNumber: 'MDCN/R/12345', status: 'SUBMITTED', hasDocument: false, submittedAt: '2026-10-03', verifiedAt: null, message: null }, blockers: ['LICENCE_NOT_VERIFIED'] }));
    f.detectChanges();
    expect(el.querySelector('[data-credential-status]')!.textContent).toContain('Waiting for our check');
    expect(el.textContent).toContain('Uploads are switched off for now');
  });

  it('shows what to fix when staff send it back, and locks a verified licence', () => {
    TestBed.configureTestingModule({ imports: [ProviderCredentialsCardComponent], providers: providers() });
    const f = TestBed.createComponent(ProviderCredentialsCardComponent);
    const http = TestBed.inject(HttpTestingController);
    f.detectChanges();
    http.expectOne('/api/v1/public/provider-directory/specialties').flush(CATALOGUE);
    http.expectOne('/api/v1/provider/credentials').flush(view({ credential: { regulator: 'MDCN', licenceNumber: 'X1', status: 'REJECTED', hasDocument: false, submittedAt: '2026-10-03', verifiedAt: null, message: 'Please upload your certificate.' } }));
    f.detectChanges();
    const el = f.nativeElement as HTMLElement;
    expect(el.querySelector('[data-credential-message]')!.textContent).toContain('Please upload your certificate.');
    f.componentInstance['apply'](view({ verified: true, credential: { regulator: 'MDCN', licenceNumber: 'X1', status: 'VERIFIED', hasDocument: true, submittedAt: '2026-10-03', verifiedAt: '2026-10-04T10:00:00Z', message: null } }) as never);
    f.detectChanges();
    expect(el.querySelector('[data-credential-status]')!.textContent).toContain('✓ Verified');
    expect(el.querySelector('[data-save-licence]')).toBeNull();
    expect((el.querySelector('[data-licence]') as HTMLInputElement).disabled).toBe(true);
  });
});

describe('Staff licence review', () => {
  afterEach(() => TestBed.inject(HttpTestingController).verify());

  it('links to the regulator check page and records how it was checked', () => {
    TestBed.configureTestingModule({ imports: [ProviderCredentialReviewComponent], providers: providers() });
    const f = TestBed.createComponent(ProviderCredentialReviewComponent);
    f.componentRef.setInput('providerId', 'p-1');
    const http = TestBed.inject(HttpTestingController);
    let changed = 0;
    f.componentInstance.changed.subscribe(() => (changed += 1));
    f.detectChanges();
    const cred = { regulator: 'MDCN', licenceNumber: 'MDCN/R/7', status: 'SUBMITTED', hasDocument: false, submittedAt: '2026-10-03', verifiedAt: null, message: null };
    const submitted = view({
      specialties: [{ code: 'PEDIATRICS', name: 'Pediatrics', isPrimary: true }],
      credential: cred,
      documentUrl: null, checkUrl: 'https://mdcn.gov.ng/page/services/primary-source-verification', checkedVia: null, reviewNote: null,
    });
    http.expectOne('/api/v1/admin/providers/p-1/credentials').flush(submitted);
    f.detectChanges();
    const el = f.nativeElement as HTMLElement;
    expect(el.querySelector('[data-review-licence]')!.textContent).toContain('MDCN/R/7');
    expect((el.querySelector('[data-review-check-url]') as HTMLAnchorElement).href).toContain('mdcn.gov.ng');
    expect((el.querySelector('[data-review-verify]') as HTMLButtonElement).disabled).toBe(true);
    const via = el.querySelector('[data-review-checked-via]') as HTMLInputElement;
    via.value = 'MDCN online register';
    via.dispatchEvent(new Event('input'));
    f.detectChanges();
    (el.querySelector('[data-review-verify]') as HTMLButtonElement).click();
    const v = http.expectOne('/api/v1/admin/providers/p-1/credentials/verify');
    expect(v.request.body).toEqual({ checkedVia: 'MDCN online register' });
    v.flush({ ...submitted, verified: true, credential: { ...cred, status: 'VERIFIED' }, checkedVia: 'MDCN online register' });
    f.detectChanges();
    expect(el.querySelector('[data-review-status]')!.textContent).toContain('✓ Verified');
    expect(changed).toBe(1);
  });
});

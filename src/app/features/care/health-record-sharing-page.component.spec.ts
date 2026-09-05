import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { ClinicalRecordsApiService } from '../../core/services/clinical-records-api.service';
import { HealthRecordSharingPageComponent } from './health-record-sharing-page.component';

describe('HealthRecordSharingPageComponent', () => {
  const active = { reference: 'SC-CRG-1', provider: { providerReference: 'SCPR-1', displayName: 'Prime Clinic', providerType: 'CLINIC' }, scope: 'ALL_RECORDS', recordType: null, clinicalRecord: null, grantedAt: '2026-08-01T10:00:00Z', expiresAt: null, revokedAt: null, status: 'ACTIVE', createdAt: '', updatedAt: '' } as const;

  it('renders authoritative scope/state labels and only allows active grants to be revoked', async () => {
    const grants = [
      active,
      { reference: 'SC-CRG-2', provider: { providerReference: 'SCPR-2', displayName: 'Old Clinic', providerType: 'CLINIC' }, scope: 'RECORD_TYPE', recordType: 'CONSULTATION', clinicalRecord: null, grantedAt: '2026-07-01T10:00:00Z', expiresAt: '2026-07-02T10:00:00Z', revokedAt: null, status: 'EXPIRED', createdAt: '', updatedAt: '' },
      { reference: 'SC-CRG-3', provider: { providerReference: 'SCPR-3', displayName: 'Past Clinic', providerType: 'CLINIC' }, scope: 'SINGLE_RECORD', recordType: null, clinicalRecord: { reference: 'SC-CLR-1', title: 'Consultation', recordType: 'CONSULTATION' }, grantedAt: '2026-06-01T10:00:00Z', expiresAt: null, revokedAt: '2026-06-02T10:00:00Z', status: 'REVOKED', createdAt: '', updatedAt: '' },
    ];
    await TestBed.configureTestingModule({ imports: [HealthRecordSharingPageComponent], providers: [provideRouter([]), { provide: ClinicalRecordsApiService, useValue: { listAccessGrants: () => of({ items: grants }) } }] }).compileComponents();
    const fixture: ComponentFixture<HealthRecordSharingPageComponent> = TestBed.createComponent(HealthRecordSharingPageComponent); fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Health Passport + finalized clinical records'); expect(fixture.nativeElement.textContent).toContain('Consultation records'); expect(fixture.nativeElement.textContent).toContain('Expired'); expect(fixture.nativeElement.textContent).toContain('Revoked');
    expect(fixture.nativeElement.querySelectorAll('button').length).toBe(1);
  });

  it('renders a Health Passport-only grant without changing connection state', async () => {
    const passport = { ...active, reference: 'SC-CRG-P', scope: 'HEALTH_PASSPORT' as const };
    const revokeAccessGrant = vi.fn(() => of({ ...passport, status: 'REVOKED' }));
    await TestBed.configureTestingModule({ imports: [HealthRecordSharingPageComponent], providers: [provideRouter([]), { provide: ClinicalRecordsApiService, useValue: { listAccessGrants: () => of({ items: [passport] }), revokeAccessGrant } }] }).compileComponents();
    const fixture = TestBed.createComponent(HealthRecordSharingPageComponent); fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Shareable Health Passport only');
    fixture.componentInstance.openRevoke(passport); fixture.componentInstance.confirmRevoke();
    expect(revokeAccessGrant).toHaveBeenCalledWith('SC-CRG-P');
  });

  it('confirms revocation, prevents double submit, and replaces the row with the backend response', async () => {
    const response = new Subject<any>(); const revokeAccessGrant = vi.fn(() => response);
    await TestBed.configureTestingModule({ imports: [HealthRecordSharingPageComponent], providers: [provideRouter([]), { provide: ClinicalRecordsApiService, useValue: { listAccessGrants: () => of({ items: [active] }), revokeAccessGrant } }] }).compileComponents();
    const fixture = TestBed.createComponent(HealthRecordSharingPageComponent); fixture.detectChanges(); const component = fixture.componentInstance;
    component.openRevoke(active); fixture.detectChanges(); expect(fixture.nativeElement.querySelector('[role="alertdialog"]')).toBeTruthy();
    component.confirmRevoke(); component.confirmRevoke(); expect(revokeAccessGrant).toHaveBeenCalledTimes(1);
    response.next({ ...active, status: 'REVOKED', revokedAt: '2026-09-04T10:00:00Z' }); response.complete(); fixture.detectChanges();
    expect(component.grants()[0].status).toBe('REVOKED'); expect(component.revokeTarget()).toBeNull();
  });

  it('can cancel and preserves active state when revoke fails', async () => {
    const revokeAccessGrant = vi.fn(() => throwError(() => new Error('offline')));
    await TestBed.configureTestingModule({ imports: [HealthRecordSharingPageComponent], providers: [provideRouter([]), { provide: ClinicalRecordsApiService, useValue: { listAccessGrants: () => of({ items: [active] }), revokeAccessGrant } }] }).compileComponents();
    const fixture = TestBed.createComponent(HealthRecordSharingPageComponent); fixture.detectChanges(); const component = fixture.componentInstance;
    component.openRevoke(active); component.cancelRevoke(); expect(revokeAccessGrant).not.toHaveBeenCalled();
    component.openRevoke(active); component.confirmRevoke(); fixture.detectChanges(); expect(component.grants()[0].status).toBe('ACTIVE'); expect(fixture.nativeElement.textContent).toContain('Unable to revoke access');
  });
});

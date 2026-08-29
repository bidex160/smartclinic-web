import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { ClinicalRecordsApiService } from '../../core/services/clinical-records-api.service';
import { NewHealthRecordSharingPageComponent } from './new-health-record-sharing-page.component';

describe('NewHealthRecordSharingPageComponent', () => {
  it('preselects a finalized record and submits the provider public reference with SINGLE_RECORD scope', async () => {
    const createAccessGrant = vi.fn(() => of({ reference: 'SC-CRG-1' }));
    const searchAccessProviders = vi.fn(() => of({ items: [{ providerReference: 'SCPR-PUBLIC', displayName: 'Prime Clinic', providerType: 'CLINIC', location: { city: 'Ikeja', stateOrRegion: 'Lagos', countryCode: 'NG' } }], page: 1, limit: 10, total: 1, totalPages: 1 }));
    const record = { reference: 'SC-CLR-1', title: 'Consultation', recordType: 'CONSULTATION' };
    await TestBed.configureTestingModule({ imports: [NewHealthRecordSharingPageComponent], providers: [provideRouter([{ path: 'me/health-records/sharing/:reference', component: NewHealthRecordSharingPageComponent }]), { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: convertToParamMap({ recordReference: 'SC-CLR-1' }) } } }, { provide: ClinicalRecordsApiService, useValue: { listMine: () => of({ items: [record] }), searchAccessProviders, createAccessGrant } }] }).compileComponents();
    const fixture = TestBed.createComponent(NewHealthRecordSharingPageComponent); fixture.detectChanges(); const component = fixture.componentInstance;
    expect(component.form.controls.scope.value).toBe('SINGLE_RECORD'); expect(component.form.controls.clinicalRecordReference.value).toBe('SC-CLR-1');
    component.selectProvider(component.providers()[0]); component.submit();
    expect(createAccessGrant).toHaveBeenCalledWith({ providerReference: 'SCPR-PUBLIC', scope: 'SINGLE_RECORD', clinicalRecordReference: 'SC-CLR-1' });
    component.providerSearch.setValue('prime'); component.searchProviders(); expect(searchAccessProviders).toHaveBeenLastCalledWith('prime', 1, 10);
    component.loadProviders(2); expect(searchAccessProviders).toHaveBeenLastCalledWith('prime', 2, 10);
  });

  it('renders directory loading, empty, and recoverable error states', async () => {
    const pending = new Subject<never>();
    const searchAccessProviders = vi.fn().mockReturnValueOnce(pending).mockReturnValueOnce(throwError(() => new Error('offline')));
    await TestBed.configureTestingModule({ imports: [NewHealthRecordSharingPageComponent], providers: [provideRouter([]), { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: convertToParamMap({}) } } }, { provide: ClinicalRecordsApiService, useValue: { listMine: () => of({ items: [] }), searchAccessProviders } }] }).compileComponents();
    const fixture = TestBed.createComponent(NewHealthRecordSharingPageComponent); fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Loading providers');
    pending.complete(); fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('No providers match this search');
    fixture.componentInstance.searchProviders(); fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Unable to load providers');
  });
});

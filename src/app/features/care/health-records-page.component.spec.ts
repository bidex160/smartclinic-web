import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { ClinicalRecordsApiService } from '../../core/services/clinical-records-api.service';
import { HealthRecordsPageComponent } from './health-records-page.component';
import { ClinicalRecord } from '../../core/models/clinical-record.model';

describe('HealthRecordsPageComponent', () => {
  it('renders finalized patient records from the authoritative list', async () => {
    const api = { listMine: vi.fn(() => of({ items: [record()], page: 1, limit: 20, total: 1, totalPages: 1 })) };
    await TestBed.configureTestingModule({ imports: [HealthRecordsPageComponent], providers: [provideRouter([]), { provide: ClinicalRecordsApiService, useValue: api }] }).compileComponents();
    const fixture = TestBed.createComponent(HealthRecordsPageComponent); fixture.detectChanges();
    expect(api.listMine).toHaveBeenCalled(); expect(fixture.nativeElement.textContent).toContain('Consultation outcome'); expect(fixture.nativeElement.textContent).toContain('Finalized');
  });
});
export function record(): ClinicalRecord { return { reference: 'SC-CLR-ABC', recordType: 'CONSULTATION', title: 'Consultation outcome', summary: 'Summary', status: 'FINALIZED', occurredAt: '2026-08-29T08:00:00Z', finalizedAt: '2026-08-29T09:00:00Z', provider: { providerReference: 'SCPR-1', displayName: 'Example Clinic', providerType: 'CLINIC' }, careRequestReference: 'SC-CARE-1', careAppointmentReference: 'SC-APT-1', service: { code: 'GENERAL_CONSULTATION', name: 'General Consultation' }, consultation: { presentingComplaint: 'Pain', historyOfPresentingComplaint: null, observations: null, assessment: 'Stable', diagnosis: 'Example', plan: 'Rest', followUpInstructions: 'Return if worse' }, attachments: [], createdAt: '2026-08-29T08:00:00Z', updatedAt: '2026-08-29T09:00:00Z' }; }

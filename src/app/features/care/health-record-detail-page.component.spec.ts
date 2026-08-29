import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { ClinicalRecordsApiService } from '../../core/services/clinical-records-api.service';
import { HealthRecordDetailPageComponent } from './health-record-detail-page.component';
import { record } from './health-records-page.component.spec';
describe('HealthRecordDetailPageComponent', () => { it('renders finalized consultation detail read-only', async () => { const api = { getMine: vi.fn(() => of(record())) }; await TestBed.configureTestingModule({ imports: [HealthRecordDetailPageComponent], providers: [provideRouter([]), { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => 'SC-CLR-ABC' } } } }, { provide: ClinicalRecordsApiService, useValue: api }] }).compileComponents(); const fixture = TestBed.createComponent(HealthRecordDetailPageComponent); fixture.detectChanges(); const text = fixture.nativeElement.textContent; expect(text).toContain('Presenting complaint'); expect(text).toContain('Pain'); expect(text).toContain('Diagnosis'); expect(fixture.nativeElement.querySelector('textarea')).toBeNull(); }); });

import { describe, expect, it, vi } from 'vitest';

// Explicit smoke registration keeps this suite discoverable in Angular's Vitest runner.
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { ClinicalRecordsApiService } from '../../core/services/clinical-records-api.service';
import { HealthRecordsPageComponent } from './health-records-page.component';
import { clinicalRecordFixture } from './health-record.test-fixture';

describe('HealthRecordsPageComponent', () => {
  it('registers the health records suite', () => expect(true).toBe(true));
  it('renders finalized patient records from the authoritative list', async () => {
    const api = { listMine: vi.fn(() => of({ items: [clinicalRecordFixture()], page: 1, limit: 20, total: 1, totalPages: 1 })) };
    await TestBed.configureTestingModule({ imports: [HealthRecordsPageComponent], providers: [provideRouter([]), { provide: ClinicalRecordsApiService, useValue: api }] }).compileComponents();
    const fixture = TestBed.createComponent(HealthRecordsPageComponent); fixture.detectChanges();
    expect(api.listMine).toHaveBeenCalled(); expect(fixture.nativeElement.textContent).toContain('Consultation outcome'); expect(fixture.nativeElement.textContent).toContain('Finalized');
  });
});

import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';

import { DirectOrdersApiService } from '../../core/services/direct-orders-api.service';
import { PendingRequestsCardComponent } from './pending-requests-card.component';

const order = (reference: string, overrides: Record<string, unknown> = {}) => ({
  reference, type: 'LABORATORY', status: 'ISSUED', origin: 'DIRECT', patientResponse: 'PENDING',
  orderingProvider: { providerReference: 'SCPR-1', displayName: 'Dr Bisi Clinic' }, ...overrides,
});

describe('PendingRequestsCardComponent', () => {
  async function setup(listMine: ReturnType<typeof vi.fn>) {
    await TestBed.configureTestingModule({
      imports: [PendingRequestsCardComponent],
      providers: [provideRouter([]), { provide: DirectOrdersApiService, useValue: { listMine } }],
    }).compileComponents();
    const fixture = TestBed.createComponent(PendingRequestsCardComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('lists only direct requests still waiting for the patient', async () => {
    const fixture = await setup(vi.fn(() => of({ items: [
      order('A'),
      order('B', { origin: 'APPOINTMENT', patientResponse: null }),
      order('C', { patientResponse: 'APPROVED' }),
      order('D', { type: 'PRESCRIPTION' }),
    ] })));
    expect(fixture.componentInstance.pending().map((o) => o.reference)).toEqual(['A', 'D']);
    expect(fixture.componentInstance.link(fixture.componentInstance.pending()[1])).toEqual(['/me/prescriptions', 'D']);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('2 requests from your care providers');
  });

  it('stays hidden when nothing is waiting or requests are unavailable', async () => {
    const fixture = await setup(vi.fn(() => throwError(() => new Error('offline'))));
    expect((fixture.nativeElement as HTMLElement).querySelector('[data-pending-requests]')).toBeNull();
  });
});

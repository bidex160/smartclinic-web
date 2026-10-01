import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';

import { DirectOrdersApiService } from '../../../core/services/direct-orders-api.service';
import { ProviderSentRequestsPageComponent } from './provider-sent-requests-page.component';

const order = (overrides: Record<string, unknown>) => ({
  reference: 'SC-ORD-1',
  type: 'LABORATORY',
  status: 'ISSUED',
  origin: 'DIRECT',
  patientResponse: 'PENDING',
  orderingProvider: { providerReference: 'SCPR-1', displayName: 'Dr Bisi Clinic' },
  patient: { patientReference: 'SCP-ABCD-1234', displayName: 'Adaeze O.' },
  issuedAt: '2026-10-01T10:00:00Z',
  createdAt: '2026-10-01T10:00:00Z',
  prescription: null,
  diagnosticItems: [{ name: 'FBC', resultedAt: null, sortOrder: 0 }],
  fulfillment: null,
  ...overrides,
});

describe('ProviderSentRequestsPageComponent', () => {
  async function setup(items: unknown[]) {
    const api = {
      listSent: vi.fn(() => of({ items, page: 1, limit: 50, total: items.length, totalPages: 1 })),
      cancel: vi.fn(() => of({ ...(items[0] as object), status: 'CANCELLED' })),
    };
    await TestBed.configureTestingModule({
      imports: [ProviderSentRequestsPageComponent],
      providers: [provideRouter([]), { provide: DirectOrdersApiService, useValue: api }],
    }).compileComponents();
    const fixture = TestBed.createComponent(ProviderSentRequestsPageComponent);
    fixture.detectChanges();
    return { fixture, page: fixture.componentInstance, api, el: fixture.nativeElement as HTMLElement };
  }

  it('shows where each request is, in plain words', async () => {
    const { el } = await setup([
      order({ reference: 'A' }),
      order({ reference: 'B', patientResponse: 'APPROVED', fulfillment: { reference: 'F', status: 'ACCEPTED' } }),
      order({ reference: 'C', status: 'CANCELLED', patientResponse: 'DECLINED' }),
      order({ reference: 'D', patientResponse: 'APPROVED', diagnosticItems: [{ name: 'FBC', resultedAt: '2026-10-02T10:00:00Z', resultValue: '12.1', resultUnit: 'g/dL', sortOrder: 0 }] }),
    ]);
    const labels = [...el.querySelectorAll('[data-status]')].map((node) => node.textContent?.trim());
    expect(labels).toEqual(['Waiting for patient', 'Accepted by lab', 'Declined by patient', 'Results ready']);
    expect(el.querySelector('[data-results]')?.textContent).toContain('12.1');
  });

  it('cancels a request that has not been accepted yet', async () => {
    const { fixture, page, api } = await setup([order({ reference: 'A' })]);
    const first = page.items()[0];
    expect(page.canCancel(first)).toBe(true);
    page.cancel(first);
    fixture.detectChanges();
    expect(api.cancel).toHaveBeenCalledWith('A');
    expect(page.items()[0].status).toBe('CANCELLED');
    expect(page.canCancel(order({ fulfillment: { reference: 'F', status: 'ACCEPTED' } }) as never)).toBe(false);
  });

  it('invites a first request when nothing has been sent', async () => {
    const { el } = await setup([]);
    expect(el.textContent).toContain('Nothing sent yet');
  });
});

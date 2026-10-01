import { ComponentRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';

import { DirectOrdersApiService } from '../../core/services/direct-orders-api.service';
import { DirectRequestBannerComponent } from './direct-request-banner.component';

const order = (overrides: Record<string, unknown> = {}) => ({
  reference: 'SC-ORD-1',
  type: 'PRESCRIPTION',
  status: 'ISSUED',
  origin: 'DIRECT',
  patientResponse: 'PENDING',
  orderingProvider: { providerReference: 'SCPR-1', displayName: 'Dr Bisi Clinic' },
  ...overrides,
});

describe('DirectRequestBannerComponent', () => {
  async function setup(value: Record<string, unknown>) {
    const api = { decline: vi.fn(() => of(order({ status: 'CANCELLED', patientResponse: 'DECLINED' }))) };
    await TestBed.configureTestingModule({
      imports: [DirectRequestBannerComponent],
      providers: [{ provide: DirectOrdersApiService, useValue: api }],
    }).compileComponents();
    const fixture = TestBed.createComponent(DirectRequestBannerComponent);
    (fixture.componentRef as ComponentRef<DirectRequestBannerComponent>).setInput('order', value);
    fixture.detectChanges();
    return { fixture, api, el: fixture.nativeElement as HTMLElement };
  }

  it('explains a pending request and lets the patient decline it after confirming', async () => {
    const { fixture, api, el } = await setup(order());
    expect(el.textContent).toContain('Dr Bisi Clinic sent you this prescription');
    const emitted: unknown[] = [];
    fixture.componentInstance.changed.subscribe((value) => emitted.push(value));

    fixture.componentInstance.confirming.set(true);
    fixture.componentInstance.decline();
    expect(api.decline).toHaveBeenCalledWith('SC-ORD-1');
    expect(emitted).toHaveLength(1);
  });

  it('stays out of the way for appointment orders and answered requests', async () => {
    const { el } = await setup(order({ origin: 'APPOINTMENT', patientResponse: null }));
    expect(el.querySelector('[data-direct-request]')).toBeNull();
  });
});

import { ComponentRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';

import { PharmacyFulfillmentApiService } from '../../../core/services/pharmacy-fulfillment-api.service';
import { ReferOnwardPanelComponent } from './refer-onward-panel.component';

const fulfillment = { reference: 'SC-ORF-1', status: 'ACCEPTED', clinicalOrder: { type: 'LABORATORY' }, fulfiller: { providerReference: 'SCPR-ME' } } as never;
const option = (ref: string, provider: string, name: string) => ({ providerReference: provider, displayName: name, providerType: 'DIAGNOSTIC_CENTRE', providerServiceUnitReference: ref, unitName: 'Lab', capabilityType: 'LABORATORY', location: { city: 'Ikeja', stateOrRegion: 'Lagos', countryCode: 'NG' } });

describe('ReferOnwardPanelComponent', () => {
  async function setup(api: Record<string, unknown> = {}) {
    const mock = {
      searchFulfillmentProvidersForProvider: vi.fn(() => of({ items: [option('U-ME', 'SCPR-ME', 'Us'), option('U-B', 'SCPR-B', 'Ikeja Reference Lab')] })),
      referOnward: vi.fn(() => of({ reference: 'SC-ORF-2' })),
      ...api,
    };
    await TestBed.configureTestingModule({ imports: [ReferOnwardPanelComponent], providers: [{ provide: PharmacyFulfillmentApiService, useValue: mock }] }).compileComponents();
    const fixture = TestBed.createComponent(ReferOnwardPanelComponent);
    (fixture.componentRef as ComponentRef<ReferOnwardPanelComponent>).setInput('fulfillment', fulfillment);
    fixture.detectChanges();
    return { fixture, panel: fixture.componentInstance, api: mock, el: fixture.nativeElement as HTMLElement };
  }

  it('searches labs, leaves out this facility, and refers with a note', async () => {
    const { fixture, panel, api, el } = await setup();
    expect(el.textContent).toContain('Refer to another lab');
    panel.start();
    fixture.detectChanges();
    expect(api.searchFulfillmentProvidersForProvider).toHaveBeenCalledWith('LABORATORY', expect.objectContaining({ page: 1 }));
    expect(panel.options().map((o) => o.displayName)).toEqual(['Ikeja Reference Lab']);

    const emitted: unknown[] = [];
    panel.referred.subscribe((value) => emitted.push(value));
    panel.chosen.set(panel.options()[0]);
    panel.note.set('  We don’t run HbA1c ');
    panel.refer();
    expect(api.referOnward).toHaveBeenCalledWith('SC-ORF-1', 'U-B', 'We don’t run HbA1c');
    expect(emitted).toEqual([{ reference: 'SC-ORF-2' }]);
  });

  it('shows why a referral was refused', async () => {
    const { panel } = await setup({ referOnward: vi.fn(() => throwError(() => ({ error: { message: 'The patient has already accepted your price.' } }))) });
    panel.start();
    panel.chosen.set(panel.options()[0]);
    panel.refer();
    expect(panel.error()).toContain('already accepted your price');
  });
});

import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { PharmacyFulfillmentApiService } from '../../core/services/pharmacy-fulfillment-api.service';
import { ProviderServiceUnitsPageComponent } from './provider-service-units-page.component';

describe('ProviderServiceUnitsPageComponent', () => {
  it('accepts mixed-case service unit codes and sends their canonical uppercase form', async () => {
    const createServiceUnit = vi.fn((body) => of(body));
    const api = { listServiceUnits: vi.fn(() => of({ items: [] })), createServiceUnit };
    await TestBed.configureTestingModule({
      imports: [ProviderServiceUnitsPageComponent],
      providers: [{ provide: PharmacyFulfillmentApiService, useValue: api }],
    }).compileComponents();
    const component = TestBed.createComponent(ProviderServiceUnitsPageComponent).componentInstance;
    component.form.setValue({ name: 'Medford Pharmacy', code: 'Main_pharmacy', type: 'PHARMACY', description: '' });
    expect(component.form.valid).toBe(true);
    component.save();
    expect(createServiceUnit).toHaveBeenCalledWith({ name: 'Medford Pharmacy', code: 'MAIN_PHARMACY', type: 'PHARMACY', description: null });
  });
});

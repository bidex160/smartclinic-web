import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { API_CONFIG } from '../../core/config/api-config.token';
import { FulfilmentMode } from '../../core/models/fulfilment-mode.model';
import { BookingFlowStateService } from './booking-flow-state.service';
import { FulfilmentSelectionPageComponent } from './fulfilment-selection-page.component';

describe('FulfilmentSelectionPageComponent', () => {
  it('selects a backend mode without relying on a global package price', async () => {
    await TestBed.configureTestingModule({
      imports: [FulfilmentSelectionPageComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([]),
        { provide: API_CONFIG, useValue: { baseUrl: 'http://api.example.test/api/v1' } }],
    }).compileComponents();
    const state = TestBed.inject(BookingFlowStateService);
    state.selectPackage({ id: 'package-id', code: 'PACKAGE', name: 'Package', description: null,
      benefits: [], estimatedDurationMinutes: null, isActive: true });
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const fixture = TestBed.createComponent(FulfilmentSelectionPageComponent);
    const mode: FulfilmentMode = { id: 'mode-id', code: 'HOME_VISIT', name: 'Home visit', isActive: true };
    TestBed.inject(HttpTestingController).expectOne('http://api.example.test/api/v1/fulfilment-modes').flush([mode]);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).not.toContain('booking price');
    fixture.componentInstance.selectMode(mode);
    expect(state.selectedFulfilmentMode()).toEqual(mode);
    expect(router.navigate).toHaveBeenCalledWith(['/book/details']);
  });
});

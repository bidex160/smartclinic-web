import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';

import { PatientProviderConnectionsApiService } from '../../core/services/patient-provider-connections-api.service';
import { ConnectProviderPageComponent } from './connect-provider-page.component';

describe('ConnectProviderPageComponent', () => {
  async function setup() {
    const api = { directory: vi.fn(() => of({ items: [], page: 1, limit: 10, total: 0, totalPages: 0 })) };
    await TestBed.configureTestingModule({
      imports: [ConnectProviderPageComponent],
      providers: [
        provideRouter([]),
        { provide: PatientProviderConnectionsApiService, useValue: api },
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: convertToParamMap({}) } } },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(ConnectProviderPageComponent);
    fixture.detectChanges();
    return { fixture, api };
  }

  it('does not claim a search failed before the patient has searched, and offers the wider directory', async () => {
    const { fixture } = await setup();
    const element: HTMLElement = fixture.nativeElement;
    expect(element.textContent).not.toContain('match');
    expect(element.textContent).toContain('No hospitals are connected to SmartClinic near you yet.');
    expect(element.querySelector('[data-directory-fallback]')?.getAttribute('href')).toBe('/me/partner-facilities');
  });

  it('names the term when a search finds nothing', async () => {
    const { fixture, api } = await setup();
    fixture.componentInstance.search.setValue('Medford');
    fixture.componentInstance.load(1);
    fixture.detectChanges();
    expect(api.directory).toHaveBeenLastCalledWith('Medford', 1, 10);
    expect(fixture.nativeElement.textContent).toContain('No connected hospitals match “Medford”.');
  });
});

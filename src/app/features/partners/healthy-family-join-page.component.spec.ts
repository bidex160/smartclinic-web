import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';
import { AuthStateService } from '../../core/services/auth-state.service';
import { PartnerApiService } from '../../core/services/partner-api.service';
import { HealthyFamilyJoinPageComponent } from './healthy-family-join-page.component';

describe('HealthyFamilyJoinPageComponent', () => {
  async function setup(authenticated: boolean, patient = authenticated) {
    const api = {
      invitation: vi.fn(() => of({ token: 'invite-token', status: 'INVITED', partner: { id: 'school-1', name: 'Demo School', type: 'SCHOOL' }, programId: 'program-1', campaignId: null })),
      activate: vi.fn(() => of({ familyId: 'family-1' })),
    };
    await TestBed.configureTestingModule({
      imports: [HealthyFamilyJoinPageComponent],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ token: 'invite-token' }) } } },
        { provide: PartnerApiService, useValue: api },
        { provide: AuthStateService, useValue: { authenticated: () => authenticated, isPatient: () => patient } },
      ],
    }).compileComponents();
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    const fixture = TestBed.createComponent(HealthyFamilyJoinPageComponent);
    fixture.detectChanges();
    return { fixture, api, router };
  }

  it('keeps the invitation public and preserves its return URL through sign in and registration', async () => {
    const { fixture } = await setup(false, false);
    const links = [...fixture.nativeElement.querySelectorAll('a')] as HTMLAnchorElement[];
    expect(fixture.nativeElement.textContent).toContain('Demo School invited your family');
    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      '/login?returnUrl=%2Fhealthy-families%2Fjoin%2Finvite-token',
      '/register?returnUrl=%2Fhealthy-families%2Fjoin%2Finvite-token',
    ]);
    expect(fixture.nativeElement.textContent).not.toContain('Join Healthy Families');
  });

  it('allows an authenticated patient to consent and activate the same invitation', async () => {
    const { fixture, api, router } = await setup(true, true);
    const checkbox = fixture.nativeElement.querySelector('input[type="checkbox"]') as HTMLInputElement;
    checkbox.checked = true;
    checkbox.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    expect(button.disabled).toBe(false);
    button.click();
    expect(api.activate).toHaveBeenCalledWith('invite-token', 'healthy-families-v1');
    expect(router.navigateByUrl).toHaveBeenCalledWith('/me/family');
  });
});

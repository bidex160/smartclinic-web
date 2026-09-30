import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { PartnerApiService } from '../../core/services/partner-api.service';
import { FamilyWellnessHomePageComponent } from './family-wellness-home-page.component';

describe('FamilyWellnessHomePageComponent', () => {
  it('links Find Provider and My Appointments to patient routes', async () => {
    await TestBed.configureTestingModule({
      imports: [FamilyWellnessHomePageComponent],
      providers: [provideRouter([]), { provide: PartnerApiService, useValue: { familyHome: () => of([]) } }],
    }).compileComponents();
    const fixture = TestBed.createComponent(FamilyWellnessHomePageComponent);
    fixture.detectChanges();
    const links = [...fixture.nativeElement.querySelectorAll('a')] as HTMLAnchorElement[];
    expect(links.find((link) => link.textContent?.includes('Find Provider'))?.getAttribute('href')).toBe('/me/request-care');
    expect(links.find((link) => link.textContent?.includes('My Appointments'))?.getAttribute('href')).toBe('/me/care');
  });
});

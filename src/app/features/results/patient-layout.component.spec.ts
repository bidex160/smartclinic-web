import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { AuthSessionService } from '../../core/services/auth-session.service';
import { PatientLayoutComponent } from './patient-layout.component';

describe('PatientLayoutComponent', () => {
  it('includes Health Records in desktop and mobile patient navigation', async () => {
    await TestBed.configureTestingModule({ imports: [PatientLayoutComponent], providers: [provideRouter([]), { provide: AuthSessionService, useValue: { logout: () => of(undefined) } }] }).compileComponents();
    const fixture = TestBed.createComponent(PatientLayoutComponent); fixture.componentInstance.menuOpen.set(true); fixture.detectChanges();
    const links = fixture.nativeElement.querySelectorAll('a[href="/me/health-records"]'); expect(links.length).toBe(2); expect(fixture.nativeElement.textContent).toContain('Health Records');
  });
});

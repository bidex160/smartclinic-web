import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { AuthSessionService } from '../../core/services/auth-session.service';
import { AuthStateService } from '../../core/services/auth-state.service';
import { AdminSessionHeaderComponent } from './admin-session-header.component';

describe('AdminSessionHeaderComponent', () => {
  it('includes Care Services in desktop and mobile Operations navigation', async () => {
    const authState = { currentUser: signal(null), loading: signal(false) };
    await TestBed.configureTestingModule({
      imports: [AdminSessionHeaderComponent],
      providers: [
        provideRouter([]),
        { provide: AuthStateService, useValue: authState },
        { provide: AuthSessionService, useValue: { logout: () => of(true) } },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(AdminSessionHeaderComponent);
    fixture.detectChanges();
    const links = Array.from(
      fixture.nativeElement.querySelectorAll('a[href="/admin/care-services"]'),
    ) as HTMLAnchorElement[];
    expect(links).toHaveLength(2);
    expect(links.every((link) => link.textContent?.includes('Care Services'))).toBe(true);
    const commissionLinks = Array.from(
      fixture.nativeElement.querySelectorAll('a[href="/admin/commission-settings"]'),
    ) as HTMLAnchorElement[];
    expect(commissionLinks).toHaveLength(2);
    expect(commissionLinks.every((link) => link.textContent?.includes('Commission Settings'))).toBe(
      true,
    );
  });

  it('shows catalogue links only for an ADMIN account', async () => {
    const fixture = await setupHeader(['ADMIN']);
    expect(
      fixture.nativeElement.querySelectorAll('a[href="/admin/health-checks/packages"]'),
    ).toHaveLength(2);
    expect(
      fixture.nativeElement.querySelectorAll('a[href="/admin/health-checks/clinical-contents"]'),
    ).toHaveLength(2);
    TestBed.resetTestingModule();
    const operationsFixture = await setupHeader(['OPERATIONS']);
    expect(
      operationsFixture.nativeElement.querySelector('a[href="/admin/health-checks/packages"]'),
    ).toBeNull();
  });
});

async function setupHeader(roles: string[]) {
  const authState = {
    currentUser: signal({ displayName: 'Admin', roles }),
    loading: signal(false),
  };
  await TestBed.configureTestingModule({
    imports: [AdminSessionHeaderComponent],
    providers: [
      provideRouter([]),
      { provide: AuthStateService, useValue: authState },
      { provide: AuthSessionService, useValue: { logout: () => of(true) } },
    ],
  }).compileComponents();
  const fixture = TestBed.createComponent(AdminSessionHeaderComponent);
  fixture.detectChanges();
  return fixture;
}

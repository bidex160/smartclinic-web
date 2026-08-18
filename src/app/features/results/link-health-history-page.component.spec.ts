import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { PatientAccountLinkResponse } from '../../core/models/patient-account-link.model';
import { PatientAccountLinkingApiService } from '../../core/services/patient-account-linking-api.service';
import { LinkHealthHistoryPageComponent } from './link-health-history-page.component';

describe('LinkHealthHistoryPageComponent', () => {
  const token = 'a'.repeat(43);
  it('links a valid booking reference once and renders success navigation', async () => {
    const pending = new Subject<PatientAccountLinkResponse>();
    const api = apiMock({ booking: pending });
    const { component, fixture } = await setup(api);
    component.bookingForm.setValue({ bookingReference: 'sc-2026-7f23b0c9d1e4' });
    component.linkFromBooking();
    component.linkFromBooking();
    expect(api.linkFromBooking).toHaveBeenCalledOnce();
    expect(api.linkFromBooking).toHaveBeenCalledWith('SC-2026-7F23B0C9D1E4');
    pending.next(linked());
    pending.complete();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain(
      'Your existing Smart Health Check history is now linked',
    );
    expect(fixture.nativeElement.querySelector('a[href="/me/health-checks"]')).not.toBeNull();
  });
  it('extracts an expected full result URL, submits once, and clears token state', async () => {
    const pending = new Subject<PatientAccountLinkResponse>();
    const api = apiMock({ result: pending });
    const { component } = await setup(api);
    component.resultForm.setValue({
      resultLinkOrToken: `${location.origin}/health-results/${token}`,
    });
    component.linkFromResult();
    component.linkFromResult();
    expect(api.linkFromResult).toHaveBeenCalledOnce();
    expect(api.linkFromResult).toHaveBeenCalledWith(token);
    pending.next(linked());
    pending.complete();
    expect(component.resultForm.controls.resultLinkOrToken.value).toBe('');
    expect(component.success()).toBe(true);
  });
  it('accepts token-only input but rejects unexpected result URLs', async () => {
    const api = apiMock();
    const { component } = await setup(api);
    component.resultForm.setValue({ resultLinkOrToken: token });
    component.linkFromResult();
    expect(api.linkFromResult).toHaveBeenCalledWith(token);
    TestBed.resetTestingModule();
    const second = await setup(apiMock());
    second.component.resultForm.setValue({
      resultLinkOrToken: `https://evil.example/health-results/${token}`,
    });
    second.component.linkFromResult();
    expect(second.api.linkFromResult).not.toHaveBeenCalled();
    expect(second.component.error()).toContain('valid SmartClinic result link');
  });
  it.each([401, 403, 404])('sanitizes invalid booking proof status %s', async (status) => {
    const api = apiMock({
      bookingError: new HttpErrorResponse({ status, error: { message: 'patient other-user' } }),
    });
    const { component } = await setup(api);
    component.bookingForm.setValue({ bookingReference: 'SC-2026-7F23B0C9D1E4' });
    component.linkFromBooking();
    expect(component.error()).toContain('booking session');
    expect(component.error()).not.toContain('other-user');
  });
  it('uses privacy-safe conflict guidance and treats idempotent success as success', async () => {
    const conflict = await setup(
      apiMock({
        resultError: new HttpErrorResponse({
          status: 409,
          error: { message: 'linked to other@example.test' },
        }),
      }),
    );
    conflict.component.resultForm.setValue({ resultLinkOrToken: token });
    conflict.component.linkFromResult();
    expect(conflict.component.error()).toContain('cannot be linked');
    expect(conflict.component.error()).not.toContain('other@example.test');
    TestBed.resetTestingModule();
    const same = await setup(apiMock());
    same.component.resultForm.setValue({ resultLinkOrToken: token });
    same.component.linkFromResult();
    expect(same.component.success()).toBe(true);
  });
  it('contains no email, phone, patient ID, or user ID ownership controls and does not persist proofs', async () => {
    const storage = vi.spyOn(Storage.prototype, 'setItem');
    const { fixture } = await setup(apiMock());
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('does not link health records using email or phone alone');
    for (const name of ['email', 'phone', 'patientId', 'userId'])
      expect(fixture.nativeElement.querySelector(`[name="${name}"]`)).toBeNull();
    expect(storage).not.toHaveBeenCalled();
  });
  async function setup(api: ReturnType<typeof apiMock>) {
    await TestBed.configureTestingModule({
      imports: [LinkHealthHistoryPageComponent],
      providers: [provideRouter([]), { provide: PatientAccountLinkingApiService, useValue: api }],
    }).compileComponents();
    const fixture = TestBed.createComponent(LinkHealthHistoryPageComponent);
    fixture.detectChanges();
    return { fixture, component: fixture.componentInstance, api };
  }
});
function apiMock(
  options: {
    booking?: Subject<PatientAccountLinkResponse>;
    result?: Subject<PatientAccountLinkResponse>;
    bookingError?: HttpErrorResponse;
    resultError?: HttpErrorResponse;
  } = {},
) {
  return {
    linkFromBooking: vi.fn(
      () =>
        options.booking ??
        (options.bookingError ? throwError(() => options.bookingError) : of(linked())),
    ),
    linkFromResult: vi.fn(
      () =>
        options.result ??
        (options.resultError ? throwError(() => options.resultError) : of(linked())),
    ),
  };
}
function linked(): PatientAccountLinkResponse {
  return { linked: true, patient: { givenName: 'Ada', familyName: 'Okafor' } };
}

import { TestBed } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';
import { ProviderOnboardingApiService } from '../../core/services/provider-onboarding-api.service';
import { ProviderProfileImageComponent } from './provider-profile-image.component';

describe('ProviderProfileImageComponent', () => {
  async function setup() {
    const api = { uploadProfileImage: vi.fn(() => of({ profileImageUrl: 'https://res.cloudinary.com/test/image/upload/photo.png' })), removeProfileImage: vi.fn(() => of({ profileImageUrl: null })) };
    await TestBed.configureTestingModule({ imports: [ProviderProfileImageComponent], providers: [{ provide: ProviderOnboardingApiService, useValue: api }] }).compileComponents();
    const fixture = TestBed.createComponent(ProviderProfileImageComponent); fixture.detectChanges();
    const component = fixture.componentInstance; const changed = vi.fn(); component.imageChange.subscribe(changed);
    return { fixture, component, api, changed };
  }
  it('explains public visibility and does not upload on file selection', async () => {
    const { fixture, component, api, changed } = await setup();
    expect(fixture.nativeElement.textContent).toContain('This image will be public');
    const file = new File(['test'], 'photo.png', { type: 'image/png' });
    component.choose({ target: { files: [file] } } as unknown as Event);
    expect(api.uploadProfileImage).not.toHaveBeenCalled(); component.upload();
    expect(api.uploadProfileImage).toHaveBeenCalledWith(file); expect(changed).toHaveBeenCalledOnce();
  });
  it('rejects unsupported files without submitting', async () => {
    const { component, api } = await setup();
    component.choose({ target: { files: [new File(['x'], 'script.svg', { type: 'image/svg+xml' })], value: 'file' } } as unknown as Event);
    component.upload(); expect(api.uploadProfileImage).not.toHaveBeenCalled(); expect(component.error()).toContain('JPEG');
  });
  it('retains the existing image when uploading fails and permits retry', async () => {
    const { component, api, changed } = await setup();
    api.uploadProfileImage.mockReturnValue(throwError(() => new Error('offline')));
    component.selected.set(new File(['x'], 'photo.png', { type: 'image/png' })); component.upload();
    expect(changed).not.toHaveBeenCalled(); expect(component.pending()).toBe(false); expect(component.selected()).not.toBeNull();
  });
  it('prevents duplicate uploads and blocks disabled accounts', async () => {
    const { fixture, component, api } = await setup();
    api.uploadProfileImage.mockReturnValue(new Subject<{ profileImageUrl: string }>());
    component.selected.set(new File(['x'], 'photo.png', { type: 'image/png' })); component.upload(); component.upload();
    expect(api.uploadProfileImage).toHaveBeenCalledOnce();
    component.pending.set(false); fixture.componentRef.setInput('disabled', true); component.upload();
    expect(api.uploadProfileImage).toHaveBeenCalledOnce();
  });
  it('removes an existing image only after the API succeeds', async () => {
    const { fixture, component, api, changed } = await setup();
    fixture.componentRef.setInput('imageUrl', 'https://res.cloudinary.com/test/image/upload/photo.png'); component.remove();
    expect(api.removeProfileImage).toHaveBeenCalledOnce(); expect(changed).toHaveBeenCalledWith(null);
  });
});

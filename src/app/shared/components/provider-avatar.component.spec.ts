import { TestBed } from '@angular/core/testing';
import { ProviderAvatarComponent } from './provider-avatar.component';
it('falls back to initials on image failure and retries when the URL changes', async () => {
  await TestBed.configureTestingModule({ imports: [ProviderAvatarComponent] }).compileComponents();
  const fixture = TestBed.createComponent(ProviderAvatarComponent);
  fixture.componentRef.setInput('name', 'Dr Ada Test');
  fixture.componentRef.setInput('url', 'https://res.cloudinary.com/test/a.png');
  fixture.detectChanges();
  fixture.nativeElement.querySelector('img').dispatchEvent(new Event('error')); fixture.detectChanges();
  expect(fixture.nativeElement.querySelector('img')).toBeNull();
  expect(fixture.nativeElement.textContent).toContain('AT');
  fixture.componentRef.setInput('url', 'https://res.cloudinary.com/test/b.png'); fixture.detectChanges();
  expect(fixture.nativeElement.querySelector('img')).not.toBeNull();
});

import { ChangeDetectionStrategy, Component, inject, input, output, signal } from '@angular/core';
import { finalize } from 'rxjs';
import { ProviderOnboardingApiService } from '../../core/services/provider-onboarding-api.service';
import { ProviderAvatarComponent } from '../../shared/components/provider-avatar.component';

@Component({
  selector: 'app-provider-profile-image',
  imports: [ProviderAvatarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="mt-6 rounded-2xl border border-violet-100 bg-white p-6" aria-labelledby="profile-image-heading">
      <div class="flex items-center gap-4"><app-provider-avatar [name]="name()" [url]="imageUrl()" [logo]="!individual()" /><div><h2 id="profile-image-heading" class="text-xl font-bold text-brand-900">{{ individual() ? 'Your profile photo' : 'Your facility logo' }}</h2><p class="mt-1 text-sm text-slate-600">Help patients recognise you when choosing care.</p></div></div>
      <p id="profile-image-help" class="mt-4 text-sm text-slate-600">This image will be public wherever your provider profile is listed. Upload only your own photo or an authorised facility logo. JPEG, PNG or WebP, up to 5 MB.</p>
      @if (!disabled()) {
        <label class="mt-4 block font-semibold" for="provider-profile-image">Choose {{ individual() ? 'photo' : 'logo' }}</label>
        <input id="provider-profile-image" type="file" accept="image/jpeg,image/png,image/webp" aria-describedby="profile-image-help" [disabled]="pending()" (change)="choose($event)" class="mt-2 block min-h-11 max-w-full text-sm" />
        @if (selected()) { <p class="mt-2 break-all text-sm">Selected: {{ selected()!.name }}</p> }
        <div class="mt-4 flex flex-wrap gap-3">
          <button type="button" (click)="upload()" [disabled]="pending() || !selected()" class="min-h-11 rounded-xl bg-brand-700 px-4 py-2 font-bold text-white disabled:opacity-50">{{ pending() ? 'Updating…' : 'Upload public image' }}</button>
          @if (imageUrl()) { <button type="button" (click)="remove()" [disabled]="pending()" class="min-h-11 rounded-xl border border-slate-300 px-4 py-2 font-bold">Remove image</button> }
        </div>
      }
      @if (error()) { <p role="alert" class="mt-3 text-sm text-red-800">{{ error() }}</p> }
      @if (feedback()) { <p role="status" class="mt-3 text-sm text-green-800">{{ feedback() }}</p> }
    </section>
  `,
})
export class ProviderProfileImageComponent {
  readonly name = input(''); readonly imageUrl = input<string | null | undefined>(null);
  readonly individual = input(false); readonly disabled = input(false);
  readonly imageChange = output<string | null>();
  readonly selected = signal<File | null>(null); readonly pending = signal(false);
  readonly error = signal(''); readonly feedback = signal('');
  private readonly api = inject(ProviderOnboardingApiService);
  choose(event: Event) {
    const input = event.target as HTMLInputElement; const file = input.files?.[0];
    this.selected.set(null); this.error.set(''); this.feedback.set('');
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024 || !file.size) { this.error.set('Choose a JPEG, PNG or WebP image no larger than 5 MB.'); input.value = ''; return; }
    this.selected.set(file); input.value = '';
  }
  upload() {
    const file = this.selected(); if (!file || this.pending() || this.disabled()) return;
    this.run(this.api.uploadProfileImage(file), 'Public profile image updated.');
  }
  remove() {
    if (!this.imageUrl() || this.pending() || this.disabled()) return;
    this.run(this.api.removeProfileImage(), 'Profile image removed.');
  }
  private run(operation: ReturnType<ProviderOnboardingApiService['removeProfileImage']>, message: string) {
    this.pending.set(true); this.error.set(''); this.feedback.set('');
    operation.pipe(finalize(() => this.pending.set(false))).subscribe({
      next: result => { this.imageChange.emit(result.profileImageUrl); this.selected.set(null); this.feedback.set(message); },
      error: () => this.error.set('The image could not be updated. Check the file and connection, then try again.'),
    });
  }
}

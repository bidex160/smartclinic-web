import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';

@Component({
  selector: 'app-provider-avatar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'inline-flex shrink-0' },
  template: `
    <span class="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-violet-100 bg-violet-50 font-bold text-brand-800" aria-hidden="true">
      @if (url() && failedUrl() !== url()) {
        <img [src]="url()" alt="" width="56" height="56" loading="lazy" decoding="async" referrerpolicy="no-referrer" class="h-full w-full" [class.object-cover]="!logo()" [class.object-contain]="logo()" [class.p-1]="logo()" (error)="failedUrl.set(url())" />
      } @else { {{ initials() }} }
    </span>
  `,
})
export class ProviderAvatarComponent {
  readonly name = input('');
  readonly url = input<string | null | undefined>(null);
  readonly logo = input(false);
  readonly failedUrl = signal<string | null | undefined>(undefined);
  initials() { return this.name().trim().split(/\s+/).filter(part => !/^dr\.?$/i.test(part)).slice(0, 2).map(part => part[0]).join('').toUpperCase() || 'SC'; }
}

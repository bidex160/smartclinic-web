import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

/** The API's answer when a facility is signed in but not yet verified. */
export function isAwaitingProviderApproval(error: unknown): boolean {
  return (
    error instanceof HttpErrorResponse &&
    error.status === 403 &&
    typeof error.error?.message === 'string' &&
    /approved provider access/i.test(error.error.message)
  );
}

/** Explains a locked page instead of showing a generic "couldn't be loaded". */
@Component({
  selector: 'app-provider-approval-notice',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div role="status" class="mt-6 rounded-2xl bg-ochre-50 p-5 text-ink ring-1 ring-ochre-100">
      <p class="font-semibold">{{ feature() }} opens once SmartClinic has verified your facility.</p>
      <p class="mt-1 text-sm leading-6 text-ink-soft">
        Verification usually runs in the background while you finish setup. You'll get a notification as soon as it's done.
      </p>
      <a routerLink="/provider/profile" class="mt-3 inline-flex min-h-11 items-center font-semibold text-brand-700 underline underline-offset-4">Continue provider setup →</a>
    </div>
  `,
})
export class ProviderApprovalNoticeComponent {
  readonly feature = input.required<string>();
}

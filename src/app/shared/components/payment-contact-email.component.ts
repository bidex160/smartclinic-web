import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { PaymentEmailRequest } from '../../core/models/payment-email.model';
import { AuthStateService } from '../../core/services/auth-state.service';

@Component({
  selector: 'app-payment-contact-email',
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (required()) {
      <label class="mt-4 block font-semibold" for="payment-contact-email">
        Payment email
        <input
          id="payment-contact-email"
          type="email"
          autocomplete="email"
          placeholder="e.g. ada@example.com"
          [formControl]="control"
          [attr.aria-invalid]="control.touched && control.invalid"
          aria-describedby="payment-contact-email-help payment-contact-email-error"
          class="mt-2 min-h-12 w-full rounded-xl border bg-white p-3 font-normal"
        />
      </label>
      <p id="payment-contact-email-help" class="mt-2 text-sm text-slate-600">
        Your payment provider requires an email address to process this payment. This email is used
        for this payment only and won't change your SmartClinic account.
      </p>
      @if (control.touched && control.invalid) {
        <p id="payment-contact-email-error" role="alert" class="mt-2 text-sm text-red-700">
          Enter a valid payment email address.
        </p>
      }
    }
  `,
})
export class PaymentContactEmailComponent {
  private readonly auth = inject(AuthStateService);
  readonly required = computed(() => this.auth.currentUser()?.email === null);
  readonly control = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.email, Validators.maxLength(254)],
  });

  request(): PaymentEmailRequest | null | undefined {
    if (!this.required()) return undefined;
    const normalized = this.control.value.trim().toLowerCase();
    this.control.setValue(normalized);
    this.control.markAsTouched();
    if (this.control.invalid) return null;
    return { paymentEmail: normalized };
  }
}

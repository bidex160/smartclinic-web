import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { PaymentEmailRequest, PaymentProvider } from '../../core/models/payment-email.model';
import { AuthStateService } from '../../core/services/auth-state.service';

@Component({
  selector: 'app-payment-contact-email',
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <fieldset class="mt-4 rounded-xl border bg-white p-4">
      <legend class="font-semibold">Choose how you'd like to pay</legend>
      <div class="mt-3 grid gap-3 sm:grid-cols-2">
      
        <label
          class="flex cursor-pointer items-start gap-3 rounded-xl border p-3"
          [class.border-brand-700]="provider === 'OPAY'"
          ><input
            type="radio"
            name="payment-provider"
            value="OPAY"
            [checked]="provider === 'OPAY'"
            (change)="provider = 'OPAY'"
          />
          <span
            ><strong class="block">OPay</strong
            ><span class="text-sm text-slate-600">Pay securely with OPay</span></span
          ></label
        >
          <label
          class="flex cursor-pointer items-start gap-3 rounded-xl border p-3"
          [class.border-brand-700]="provider === 'PAYSTACK'"
          ><input
            type="radio"
            name="payment-provider"
            value="PAYSTACK"
            [checked]="provider === 'PAYSTACK'"
            (change)="provider = 'PAYSTACK'"
          />
          <span
            ><strong class="block">Paystack</strong
            ><span class="text-sm text-slate-600">Secure online payment</span></span
          ></label>
      </div>
    </fieldset>
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
  provider: PaymentProvider = 'OPAY';

  request(): PaymentEmailRequest | null | undefined {
    const provider = this.provider;
    if (!this.required()) return { paymentProvider: provider };
    const normalized = this.control.value.trim().toLowerCase();
    this.control.setValue(normalized);
    this.control.markAsTouched();
    if (this.control.invalid) return null;
    return { paymentEmail: normalized, paymentProvider: provider };
  }
}

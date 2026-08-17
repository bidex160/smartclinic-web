import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-booking-progress',
  template: `
    <nav aria-label="Booking progress" class="mb-8">
      <p class="mb-3 text-sm font-semibold text-slate-600">Step {{ currentStep() }} of 4</p>
      <ol class="grid grid-cols-4 gap-2 text-xs font-semibold sm:text-sm">
        @for (step of steps; track step.number) {
          <li
            class="border-t-4 pt-2"
            [class.border-brand-600]="step.number <= currentStep()"
            [class.text-brand-800]="step.number <= currentStep()"
            [class.border-slate-200]="step.number > currentStep()"
            [class.text-slate-500]="step.number > currentStep()"
            [attr.aria-current]="step.number === currentStep() ? 'step' : null"
          >
            <span class="hidden sm:inline">{{ step.label }}</span>
            <span class="sm:hidden">{{ step.shortLabel }}</span>
          </li>
        }
      </ol>
    </nav>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookingProgressComponent {
  readonly currentStep = input.required<number>();
  protected readonly steps = [
    { number: 1, label: 'Package', shortLabel: 'Package' },
    { number: 2, label: 'Fulfilment', shortLabel: 'Mode' },
    { number: 3, label: 'Your details', shortLabel: 'Details' },
    { number: 4, label: 'Review', shortLabel: 'Review' },
  ];
}

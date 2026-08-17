import { ChangeDetectionStrategy, Component, ElementRef, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { RouterLink } from '@angular/router';

import { BookingDetailsDraft, ParticipantRelationship } from './booking-flow.models';
import { BookingFlowStateService } from './booking-flow-state.service';
import { BookingProgressComponent } from './booking-progress.component';

const PHONE_PATTERN = /^\+?[0-9][0-9 ()-]{6,29}$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

function notBlank(control: AbstractControl<string>): ValidationErrors | null {
  return control.value.trim().length > 0 ? null : { blank: true };
}

function optionalPattern(
  pattern: RegExp,
): (control: AbstractControl<string>) => ValidationErrors | null {
  return (control) => (!control.value || pattern.test(control.value) ? null : { pattern: true });
}

function validTimeWindow(control: AbstractControl): ValidationErrors | null {
  const from = control.get('preferredTimeFrom')?.value as string | undefined;
  const to = control.get('preferredTimeTo')?.value as string | undefined;
  return from && to && to <= from ? { timeOrder: true } : null;
}

@Component({
  selector: 'app-booking-details-page',
  imports: [ReactiveFormsModule, RouterLink, BookingProgressComponent],
  templateUrl: './booking-details-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookingDetailsPageComponent {
  private readonly formBuilder = inject(FormBuilder).nonNullable;
  private readonly host: ElementRef<HTMLElement> = inject(ElementRef);
  readonly bookingFlow = inject(BookingFlowStateService);

  readonly submitted = signal(false);
  readonly detailsSaved = signal(false);
  readonly relationships: ReadonlyArray<{ value: ParticipantRelationship; label: string }> = [
    { value: 'SELF', label: 'Myself' },
    { value: 'FAMILY', label: 'A family member' },
    { value: 'OTHER', label: 'Someone else' },
  ];

  readonly form = this.formBuilder.group({
    booker: this.formBuilder.group({
      givenName: ['', [Validators.required, notBlank, Validators.maxLength(100)]],
      familyName: ['', [Validators.required, notBlank, Validators.maxLength(100)]],
      email: ['', [Validators.email, Validators.maxLength(254)]],
      phone: [
        '',
        [Validators.required, Validators.pattern(PHONE_PATTERN), Validators.maxLength(30)],
      ],
    }),
    participant: this.formBuilder.group({
      relationship: this.formBuilder.control<ParticipantRelationship>('SELF', Validators.required),
      givenName: ['', [Validators.required, notBlank, Validators.maxLength(100)]],
      familyName: ['', [Validators.required, notBlank, Validators.maxLength(100)]],
      dateOfBirth: ['', optionalPattern(DATE_PATTERN)],
      phone: ['', [optionalPattern(PHONE_PATTERN), Validators.maxLength(30)]],
      email: ['', [Validators.email, Validators.maxLength(254)]],
    }),
    preferences: this.formBuilder.group(
      {
        preferredDate: ['', optionalPattern(DATE_PATTERN)],
        preferredTimeFrom: ['', optionalPattern(TIME_PATTERN)],
        preferredTimeTo: ['', optionalPattern(TIME_PATTERN)],
        locationNote: ['', Validators.maxLength(1000)],
      },
      { validators: validTimeWindow },
    ),
  });

  constructor() {
    const draft = this.bookingFlow.details();
    if (draft) this.form.setValue(draft);
  }

  copyBookerToParticipant(): void {
    const booker = this.form.controls.booker.getRawValue();
    this.form.controls.participant.patchValue({
      givenName: booker.givenName,
      familyName: booker.familyName,
      email: booker.email,
      phone: booker.phone,
    });
    this.form.controls.participant.markAsDirty();
    this.detailsSaved.set(false);
  }

  submitDetails(): void {
    this.submitted.set(true);
    this.detailsSaved.set(false);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      queueMicrotask(() =>
        this.host.nativeElement.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(),
      );
      return;
    }

    const details: BookingDetailsDraft = this.form.getRawValue();
    this.bookingFlow.saveDetails(details);
    this.detailsSaved.set(true);
  }

  showError(control: AbstractControl): boolean {
    return control.invalid && (control.touched || this.submitted());
  }
}

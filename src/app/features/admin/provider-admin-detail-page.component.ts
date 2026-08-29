import { DatePipe, DOCUMENT } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { AdminProviderDetail } from '../../core/models/admin-provider.model';
import {
  AdminUserSearchItem,
  AdminUserSearchResponse,
} from '../../core/models/admin-user-search.model';
import { AdminProvidersApiService } from '../../core/services/admin-providers-api.service';
import { AdminUserSearchApiService } from '../../core/services/admin-user-search-api.service';
import { AdminProviderInvitation } from '../../core/models/provider-invitation.model';
import { ProviderInvitationsApiService } from '../../core/services/provider-invitations-api.service';
import { ProviderEligibilityConfigComponent } from './provider-eligibility-config.component';
import { ProviderServiceAreasComponent } from '../provider/provider-service-areas.component';
import { ICity, ICountry, IState } from 'country-state-city';
import { LocationDataService } from '../../core/services/location-data.service';

type Confirmation = 'activate' | 'suspend' | 'approve' | 'reject' | 'link' | 'unlink' | null;

@Component({
  selector: 'app-provider-admin-detail-page',
  imports: [
    ProviderEligibilityConfigComponent,
    ProviderServiceAreasComponent,
    DatePipe,
    ReactiveFormsModule,
    RouterLink,
  ],
  templateUrl: './provider-admin-detail-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProviderAdminDetailPageComponent {
  private readonly api = inject(AdminProvidersApiService);
    private readonly locationDataService = inject(LocationDataService);
  private readonly usersApi = inject(AdminUserSearchApiService);
  private readonly invitationsApi = inject(ProviderInvitationsApiService);
  private readonly document = inject(DOCUMENT);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly formBuilder = inject(FormBuilder).nonNullable;
  private readonly errorSummary = viewChild<ElementRef<HTMLElement>>('errorSummary');
  readonly id = this.route.snapshot.paramMap.get('id') ?? '';

  readonly provider = signal<AdminProviderDetail | null>(null);
  readonly loading = signal(false);
  readonly mutating = signal(false);
  readonly notFound = signal(false);
  readonly error = signal<string | null>(null);
  readonly statusMessage = signal<string | null>(null);
  readonly confirmation = signal<Confirmation>(null);
  readonly searching = signal(false);
  readonly searchResponse = signal<AdminUserSearchResponse | null>(null);
  readonly selectedUser = signal<AdminUserSearchItem | null>(null);
  readonly invitations = signal<AdminProviderInvitation[]>([]);
  readonly invitationsLoading = signal(false);
  readonly inviting = signal(false);
  readonly oneTimeInvitationLink = signal<string | null>(null);
  readonly invitationDeliveryStatus = signal<'SENT' | 'MANUAL_REQUIRED' | 'FAILED' | null>(null);
  readonly pendingRevokeId = signal<string | null>(null);
  readonly revoking = signal(false);
  readonly profileForm = this.formBuilder.group({
    displayName: ['', [Validators.required, Validators.maxLength(200)]],
    phone: ['', [Validators.minLength(7), Validators.maxLength(32)]],
    professionalReference: ['', Validators.maxLength(200)],
    providerType: this.formBuilder.control<'INDIVIDUAL' | 'CLINIC' | 'DIAGNOSTIC_CENTRE' | 'PHARMACY' | 'OTHER'>(
      'INDIVIDUAL',
    ),
    countryCode: ['', [Validators.required]],
    stateOrRegion: ['', [Validators.required]],
    city: ['', [Validators.required]],
  });
  readonly rejectionForm = this.formBuilder.group({ reviewNote: ['', Validators.maxLength(1000)] });
  readonly userSearchForm = this.formBuilder.group({
    q: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
  });
  readonly invitationForm = this.formBuilder.group({
    email: ['', [Validators.required, Validators.email, Validators.maxLength(254)]],
  });

    countries: ICountry[] = this.locationDataService.getCountries();
  states: IState[] = [];
  cities: ICity[] = [];
readonly editStateCode = new FormControl<string>('', {
  nonNullable: true,
});

  constructor() {
    this.load();
    this.loadInvitations();
  }

  createInvitation(): void {
    if (this.invitationForm.invalid || this.inviting() || this.provider()?.linkedUser) {
      this.invitationForm.markAllAsTouched();
      return;
    }
    this.inviting.set(true);
    this.error.set(null);
    this.oneTimeInvitationLink.set(null);
    this.invitationDeliveryStatus.set(null);
    const email = this.invitationForm.controls.email.value.trim().toLowerCase();
    this.invitationsApi
      .create(this.id, email)
      .pipe(finalize(() => this.inviting.set(false)))
      .subscribe({
        next: (created) => {
          this.invitationDeliveryStatus.set(created.deliveryStatus);
          this.oneTimeInvitationLink.set(created.manualInvitationLink ?? null);
          this.invitationForm.reset();
          const messages = {
            SENT: 'Invitation email sent successfully.',
            MANUAL_REQUIRED:
              'Automatic email delivery is not configured. Share this invitation link manually.',
            FAILED:
              'Invitation was created, but email delivery failed. Share this invitation link manually.',
          } as const;
          this.statusMessage.set(messages[created.deliveryStatus]);
          this.loadInvitations();
        },
        error: (error: HttpErrorResponse) => this.handleInvitationError(error),
      });
  }

  async copyInvitationLink(): Promise<void> {
    const link = this.oneTimeInvitationLink();
    if (!link) return;
    try {
      await this.document.defaultView?.navigator.clipboard.writeText(link);
      this.statusMessage.set('Invitation link copied.');
    } catch {
      this.error.set('The invitation link could not be copied. Select and copy it manually.');
    }
  }

  requestRevoke(id: string): void {
    if (!this.revoking()) this.pendingRevokeId.set(id);
  }
  cancelRevoke(): void {
    this.pendingRevokeId.set(null);
  }
  confirmRevoke(): void {
    const id = this.pendingRevokeId();
    if (!id || this.revoking()) return;
    this.revoking.set(true);
    this.error.set(null);
    this.invitationsApi
      .revoke(id)
      .pipe(finalize(() => this.revoking.set(false)))
      .subscribe({
        next: () => {
          this.pendingRevokeId.set(null);
          this.statusMessage.set('Invitation revoked.');
          this.loadInvitations();
        },
        error: (error: HttpErrorResponse) => {
          this.pendingRevokeId.set(null);
          this.handleInvitationError(error);
          if (error.status === 409) this.loadInvitations();
        },
      });
  }

  private loadInvitations(): void {
    if (!this.id || this.invitationsLoading()) return;
    this.invitationsLoading.set(true);
    this.invitationsApi
      .list(this.id)
      .pipe(finalize(() => this.invitationsLoading.set(false)))
      .subscribe({
        next: (invitations) => this.invitations.set(invitations),
        error: (error: HttpErrorResponse) => this.handleInvitationError(error),
      });
  }

  private handleInvitationError(error: HttpErrorResponse): void {
    if (error.status === 403) {
      void this.router.navigate(['/admin/access-denied']);
      return;
    }
    const messages: Record<number, string> = {
      400: 'Review the invitation email and try again.',
      404: 'The provider or invitation is no longer available.',
      409: 'This invitation conflicts with the provider’s current account or invitation state.',
    };
    this.error.set(
      error.status === 0
        ? 'SmartClinic could not be reached. Check your connection and try again.'
        : (messages[error.status] ?? 'The invitation operation could not be completed.'),
    );
    queueMicrotask(() => this.errorSummary()?.nativeElement.focus());
  }

  load(): void {
    if (!this.id || this.loading()) return;
    this.loading.set(true);
    this.error.set(null);
    this.notFound.set(false);
    this.api
      .get(this.id)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (provider) => {
          this.provider.set(provider);
          this.profileForm.setValue({
            displayName: provider.displayName,
            phone: provider.phone ?? '',
            professionalReference: provider.professionalReference ?? '',
            providerType: provider.providerType,
            countryCode: provider.countryCode ?? '',
            stateOrRegion: provider.stateOrRegion ?? '',
            city: provider.city ?? '',
          });
          this.initializeProfileGeography(provider);
        },
        error: (error: HttpErrorResponse) =>
          this.handleError(error, 'Provider details could not be loaded.'),
      });
  }

  updateProfile(): void {
    if (this.profileForm.invalid || this.mutating()) {
      this.profileForm.markAllAsTouched();
      return;
    }
    const value = this.profileForm.getRawValue();
    this.run(
      this.api.update(this.id, {
        displayName: value.displayName.trim(),
        phone: value.phone.trim() || null,
        professionalReference: value.professionalReference.trim(),
        providerType: value.providerType,
        countryCode: value.countryCode.trim().toUpperCase(),
        stateOrRegion: value.stateOrRegion.trim(),
        city: value.city.trim(),
      }),
      'Provider profile updated.',
    );
  }

  requestConfirmation(action: Exclude<Confirmation, null>): void {
    console.log(this.mutating(), 'this.mutating()', action);
    if (!this.mutating()) this.confirmation.set(action);
  }
  cancelConfirmation(): void {
    this.confirmation.set(null);
  }
  confirmAction(): void {
    const action = this.confirmation();
    if (!action || this.mutating()) return;
    if (action === 'link') {
      this.linkSelectedUser();
      return;
    }
    const operation =
      action === 'activate'
        ? this.api.activate(this.id)
        : action === 'suspend'
          ? this.api.suspend(this.id)
          : action === 'approve'
            ? this.api.approve(this.id)
            : action === 'reject'
              ? this.api.reject(this.id, {
                  ...(this.rejectionForm.controls.reviewNote.value.trim() && {
                    reviewNote: this.rejectionForm.controls.reviewNote.value.trim(),
                  }),
                })
              : this.api.unlinkUser(this.id);
    const message =
      action === 'activate'
        ? 'Provider activated.'
        : action === 'suspend'
          ? 'Provider suspended.'
          : action === 'approve'
            ? 'Provider onboarding approved and provider activated.'
            : action === 'reject'
              ? 'Provider onboarding rejected.'
              : 'Provider account unlinked safely.';
    this.run(operation, message);
  }

  searchUsers(page = 1): void {
    const query = this.userSearchForm.controls.q.value.trim();
    this.userSearchForm.controls.q.setValue(query);
    if (query.length < 2 || query.length > 100 || this.searching()) {
      this.userSearchForm.controls.q.markAsTouched();
      return;
    }
    this.searching.set(true);
    this.error.set(null);
    this.selectedUser.set(null);
    this.usersApi
      .search(query, page, 20)
      .pipe(finalize(() => this.searching.set(false)))
      .subscribe({
        next: (response) => this.searchResponse.set(response),
        error: (error: HttpErrorResponse) =>
          this.handleError(error, 'User search could not be completed.'),
      });
  }

  selectUser(user: AdminUserSearchItem): void {
    if (this.isEligible(user) && !this.mutating()) this.selectedUser.set(user);
  }

  isEligible(user: AdminUserSearchItem): boolean {
    return user.status === 'ACTIVE' && user.providerLink === null;
  }

  requestLinkConfirmation(): void {
    if (this.selectedUser() && !this.mutating()) this.confirmation.set('link');
  }

  private linkSelectedUser(): void {
    const user = this.selectedUser();
    if (!user) return;
    this.mutating.set(true);
    this.error.set(null);
    this.statusMessage.set(null);
    this.api
      .linkUser(this.id, user.id)
      .pipe(finalize(() => this.mutating.set(false)))
      .subscribe({
        next: (provider) => {
          this.provider.set(provider);
          this.confirmation.set(null);
          this.selectedUser.set(null);
          this.searchResponse.set(null);
          this.userSearchForm.reset();
          this.statusMessage.set('User account linked to this provider.');
          this.load();
        },
        error: (error: HttpErrorResponse) => {
          this.confirmation.set(null);
          this.selectedUser.set(null);
          this.handleError(error, 'The user account could not be linked.');
          if (error.status === 409) {
            this.api.get(this.id).subscribe({ next: (provider) => this.provider.set(provider) });
            const query = this.userSearchForm.controls.q.value;
            if (query) {
              this.usersApi
                .search(query, this.searchResponse()?.page ?? 1, 20)
                .subscribe({ next: (response) => this.searchResponse.set(response) });
            }
          }
        },
      });
  }

  private run(operation: ReturnType<AdminProvidersApiService['update']>, message: string): void {
    this.mutating.set(true);
    this.error.set(null);
    this.statusMessage.set(null);
    operation.pipe(finalize(() => this.mutating.set(false))).subscribe({
      next: (provider) => {
        this.provider.set(provider);
        this.confirmation.set(null);
        this.statusMessage.set(message);
    this.profileForm.setValue({
  displayName: provider.displayName,
  phone: provider.phone ?? '',
  professionalReference: provider.professionalReference ?? '',
  providerType: provider.providerType,
  countryCode: provider.countryCode ?? '',
  stateOrRegion: provider.stateOrRegion ?? '',
  city: provider.city ?? '',
});

this.initializeProfileGeography(provider);

      },
      error: (error: HttpErrorResponse) =>
        this.handleError(error, 'Provider operation could not be completed.'),
    });
  }

  private handleError(error: HttpErrorResponse, fallback: string): void {
    if (error.status === 403) {
      void this.router.navigate(['/admin/access-denied']);
      return;
    }
    if (error.status === 404) {
      this.notFound.set(true);
      this.provider.set(null);
    }
    const messages: Record<number, string> = {
      400: 'Review the provider information and try again.',
      404: 'This provider or linked user is unavailable.',
      409: 'This operation conflicts with the provider’s current status, linked account, or active work.',
    };
    this.error.set(
      error.status === 0
        ? 'SmartClinic could not be reached. Check your connection and try again.'
        : (messages[error.status] ?? fallback),
    );
    queueMicrotask(() => this.errorSummary()?.nativeElement.focus());
  }

   onCountryChange(countryCode: string): void {
    this.states = this.locationDataService.getStates(countryCode);
    this.cities = [];
    this.editStateCode.setValue('', { emitEvent: false });

    this.profileForm.patchValue({
      stateOrRegion: '',
      city: '',
    });
  }

  onStateChange(stateCode: string): void {
    const countryCode = this.profileForm.controls.countryCode.value ?? '';

    const state = this.states.find(
      (item) => item.isoCode === stateCode,
    );

    this.editStateCode.setValue(stateCode, { emitEvent: false });
    this.cities = this.locationDataService.getCities(countryCode, stateCode);

    this.profileForm.patchValue({
      stateOrRegion: state?.name ?? '',
      city: '',
    });
  }

  onCityChange(cityName: string): void {
    this.profileForm.controls.city.setValue(cityName);
  }

  private initializeProfileGeography(provider: AdminProviderDetail): void {
    this.states = provider.countryCode
      ? this.locationDataService.getStates(provider.countryCode)
      : [];
    this.cities = [];
    this.editStateCode.setValue('', { emitEvent: false });
    const stateName = provider.stateOrRegion?.trim().toLowerCase();
    const selectedState = stateName
      ? this.states.find(state => state.name.trim().toLowerCase() === stateName)
      : undefined;
    if (provider.countryCode && selectedState) {
      this.editStateCode.setValue(selectedState.isoCode, { emitEvent: false });
      this.cities = this.locationDataService.getCities(provider.countryCode, selectedState.isoCode);
    }
    this.profileForm.patchValue(
      { countryCode: provider.countryCode ?? '', stateOrRegion: provider.stateOrRegion ?? '', city: provider.city ?? '' },
      { emitEvent: false },
    );
  }
}

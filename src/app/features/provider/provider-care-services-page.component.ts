import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize, forkJoin } from 'rxjs';
import {
  CareDeliveryMode,
  ProviderCareServiceDefinition,
  ProviderCareServiceOffering,
  UpdateProviderCareServiceOffering,
} from '../../core/models/find-care.model';
import { ProviderCareServicesApiService } from '../../core/services/provider-care-services-api.service';
import { careDeliveryModeLabel } from '../care/care-delivery-mode';
import { formatMinor, majorToMinor, minorToMajor } from './care-money';
import { ProviderClinicalDocumentationComponent } from './provider-clinical-documentation.component';

@Component({
  selector: 'app-provider-care-services-page',
  imports: [ReactiveFormsModule, ProviderClinicalDocumentationComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<main class="mx-auto max-w-6xl px-5 py-10 sm:px-8">
    <header>
      <p class="text-sm font-bold uppercase text-brand-600">Find Care configuration</p>
      <h1 class="mt-2 text-3xl font-bold">Care Services</h1>
      <p class="mt-2 max-w-3xl text-slate-600">
        Configure the General Care services patients can find you for. These offerings are separate
        from Health Check services.
      </p>
    </header>
    @if (feedback()) {
      <p aria-live="polite" class="mt-5 rounded-xl bg-green-50 p-4 text-green-900">
        {{ feedback() }}
      </p>
    }
    @if (pageError()) {
      <div role="alert" class="mt-5 rounded-xl bg-red-50 p-4 text-red-800">
        {{ pageError() }}
        <button type="button" (click)="load()" class="font-bold underline">Try again</button>
      </div>
    }
    @if (loading()) {
      <p role="status" class="mt-8 rounded-2xl border bg-white p-6">Loading Care Services…</p>
    } @else {
      <section class="mt-8 rounded-2xl border bg-white p-6">
        <div class="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 class="text-xl font-bold">Configured offerings</h2>
            <p class="mt-1 text-sm text-slate-600">
              Active offerings can appear in Find Care when all backend eligibility requirements are
              met.
            </p>
          </div>
          <button
            type="button"
            (click)="openCreate()"
            [disabled]="!availableDefinitions().length"
            class="rounded-xl bg-brand-700 px-5 py-3 font-bold text-white disabled:opacity-50"
          >
            Add Care Service
          </button>
        </div>
       @if (!offerings().length) {
  <p class="mt-6 rounded-xl bg-slate-50 p-5">
    No General Care offerings configured yet.
  </p>
} @else {
  <div class="mt-6 overflow-hidden rounded-xl border border-slate-200">
    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-slate-200">
        <thead class="bg-slate-50">
          <tr>
            <th
              scope="col"
              class="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500"
            >
              Service
            </th>

            <th
              scope="col"
              class="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500"
            >
              Delivery & Pricing
            </th>

            <th
              scope="col"
              class="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500"
            >
              Appointments
            </th>
            <th scope="col" class="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">Clinical Record</th>

            <th
              scope="col"
              class="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500"
            >
              FastTrack
            </th>

            <th
              scope="col"
              class="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500"
            >
              Status
            </th>

            <th
              scope="col"
              class="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-slate-500"
            >
              Actions
            </th>
          </tr>
        </thead>

        <tbody class="divide-y divide-slate-100 bg-white">
          @for (item of offerings(); track item.id) {
            <tr class="align-top transition hover:bg-slate-50">
              <!-- Service -->
              <td class="px-4 py-4">
                <div class="min-w-48">
                  <p class="font-bold text-slate-900">
                    {{ item.definition.name }}
                  </p>

                  @if (item.descriptionOverride) {
                    <p class="mt-1 max-w-sm text-sm text-slate-500">
                      {{ item.descriptionOverride }}
                    </p>
                  }
                </div>
              </td>

              <!-- Delivery / Pricing -->
              <td class="px-4 py-4">
                <div class="grid min-w-52 gap-2 text-sm">
                  @for (mode of modes; track mode) {
                    @if (deliveryOption(item, mode); as option) {
                      <div>
                        <span class="font-semibold text-slate-800">
                          {{ modeLabel(mode) }}
                        </span>

                        <span class="ml-1 text-slate-600">
                          · {{ formatPrice(option.priceMinor, option.currency) }}
                        </span>
                      </div>
                    } @else {
                      <div class="text-slate-400">
                        {{ modeLabel(mode) }} · Not offered
                      </div>
                    }
                  }
                </div>
              </td>

              <!-- Appointment -->
              <td class="whitespace-nowrap px-4 py-4 text-sm">
                @if (item.supportsAppointmentRequests) {
                  <span
                    class="inline-flex rounded-full bg-green-100 px-2.5 py-1 text-xs font-bold text-green-800"
                  >
                    Enabled
                  </span>
                } @else {
                  <span
                    class="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600"
                  >
                    Disabled
                  </span>
                }
              </td>

              <td class="px-4 py-4 text-sm">
                @if (item.clinicalDocumentation; as documentation) {
                  <p class="font-semibold">{{ clinicalTypeLabel(documentation.clinicalRecordType) }}</p>
                  <p class="mt-1 text-slate-500">{{ documentation.templateMode === 'STANDARD' ? 'Standard' : documentation.templateMode === 'CUSTOM' ? 'Custom' : 'Default' }}@if (documentation.templateVersion) { · v{{ documentation.templateVersion }} }</p>
                } @else { <span class="text-slate-500">Not required</span> }
              </td>

              <!-- FastTrack -->
              <td class="whitespace-nowrap px-4 py-4 text-sm">
                @if (item.supportsFastTrack) {
                  <div>
                    <span
                      class="inline-flex rounded-full bg-green-100 px-2.5 py-1 text-xs font-bold text-green-800"
                    >
                      Enabled
                    </span>

                    <p class="mt-1 text-xs text-slate-500">
                      {{
                        formatPrice(
                          item.fastTrackFeeMinor,
                          item.fastTrackCurrency
                        )
                      }}
                    </p>
                  </div>
                } @else {
                  <span class="text-slate-500">
                    Not offered
                  </span>
                }
              </td>

              <!-- Status -->
              <td class="whitespace-nowrap px-4 py-4">
                <span
                  class="inline-flex rounded-full px-3 py-1 text-xs font-bold"
                  [class.bg-green-100]="item.isActive"
                  [class.text-green-800]="item.isActive"
                  [class.bg-slate-100]="!item.isActive"
                  [class.text-slate-600]="!item.isActive"
                >
                  {{ item.isActive ? 'Active' : 'Inactive' }}
                </span>
              </td>

              <!-- Actions -->
              <td class="whitespace-nowrap px-4 py-4 text-right">
                <div class="flex justify-end gap-3">
                  <button
                    type="button"
                    (click)="openEdit(item)"
                    class="font-bold text-brand-700 hover:underline"
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    (click)="confirmActive(item)"
                    class="font-bold"
                    [class.text-red-700]="item.isActive"
                    [class.text-brand-700]="!item.isActive"
                  >
                    {{ item.isActive ? 'Deactivate' : 'Activate' }}
                  </button>
                </div>
              </td>
            </tr>
          }
        </tbody>
      </table>
    </div>
  </div>
}
      </section>
      <section class="mt-6 rounded-2xl border bg-white p-6">
        <h2 class="text-xl font-bold">Available to add</h2>
        @if (!availableDefinitions().length) {
          <p class="mt-3 text-slate-600">
            Every currently available Care Service is already configured.
          </p>
        } @else {
          <ul class="mt-4 grid gap-3 sm:grid-cols-2">
            @for (definition of availableDefinitions(); track definition.id) {
              <li class="rounded-xl bg-slate-50 p-4">
                <strong>{{ definition.name }}</strong>
                @if (definition.description) {
                  <p class="mt-1 text-sm text-slate-600">{{ definition.description }}</p>
                }
              </li>
            }
          </ul>
        }
      </section>
    }
    @if (editorOpen()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <section
          role="dialog"
          aria-modal="true"
          aria-labelledby="care-service-editor-title"
          class="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
        >
          <h2 id="care-service-editor-title" class="text-2xl font-bold">
            {{ editing() ? 'Edit' : 'Add' }} Care Service
          </h2>
          <form [formGroup]="form" (ngSubmit)="save()" class="mt-6 grid gap-6">
            <section>
              <h3 class="font-bold">Service</h3>
              @if (!editing()) {
                <label for="care-definition" class="mt-3 block font-semibold">Care Service</label
                ><select
                  id="care-definition"
                  formControlName="careServiceDefinitionId"
                  class="mt-2 min-h-12 w-full rounded-xl border px-3"
                >
                  <option value="">Select a Care Service</option>
                  @for (definition of availableDefinitions(); track definition.id) {
                    <option [value]="definition.id">{{ definition.name }}</option>
                  }
                </select>
              } @else {
                <p class="mt-2">{{ editing()?.definition?.name }}</p>
              }
              <label for="care-description" class="mt-4 block font-semibold"
                >Provider description (optional)</label
              ><textarea
                id="care-description"
                formControlName="description"
                maxlength="4000"
                rows="3"
                placeholder="Describe how your organisation provides this service"
                class="mt-2 w-full rounded-xl border p-3"
              ></textarea>
            </section>
            <fieldset>
              <legend class="font-bold">Delivery</legend>
              <p class="mt-1 text-sm text-slate-600">
                Select at least one supported delivery mode.
              </p>
              <div class="mt-3 grid gap-3">
                @for (mode of modes; track mode) {
                  <div class="rounded-xl border p-4">
                    <label class="flex gap-3"
                      ><input
                        type="checkbox"
                        [checked]="selectedModes().includes(mode)"
                        (change)="toggleMode(mode)"
                      /><span
                        ><strong>{{ modeLabel(mode) }}</strong
                        ><span class="block text-sm text-slate-600">{{
                          modeHelp(mode)
                        }}</span></span
                      ></label
                    >
                    @if (selectedModes().includes(mode)) {
                      <div class="mt-4 grid gap-3 sm:grid-cols-[8rem_1fr]">
                        <label class="font-semibold"
                          >Currency<input
                            [formControl]="currencyControl(mode)"
                            maxlength="3"
                            placeholder="e.g. NGN"
                            class="mt-2 min-h-12 w-full rounded-xl border px-3 uppercase" /></label
                        ><label class="font-semibold"
                          >Price<input
                            [formControl]="priceControl(mode)"
                            inputmode="decimal"
                            placeholder="e.g. 15000.00"
                            class="mt-2 min-h-12 w-full rounded-xl border px-3"
                          /><span class="mt-1 block text-xs font-normal text-slate-500"
                            >Enter 0 to offer this mode free. Blank is invalid.</span
                          ></label
                        >
                      </div>
                    }
                  </div>
                }
              </div>
              @if (modeError()) {
                <p role="alert" class="mt-2 text-sm text-red-700">
                  Select at least one delivery mode.
                </p>
              }
              @if (selectedModes().includes('VIRTUAL')) {
                <p class="mt-3 rounded-xl bg-brand-50 p-3 text-sm">
                  Virtual appointments can use an external meeting link after scheduling. Meeting
                  links are not configured here.
                </p>
              }
            </fieldset>
            <section>
              <h3 class="font-bold">Appointments</h3>
              <label class="mt-3 flex gap-3"
                ><input type="checkbox" formControlName="supportsAppointmentRequests" /><span
                  >Allow patients to request appointments for this service</span
                ></label
              >
            </section>
            <fieldset>
              <legend class="font-bold">FastTrack</legend>
              <label class="mt-3 flex gap-3"
                ><input type="checkbox" formControlName="supportsFastTrack" /><span
                  ><strong>Offer FastTrack for this service</strong
                  ><span class="block text-sm text-slate-600"
                    >Paid priority appointment handling. Clinical urgency always takes
                    priority.</span
                  ></span
                ></label
              >
              @if (form.controls.supportsFastTrack.value) {
                <div class="mt-3 grid gap-3 sm:grid-cols-[8rem_1fr]">
                  <label class="font-semibold"
                    >Currency<input
                      formControlName="fastTrackCurrency"
                      maxlength="3"
                      placeholder="e.g. NGN"
                      class="mt-2 min-h-12 w-full rounded-xl border px-3 uppercase" /></label
                  ><label class="font-semibold"
                    >FastTrack fee<input
                      formControlName="fastTrackFee"
                      inputmode="decimal"
                      placeholder="e.g. 3000.00"
                      class="mt-2 min-h-12 w-full rounded-xl border px-3"
                  /></label>
                </div>
              }
            </fieldset>
            @if (editing(); as offering) {
              <app-provider-clinical-documentation [offeringId]="offering.id" />
            } @else {
              <section class="rounded-xl border p-4">
                <h3 class="font-bold">Clinical Documentation</h3>
                <p class="mt-1 text-sm text-slate-600">Documentation settings become available after the offering is created. The platform service controls the Clinical Record type.</p>
              </section>
            }
            @if (!editing()) {
              <section class="rounded-xl bg-amber-50 p-4">
                <h3 class="font-bold">Visibility</h3>
                <p class="mt-1 text-sm text-slate-700">
                  The backend creates new offerings as active. Active offerings can appear in Find
                  Care only when the service and your provider account satisfy all eligibility
                  rules. You can deactivate the offering after creation.
                </p>
              </section>
            }
            @if (editorError()) {
              <p role="alert" class="rounded-xl bg-red-50 p-3 text-red-800">{{ editorError() }}</p>
            }
            <div class="sticky bottom-0 flex justify-end gap-3 border-t bg-white pt-4">
              <button
                type="button"
                (click)="editorOpen.set(false)"
                [disabled]="saving()"
                class="rounded-xl border px-4 py-3 font-bold"
              >
                Cancel</button
              ><button
                type="submit"
                [disabled]="saving()"
                class="rounded-xl bg-brand-700 px-5 py-3 font-bold text-white disabled:opacity-50"
              >
                {{ saving() ? 'Saving…' : 'Save offering' }}
              </button>
            </div>
          </form>
        </section>
      </div>
    }
    @if (activeTarget(); as target) {
      <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <section
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="offering-active-title"
          class="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"
        >
          <h2 id="offering-active-title" class="text-xl font-bold">
            {{ target.isActive ? 'Deactivate' : 'Activate' }} this offering?
          </h2>
          <p class="mt-2 text-slate-600">
            {{
              target.isActive
                ? 'It will no longer be offered publicly.'
                : 'It can become discoverable when all backend eligibility requirements are satisfied.'
            }}
          </p>
          <div class="mt-6 flex justify-end gap-3">
            <button
              type="button"
              (click)="activeTarget.set(null)"
              [disabled]="saving()"
              class="rounded-xl border px-4 py-3 font-bold"
            >
              Cancel</button
            ><button
              type="button"
              (click)="setActive(target)"
              [disabled]="saving()"
              class="rounded-xl px-4 py-3 font-bold text-white disabled:opacity-50"
              [class.bg-red-700]="target.isActive"
              [class.bg-brand-700]="!target.isActive"
            >
              Confirm
            </button>
          </div>
        </section>
      </div>
    }
  </main>`,
})
export class ProviderCareServicesPageComponent {
  private readonly api = inject(ProviderCareServicesApiService);
  private readonly fb = inject(FormBuilder);
  readonly catalogue = signal<readonly ProviderCareServiceDefinition[]>([]);
  readonly offerings = signal<readonly ProviderCareServiceOffering[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly pageError = signal<string | null>(null);
  readonly editorError = signal<string | null>(null);
  readonly feedback = signal<string | null>(null);
  readonly editorOpen = signal(false);
  readonly editing = signal<ProviderCareServiceOffering | null>(null);
  readonly activeTarget = signal<ProviderCareServiceOffering | null>(null);
  readonly selectedModes = signal<readonly CareDeliveryMode[]>([]);
  readonly modeError = signal(false);
  readonly modes: readonly CareDeliveryMode[] = ['IN_PERSON', 'VIRTUAL', 'HOME_VISIT'];
  readonly form = this.fb.nonNullable.group({
    careServiceDefinitionId: ['', Validators.required],
    description: ['', [Validators.maxLength(4000)]],
    supportsAppointmentRequests: [false],
    inPersonCurrency: ['', [Validators.maxLength(3)]],
    inPersonPrice: [''],
    virtualCurrency: ['', [Validators.maxLength(3)]],
    virtualPrice: [''],
    homeVisitCurrency: ['', [Validators.maxLength(3)]],
    homeVisitPrice: [''],
    supportsFastTrack: [false],
    fastTrackCurrency: ['', [Validators.maxLength(3)]],
    fastTrackFee: [''],
  });
  readonly availableDefinitions = computed(() => {
    const configured = new Set(this.offerings().map((x) => x.careServiceDefinitionId));
    return this.catalogue().filter((x) => x.isActive && !configured.has(x.id));
  });
  constructor() {
    this.load();
  }
  load() {
    this.loading.set(true);
    this.pageError.set(null);
    forkJoin({ catalogue: this.api.getCatalogue(), offerings: this.api.getOfferings() })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (value) => {
          this.catalogue.set(value.catalogue);
          this.offerings.set(value.offerings);
        },
        error: (e) =>
          this.pageError.set(
            e?.status === 409
              ? 'General Care configuration is available after provider onboarding is approved.'
              : 'We could not load General Care offerings.',
          ),
      });
  }
  openCreate() {
    this.editing.set(null);
    this.selectedModes.set([]);
    this.modeError.set(false);
    this.editorError.set(null);
    this.form.reset({
      careServiceDefinitionId: '',
      description: '',
      supportsAppointmentRequests: false,
      inPersonCurrency: '',
      inPersonPrice: '',
      virtualCurrency: '',
      virtualPrice: '',
      homeVisitCurrency: '',
      homeVisitPrice: '',
      supportsFastTrack: false,
      fastTrackCurrency: '',
      fastTrackFee: '',
    });
    this.editorOpen.set(true);
  }
  openEdit(item: ProviderCareServiceOffering) {
    this.editing.set(item);
    this.selectedModes.set(item.deliveryOptions.map((option) => option.deliveryMode));
    this.modeError.set(false);
    this.editorError.set(null);
    this.form.reset({
      careServiceDefinitionId: item.careServiceDefinitionId,
      description: item.descriptionOverride ?? '',
      supportsAppointmentRequests: item.supportsAppointmentRequests,
      inPersonCurrency: this.optionCurrency(item, 'IN_PERSON'),
      inPersonPrice: this.optionPrice(item, 'IN_PERSON'),
      virtualCurrency: this.optionCurrency(item, 'VIRTUAL'),
      virtualPrice: this.optionPrice(item, 'VIRTUAL'),
      homeVisitCurrency: this.optionCurrency(item, 'HOME_VISIT'),
      homeVisitPrice: this.optionPrice(item, 'HOME_VISIT'),
      supportsFastTrack: item.supportsFastTrack,
      fastTrackCurrency: item.fastTrackCurrency ?? '',
      fastTrackFee: minorToMajor(item.fastTrackFeeMinor, item.fastTrackCurrency),
    });
    this.editorOpen.set(true);
  }
  toggleMode(mode: CareDeliveryMode) {
    this.selectedModes.update((current) =>
      current.includes(mode) ? current.filter((x) => x !== mode) : [...current, mode],
    );
    this.modeError.set(false);
  }
  save() {
    if (this.saving()) return;
    if (this.form.invalid || !this.selectedModes().length) {
      this.form.markAllAsTouched();
      this.modeError.set(!this.selectedModes().length);
      return;
    }
    const v = this.form.getRawValue();
    const deliveryOptions = [] as {
      deliveryMode: CareDeliveryMode;
      priceMinor: number;
      currency: string;
    }[];
    for (const mode of this.selectedModes()) {
      const currency = this.currencyControl(mode).value.trim().toUpperCase();
      const raw = this.priceControl(mode).value;
      const priceMinor = majorToMinor(raw, currency);
      if (
        !/^[A-Za-z]{3}$/.test(currency) ||
        raw.trim() === '' ||
        priceMinor === null ||
        priceMinor < 0
      ) {
        this.editorError.set(
          `${careDeliveryModeLabel(mode)} requires a valid currency and non-negative price.`,
        );
        return;
      }
      deliveryOptions.push({ deliveryMode: mode, priceMinor, currency });
    }
    const fastTrackFeeMinor = v.supportsFastTrack
      ? majorToMinor(v.fastTrackFee, v.fastTrackCurrency.toUpperCase())
      : null;
    if (
      v.supportsFastTrack &&
      (!/^[A-Za-z]{3}$/.test(v.fastTrackCurrency) ||
        fastTrackFeeMinor === null ||
        fastTrackFeeMinor <= 0)
    ) {
      this.editorError.set('FastTrack requires a valid currency and positive fee.');
      return;
    }
    const body: UpdateProviderCareServiceOffering = {
      description: v.description.trim() || null,
      deliveryOptions,
      supportsAppointmentRequests: v.supportsAppointmentRequests,
      supportsFastTrack: v.supportsFastTrack,
      fastTrackFeeMinor: v.supportsFastTrack ? fastTrackFeeMinor : null,
      fastTrackCurrency: v.supportsFastTrack ? v.fastTrackCurrency.toUpperCase() : null,
    };
    this.saving.set(true);
    this.editorError.set(null);
    const command = this.editing()
      ? this.api.update(this.editing()!.id, body)
      : this.api.create({ careServiceDefinitionId: v.careServiceDefinitionId, ...body });
    command.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: () => {
        this.editorOpen.set(false);
        this.feedback.set(
          this.editing() ? 'Care Service updated.' : 'Care Service offering added.',
        );
        this.load();
      },
      error: (e) =>
        this.editorError.set(
          e?.status === 409
            ? 'This offering or provider eligibility changed. Review the current configuration and try again.'
            : 'We could not save this Care Service offering.',
        ),
    });
  }
  confirmActive(item: ProviderCareServiceOffering) {
    this.activeTarget.set(item);
  }
  setActive(item: ProviderCareServiceOffering) {
    if (this.saving()) return;
    this.saving.set(true);
    this.api
      .setActive(item.id, !item.isActive)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: () => {
          this.activeTarget.set(null);
          this.feedback.set(
            item.isActive ? 'Care Service deactivated.' : 'Care Service activated.',
          );
          this.load();
        },
        error: (e) => {
          this.activeTarget.set(null);
          this.pageError.set(
            e?.status === 409
              ? 'This offering cannot be changed because its service or provider eligibility changed.'
              : 'We could not update offering visibility.',
          );
          this.load();
        },
      });
  }
  modeLabel = careDeliveryModeLabel;
  clinicalTypeLabel(value: string) {
    return value.split('_').map((part) => part[0] + part.slice(1).toLowerCase()).join(' ');
  }
  modeHelp(mode: CareDeliveryMode) {
    return mode === 'IN_PERSON'
      ? 'Patient visits a provider location.'
      : mode === 'VIRTUAL'
        ? 'Consultation is delivered remotely.'
        : 'Provider delivers care at the patient’s location.';
  }
  modeList(modes: readonly CareDeliveryMode[]) {
    return modes.map(careDeliveryModeLabel).join(' · ');
  }
  formatPrice = formatMinor;
  currencyControl(mode: CareDeliveryMode) {
    return mode === 'IN_PERSON'
      ? this.form.controls.inPersonCurrency
      : mode === 'VIRTUAL'
        ? this.form.controls.virtualCurrency
        : this.form.controls.homeVisitCurrency;
  }
  priceControl(mode: CareDeliveryMode) {
    return mode === 'IN_PERSON'
      ? this.form.controls.inPersonPrice
      : mode === 'VIRTUAL'
        ? this.form.controls.virtualPrice
        : this.form.controls.homeVisitPrice;
  }
  deliveryOption(item: ProviderCareServiceOffering, mode: CareDeliveryMode) {
    return item.deliveryOptions.find((option) => option.deliveryMode === mode) ?? null;
  }
  private optionCurrency(item: ProviderCareServiceOffering, mode: CareDeliveryMode) {
    return this.deliveryOption(item, mode)?.currency ?? '';
  }
  private optionPrice(item: ProviderCareServiceOffering, mode: CareDeliveryMode) {
    const option = this.deliveryOption(item, mode);
    return option ? minorToMajor(option.priceMinor, option.currency) : '';
  }
}

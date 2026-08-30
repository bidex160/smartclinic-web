import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize, Observable } from 'rxjs';
import { CareAppointment } from '../../core/models/find-care.model';
import { ClinicalRecord, ClinicalRecordAttachment, ClinicalRecordType, UpdateClinicalRecordRequest } from '../../core/models/clinical-record.model';
import { ProviderCareOperationsApiService } from '../../core/services/provider-care-operations-api.service';
import { ProviderCareServicesApiService } from '../../core/services/provider-care-services-api.service';
import { ClinicalRecordsApiService } from '../../core/services/clinical-records-api.service';
import { UtilsService } from '../../core/services/utils.service';
import { careDeliveryModeLabel } from '../care/care-delivery-mode';
import { ProviderPrescriptionSectionComponent } from './provider-prescription-section.component';
type Decision = 'complete' | 'no-show' | 'cancel' | null;
@Component({
  selector: 'app-provider-care-appointment-detail-page',
  imports: [RouterLink, ReactiveFormsModule, ProviderPrescriptionSectionComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<main class="mx-auto max-w-4xl px-5 py-10 sm:px-8">
    <a routerLink="/provider/care-appointments" class="font-bold text-brand-700 underline"
      >← Care Appointments</a
    >
    @if (loading()) {
      <p role="status" class="mt-6 rounded-2xl border bg-white p-6">Loading appointment…</p>
    } @else if (error() && !appointment()) {
      <p role="alert" class="mt-6 rounded-2xl bg-red-50 p-6">
        {{ error() }}
        <button type="button" (click)="load()" class="font-bold underline">Try again</button>
      </p>
    } @else if (appointment(); as a) {
      <header class="mt-6">
        <p class="break-all text-sm font-bold uppercase text-brand-600">
          {{ a.appointmentReference }}
        </p>
        <h1 class="mt-2 text-3xl font-bold">{{ a.service.name }}</h1>
        <p class="mt-2">{{ label(a.status) }}</p>
      </header>
      @if (feedback()) {
        <p aria-live="polite" class="mt-5 rounded-xl bg-green-50 p-4 text-green-900">
          {{ feedback() }}
        </p>
      }
      @if (error()) {
        <p role="alert" class="mt-5 rounded-xl bg-red-50 p-4 text-red-800">{{ error() }}</p>
      }
      <section class="mt-6 rounded-2xl border bg-white p-6">
        <dl class="grid gap-5 sm:grid-cols-2">
          <div>
            <dt class="text-sm text-slate-500">Delivery</dt>
            <dd>{{ deliveryModeLabel(a.deliveryMode) }}</dd>
          </div>
          <div>
            <dt class="text-sm text-slate-500">Appointment</dt>
            <dd>
              {{ utils.formatAppointment(a.scheduledDate, a.scheduledTimeFrom, a.scheduledTimeTo) }}
            </dd>
          </div>
          <div>
            <dt class="text-sm text-slate-500">Timezone</dt>
            <dd>{{ a.timezone }}</dd>
          </div>
          <div>
            <dt class="text-sm text-slate-500">Care Request</dt>
            <dd class="break-all">{{ a.careRequestReference }}</dd>
          </div>
          <div>
            <dt class="text-sm text-slate-500">Location</dt>
            <dd>
              {{
                a.deliveryMode === 'VIRTUAL'
                  ? 'Online'
                  : a.deliveryMode === 'HOME_VISIT'
                    ? 'Home visit'
                    : a.providerLocation?.name || 'No specific provider location'
              }}
            </dd>
          </div>
          @if (a.providerLocation; as l) {
            <div class="sm:col-span-2">
              <dt class="text-sm text-slate-500">Address</dt>
              <dd>
                {{ l.addressLine1 }}{{ l.addressLine2 ? ', ' + l.addressLine2 : '' }}, {{ l.city }},
                {{ l.stateOrRegion }} {{ l.postalCode || '' }}, {{ l.countryCode }}
              </dd>
            </div>
          }
          @if (a.notes) {
            <div class="sm:col-span-2">
              <dt class="text-sm text-slate-500">Appointment notes</dt>
              <dd>{{ a.notes }}</dd>
            </div>
          }
        </dl>
      </section>
      @if (a.deliveryMode === 'VIRTUAL') {
        <section class="mt-6 rounded-2xl border border-brand-200 bg-brand-50 p-6">
          <h2 class="text-xl font-bold">Virtual consultation</h2>
          @if (safeMeetingUrl(a.meetingUrl); as url) {
            <p class="mt-2 text-slate-600">An external meeting link is configured.</p>
            <div class="mt-4 flex flex-wrap gap-3">
              <a
                [href]="url"
                target="_blank"
                rel="noopener noreferrer"
                class="rounded-xl bg-brand-700 px-5 py-3 font-bold text-white"
                >Open meeting</a
              ><button
                type="button"
                (click)="openMeetingLink()"
                class="rounded-xl border px-5 py-3 font-bold"
              >
                Replace link</button
              ><button
                type="button"
                (click)="removeMeetingLink()"
                [disabled]="pending()"
                class="rounded-xl border border-red-300 px-5 py-3 font-bold text-red-700"
              >
                Remove link
              </button>
            </div>
          } @else {
            <p class="mt-2 text-slate-600">No meeting link added yet.</p>
            <button
              type="button"
              (click)="openMeetingLink()"
              class="mt-4 rounded-xl bg-brand-700 px-5 py-3 font-bold text-white"
            >
              Add meeting link
            </button>
          }
        </section>
      }
      @if (clinicalRecordType(); as requiredType) {
        <section class="mt-6 rounded-2xl border bg-white p-6" aria-labelledby="clinical-record-heading">
          <div class="flex flex-wrap items-start justify-between gap-3"><div><h2 id="clinical-record-heading" class="text-xl font-bold">Clinical record</h2><p class="mt-1 text-slate-600">Required type: {{ recordTypeLabel(requiredType) }}</p></div>
          @if (clinicalRecord(); as record) { <span class="rounded-full px-3 py-1 text-sm font-bold" [class.bg-amber-100]="record.status === 'DRAFT'" [class.text-amber-900]="record.status === 'DRAFT'" [class.bg-green-100]="record.status === 'FINALIZED'" [class.text-green-900]="record.status === 'FINALIZED'">{{ record.status === 'DRAFT' ? 'Draft' : 'Finalized' }}</span> }</div>
          @if (recordLoading()) { <p role="status" class="mt-4">Loading clinical record…</p> }
          @else if (a.status === 'SCHEDULED' || a.status === 'CONFIRMED') { <p class="mt-4 rounded-xl bg-slate-50 p-4">Clinical documentation will be available when the appointment starts.</p> }
          @else if (recordError()) { <p role="alert" class="mt-4 rounded-xl bg-red-50 p-4">{{ recordError() }} <button type="button" (click)="loadClinicalRecord()" class="font-bold underline">Try again</button></p> }
          @else if (requiredType !== 'CONSULTATION') { <p class="mt-4 rounded-xl bg-slate-50 p-4">This service requires a {{ recordTypeLabel(requiredType).toLowerCase() }} clinical record. Structured entry for this record type is not available yet.</p> }
          @else if (clinicalRecord(); as record) {
            <div class="mt-4"><h3 class="font-bold">{{ record.title }}</h3>@if (record.summary) { <p class="mt-2 whitespace-pre-wrap text-slate-700">{{ record.summary }}</p> }
            @if (record.consultation; as c) { <dl class="mt-5 grid gap-4">@for (field of consultationFields(c); track field.label) { @if (field.value) { <div><dt class="font-semibold">{{ field.label }}</dt><dd class="mt-1 whitespace-pre-wrap text-slate-700">{{ field.value }}</dd></div> } }</dl> }
            @if (record.status === 'DRAFT') { <div class="mt-5 flex flex-wrap gap-3"><button type="button" (click)="openRecordForm()" class="rounded-xl border px-5 py-3 font-bold">Record consultation</button><button type="button" (click)="finalizeOpen.set(true)" class="rounded-xl bg-brand-700 px-5 py-3 font-bold text-white">Finalize record</button></div> }
            </div>
          }
          @if (clinicalRecord(); as record) {
            <div class="mt-6 border-t pt-6"><h3 class="text-lg font-bold">Supporting files</h3>
              @if (!record.attachments.length) { <p class="mt-2 text-slate-600">No supporting files attached.</p> }
              @else { <div class="mt-4 grid gap-3 sm:grid-cols-2">@for (attachment of record.attachments; track attachment.reference) {
                <article class="min-w-0 rounded-xl border p-4"><div class="flex items-start gap-3"><span aria-hidden="true" class="grid size-10 shrink-0 place-items-center rounded-lg bg-slate-100 font-bold">{{ attachment.resourceType === 'IMAGE' ? 'IMG' : 'PDF' }}</span><div class="min-w-0"><p class="break-words font-bold">{{ attachment.originalName }}</p><p class="mt-1 text-sm text-slate-500">{{ formatFileSize(attachment.sizeBytes) }} · {{ formatAttachmentDate(attachment.createdAt) }}</p></div></div>
                <div class="mt-4 flex flex-wrap gap-3"><button type="button" (click)="viewProviderAttachment(attachment)" [disabled]="attachmentAccessPending() === attachment.reference" class="font-bold text-brand-700 underline">{{ attachmentAccessPending() === attachment.reference ? 'Opening…' : attachment.resourceType === 'IMAGE' ? 'Preview' : 'Open' }}</button>@if (record.status === 'DRAFT') { <button type="button" (click)="attachmentToDelete.set(attachment)" class="font-bold text-red-700 underline">Delete</button> }</div>
                </article>
              }</div> }
              @if (record.status === 'DRAFT') { <div class="mt-5 rounded-xl bg-slate-50 p-4"><label for="clinical-attachment" class="font-bold">Attach supporting clinical documents or images</label><p id="clinical-attachment-help" class="mt-1 text-sm text-slate-600">PDF, JPG, PNG or WEBP. Maximum 15 MB per file. Up to 5 files.</p><input id="clinical-attachment" type="file" accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp" (change)="selectAttachment($event)" aria-describedby="clinical-attachment-help" class="mt-3 block w-full text-sm" />@if (selectedFile(); as file) { <div class="mt-3 flex flex-wrap items-center gap-3"><span class="break-all text-sm">{{ file.name }}</span><button type="button" (click)="uploadSelectedAttachment()" [disabled]="attachmentUploading()" class="rounded-lg bg-brand-700 px-4 py-2 font-bold text-white disabled:opacity-50">{{ attachmentUploading() ? 'Uploading…' : 'Upload file' }}</button></div> }</div> }
              @if (attachmentError()) { <p role="alert" class="mt-4 rounded-xl bg-red-50 p-4 text-red-900">{{ attachmentError() }}</p> }
            </div>
          }
        </section>
      }
      @if (a.status === 'IN_PROGRESS') { <app-provider-prescription-section [appointmentReference]="a.appointmentReference" [appointmentStatus]="a.status" /> }
      <div class="mt-6 flex flex-wrap gap-3">
        @if (a.status === 'SCHEDULED' || a.status === 'CONFIRMED') {
          <button
            type="button"
            (click)="start()"
            [disabled]="pending()"
            class="rounded-xl bg-brand-700 px-5 py-3 font-bold text-white"
          >
            Start appointment</button
          ><button
            type="button"
            (click)="open('no-show')"
            [disabled]="pending()"
            class="rounded-xl border border-red-300 px-5 py-3 font-bold text-red-700"
          >
            Mark as no-show</button
          ><button
            type="button"
            (click)="open('cancel')"
            [disabled]="pending()"
            class="rounded-xl border px-5 py-3 font-bold"
          >
            Cancel appointment
          </button>
        }
        @if (a.status === 'IN_PROGRESS') {
          @if (completionBlockMessage(); as message) { <p class="w-full rounded-xl bg-amber-50 p-4 font-semibold text-amber-950">{{ message }}</p> }
          <button
            type="button"
            (click)="open('complete')"
            [disabled]="pending() || !!completionBlockMessage()"
            class="rounded-xl bg-brand-700 px-5 py-3 font-bold text-white"
          >
            Complete appointment
          </button>
        }
      </div>
    }
    @if (recordFormOpen()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"><section role="dialog" aria-modal="true" aria-labelledby="clinical-record-form-title" class="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"><h2 id="clinical-record-form-title" class="text-xl font-bold">{{ clinicalRecord() ? 'Edit' : 'Create' }} consultation record</h2><p class="mt-2 text-slate-600">Only the title is required. Add clinically appropriate information available for this consultation.</p>
      <form [formGroup]="recordForm" (ngSubmit)="saveClinicalRecord()" class="mt-5 grid gap-4"><label class="font-bold">Title<input formControlName="title" maxlength="200" class="mt-2 block min-h-12 w-full rounded-xl border p-3" />@if (recordForm.controls.title.touched && recordForm.controls.title.invalid) { <span class="mt-1 block text-sm text-red-700">Enter a title of no more than 200 characters.</span> }</label><label class="font-bold">Summary <span class="font-normal text-slate-500">(optional)</span><textarea formControlName="summary" maxlength="4000" rows="3" class="mt-2 block w-full rounded-xl border p-3"></textarea></label>
      @for (field of consultationFormFields; track field.control) { <label class="font-bold">{{ field.label }} <span class="font-normal text-slate-500">(optional)</span><textarea [formControlName]="field.control" maxlength="10000" rows="4" class="mt-2 block w-full rounded-xl border p-3"></textarea></label> }
      @if (recordMutationError()) { <p role="alert" class="rounded-xl bg-red-50 p-4 text-red-900">{{ recordMutationError() }}</p> }
      <div class="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><button type="button" (click)="recordFormOpen.set(false)" [disabled]="recordPending()" class="rounded-xl border px-5 py-3 font-bold">Cancel</button><button type="submit" [disabled]="recordPending() || recordForm.invalid" class="rounded-xl bg-brand-700 px-5 py-3 font-bold text-white disabled:opacity-50">{{ recordPending() ? 'Saving…' : 'Save draft' }}</button></div></form></section></div>
    }
    @if (finalizeOpen()) { <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"><section role="alertdialog" aria-modal="true" aria-labelledby="finalize-record-title" class="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"><h2 id="finalize-record-title" class="text-xl font-bold">Finalize clinical record?</h2><p class="mt-2 text-slate-600">Once finalized, this clinical record can no longer be edited.</p>@if (recordMutationError()) { <p role="alert" class="mt-4 rounded-xl bg-red-50 p-4 text-red-900">{{ recordMutationError() }}</p> }<div class="mt-5 flex justify-end gap-3"><button type="button" (click)="finalizeOpen.set(false)" [disabled]="recordPending()" class="rounded-xl border px-5 py-3 font-bold">Keep draft</button><button type="button" (click)="finalizeClinicalRecord()" [disabled]="recordPending()" class="rounded-xl bg-brand-700 px-5 py-3 font-bold text-white">{{ recordPending() ? 'Finalizing…' : 'Finalize record' }}</button></div></section></div> }
    @if (attachmentToDelete(); as attachment) { <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"><section role="alertdialog" aria-modal="true" aria-labelledby="delete-attachment-title" class="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"><h2 id="delete-attachment-title" class="text-xl font-bold">Delete supporting file?</h2><p class="mt-2 break-words text-slate-600">Remove {{ attachment.originalName }} from this draft clinical record?</p><div class="mt-5 flex justify-end gap-3"><button type="button" (click)="attachmentToDelete.set(null)" [disabled]="attachmentDeleting()" class="rounded-xl border px-5 py-3 font-bold">Keep file</button><button type="button" (click)="deleteAttachment(attachment)" [disabled]="attachmentDeleting()" class="rounded-xl bg-red-700 px-5 py-3 font-bold text-white">{{ attachmentDeleting() ? 'Deleting…' : 'Delete file' }}</button></div></section></div> }
    @if (previewUrl(); as url) { <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"><section role="dialog" aria-modal="true" aria-labelledby="attachment-preview-title" class="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white p-5 shadow-xl"><div class="flex items-start justify-between gap-3"><h2 id="attachment-preview-title" class="break-words text-xl font-bold">{{ previewName() }}</h2><button type="button" (click)="closePreview()" class="rounded-lg border px-4 py-2 font-bold">Close</button></div><img [src]="url" [alt]="previewName()" class="mt-4 max-h-[75vh] w-full object-contain" /></section></div> }
    @if (meetingOpen()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <section
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="meeting-link-title"
          class="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
        >
          <h2 id="meeting-link-title" class="text-xl font-bold">
            {{ appointment()?.meetingUrl ? 'Replace' : 'Add' }} meeting link
          </h2>
          <p class="mt-2 text-slate-600">
            Use an HTTPS link from your approved external meeting service.
          </p>
          <form [formGroup]="meetingForm" (ngSubmit)="saveMeetingLink()" class="mt-5">
            <label for="meeting-url" class="font-bold">Meeting link</label
            ><input
              id="meeting-url"
              type="url"
              formControlName="meetingUrl"
              placeholder="https://meet.google.com/..."
              class="mt-2 min-h-12 w-full rounded-xl border px-3"
            />
            @if (meetingError()) {
              <p role="alert" class="mt-3 text-red-700">{{ meetingError() }}</p>
            }
            <div class="mt-5 flex justify-end gap-3">
              <button
                type="button"
                (click)="meetingOpen.set(false)"
                [disabled]="pending()"
                class="rounded-xl border px-4 py-3 font-bold"
              >
                Cancel</button
              ><button
                type="submit"
                [disabled]="pending() || meetingForm.invalid"
                class="rounded-xl bg-brand-700 px-4 py-3 font-bold text-white disabled:opacity-50"
              >
                {{ pending() ? 'Saving…' : 'Save meeting link' }}
              </button>
            </div>
          </form>
        </section>
      </div>
    }
    @if (decision(); as action) {
      <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <section
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="appointment-action-title"
          class="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
        >
          <h2 id="appointment-action-title" class="text-xl font-bold">{{ actionTitle(action) }}</h2>
          <p class="mt-2 text-slate-600">{{ actionCopy(action) }}</p>
          <form [formGroup]="reasonForm" (ngSubmit)="confirm(action)" class="mt-5">
            @if (action !== 'complete') {
              <label for="appointment-reason" class="font-bold">Reason</label
              ><textarea
                id="appointment-reason"
                formControlName="reason"
                rows="4"
                maxlength="2000"
                placeholder="Enter a reason"
                class="mt-2 w-full rounded-xl border p-3"
              ></textarea>
            }
            <div class="mt-5 flex justify-end gap-3">
              <button
                type="button"
                (click)="decision.set(null)"
                [disabled]="pending()"
                class="rounded-xl border px-4 py-3 font-bold"
              >
                Cancel</button
              ><button
                type="submit"
                [disabled]="pending() || (action !== 'complete' && reasonForm.invalid)"
                [class.bg-red-700]="action !== 'complete'"
                [class.bg-brand-700]="action === 'complete'"
                class="rounded-xl px-4 py-3 font-bold text-white disabled:opacity-50"
              >
                {{ pending() ? 'Updating…' : 'Confirm' }}
              </button>
            </div>
          </form>
        </section>
      </div>
    }
  </main>`,
})
export class ProviderCareAppointmentDetailPageComponent {
  private readonly api = inject(ProviderCareOperationsApiService);
  private readonly careServicesApi = inject(ProviderCareServicesApiService);
  private readonly clinicalRecordsApi = inject(ClinicalRecordsApiService);
  private readonly fb = inject(FormBuilder);
  readonly utils = inject(UtilsService);
  readonly reference = inject(ActivatedRoute).snapshot.paramMap.get('reference') ?? '';
  readonly appointment = signal<CareAppointment | null>(null);
  readonly loading = signal(true);
  readonly pending = signal(false);
  readonly error = signal<string | null>(null);
  readonly feedback = signal<string | null>(null);
  readonly decision = signal<Decision>(null);
  readonly meetingOpen = signal(false);
  readonly meetingError = signal<string | null>(null);
  readonly clinicalRecordType = signal<ClinicalRecordType | null>(null);
  readonly clinicalRecord = signal<ClinicalRecord | null>(null);
  readonly recordLoading = signal(false);
  readonly recordError = signal<string | null>(null);
  readonly recordFormOpen = signal(false);
  readonly finalizeOpen = signal(false);
  readonly recordPending = signal(false);
  readonly recordMutationError = signal<string | null>(null);
  readonly selectedFile = signal<File | null>(null);
  readonly attachmentUploading = signal(false);
  readonly attachmentDeleting = signal(false);
  readonly attachmentError = signal<string | null>(null);
  readonly attachmentToDelete = signal<ClinicalRecordAttachment | null>(null);
  readonly attachmentAccessPending = signal<string | null>(null);
  readonly previewUrl = signal<string | null>(null);
  readonly previewName = signal('');
  readonly deliveryModeLabel = careDeliveryModeLabel;
  readonly meetingForm = this.fb.nonNullable.group({ meetingUrl: ['', Validators.required] });
  readonly reasonForm = this.fb.nonNullable.group({
    reason: ['', [Validators.required, Validators.maxLength(2000)]],
  });
  readonly recordForm = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.pattern(/.*\S.*/), Validators.maxLength(200)]], summary: ['', Validators.maxLength(4000)],
    presentingComplaint: ['', Validators.maxLength(10000)], historyOfPresentingComplaint: ['', Validators.maxLength(10000)], observations: ['', Validators.maxLength(10000)], assessment: ['', Validators.maxLength(10000)], diagnosis: ['', Validators.maxLength(10000)], plan: ['', Validators.maxLength(10000)], followUpInstructions: ['', Validators.maxLength(10000)],
  });
  readonly consultationFormFields = [
    { control: 'presentingComplaint', label: 'Presenting complaint' }, { control: 'historyOfPresentingComplaint', label: 'History of presenting complaint' },
    { control: 'observations', label: 'Clinical observations' }, { control: 'assessment', label: 'Assessment' }, { control: 'diagnosis', label: 'Diagnosis' },
    { control: 'plan', label: 'Plan' }, { control: 'followUpInstructions', label: 'Follow-up instructions' },
  ] as const;
  constructor() {
    this.load();
  }
  load() {
    this.loading.set(true);
    this.api
      .getAppointment(this.reference)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (a) => { this.appointment.set(a); this.loadClinicalRequirement(a); },
        error: () => this.error.set('This Care Appointment is unavailable.'),
      });
  }
  private loadClinicalRequirement(appointment: CareAppointment): void {
    this.careServicesApi.getCatalogue().subscribe({ next: definitions => {
      const type = definitions.find(item => item.code === appointment.service.code)?.clinicalRecordType ?? null;
      this.clinicalRecordType.set(type); this.clinicalRecord.set(null); this.recordError.set(null);
      if (type && appointment.status !== 'SCHEDULED' && appointment.status !== 'CONFIRMED') this.loadClinicalRecord();
    }, error: () => { this.clinicalRecordType.set(null); } });
  }
  loadClinicalRecord(): void {
    this.recordLoading.set(true); this.recordError.set(null);
    this.clinicalRecordsApi.getForProviderAppointment(this.reference).pipe(finalize(() => this.recordLoading.set(false))).subscribe({
      next: record => this.clinicalRecord.set(record),
      error: error => {
        this.clinicalRecord.set(null);
        this.recordError.set(error?.status === 404 && this.appointment()?.status === 'IN_PROGRESS'
          ? 'Clinical record could not be loaded. Refresh and try again.'
          : 'We could not load the clinical record.');
      },
    });
  }
  openRecordForm(): void {
    const record = this.clinicalRecord(); const c = record?.consultation;
    this.recordForm.reset({ title: record?.title ?? '', summary: record?.summary ?? '', presentingComplaint: c?.presentingComplaint ?? '', historyOfPresentingComplaint: c?.historyOfPresentingComplaint ?? '', observations: c?.observations ?? '', assessment: c?.assessment ?? '', diagnosis: c?.diagnosis ?? '', plan: c?.plan ?? '', followUpInstructions: c?.followUpInstructions ?? '' });
    this.recordMutationError.set(null); this.recordFormOpen.set(true);
  }
  saveClinicalRecord(): void {
    if (this.recordForm.invalid || this.recordPending()) { this.recordForm.markAllAsTouched(); return; }
    const value = this.recordForm.getRawValue(); const nullable = (text: string) => text.trim() || null;
    if (!this.clinicalRecord()) { this.recordMutationError.set('Clinical record could not be loaded. Refresh and try again.'); return; }
    const body: UpdateClinicalRecordRequest = { recordType: 'CONSULTATION', title: value.title.trim(), summary: nullable(value.summary), consultation: { presentingComplaint: nullable(value.presentingComplaint), historyOfPresentingComplaint: nullable(value.historyOfPresentingComplaint), observations: nullable(value.observations), assessment: nullable(value.assessment), diagnosis: nullable(value.diagnosis), plan: nullable(value.plan), followUpInstructions: nullable(value.followUpInstructions) } };
    this.recordPending.set(true); this.recordMutationError.set(null);
    this.clinicalRecordsApi.updateForProviderAppointment(this.reference, body).pipe(finalize(() => this.recordPending.set(false))).subscribe({ next: () => { this.recordFormOpen.set(false); this.feedback.set('Clinical record draft saved.'); this.loadClinicalRecord(); }, error: error => this.recordMutationError.set(this.safeRecordError(error)) });
  }
  finalizeClinicalRecord(): void {
    if (this.recordPending()) return; this.recordPending.set(true); this.recordMutationError.set(null);
    this.clinicalRecordsApi.finalizeForProviderAppointment(this.reference).pipe(finalize(() => this.recordPending.set(false))).subscribe({ next: () => { this.finalizeOpen.set(false); this.feedback.set('Clinical record finalized.'); this.loadClinicalRecord(); }, error: error => this.recordMutationError.set(this.safeRecordError(error)) });
  }
  selectAttachment(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0] ?? null;
    this.selectedFile.set(null); this.attachmentError.set(null);
    if (!file) return;
    if (!['application/pdf', 'image/jpeg', 'image/png', 'image/webp'].includes(file.type)) { this.attachmentError.set('Choose a PDF, JPG, PNG or WEBP file.'); return; }
    if (file.size > 15 * 1024 * 1024) { this.attachmentError.set('The selected file must not exceed 15 MB.'); return; }
    if ((this.clinicalRecord()?.attachments.length ?? 0) >= 5) { this.attachmentError.set('This clinical record already has the maximum of 5 attachments.'); return; }
    this.selectedFile.set(file);
  }
  uploadSelectedAttachment(): void {
    const record = this.clinicalRecord(); const file = this.selectedFile();
    if (!record || !file || this.attachmentUploading()) return;
    this.attachmentUploading.set(true); this.attachmentError.set(null);
    this.clinicalRecordsApi.uploadAttachment(record.reference, file).pipe(finalize(() => this.attachmentUploading.set(false))).subscribe({ next: () => { this.selectedFile.set(null); this.feedback.set('Supporting file uploaded.'); this.loadClinicalRecord(); }, error: () => this.attachmentError.set('We could not upload this file. Review it and try again.') });
  }
  deleteAttachment(attachment: ClinicalRecordAttachment): void {
    const record = this.clinicalRecord(); if (!record || this.attachmentDeleting()) return;
    this.attachmentDeleting.set(true); this.attachmentError.set(null);
    this.clinicalRecordsApi.deleteAttachment(record.reference, attachment.reference).pipe(finalize(() => this.attachmentDeleting.set(false))).subscribe({ next: () => { this.attachmentToDelete.set(null); this.feedback.set('Supporting file deleted.'); this.loadClinicalRecord(); }, error: () => { this.attachmentToDelete.set(null); this.attachmentError.set('We could not delete this file. Refresh and try again.'); } });
  }
  viewProviderAttachment(attachment: ClinicalRecordAttachment): void {
    const record = this.clinicalRecord(); if (!record || this.attachmentAccessPending()) return;
    this.attachmentAccessPending.set(attachment.reference); this.attachmentError.set(null);
    this.clinicalRecordsApi.getProviderAttachmentAccess(record.reference, attachment.reference).pipe(finalize(() => this.attachmentAccessPending.set(null))).subscribe({ next: access => this.openAuthorizedAttachment(attachment, access.url), error: () => this.attachmentError.set('Unable to open this file. Please try again.') });
  }
  private openAuthorizedAttachment(attachment: ClinicalRecordAttachment, value: string): void {
    let url: URL; try { url = new URL(value); } catch { this.attachmentError.set('Unable to open this file. Please try again.'); return; }
    if (url.protocol !== 'https:') { this.attachmentError.set('Unable to open this file. Please try again.'); return; }
    if (attachment.resourceType === 'IMAGE') { this.previewUrl.set(url.toString()); this.previewName.set(attachment.originalName); return; }
    window.open(url.toString(), '_blank', 'noopener,noreferrer');
  }
  closePreview(): void { this.previewUrl.set(null); this.previewName.set(''); }
  formatFileSize(bytes: number): string { if (bytes < 1024) return `${bytes} bytes`; if (bytes < 1024 * 1024) return `${this.compact(bytes / 1024)} KB`; return `${this.compact(bytes / (1024 * 1024))} MB`; }
  formatAttachmentDate(value: string): string { return new Intl.DateTimeFormat('en-NG', { dateStyle: 'medium' }).format(new Date(value)); }
  private compact(value: number): string { return Number.isInteger(value) ? String(value) : value.toFixed(1); }
  completionBlockMessage(): string | null {
    const required = this.clinicalRecordType(); if (!required) return null; const record = this.clinicalRecord();
    if (!record) return 'Complete the required clinical record before completing this appointment.';
    if (record.recordType !== required) return `A finalized ${this.recordTypeLabel(required).toLowerCase()} clinical record is required before completion.`;
    return record.status === 'DRAFT' ? 'Finalize the clinical record before completing this appointment.' : null;
  }
  recordTypeLabel(value: string): string { return value.split('_').map(part => part[0] + part.slice(1).toLowerCase()).join(' '); }
  consultationFields(c: NonNullable<ClinicalRecord['consultation']>) { return this.consultationFormFields.map(field => ({ label: field.label, value: c[field.control] })); }
  private safeRecordError(error: { status?: number; error?: { message?: unknown } }): string { const message = error.error?.message; return (error.status === 400 || error.status === 409) && typeof message === 'string' ? message : 'We could not update this clinical record.'; }
  start() {
    this.run(this.api.startAppointment(this.reference), 'Appointment started.');
  }
  openMeetingLink() {
    this.meetingError.set(null);
    this.meetingForm.setValue({ meetingUrl: this.appointment()?.meetingUrl ?? '' });
    this.meetingOpen.set(true);
  }
  safeMeetingUrl(value: string | null) {
    if (!value) return null;
    try {
      const url = new URL(value);
      return url.protocol === 'https:' ? url.toString() : null;
    } catch {
      return null;
    }
  }
  saveMeetingLink() {
    const value = this.meetingForm.controls.meetingUrl.value.trim();
    if (!this.safeMeetingUrl(value)) {
      this.meetingError.set('Enter a valid HTTPS meeting link.');
      return;
    }
    this.runMeetingLink(value, 'Meeting link saved.');
  }
  removeMeetingLink() {
    this.runMeetingLink(null, 'Meeting link removed.');
  }
  private runMeetingLink(value: string | null, message: string) {
    if (this.pending()) return;
    this.pending.set(true);
    this.meetingError.set(null);
    this.api
      .updateMeetingLink(this.reference, value)
      .pipe(finalize(() => this.pending.set(false)))
      .subscribe({
        next: () => {
          this.meetingOpen.set(false);
          this.feedback.set(message);
          this.load();
        },
        error: () => {
          this.meetingError.set(
            'The meeting link could not be updated. We refreshed the appointment.',
          );
          this.load();
        },
      });
  }
  open(action: Exclude<Decision, null>) {
    this.reasonForm.reset();
    this.decision.set(action);
  }
  confirm(action: Exclude<Decision, null>) {
    if (action !== 'complete' && this.reasonForm.invalid) return;
    const reason = this.reasonForm.controls.reason.value.trim();
    const command =
      action === 'complete'
        ? this.api.completeAppointment(this.reference)
        : action === 'no-show'
          ? this.api.markNoShow(this.reference, reason)
          : this.api.cancelAppointment(this.reference, reason);
    this.run(
      command,
      action === 'complete'
        ? 'Appointment completed.'
        : action === 'no-show'
          ? 'Appointment marked as no-show.'
          : 'Appointment cancelled.',
    );
  }
  private run(command: Observable<CareAppointment>, message: string) {
    if (this.pending()) return;
    this.pending.set(true);
    this.error.set(null);
    command.pipe(finalize(() => this.pending.set(false))).subscribe({
      next: () => {
        this.decision.set(null);
        this.feedback.set(message);
        this.load();
      },
      error: (e) => {
        this.decision.set(null);
        this.error.set(
          e?.status === 409
            ? (typeof e?.error?.message === 'string' ? e.error.message : 'This appointment changed before the action completed. We refreshed its current state.')
            : 'We could not update this appointment.',
        );
        this.load();
      },
    });
  }
  label(s: string) {
    return s === 'IN_PROGRESS'
      ? 'In progress'
      : s === 'NO_SHOW'
        ? 'No-show'
        : s.charAt(0) + s.slice(1).toLowerCase();
  }
  actionTitle(a: string) {
    return a === 'complete'
      ? 'Complete appointment?'
      : a === 'no-show'
        ? 'Mark patient as no-show?'
        : 'Cancel appointment?';
  }
  actionCopy(a: string) {
    return a === 'complete'
      ? 'Confirm that this appointment has been completed.'
      : a === 'no-show'
        ? 'This records that the patient did not attend the scheduled appointment.'
        : 'The backend will cancel the appointment and keep the Care Request lifecycle consistent.';
  }
}

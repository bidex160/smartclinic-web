import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import {
  AdminCareServiceDefinition,
  CreateAdminCareServiceDefinition,
} from '../../core/models/admin-care-service-definition.model';
import { AdminCareServicesApiService } from '../../core/services/admin-care-services-api.service';

const CODE_PATTERN = /^[A-Za-z][A-Za-z0-9_]{1,79}$/;

@Component({
  selector: 'app-admin-care-services-page',
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="mx-auto max-w-7xl px-5 py-10 sm:px-8">
      <div class="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p class="text-sm font-bold uppercase tracking-wider text-brand-600">Operations</p>
          <h1 class="mt-2 text-3xl font-bold text-brand-900">Care Services</h1>
          <p class="mt-2 max-w-3xl text-slate-600">Manage the General Care services that providers can offer through Find Care.</p>
        </div>
        <button type="button" (click)="openCreate()" class="rounded-xl bg-brand-700 px-5 py-3 font-bold text-white focus:outline-none focus:ring-4 focus:ring-brand-200">Add Care Service</button>
      </div>

      @if (feedback()) { <p aria-live="polite" class="mt-6 rounded-xl bg-green-50 p-4 font-semibold text-green-950">{{ feedback() }}</p> }
      @if (actionError()) { <p role="alert" class="mt-6 rounded-xl bg-red-50 p-4 text-red-950">{{ actionError() }}</p> }
      @if (loading()) {
        <p role="status" class="mt-8 rounded-2xl border bg-white p-6">Loading Care Services…</p>
      } @else if (loadError()) {
        <div role="alert" class="mt-8 rounded-2xl bg-red-50 p-6 text-red-950">We could not load Care Services. <button type="button" (click)="load()" class="font-bold underline">Try again</button></div>
      } @else if (!definitions().length) {
        <section class="mt-8 rounded-2xl border bg-white p-8 text-center">
          <h2 class="text-xl font-bold">No Care Services have been created yet.</h2>
          <button type="button" (click)="openCreate()" class="mt-5 rounded-xl bg-brand-700 px-5 py-3 font-bold text-white">Add Care Service</button>
        </section>
      } @else {
        <div class="mt-8 overflow-x-auto rounded-2xl border bg-white">
          <table class="w-full min-w-[720px] text-left">
            <thead class="bg-slate-50"><tr><th class="p-4">Service</th><th class="p-4">Code</th><th class="p-4">Description</th><th class="p-4">Status</th><th class="p-4">Actions</th></tr></thead>
            <tbody>@for (definition of definitions(); track definition.id) {
              <tr class="border-t align-top">
                <td class="p-4 font-bold">{{ definition.name }}</td>
                <td class="p-4 font-mono text-sm">{{ definition.code }}</td>
                <td class="max-w-md p-4 text-slate-600">{{ definition.description || '—' }}</td>
                <td class="p-4"><span class="rounded-full px-3 py-1 text-sm font-bold" [class.bg-green-100]="definition.isActive" [class.text-green-900]="definition.isActive" [class.bg-slate-200]="!definition.isActive">{{ definition.isActive ? 'Active' : 'Inactive' }}</span></td>
                <td class="p-4"><div class="flex flex-wrap gap-3"><button type="button" (click)="openEdit(definition)" class="font-bold text-brand-700 underline">Edit</button><button type="button" (click)="setActive(definition, !definition.isActive)" [disabled]="mutatingId() === definition.id" class="font-bold text-brand-700 underline disabled:opacity-50">{{ definition.isActive ? 'Deactivate' : 'Activate' }}</button></div></td>
              </tr>
            }</tbody>
          </table>
        </div>
      }

      @if (modalOpen()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4" role="dialog" aria-modal="true" aria-labelledby="care-service-form-title">
          <section class="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl sm:p-8">
            <h2 id="care-service-form-title" class="text-2xl font-bold">{{ editing() ? 'Edit Care Service' : 'Add Care Service' }}</h2>
            <p class="mt-2 text-slate-600">Define what General Care service exists across SmartClinic. Providers configure delivery and pricing separately.</p>
            <form [formGroup]="form" (ngSubmit)="submit()" class="mt-6 grid gap-5" novalidate>
              <label class="font-semibold">Code<input formControlName="code" maxlength="80" placeholder="GENERAL_CONSULTATION" class="mt-2 block w-full rounded-xl border p-3 font-mono uppercase" aria-describedby="code-help code-error" /><span id="code-help" class="mt-1 block text-sm font-normal text-slate-500">Uppercase letters, numbers, and underscores. This identifier is required by the backend.</span>@if (form.controls.code.touched && form.controls.code.invalid) { <span id="code-error" class="mt-1 block text-sm font-normal text-red-700">Enter 2–80 characters beginning with a letter.</span> }</label>
              <label class="font-semibold">Name<input formControlName="name" maxlength="160" placeholder="General Consultation" class="mt-2 block w-full rounded-xl border p-3" />@if (form.controls.name.touched && form.controls.name.invalid) { <span class="mt-1 block text-sm font-normal text-red-700">Name is required and must be no more than 160 characters.</span> }</label>
              <label class="font-semibold">Description <span class="font-normal text-slate-500">(optional)</span><textarea formControlName="description" maxlength="4000" rows="5" placeholder="General consultation with a healthcare provider" class="mt-2 block w-full rounded-xl border p-3"></textarea></label>
              @if (mutationError()) { <p role="alert" class="rounded-xl bg-red-50 p-4 text-red-900">{{ mutationError() }}</p> }
              <div class="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><button type="button" (click)="closeModal()" [disabled]="saving()" class="rounded-xl border px-5 py-3 font-bold">Cancel</button><button type="submit" [disabled]="saving()" class="rounded-xl bg-brand-700 px-5 py-3 font-bold text-white disabled:opacity-60">{{ saving() ? 'Saving…' : editing() ? 'Save changes' : 'Create Care Service' }}</button></div>
            </form>
          </section>
        </div>
      }
    </main>
  `,
})
export class AdminCareServicesPageComponent {
  private readonly api = inject(AdminCareServicesApiService);
  private readonly fb = inject(FormBuilder).nonNullable;
  readonly definitions = signal<readonly AdminCareServiceDefinition[]>([]);
  readonly loading = signal(true);
  readonly loadError = signal(false);
  readonly modalOpen = signal(false);
  readonly editing = signal<AdminCareServiceDefinition | null>(null);
  readonly saving = signal(false);
  readonly mutatingId = signal<string | null>(null);
  readonly mutationError = signal<string | null>(null);
  readonly actionError = signal<string | null>(null);
  readonly feedback = signal<string | null>(null);
  readonly form = this.fb.group({
    code: ['', [Validators.required, Validators.pattern(CODE_PATTERN)]],
    name: ['', [Validators.required, Validators.pattern(/.*\S.*/), Validators.maxLength(160)]],
    description: ['', Validators.maxLength(4000)],
  });

  constructor() { this.load(); }

  load(): void {
    this.loading.set(true); this.loadError.set(false);
    this.api.list().pipe(finalize(() => this.loading.set(false))).subscribe({
      next: definitions => this.definitions.set(definitions),
      error: () => this.loadError.set(true),
    });
  }

  openCreate(): void {
    this.editing.set(null); this.form.reset({ code: '', name: '', description: '' });
    this.mutationError.set(null); this.feedback.set(null); this.actionError.set(null); this.modalOpen.set(true);
  }

  openEdit(definition: AdminCareServiceDefinition): void {
    this.editing.set(definition);
    this.form.reset({ code: definition.code, name: definition.name, description: definition.description ?? '' });
    this.mutationError.set(null); this.feedback.set(null); this.actionError.set(null); this.modalOpen.set(true);
  }

  closeModal(): void { if (!this.saving()) this.modalOpen.set(false); }

  submit(): void {
    if (this.form.invalid || this.saving()) { this.form.markAllAsTouched(); return; }
    const value = this.form.getRawValue();
    const request: CreateAdminCareServiceDefinition = {
      code: value.code.trim().toUpperCase(), name: value.name.trim(),
      description: value.description.trim() || null,
    };
    this.saving.set(true); this.mutationError.set(null);
    const operation = this.editing() ? this.api.update(this.editing()!.id, request) : this.api.create(request);
    operation.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: () => { this.modalOpen.set(false); this.feedback.set(this.editing() ? 'Care Service updated.' : 'Care Service created.'); this.load(); },
      error: error => this.mutationError.set(this.safeError(error)),
    });
  }

  setActive(definition: AdminCareServiceDefinition, isActive: boolean): void {
    if (this.mutatingId()) return;
    this.mutatingId.set(definition.id); this.feedback.set(null); this.actionError.set(null);
    this.api.update(definition.id, { isActive }).pipe(finalize(() => this.mutatingId.set(null))).subscribe({
      next: () => { this.feedback.set(isActive ? 'Care Service activated.' : 'Care Service deactivated.'); this.load(); },
      error: error => this.actionError.set(this.safeError(error)),
    });
  }

  private safeError(error: HttpErrorResponse): string {
    const message = error.error?.message;
    if ((error.status === 400 || error.status === 409) && typeof message === 'string') return message;
    return 'We could not save this Care Service. Review the details and try again.';
  }
}

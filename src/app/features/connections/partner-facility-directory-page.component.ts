import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { PartnerFacilityDirectoryItem, PartnerFacilityType } from '../../core/models/partner-facility-directory.model';
import { PartnerFacilityDirectoryApiService } from '../../core/services/partner-facility-directory-api.service';

@Component({
  selector: 'app-partner-facility-directory-page',
  imports: [ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<main class="mx-auto max-w-6xl px-5 py-8 sm:px-8">
    <a routerLink="/me/providers" class="font-bold text-brand-700 underline">← My providers</a>
    <p class="mt-6 text-sm font-bold uppercase tracking-wider text-brand-700">SmartClinic Network</p>
    <h1 class="font-display mt-2 text-3xl font-semibold text-ink">Find a hospital, pharmacy or lab</h1>
    <p class="mt-2 max-w-3xl text-ink-soft">Search verified facility listings. Facilities marked “Available to join” are not yet connected for bookings or payments. Ask SmartClinic to contact them for you.</p>
    <section class="mt-6 grid gap-3 rounded-2xl border bg-white p-4 sm:grid-cols-4">
      <label class="grid gap-1 text-sm font-bold">Search<input [formControl]="search" class="rounded-xl border p-3 font-normal" placeholder="Name, city or state"></label>
      <label class="grid gap-1 text-sm font-bold">Facility type<select [formControl]="type" class="rounded-xl border p-3"><option value="">All facilities</option><option value="HOSPITAL">Hospital</option><option value="PHARMACY">Pharmacy</option><option value="LABORATORY">Laboratory</option><option value="RADIOLOGY">Radiology</option></select></label>
      <label class="grid gap-1 text-sm font-bold">State<input [formControl]="state" class="rounded-xl border p-3 font-normal" placeholder="e.g. Lagos"></label>
      <label class="grid gap-1 text-sm font-bold">City<input [formControl]="city" class="rounded-xl border p-3 font-normal" placeholder="e.g. Kano"></label>
      <button type="button" (click)="load(1)" class="rounded-xl bg-brand-700 px-4 py-3 font-bold text-white sm:col-span-4">Search facilities</button>
    </section>
    @if (loading()) { <p role="status" class="mt-5">Loading facilities…</p> }
    @else if (error()) { <p role="alert" class="mt-5 rounded-xl bg-red-50 p-4">We couldn’t load the facility directory. <button (click)="load(page())" class="font-bold underline">Try again</button></p> }
    @else if (!items().length) { <p class="mt-5 rounded-xl bg-sand-50 p-5">No listed facilities match these filters yet.</p> }
    @else {
      <section class="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        @for (item of items(); track item.id) {
          <article class="rounded-2xl border bg-white p-5 shadow-sm">
            <div class="flex items-start justify-between gap-3"><div><p class="text-xs font-bold uppercase tracking-wide text-brand-700">{{ typeLabel(item.facilityType) }}</p><h2 class="mt-1 text-lg font-black">{{ item.displayName }}</h2></div><span class="rounded-full border px-3 py-1 text-xs font-bold">{{ readinessLabel(item.readiness) }}</span></div>
            <p class="mt-3 text-sm text-ink-soft">{{ location(item) }}</p>
            @if (!item.availableForConnection) {
              <label class="mt-4 flex gap-2 text-sm"><input type="checkbox" [checked]="consented(item.id)" (change)="setConsent(item.id, $any($event.target).checked)"><span>I agree that SmartClinic may use my contact details to contact me and this facility about my request. This does not share my medical record or confirm an appointment.</span></label>
              @if (item.facilityType === 'HOSPITAL') { <label class="mt-3 grid gap-1 text-sm font-semibold">Preferred appointment time (optional)<input type="datetime-local" [value]="preferredTimes()[item.id] || ''" (change)="setPreferredTime(item.id, $any($event.target).value)" class="rounded-xl border p-3 font-normal"></label> }
              @if (item.facilityType === 'HOSPITAL') { <button type="button" (click)="requestAppointment(item, preferredTimes()[item.id] || '')" [disabled]="sendingId() === item.id || !consented(item.id)" class="mt-3 w-full rounded-xl bg-brand-700 px-4 py-3 font-bold text-white disabled:opacity-50">{{ sendingId() === item.id ? 'Sending…' : 'Request appointment help' }}</button> }
              <button type="button" (click)="requestContact(item)" [disabled]="sendingId() === item.id || !consented(item.id)" class="mt-3 w-full rounded-xl border border-brand-700 px-4 py-3 font-bold text-brand-800 disabled:opacity-50">{{ sendingId() === item.id ? 'Sending…' : 'Ask SmartClinic to contact them' }}</button>
            } @else if (item.providerReference) {
              <a [routerLink]="['/me/providers/connect']" [queryParams]="{providerReference: item.providerReference}" class="mt-4 block rounded-xl bg-brand-700 px-4 py-3 text-center font-bold text-white">Connect with this facility</a>
            }
            @if (messageFor(item.id); as message) { <p role="status" class="mt-3 text-sm font-semibold text-emerald-800">{{ message }}</p> }
          </article>
        }
      </section>
      <div class="mt-5 flex items-center justify-between"><button type="button" (click)="load(page()-1)" [disabled]="page() <= 1" class="rounded-lg border px-4 py-2">Previous</button><span>Page {{ page() }} of {{ totalPages() || 1 }}</span><button type="button" (click)="load(page()+1)" [disabled]="page() >= totalPages()" class="rounded-lg border px-4 py-2">Next</button></div>
    }
  </main>`,
})
export class PartnerFacilityDirectoryPageComponent {
  private readonly api = inject(PartnerFacilityDirectoryApiService);
  search = new FormControl('', { nonNullable: true });
  type = new FormControl<PartnerFacilityType | ''>('', { nonNullable: true });
  state = new FormControl('', { nonNullable: true });
  city = new FormControl('', { nonNullable: true });
  items = signal<readonly PartnerFacilityDirectoryItem[]>([]);
  loading = signal(false); error = signal(false); page = signal(1); totalPages = signal(0); sendingId = signal('');
  messages = signal<Record<string,string>>({});
  consents = signal<Record<string,boolean>>({});
  preferredTimes = signal<Record<string,string>>({});
  constructor() { this.load(1); }
  load(page: number) {
    if (page < 1 || this.loading()) return;
    this.loading.set(true); this.error.set(false);
    this.api.directory({ q: this.search.value, facilityType: this.type.value, stateOrRegion: this.state.value, city: this.city.value, page, limit: 18 }).pipe(finalize(() => this.loading.set(false))).subscribe({
      next: result => { this.items.set(result.items); this.page.set(result.page); this.totalPages.set(result.totalPages); },
      error: () => this.error.set(true),
    });
  }
  requestContact(item: PartnerFacilityDirectoryItem) {
    if (this.sendingId() || !this.consented(item.id)) return;
    this.sendingId.set(item.id);
    this.api.requestContact(item.id).pipe(finalize(() => this.sendingId.set(''))).subscribe({
      next: result => this.messages.update(old => ({ ...old, [item.id]: result.alreadyRequested ? 'Your request is already on our list.' : 'Request received. SmartClinic will follow up.' })),
      error: () => this.messages.update(old => ({ ...old, [item.id]: 'We couldn’t save your request. Please try again.' })),
    });
  }
  requestAppointment(item: PartnerFacilityDirectoryItem, preferredAt: string) {
    if (this.sendingId() || !this.consented(item.id)) return;
    this.sendingId.set(item.id);
    const preferredInstant = preferredAt ? new Date(preferredAt).toISOString() : undefined;
    this.api.createRequest(item.id, 'APPOINTMENT', preferredInstant).pipe(finalize(() => this.sendingId.set(''))).subscribe({
      next: result => this.messages.update(old => ({ ...old, [item.id]: `Appointment help request ${result.reference} received. Our team will contact the hospital and you to confirm a time.` })),
      error: () => this.messages.update(old => ({ ...old, [item.id]: 'We could not submit your appointment help request. Please try again.' })),
    });
  }
  messageFor(id: string) { return this.messages()[id] ?? ''; }
  location(item: PartnerFacilityDirectoryItem) { return [item.location.city, item.location.stateOrRegion, item.location.countryCode].filter(value => !!value).join(', '); }
  consented(id: string) { return this.consents()[id] === true; }
  setConsent(id: string, value: boolean) { this.consents.update(old => ({ ...old, [id]: value })); }
  setPreferredTime(id: string, value: string) { this.preferredTimes.update(old => ({ ...old, [id]: value })); }
  typeLabel(type: PartnerFacilityType) { return ({ HOSPITAL: 'Hospital', PHARMACY: 'Pharmacy', LABORATORY: 'Laboratory', RADIOLOGY: 'Radiology' })[type]; }
  readinessLabel(readiness: string) { return ({ AVAILABLE_TO_JOIN: 'Available to join', JOINED: 'Joined', FULLY_JOINED: 'Fully joined' } as Record<string,string>)[readiness] ?? readiness; }
}

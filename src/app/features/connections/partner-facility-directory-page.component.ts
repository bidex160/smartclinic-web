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
    <p class="mt-2 max-w-3xl text-ink-soft">Every registered facility, with a call button and directions. Ones not on SmartClinic yet can’t take bookings here: ask them to join, and when enough patients ask, we invite them.</p>
    <section class="mt-6 grid gap-3 rounded-2xl border bg-white p-4 sm:grid-cols-4">
      <label class="grid gap-1 text-sm font-bold">Search<input [formControl]="search" class="rounded-xl border p-3 font-normal" placeholder="Name, area or city"></label>
      <label class="grid gap-1 text-sm font-bold">Facility type<select [formControl]="type" class="rounded-xl border p-3"><option value="">All facilities</option><option value="HOSPITAL">Hospital or clinic</option><option value="PHARMACY">Pharmacy</option><option value="LABORATORY">Laboratory</option><option value="RADIOLOGY">Imaging</option></select></label>
      <label class="grid gap-1 text-sm font-bold">State<input [formControl]="state" class="rounded-xl border p-3 font-normal" placeholder="e.g. Lagos"></label>
      <label class="grid gap-1 text-sm font-bold">City or LGA<input [formControl]="city" class="rounded-xl border p-3 font-normal" placeholder="e.g. Ikeja"></label>
      <div class="flex flex-wrap items-center gap-3 sm:col-span-4">
        <button type="button" (click)="toggleNearMe()" [attr.aria-pressed]="!!near()" class="min-h-11 rounded-full px-4 font-bold ring-1 {{ near() ? 'bg-ink text-white ring-ink' : 'bg-white text-ink ring-ink/20' }}" data-near-me>📍 {{ locating() ? 'Finding you…' : near() ? 'Nearest first' : 'Near me' }}</button>
        <label class="flex min-h-11 items-center gap-2 text-sm font-semibold"><input type="checkbox" [checked]="verifiedOnly()" (change)="verifiedOnly.set($any($event.target).checked); load(1)" data-verified-only> Verified only</label>
        <button type="button" (click)="load(1)" class="ml-auto min-h-11 rounded-xl bg-brand-700 px-5 font-bold text-white">Search facilities</button>
      </div>
      @if (locationError()) { <p role="alert" class="text-sm text-amber-800 sm:col-span-4">{{ locationError() }}</p> }
    </section>
    <p class="mt-3 text-sm text-ink-muted">Facilities come from the national Health Facility Registry and are updated every night. <strong>Verified</strong> means the licence is current in the registry or has been checked by SmartClinic.</p>
    @if (loading()) { <p role="status" class="mt-5">Loading facilities…</p> }
    @else if (error()) { <p role="alert" class="mt-5 rounded-xl bg-red-50 p-4">We couldn’t load the facility directory. <button (click)="load(page())" class="font-bold underline">Try again</button></p> }
    @else if (!items().length) { <p class="mt-5 rounded-xl bg-sand-50 p-5">No listed facilities match these filters yet.</p> }
    @else {
      <section class="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        @for (item of items(); track item.id) {
          <article class="flex flex-col rounded-2xl border bg-white p-5 shadow-sm" [attr.data-facility]="item.id">
            <div class="flex items-start justify-between gap-3">
              <div>
                <p class="text-xs font-bold uppercase tracking-wide text-brand-700">{{ typeLabel(item.facilityType) }}@if (item.levelOfCare) { · {{ item.levelOfCare }} }</p>
                <h2 class="mt-1 text-lg font-black">{{ item.displayName }}</h2>
              </div>
              @if (item.verified) { <span class="shrink-0 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800 ring-1 ring-emerald-200" data-verified>✓ Verified</span> }
            </div>
            <p class="mt-2 text-sm text-ink-soft">{{ location(item) }}@if (item.distanceKm !== null && item.distanceKm !== undefined) { · <strong class="text-ink">{{ distance(item.distanceKm) }}</strong> }</p>
            <p class="mt-1 text-xs font-semibold {{ item.availableForConnection ? 'text-emerald-800' : 'text-ink-muted' }}">{{ item.availableForConnection ? 'Book and pay on SmartClinic' : item.readiness === 'AVAILABLE_TO_JOIN' ? 'Not on SmartClinic yet' : 'Joining SmartClinic' }}</p>
            <div class="mt-4 flex flex-wrap gap-2">
              @if (item.contact?.phone; as phone) { <a [href]="'tel:' + phone" class="inline-flex min-h-10 items-center rounded-full bg-sand-50 px-4 text-sm font-bold text-ink ring-1 ring-ink/10" data-call>📞 Call</a> }
              @if (item.directionsUrl) { <a [href]="item.directionsUrl" target="_blank" rel="noopener" class="inline-flex min-h-10 items-center rounded-full bg-sand-50 px-4 text-sm font-bold text-ink ring-1 ring-ink/10" data-directions>🧭 Directions</a> }
              @if (item.mapsUrl) { <a [href]="item.mapsUrl" target="_blank" rel="noopener" class="inline-flex min-h-10 items-center rounded-full bg-sand-50 px-4 text-sm font-bold text-ink ring-1 ring-ink/10" data-reviews>⭐ Reviews on Google</a> }
            </div>
            <div class="mt-auto pt-4">
            @if (!item.availableForConnection) {
              @if (item.alreadyAsked || asked()[item.id]) {
                <p class="rounded-xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-900" data-asked>✓ You’ve asked them to join. We’ll let you know when you can book.</p>
              } @else {
                <label class="flex gap-2 text-sm"><input type="checkbox" [checked]="consented(item.id)" (change)="setConsent(item.id, $any($event.target).checked)"><span>I agree that SmartClinic may use my contact details to contact me and this facility about my request. This does not share my medical record or confirm an appointment.</span></label>
                @if (item.facilityType === 'HOSPITAL') { <label class="mt-3 grid gap-1 text-sm font-semibold">Preferred appointment time (optional)<input type="datetime-local" [value]="preferredTimes()[item.id] || ''" (change)="setPreferredTime(item.id, $any($event.target).value)" class="rounded-xl border p-3 font-normal"></label> }
                @if (item.facilityType === 'HOSPITAL') { <button type="button" (click)="requestAppointment(item, preferredTimes()[item.id] || '')" [disabled]="sendingId() === item.id || !consented(item.id)" class="mt-3 w-full rounded-xl bg-brand-700 px-4 py-3 font-bold text-white disabled:opacity-50">{{ sendingId() === item.id ? 'Sending…' : 'Request appointment help' }}</button> }
                <button type="button" (click)="requestContact(item)" [disabled]="sendingId() === item.id || !consented(item.id)" class="mt-3 w-full rounded-xl border border-brand-700 px-4 py-3 font-bold text-brand-800 disabled:opacity-50" data-ask-join>{{ sendingId() === item.id ? 'Sending…' : 'Ask them to join SmartClinic' }}</button>
              }
              <a [href]="inviteUrl(item)" target="_blank" rel="noopener" class="mt-3 block text-center text-sm font-semibold text-brand-700 underline" data-invite-whatsapp>Tell them on WhatsApp</a>
            } @else if (item.providerReference) {
              <a [routerLink]="['/me/providers/connect']" [queryParams]="{providerReference: item.providerReference}" class="block rounded-xl bg-brand-700 px-4 py-3 text-center font-bold text-white">Connect with this facility</a>
            }
            @if (messageFor(item.id); as message) { <p role="status" class="mt-3 text-sm font-semibold text-emerald-800">{{ message }}</p> }
            </div>
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
  asked = signal<Record<string,boolean>>({});
  near = signal<{ lat: number; lng: number } | null>(null);
  locating = signal(false);
  locationError = signal('');
  verifiedOnly = signal(false);
  private readonly origin = typeof location !== 'undefined' ? location.origin : 'https://smartclinicnetwork.com';
  constructor() { this.load(1); }
  /** Your location is used once to sort by distance; it isn't saved. */
  toggleNearMe() {
    if (this.near()) { this.near.set(null); this.load(1); return; }
    if (typeof navigator === 'undefined' || !navigator.geolocation) { this.locationError.set('Your browser can’t share your location. Search by area instead.'); return; }
    this.locating.set(true); this.locationError.set('');
    navigator.geolocation.getCurrentPosition(
      (pos) => { this.locating.set(false); this.near.set({ lat: pos.coords.latitude, lng: pos.coords.longitude }); this.load(1); },
      () => { this.locating.set(false); this.locationError.set('We couldn’t get your location. Allow location for this site, or search by area.'); },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
    );
  }
  distance(km: number) { return km < 1 ? `${Math.round(km * 1000)} m away` : `${km < 10 ? km.toFixed(1) : Math.round(km)} km away`; }
  /** The patient tells the facility themselves, from their own WhatsApp. */
  inviteUrl(item: PartnerFacilityDirectoryItem) {
    const link = `${this.origin}/claim?q=${encodeURIComponent(item.displayName)}`;
    return `https://wa.me/?text=${encodeURIComponent(`Hello ${item.displayName}, I'd like to book you on SmartClinic. You're already listed there: claim your free page so patients like me can book and pay. ${link}`)}`;
  }
  load(page: number) {
    if (page < 1 || this.loading()) return;
    this.loading.set(true); this.error.set(false);
    this.api.directory({ q: this.search.value, facilityType: this.type.value, stateOrRegion: this.state.value, city: this.city.value, page, limit: 18, near: this.near(), verifiedOnly: this.verifiedOnly() }).pipe(finalize(() => this.loading.set(false))).subscribe({
      next: result => { this.items.set(result.items); this.page.set(result.page); this.totalPages.set(result.totalPages); },
      error: () => this.error.set(true),
    });
  }
  requestContact(item: PartnerFacilityDirectoryItem) {
    if (this.sendingId() || !this.consented(item.id)) return;
    this.sendingId.set(item.id);
    this.api.requestContact(item.id).pipe(finalize(() => this.sendingId.set(''))).subscribe({
      next: () => this.asked.update(old => ({ ...old, [item.id]: true })),
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
  location(item: PartnerFacilityDirectoryItem) { return [item.location.address, item.location.city, item.location.stateOrRegion].filter(value => !!value).join(', '); }
  consented(id: string) { return this.consents()[id] === true; }
  setConsent(id: string, value: boolean) { this.consents.update(old => ({ ...old, [id]: value })); }
  setPreferredTime(id: string, value: string) { this.preferredTimes.update(old => ({ ...old, [id]: value })); }
  typeLabel(type: PartnerFacilityType) { return ({ HOSPITAL: 'Hospital or clinic', PHARMACY: 'Pharmacy', LABORATORY: 'Laboratory', RADIOLOGY: 'Imaging' })[type]; }
  readinessLabel(readiness: string) { return ({ AVAILABLE_TO_JOIN: 'Available to join', JOINED: 'Joined', FULLY_JOINED: 'Fully joined' } as Record<string,string>)[readiness] ?? readiness; }
}

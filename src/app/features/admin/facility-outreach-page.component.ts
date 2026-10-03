import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { FacilityRegistryPanelComponent } from './facility-registry-panel.component';
import { FacilityOutreachApiService, FacilityType, FUNNEL, IMPORT_TEMPLATE, InviteResult, OutreachDashboard, OutreachFilters, OutreachItem, OutreachStage, STAGE_LABELS } from '../../core/services/facility-outreach-api.service';

const TYPE_LABEL: Record<FacilityType, string> = { HOSPITAL: 'Hospital / clinic', PHARMACY: 'Pharmacy', LABORATORY: 'Laboratory', RADIOLOGY: 'Radiology' };
const STAGE_TONE: Record<OutreachStage, string> = {
  LISTED: 'bg-slate-100 text-slate-700', CONTACTED: 'bg-sky-50 text-sky-800', CLAIMED: 'bg-amber-50 text-amber-900',
  VERIFIED: 'bg-violet-50 text-violet-800', LIVE: 'bg-emerald-50 text-emerald-800', DECLINED: 'bg-rose-50 text-rose-800', WRONG_CONTACT: 'bg-rose-50 text-rose-800',
};

/**
 * Facility outreach: who is listed, who we've reached, who has claimed, who is live — by place,
 * with a call list ranked by how many patients asked for each facility.
 */
@Component({
  selector: 'app-facility-outreach-page',
  imports: [DatePipe, RouterLink, FacilityRegistryPanelComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="mx-auto max-w-6xl px-4 py-8 sm:px-8">
      <div class="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 class="text-3xl font-bold text-brand-900">Facility outreach</h1>
          <p class="mt-1 max-w-2xl text-slate-600">Facilities come from the national registry by themselves, and the ones patients ask for are invited automatically. Use this page for the exceptions.</p>
        </div>
        <button type="button" (click)="showImport.set(!showImport())" class="min-h-11 rounded-lg border border-slate-300 px-4 font-semibold text-slate-700" data-import-toggle>Upload a spreadsheet (backup)</button>
      </div>

      <app-facility-registry-panel />

      @if (showImport()) {
        <section class="mt-5 rounded-2xl border border-slate-200 bg-white p-5" aria-labelledby="import-heading" data-import>
          <h2 id="import-heading" class="text-lg font-bold text-slate-900">Add or update facilities from a spreadsheet</h2>
          <p class="mt-1 text-sm text-slate-600">Save your sheet as CSV. Columns: name, type, country, state, city, address, phone, whatsapp, email, website, contact_name. A facility with the same name, state and city is updated, not added twice. <a [href]="templateHref" download="facility-template.csv" class="font-semibold text-brand-700 underline">Download the template</a>.</p>
          <div class="mt-3 flex flex-wrap items-center gap-3">
            <label class="text-sm font-semibold">Country for rows without one
              <select [value]="importCountry()" (change)="importCountry.set($any($event.target).value)" class="ml-2 min-h-10 rounded-lg border border-slate-300 bg-white px-2">
                <option value="NG">Nigeria</option><option value="GH">Ghana</option><option value="RW">Rwanda</option>
              </select>
            </label>
            <input type="file" accept=".csv,text/csv" (change)="importFile($event)" [disabled]="importing()" class="text-sm" data-import-file />
          </div>
          @if (importing()) { <p class="mt-3 text-sm text-slate-600" role="status">Importing…</p> }
          @if (importResult(); as r) {
            <p class="mt-3 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-900" role="status" data-import-result>Added {{ r.created }}, updated {{ r.updated }}, skipped {{ r.skipped }}.</p>
            @if (r.errors.length) {
              <ul class="mt-2 max-h-40 overflow-y-auto text-sm text-rose-800">
                @for (e of r.errors; track e.row) { <li>Row {{ e.row }}: {{ e.message }}</li> }
              </ul>
            }
          }
        </section>
      }

      <section class="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-5" aria-label="Stages" data-funnel>
        @for (s of funnel; track s) {
          <button type="button" (click)="setStage(s)" [attr.aria-pressed]="filters().stage === s" class="rounded-2xl border p-4 text-left transition {{ filters().stage === s ? 'border-brand-600 bg-brand-50' : 'border-slate-200 bg-white hover:border-slate-300' }}" [attr.data-stage]="s">
            <span class="block text-xs font-semibold uppercase tracking-wide text-slate-500">{{ stageLabel[s] }}</span>
            <span class="mt-1 block text-3xl font-bold text-slate-900">{{ data()?.summary?.[s] ?? 0 }}</span>
          </button>
        }
      </section>
      @if ((data()?.summary?.DECLINED ?? 0) + (data()?.summary?.WRONG_CONTACT ?? 0) > 0) {
        <p class="mt-2 text-sm text-slate-600">
          <button type="button" (click)="setStage('DECLINED')" class="underline">Declined: {{ data()?.summary?.DECLINED }}</button> ·
          <button type="button" (click)="setStage('WRONG_CONTACT')" class="underline">Wrong contact: {{ data()?.summary?.WRONG_CONTACT }}</button>
        </p>
      }

      <form class="mt-5 grid gap-2 rounded-2xl bg-slate-50 p-4 sm:grid-cols-6" (submit)="$event.preventDefault(); load(1)" data-filters>
        <select [value]="filters().countryCode ?? ''" (change)="patch({ countryCode: $any($event.target).value || undefined })" class="min-h-10 rounded-lg border border-slate-300 bg-white px-2" aria-label="Country">
          <option value="">All countries</option><option value="NG">Nigeria</option><option value="GH">Ghana</option><option value="RW">Rwanda</option>
        </select>
        <input [value]="filters().stateOrRegion ?? ''" (change)="patch({ stateOrRegion: $any($event.target).value || undefined })" placeholder="State" class="min-h-10 rounded-lg border border-slate-300 px-2" aria-label="State" />
        <input [value]="filters().city ?? ''" (change)="patch({ city: $any($event.target).value || undefined })" placeholder="City" class="min-h-10 rounded-lg border border-slate-300 px-2" aria-label="City" />
        <select [value]="filters().facilityType ?? ''" (change)="patch({ facilityType: $any($event.target).value })" class="min-h-10 rounded-lg border border-slate-300 bg-white px-2" aria-label="Type">
          <option value="">All types</option>
          @for (t of types; track t) { <option [value]="t">{{ typeLabel[t] }}</option> }
        </select>
        <input [value]="filters().search ?? ''" (change)="patch({ search: $any($event.target).value || undefined })" placeholder="Search name" class="min-h-10 rounded-lg border border-slate-300 px-2" aria-label="Search" />
        <div class="flex gap-2">
          <button type="submit" class="min-h-10 flex-1 rounded-lg bg-slate-900 px-3 font-semibold text-white">Show</button>
          @if (filters().stage) { <button type="button" (click)="setStage('')" class="min-h-10 rounded-lg px-3 text-sm ring-1 ring-slate-300">All stages</button> }
        </div>
      </form>

      @if (data()?.places?.length) {
        <details class="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
          <summary class="cursor-pointer font-semibold text-slate-900">By place ({{ data()!.places.length }})</summary>
          <div class="mt-3 overflow-x-auto">
            <table class="w-full min-w-[36rem] text-sm">
              <thead><tr class="text-left text-slate-500"><th class="py-1">Place</th><th>Patients asking</th>@for (s of funnel; track s) {<th>{{ stageLabel[s] }}</th>}</tr></thead>
              <tbody>
                @for (p of data()!.places; track $index) {
                  <tr class="border-t border-slate-100">
                    <td class="py-1.5"><button type="button" class="text-left font-semibold text-brand-700 underline" (click)="patch({ countryCode: p.countryCode, stateOrRegion: p.state ?? undefined, city: p.city ?? undefined }); load(1)">{{ p.city || '—' }}, {{ p.state || '—' }}</button></td>
                    <td>{{ p.demand }}</td>
                    @for (s of funnel; track s) { <td>{{ p.stages[s] ?? 0 }}</td> }
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </details>
      }

      @if (error()) { <p role="alert" class="mt-4 rounded-lg bg-rose-50 p-3 text-rose-800">{{ error() }}</p> }

      <p class="mt-6 text-sm text-slate-500">{{ data()?.total ?? 0 }} facilities, most-requested first.</p>
      <ul class="mt-2 grid gap-3" data-outreach-list>
        @for (f of data()?.items ?? []; track f.id) {
          <li class="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5" [attr.data-facility]="f.id">
            <div class="flex flex-wrap items-start justify-between gap-3">
              <div class="min-w-0">
                <p class="font-bold text-slate-900">{{ f.displayName }}</p>
                <p class="text-sm text-slate-600">{{ typeLabel[f.facilityType] }} · {{ f.city || '—' }}, {{ f.state || '—' }} · {{ f.countryCode }}</p>
              </div>
              <div class="flex flex-wrap items-center gap-2">
                @if (f.demand) { <span class="rounded-full bg-ochre-50 px-3 py-1 text-xs font-bold text-ochre-700" data-demand>{{ f.demand }} patient{{ f.demand === 1 ? '' : 's' }} asking</span> }
                <span class="rounded-full px-3 py-1 text-xs font-semibold {{ stageTone[f.stage] }}" data-stage-chip>{{ stageLabel[f.stage] }}</span>
              </div>
            </div>
            <p class="mt-2 text-sm font-semibold text-slate-800" data-next>→ {{ f.nextAction }}</p>
            <p class="mt-1 text-xs text-slate-500">
              @if (f.phone) { 📞 <a [href]="'tel:' + f.phone" class="underline">{{ f.phone }}</a> · }
              @if (f.whatsapp) { WhatsApp {{ f.whatsapp }} · }
              @if (f.email) { ✉️ {{ f.email }} · }
              @if (f.contactName) { {{ f.contactName }} · }
              {{ f.invitesSent }} invite{{ f.invitesSent === 1 ? '' : 's' }}@if (f.lastContactAt) { · last contact {{ f.lastContactAt | date: 'mediumDate' }} }
            </p>

            @if (!f.providerId) {
              <div class="mt-3 flex flex-wrap gap-2">
                <button type="button" (click)="invite(f)" [disabled]="busy() === f.id || !(f.phone || f.whatsapp || f.email)" class="min-h-10 rounded-lg bg-brand-700 px-3 text-sm font-semibold text-white disabled:opacity-40" data-invite>Send invite</button>
                <button type="button" (click)="copyLink(f)" [disabled]="busy() === f.id" class="min-h-10 rounded-lg px-3 text-sm font-semibold ring-1 ring-slate-300" data-copy-link>{{ copied() === f.id ? 'Copied ✓' : 'Copy claim link' }}</button>
                <button type="button" (click)="open(f.id, 'contacts')" class="min-h-10 rounded-lg px-3 text-sm font-semibold ring-1 ring-slate-300" data-edit-contacts>Contacts</button>
                <button type="button" (click)="open(f.id, 'log')" class="min-h-10 rounded-lg px-3 text-sm font-semibold ring-1 ring-slate-300" data-log>Log a call</button>
                <button type="button" (click)="toggleHistory(f.id)" class="min-h-10 rounded-lg px-3 text-sm font-semibold text-slate-600">History</button>
              </div>
            } @else {
              <div class="mt-3 flex flex-wrap gap-2">
                <a [routerLink]="['/admin/providers', f.providerId]" class="min-h-10 rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white">Open provider account</a>
                <button type="button" (click)="toggleHistory(f.id)" class="min-h-10 rounded-lg px-3 text-sm font-semibold text-slate-600">History</button>
              </div>
            }

            @if (inviteResult()?.id === f.id) {
              @let r = inviteResult()!.result;
              <div class="mt-3 rounded-xl bg-slate-50 p-3 text-sm" data-invite-result>
                @if (r.sent.length) { <p class="font-semibold text-emerald-800">Sent by {{ r.sent.join(' and ').toLowerCase() }}. Reminders go out in 2 and 7 days.</p> }
                @if (!r.automaticWhatsApp && (r.whatsappUrl || r.smsUrl)) {
                  <p class="mt-1 text-slate-700">WhatsApp isn’t automatic yet. Send it from your phone, then tap “I sent it”:</p>
                  <div class="mt-2 flex flex-wrap gap-2">
                    @if (r.whatsappUrl) {
                      <a [href]="r.whatsappUrl" target="_blank" rel="noopener" class="min-h-10 rounded-lg bg-[#1f8f4e] px-3 py-2 font-semibold text-white" data-wa-link>Open WhatsApp</a>
                      <button type="button" (click)="manualSent(f, 'WHATSAPP')" class="min-h-10 rounded-lg px-3 font-semibold ring-1 ring-slate-300" data-wa-sent>I sent it on WhatsApp</button>
                    }
                    @if (r.smsUrl) {
                      <a [href]="r.smsUrl" class="min-h-10 rounded-lg bg-slate-900 px-3 py-2 font-semibold text-white">Open SMS</a>
                      <button type="button" (click)="manualSent(f, 'SMS')" class="min-h-10 rounded-lg px-3 font-semibold ring-1 ring-slate-300">I sent it by SMS</button>
                    }
                  </div>
                }
                <p class="mt-2 text-xs text-slate-500">Message: {{ r.message }}</p>
              </div>
            }

            @if (panel()?.id === f.id && panel()?.kind === 'contacts') {
              <form class="mt-3 grid gap-2 rounded-xl bg-slate-50 p-3 sm:grid-cols-2" (submit)="$event.preventDefault(); saveContacts(f, $any($event.target))" data-contacts-form>
                <label class="text-sm font-semibold">Phone<input name="phone" [value]="f.phone ?? ''" class="mt-1 min-h-10 w-full rounded-lg border border-slate-300 px-2 font-normal" /></label>
                <label class="text-sm font-semibold">WhatsApp<input name="whatsapp" [value]="f.whatsapp ?? ''" class="mt-1 min-h-10 w-full rounded-lg border border-slate-300 px-2 font-normal" /></label>
                <label class="text-sm font-semibold">Email<input name="email" type="email" [value]="f.email ?? ''" class="mt-1 min-h-10 w-full rounded-lg border border-slate-300 px-2 font-normal" /></label>
                <label class="text-sm font-semibold">Contact person<input name="contactName" [value]="f.contactName ?? ''" class="mt-1 min-h-10 w-full rounded-lg border border-slate-300 px-2 font-normal" /></label>
                <label class="text-sm font-semibold">Website<input name="website" [value]="f.website ?? ''" class="mt-1 min-h-10 w-full rounded-lg border border-slate-300 px-2 font-normal" /></label>
                <label class="text-sm font-semibold">Address<input name="address" [value]="f.address ?? ''" class="mt-1 min-h-10 w-full rounded-lg border border-slate-300 px-2 font-normal" /></label>
                <div class="flex gap-2 sm:col-span-2"><button type="submit" class="min-h-10 rounded-lg bg-brand-700 px-4 font-semibold text-white" data-save-contacts>Save</button><button type="button" (click)="panel.set(null)" class="min-h-10 rounded-lg px-3">Cancel</button></div>
              </form>
            }

            @if (panel()?.id === f.id && panel()?.kind === 'log') {
              <form class="mt-3 grid gap-2 rounded-xl bg-slate-50 p-3 sm:grid-cols-3" (submit)="$event.preventDefault(); saveLog(f, $any($event.target))" data-log-form>
                <select name="kind" class="min-h-10 rounded-lg border border-slate-300 bg-white px-2" aria-label="What happened"><option value="CALL">Phone call</option><option value="VISIT">Visit</option><option value="NOTE">Note</option></select>
                <select name="outcome" class="min-h-10 rounded-lg border border-slate-300 bg-white px-2" aria-label="Outcome">
                  <option value="INTERESTED">Interested</option><option value="CALL_BACK">Call back later</option><option value="NO_ANSWER">No answer</option><option value="DECLINED">Not interested</option><option value="WRONG_CONTACT">Wrong number or email</option>
                </select>
                <input name="note" maxlength="500" placeholder="Who you spoke to, what's next" class="min-h-10 rounded-lg border border-slate-300 px-2" />
                <div class="flex gap-2 sm:col-span-3"><button type="submit" class="min-h-10 rounded-lg bg-brand-700 px-4 font-semibold text-white" data-save-log>Save</button><button type="button" (click)="panel.set(null)" class="min-h-10 rounded-lg px-3">Cancel</button></div>
              </form>
            }

            @if (historyFor() === f.id) {
              <ol class="mt-3 grid gap-1 border-l-2 border-slate-200 pl-3 text-sm" data-history>
                @for (e of history(); track $index) { <li><span class="text-slate-500">{{ e.at | date: 'medium' }}</span> · <strong>{{ eventLabel(e.kind) }}</strong>@if (e.note) { · {{ e.note }} } · {{ e.by }}</li> }
                @empty { <li class="text-slate-500">Nothing yet.</li> }
              </ol>
            }
          </li>
        } @empty {
          @if (data()) { <li class="rounded-2xl bg-slate-50 p-6 text-slate-600">No facilities match these filters. New ones arrive from the registry every night.</li> }
        }
      </ul>

      @if ((data()?.total ?? 0) > page() * 50) {
        <div class="mt-4 flex justify-center gap-2">
          @if (page() > 1) { <button type="button" (click)="load(page() - 1)" class="min-h-10 rounded-lg px-4 ring-1 ring-slate-300">Previous</button> }
          <button type="button" (click)="load(page() + 1)" class="min-h-10 rounded-lg px-4 ring-1 ring-slate-300">Next</button>
        </div>
      }
    </main>
  `,
})
export class FacilityOutreachPageComponent {
  private readonly api = inject(FacilityOutreachApiService);
  readonly funnel = FUNNEL;
  readonly stageLabel = STAGE_LABELS;
  readonly stageTone = STAGE_TONE;
  readonly typeLabel = TYPE_LABEL;
  readonly types = Object.keys(TYPE_LABEL) as FacilityType[];
  readonly templateHref = `data:text/csv;charset=utf-8,${encodeURIComponent(IMPORT_TEMPLATE)}`;

  readonly filters = signal<OutreachFilters>({});
  readonly page = signal(1);
  readonly data = signal<OutreachDashboard | null>(null);
  readonly error = signal('');
  readonly busy = signal<string | null>(null);
  readonly copied = signal<string | null>(null);
  readonly panel = signal<{ id: string; kind: 'contacts' | 'log' } | null>(null);
  readonly inviteResult = signal<{ id: string; result: InviteResult } | null>(null);
  readonly historyFor = signal<string | null>(null);
  readonly history = signal<readonly { kind: string; note: string | null; at: string; by: string }[]>([]);
  readonly showImport = signal(false);
  readonly importing = signal(false);
  readonly importCountry = signal('NG');
  readonly importResult = signal<{ created: number; updated: number; skipped: number; errors: readonly { row: number; message: string }[] } | null>(null);
  readonly hasFilters = computed(() => Object.values(this.filters()).some(Boolean));

  constructor() {
    this.load(1);
  }

  patch(p: Partial<OutreachFilters>): void {
    this.filters.update((f) => ({ ...f, ...p }));
  }

  setStage(stage: OutreachStage | ''): void {
    this.patch({ stage: this.filters().stage === stage ? '' : stage });
    this.load(1);
  }

  load(page = this.page()): void {
    this.page.set(page);
    this.api.dashboard({ ...this.filters(), page }).subscribe({
      next: (d) => { this.data.set(d); this.error.set(''); },
      error: (e) => this.fail(e, 'Couldn’t load facilities.'),
    });
  }

  importFile(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    if (file.size > 5_000_000) { this.error.set('That file is over 5 MB. Split it into smaller sheets.'); return; }
    this.importing.set(true);
    this.importResult.set(null);
    file.text().then((csv) => {
      this.api.importCsv(csv, this.importCountry()).pipe(finalize(() => this.importing.set(false))).subscribe({
        next: (r) => { this.importResult.set(r); this.load(1); },
        error: (e) => this.fail(e, 'Couldn’t import that file.'),
      });
    }, () => { this.importing.set(false); this.error.set('Couldn’t read that file.'); });
  }

  invite(f: OutreachItem): void {
    this.busy.set(f.id);
    this.api.invite(f.id).pipe(finalize(() => this.busy.set(null))).subscribe({
      next: (result) => { this.inviteResult.set({ id: f.id, result }); if (result.sent.length) this.load(); },
      error: (e) => this.fail(e, 'Couldn’t send the invite.'),
    });
  }

  manualSent(f: OutreachItem, channel: 'WHATSAPP' | 'SMS'): void {
    this.api.manualSent(f.id, channel).subscribe({ next: () => { this.inviteResult.set(null); this.load(); }, error: (e) => this.fail(e, 'Couldn’t save that.') });
  }

  copyLink(f: OutreachItem): void {
    this.busy.set(f.id);
    this.api.claimLink(f.id).pipe(finalize(() => this.busy.set(null))).subscribe({
      next: ({ url }) => navigator.clipboard?.writeText(url).then(() => { this.copied.set(f.id); setTimeout(() => this.copied.set(null), 2500); }, () => this.error.set(`Claim link: ${url}`)),
      error: (e) => this.fail(e, 'Couldn’t get the claim link.'),
    });
  }

  open(id: string, kind: 'contacts' | 'log'): void {
    this.panel.set(this.panel()?.id === id && this.panel()?.kind === kind ? null : { id, kind });
  }

  saveContacts(f: OutreachItem, form: HTMLFormElement): void {
    const v = Object.fromEntries(new FormData(form).entries()) as Record<string, string>;
    this.api.updateContacts(f.id, { phone: v['phone'], whatsapp: v['whatsapp'], email: v['email'], contactName: v['contactName'], website: v['website'], address: v['address'] }).subscribe({
      next: () => { this.panel.set(null); this.load(); },
      error: (e) => this.fail(e, 'Couldn’t save the contacts.'),
    });
  }

  saveLog(f: OutreachItem, form: HTMLFormElement): void {
    const v = Object.fromEntries(new FormData(form).entries()) as Record<string, string>;
    this.api.logContact(f.id, { kind: v['kind'] as 'CALL', outcome: v['kind'] === 'NOTE' ? undefined : v['outcome'], note: v['note'] || undefined }).subscribe({
      next: () => { this.panel.set(null); this.load(); },
      error: (e) => this.fail(e, 'Couldn’t save that.'),
    });
  }

  toggleHistory(id: string): void {
    if (this.historyFor() === id) { this.historyFor.set(null); return; }
    this.historyFor.set(id);
    this.history.set([]);
    this.api.history(id).subscribe({ next: (h) => this.history.set(h), error: () => this.history.set([]) });
  }

  eventLabel(kind: string): string {
    return ({ IMPORTED: 'Added', INVITE_EMAIL: 'Email invite', INVITE_WHATSAPP: 'WhatsApp invite', INVITE_MANUAL: 'Sent by hand', REMINDER_EMAIL: 'Email reminder', REMINDER_WHATSAPP: 'WhatsApp reminder', CALL: 'Call', VISIT: 'Visit', NOTE: 'Note', CLAIMED: 'Claimed' } as Record<string, string>)[kind] ?? kind;
  }

  private fail(e: unknown, fallback: string): void {
    this.error.set(e instanceof HttpErrorResponse && typeof e.error?.message === 'string' ? e.error.message : fallback);
  }
}

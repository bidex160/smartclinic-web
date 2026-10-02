import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { API_CONFIG } from '../../core/config/api-config.token';

/**
 * Public guide a hospital, lab or pharmacy IT team can read before signing up:
 * how to connect, in plain JSON or HL7 FHIR R4.
 */
@Component({
  selector: 'app-developers-page',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="bg-sand-50 text-ink">
      <section class="relative overflow-hidden bg-ink text-white">
        <div class="sc-motif absolute inset-0 opacity-[0.06]" aria-hidden="true"></div>
        <div class="relative mx-auto max-w-6xl px-5 py-14 sm:px-8 lg:py-20">
          <p class="text-xs font-semibold uppercase tracking-[0.18em] text-ochre-300">For hospital, lab and pharmacy IT teams</p>
          <h1 class="font-display mt-3 max-w-3xl text-4xl font-semibold leading-tight sm:text-5xl">Connect your hospital to SmartClinic</h1>
          <p class="mt-4 max-w-2xl text-lg leading-8 text-white/75">
            Send prescriptions, lab, imaging and referral requests to any patient by their SmartClinic ID, and get status and results back.
            Use simple JSON or HL7 FHIR R4. No new EMR needed, and your staff can use the SmartClinic portal while you connect.
          </p>
          <div class="mt-7 flex flex-wrap gap-3">
            <a routerLink="/provider/register" class="inline-flex min-h-12 items-center rounded-full bg-white px-6 font-semibold text-ink hover:bg-ochre-50">Register your facility</a>
            <a [href]="fhirBase + '/metadata'" target="_blank" rel="noopener" class="inline-flex min-h-12 items-center rounded-full border border-white/30 px-6 font-semibold text-white hover:bg-white/10">View FHIR CapabilityStatement</a>
          </div>
        </div>
      </section>

      <section class="mx-auto max-w-6xl px-5 py-12 sm:px-8" aria-labelledby="steps-title">
        <h2 id="steps-title" class="font-display text-3xl font-semibold">Live in four steps</h2>
        <ol class="mt-6 grid gap-4 md:grid-cols-4">
          @for (step of steps; track step.title; let i = $index) {
            <li class="rounded-2xl bg-white p-5 ring-1 ring-ink/[0.06]">
              <span class="font-display text-3xl font-semibold text-brand-700">{{ i + 1 }}</span>
              <h3 class="mt-2 font-semibold">{{ step.title }}</h3>
              <p class="mt-1 text-sm leading-6 text-ink-soft">{{ step.text }}</p>
            </li>
          }
        </ol>
      </section>

      <section class="mx-auto max-w-6xl px-5 pb-12 sm:px-8" aria-labelledby="choose-title">
        <div class="flex flex-wrap items-end justify-between gap-4">
          <h2 id="choose-title" class="font-display text-3xl font-semibold">Pick the format your system speaks</h2>
          <div class="inline-flex rounded-full bg-sand-100 p-1" role="group" aria-label="API format">
            <button type="button" (click)="format.set('fhir')" [attr.aria-pressed]="format() === 'fhir'" class="min-h-10 rounded-full px-4 text-sm font-semibold {{ format() === 'fhir' ? 'bg-white text-ink shadow-sm' : 'text-ink-soft' }}">HL7 FHIR R4</button>
            <button type="button" (click)="format.set('json')" [attr.aria-pressed]="format() === 'json'" class="min-h-10 rounded-full px-4 text-sm font-semibold {{ format() === 'json' ? 'bg-white text-ink shadow-sm' : 'text-ink-soft' }}">Simple JSON</button>
          </div>
        </div>

        <div class="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div class="min-w-0 overflow-x-auto rounded-2xl bg-white ring-1 ring-ink/[0.06]">
            <table class="w-full min-w-[30rem] text-left text-sm">
              <thead class="text-xs uppercase tracking-wider text-ink-muted"><tr><th class="px-4 py-3">You want to</th><th class="px-4 py-3">Call</th></tr></thead>
              <tbody>
                @for (row of format() === 'fhir' ? fhirRows : jsonRows; track row[0]) {
                  <tr class="border-t border-ink/[0.06]"><td class="px-4 py-3 align-top">{{ row[0] }}</td><td class="px-4 py-3 align-top font-mono text-xs text-ink">{{ row[1] }}</td></tr>
                }
              </tbody>
            </table>
          </div>
          <div class="min-w-0">
            <p class="text-sm text-ink-soft">Base URL <span class="break-all font-mono text-ink">{{ format() === 'fhir' ? fhirBase : apiBase + '/integrations' }}</span></p>
            <pre class="mt-3 overflow-x-auto rounded-2xl bg-ink p-4 text-xs leading-relaxed text-white/90"><code>{{ format() === 'fhir' ? fhirExample : jsonExample }}</code></pre>
            <button type="button" (click)="copy()" class="mt-3 min-h-10 rounded-full border border-ink/15 bg-white px-4 text-sm font-semibold hover:bg-sand-100">Copy example</button>
            <span aria-live="polite" class="ml-3 text-sm font-semibold text-leaf-700">{{ copied() }}</span>
          </div>
        </div>
      </section>

      <section class="mx-auto max-w-6xl px-5 pb-16 sm:px-8" aria-labelledby="rules-title">
        <h2 id="rules-title" class="font-display text-3xl font-semibold">The rules every connection follows</h2>
        <div class="mt-6 grid gap-4 md:grid-cols-3">
          @for (rule of rules; track rule.title) {
            <div class="rounded-2xl bg-white p-5 ring-1 ring-ink/[0.06]">
              <h3 class="font-semibold">{{ rule.title }}</h3>
              <p class="mt-1 text-sm leading-6 text-ink-soft">{{ rule.text }}</p>
            </div>
          }
        </div>
      </section>
    </main>
  `,
})
export class DevelopersPageComponent {
  private readonly api = inject(API_CONFIG);
  readonly apiBase = this.api.baseUrl;
  readonly fhirBase = `${this.api.baseUrl}/fhir/r4`;
  readonly format = signal<'fhir' | 'json'>('fhir');
  readonly copied = signal('');

  readonly steps = [
    { title: 'Register your facility', text: 'Create a provider account. Your team can start using the SmartClinic portal straight away.' },
    { title: 'Get verified', text: 'SmartClinic checks your facility. Sending requests and integrations open once you are approved.' },
    { title: 'Create an API key', text: 'In Provider portal → Integrations. The key is shown once and acts as your facility.' },
    { title: 'Send your first request', text: 'Use a test patient’s SmartClinic ID. Add a webhook URL to get updates pushed to you.' },
  ];

  readonly fhirRows: readonly [string, string][] = [
    ['Check what the server supports', 'GET /metadata'],
    ['Confirm a patient', 'GET /Patient?identifier=…|SCP-ABCD-1234'],
    ['Send a lab, imaging or referral request', 'POST /ServiceRequest'],
    ['Send a prescription', 'POST /MedicationRequest'],
    ['Send several at once', 'POST / (Bundle: batch or transaction)'],
    ['Follow your requests', 'GET /ServiceRequest?_count=20'],
    ['Get results', 'GET /DiagnosticReport?based-on=ServiceRequest/{id}'],
    ['Cancel', 'POST /ServiceRequest/{id}/$cancel'],
  ];
  readonly jsonRows: readonly [string, string][] = [
    ['Confirm a patient', 'GET /patients/{SmartClinic ID}'],
    ['Send any request', 'POST /requests'],
    ['Follow your requests', 'GET /requests'],
    ['One request, with results', 'GET /requests/{reference}'],
    ['Cancel', 'POST /requests/{reference}/cancel'],
  ];
  readonly rules = [
    { title: 'The patient approves first', text: 'Until they approve a request in their app, you see only their first name and initial.' },
    { title: 'The patient chooses where', text: 'They pick any lab or pharmacy on SmartClinic, whatever software that facility uses.' },
    { title: 'No health details in webhooks', text: 'Webhooks are signed and carry reference numbers only. Fetch details with your key.' },
  ];

  readonly fhirExample = [
    `curl -X POST ${this.fhirBase}/ServiceRequest \\`,
    `  -H "Authorization: Bearer $SMARTCLINIC_KEY" \\`,
    `  -H "Content-Type: application/fhir+json" \\`,
    `  -d '{`,
    `    "resourceType": "ServiceRequest", "status": "active", "intent": "order",`,
    `    "category": [{ "coding": [{ "system": "http://snomed.info/sct", "code": "108252007" }] }],`,
    `    "code": { "text": "Malaria parasite (MP)" },`,
    `    "orderDetail": [{ "text": "Full blood count" }],`,
    `    "subject": { "reference": "Patient/SCP-ABCD-1234" },`,
    `    "reasonCode": [{ "text": "Fever for 3 days" }]`,
    `  }'`,
  ].join('\n');
  readonly jsonExample = [
    `curl -X POST ${this.api.baseUrl}/integrations/requests \\`,
    `  -H "Authorization: Bearer $SMARTCLINIC_KEY" \\`,
    `  -H "Content-Type: application/json" \\`,
    `  -d '{"patientReference":"SCP-ABCD-1234","type":"LABORATORY",`,
    `       "diagnosticItems":[{"name":"Malaria parasite (MP)"}]}'`,
  ].join('\n');

  async copy(): Promise<void> {
    const text = this.format() === 'fhir' ? this.fhirExample : this.jsonExample;
    try {
      await navigator.clipboard.writeText(text);
      this.copied.set('Copied');
    } catch {
      this.copied.set('Select the example and copy it');
    }
  }
}
